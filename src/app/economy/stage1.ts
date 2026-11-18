/**
 * Pure formulas for Stage 1 (Stellar Network). Framework-free so the balance
 * simulator (tools/balance-sim) uses exactly the same numbers as the game.
 */
import { Decimal } from '../utils/numbers';
import {
  Archetype, CORE_NODES, EXPANSIONS, OVERCHARGE, Stage1NodeDef, TIERS, Theme,
} from './stage1-content';

export const STAGE1_START_ENERGY = 10;
export const FINAL_TIER = TIERS.length;
const MAX_BULK_DISCOUNT = 0.5;
const SPENDER_CAPSTONE_DISCOUNT = 0.99;

export interface Stage1State {
  tier: number;
  /** Theme chosen at each warp so far (path[0] = Tier 2) */
  path: Theme[];
  levels: Record<string, number>;
  energy: Decimal;
  runBonus: number;
  /** Seconds of Overcharge (counted twice as fast while visible) */
  overchargeTime: number;
}

export function initialState(): Stage1State {
  return { tier: 1, path: [], levels: {}, energy: new Decimal(STAGE1_START_ENERGY), runBonus: 1, overchargeTime: 0 };
}

// --- tree --------------------------------------------------------------------------

/** All nodes in the current tree, with prerequisites resolved for the chosen path */
export function buildTree(tier: number, path: readonly Theme[]): Stage1NodeDef[] {
  const nodes = CORE_NODES.map(n => ({ ...n }));
  let exits = ['core_final'];
  for (let t = 2; t <= tier; t++) {
    const exp = EXPANSIONS[t][path[t - 2]];
    const [entry, left, right] = exp.nodes;
    nodes.push({ ...entry, requires: exits }, { ...left }, { ...right });
    exits = [left.id, right.id];
  }
  return nodes;
}

/** Nodes connected to the given node (prerequisite edges, both directions) */
export function neighbors(id: string, nodes: readonly Stage1NodeDef[]): Stage1NodeDef[] {
  const node = nodes.find(n => n.id === id);
  if (!node) return [];
  return nodes.filter(n => node.requires.includes(n.id) || n.requires.includes(id));
}

export function level(state: Stage1State, id: string): number {
  return state.levels[id] ?? 0;
}

/** Max level including bonus levels from connected Relay-type nodes */
export function maxLevel(node: Stage1NodeDef, nodes: readonly Stage1NodeDef[], state: Stage1State): number {
  let bonus = 0;
  for (const n of neighbors(node.id, nodes)) {
    if (n.type === 'neighbor_levels') bonus += n.value * level(state, n.id);
  }
  return node.maxLevel + bonus;
}

export function isMaxed(node: Stage1NodeDef, nodes: readonly Stage1NodeDef[], state: Stage1State): boolean {
  return level(state, node.id) >= maxLevel(node, nodes, state);
}

export function isUnlocked(node: Stage1NodeDef, nodes: readonly Stage1NodeDef[], state: Stage1State): boolean {
  return node.requires.every(id => {
    const req = nodes.find(n => n.id === id);
    return !!req && isMaxed(req, nodes, state);
  });
}

export function allMaxed(nodes: readonly Stage1NodeDef[], state: Stage1State): boolean {
  return nodes.every(n => isMaxed(n, nodes, state));
}

export function totalLevels(nodes: readonly Stage1NodeDef[], state: Stage1State): number {
  return nodes.reduce((sum, n) => sum + level(state, n.id), 0);
}

// --- path ------------------------------------------------------------------------------

export function themeCount(path: readonly Theme[], theme: Theme): number {
  return path.filter(t => t === theme).length;
}

/** Capstone archetype; only active in Tier 5, once all four choices are made */
export function archetype(state: Stage1State): Archetype | null {
  if (state.tier !== FINAL_TIER || state.path.length < FINAL_TIER - 1) return null;
  const savers = themeCount(state.path, 'saver');
  if (savers >= 3) return 'saver';
  if (savers <= 1) return 'spender';
  return 'balanced';
}

// --- warping -------------------------------------------------------------------------

export function requirement(tier: number): Decimal {
  return new Decimal(TIERS[tier - 1]?.requirement ?? Infinity);
}

export function canWarp(nodes: readonly Stage1NodeDef[], state: Stage1State): boolean {
  return allMaxed(nodes, state) && state.energy.gte(requirement(state.tier));
}

/** Warp to the next tier with the chosen expansion (Tiers 1-4) */
export function warp(state: Stage1State, theme: Theme): Stage1State {
  return {
    tier: state.tier + 1,
    path: [...state.path, theme],
    levels: {},
    energy: new Decimal(STAGE1_START_ENERGY),
    runBonus: state.runBonus * TIERS[state.tier - 1].warpBonus,
    overchargeTime: 0,
  };
}

// --- production ------------------------------------------------------------------------

function sumOf(nodes: readonly Stage1NodeDef[], state: Stage1State, type: Stage1NodeDef['type']): number {
  return nodes.filter(n => n.type === type).reduce((s, n) => s + n.value * level(state, n.id), 0);
}

export function isOvercharging(nodes: readonly Stage1NodeDef[], state: Stage1State): boolean {
  return state.tier === FINAL_TIER && nodes.some(n => n.type === 'overcharge' && level(state, n.id) > 0)
    && allMaxed(nodes, state);
}

export function overchargeMultiplier(seconds: number): number {
  return Math.pow(1 + Math.max(0, seconds) / OVERCHARGE.tau, OVERCHARGE.power);
}

/** Integral of overchargeMultiplier between t0 and t1 */
export function overchargeIntegral(t0: number, t1: number): number {
  const { tau, power } = OVERCHARGE;
  const f = (t: number) => (tau / (power + 1)) * Math.pow(1 + Math.max(0, t) / tau, power + 1);
  return f(t1) - f(t0);
}

/** Interest bonus (Saver): based on unspent Energy */
export function interestBonus(nodes: readonly Stage1NodeDef[], state: Stage1State): number {
  const interest = sumOf(nodes, state, 'interest');
  if (interest <= 0) return 1;
  const power = 1 + sumOf(nodes, state, 'interest_power') * themeCount(state.path, 'saver');
  const arch = archetype(state);
  const capstone = arch === 'saver' ? 2 : arch === 'balanced' ? 1.5 : 1;
  const orders = Math.max(0, state.energy.max(1).log10().toNumber());
  return 1 + interest * power * capstone * orders;
}

/** Tally bonus (Spender): based on node levels owned this tier */
export function tallyBonus(nodes: readonly Stage1NodeDef[], state: Stage1State): number {
  const tally = sumOf(nodes, state, 'level_count');
  if (tally <= 0) return 1;
  const power = 1 + sumOf(nodes, state, 'level_count_power') * themeCount(state.path, 'spender');
  const capstone = archetype(state) === 'balanced' ? 1.5 : 1;
  return 1 + tally * power * capstone * totalLevels(nodes, state);
}

/** Energy per second without Overcharge */
export function baseProduction(nodes: readonly Stage1NodeDef[], state: Stage1State): Decimal {
  let base = 0;
  let mult = new Decimal(state.runBonus);
  for (const node of nodes) {
    const lvl = level(state, node.id);
    if (lvl <= 0) continue;
    if (node.type === 'production') base += node.value * lvl;
    if (node.type === 'multiplier') {
      const boost = neighbors(node.id, nodes)
        .filter(n => n.type === 'neighbor_mult')
        .reduce((s, n) => s + n.value * level(state, n.id), 0);
      mult = mult.times(Decimal.pow(1 + (node.value - 1) * (1 + boost), lvl));
    }
  }
  return mult.times(base).times(interestBonus(nodes, state)).times(tallyBonus(nodes, state));
}

export function production(nodes: readonly Stage1NodeDef[], state: Stage1State): Decimal {
  const base = baseProduction(nodes, state);
  return isOvercharging(nodes, state) ? base.times(overchargeMultiplier(state.overchargeTime)) : base;
}

/** Advance time: Energy grows; Overcharge time grows (faster while visible) */
export function advance(nodes: readonly Stage1NodeDef[], state: Stage1State, seconds: number, visible: boolean): void {
  if (isOvercharging(nodes, state)) {
    const speed = visible ? OVERCHARGE.visibleSpeed : 1;
    const t0 = state.overchargeTime;
    const t1 = t0 + seconds * speed;
    // Integrate over Overcharge time, converted back to real seconds
    const energy = baseProduction(nodes, state).times(overchargeIntegral(t0, t1) / speed);
    state.energy = state.energy.plus(energy);
    state.overchargeTime = t1;
  } else {
    state.energy = state.energy.plus(production(nodes, state).times(seconds));
  }
}

// --- buying -------------------------------------------------------------------------------

/** Cost of buying the given level of a node */
export function cost(node: Stage1NodeDef, lvl: number, nodes: readonly Stage1NodeDef[], state: Stage1State): Decimal {
  let c = new Decimal(node.cost).times(Decimal.pow(node.costMultiplier, lvl)).floor();
  if (archetype(state) === 'spender') c = c.times(Math.pow(SPENDER_CAPSTONE_DISCOUNT, totalLevels(nodes, state)));
  return c;
}

export function bulkDiscount(nodes: readonly Stage1NodeDef[], state: Stage1State): number {
  return Math.min(MAX_BULK_DISCOUNT, sumOf(nodes, state, 'bulk_discount'));
}

export function canBuy(node: Stage1NodeDef, nodes: readonly Stage1NodeDef[], state: Stage1State): boolean {
  return !isMaxed(node, nodes, state) && isUnlocked(node, nodes, state)
    && state.energy.gte(cost(node, level(state, node.id), nodes, state));
}

/** Buy one level of a node. Returns true if bought. */
export function buy(node: Stage1NodeDef, nodes: readonly Stage1NodeDef[], state: Stage1State): boolean {
  if (!canBuy(node, nodes, state)) return false;
  state.energy = state.energy.minus(cost(node, level(state, node.id), nodes, state));
  state.levels[node.id] = level(state, node.id) + 1;
  return true;
}

/**
 * "Buy all": buy the cheapest affordable level until nothing is affordable.
 * With a bulk discount, every level of a node after the first in this purchase
 * costs less. Returns the number of levels bought.
 */
export function buyAll(nodes: readonly Stage1NodeDef[], state: Stage1State): number {
  const discount = bulkDiscount(nodes, state);
  const boughtPerNode: Record<string, number> = {};
  let bought = 0;
  for (;;) {
    let best: { node: Stage1NodeDef; price: Decimal } | null = null;
    for (const node of nodes) {
      if (isMaxed(node, nodes, state) || !isUnlocked(node, nodes, state)) continue;
      let price = cost(node, level(state, node.id), nodes, state);
      if ((boughtPerNode[node.id] ?? 0) > 0) price = price.times(1 - discount);
      if (!best || price.lt(best.price)) best = { node, price };
    }
    if (!best || state.energy.lt(best.price)) return bought;
    state.energy = state.energy.minus(best.price);
    state.levels[best.node.id] = level(state, best.node.id) + 1;
    boughtPerNode[best.node.id] = (boughtPerNode[best.node.id] ?? 0) + 1;
    bought++;
  }
}
