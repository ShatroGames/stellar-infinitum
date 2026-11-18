/**
 * Pure economy formulas for the pre-collapse game (Energy, Stellar Nexus, Dimensions).
 *
 * Everything here is framework-free so the same code drives both the Angular
 * services and the balance simulator in tools/balance-sim. Change balance here,
 * not in the services.
 */
import { Decimal } from '../utils/numbers';
import { SkillNode } from '../models/skill-node.model';
import { SKILL_TREE_TIERS } from '../models/skill-trees.config';
import { AscensionEffect, ASCENSION_TREE_NODES } from '../models/ascension-tree.model';
import { Dimension } from '../models/dimension.model';

// ---------------------------------------------------------------------------
// Stellar Nexus
// ---------------------------------------------------------------------------

export interface NexusEffects {
  autoBuy: boolean;
  autoWarp: boolean;
  bulkBuy: number;
  costReduction: number;
  productionBoost: number;
  multiplierBoost: number;
  startingEnergy: number;
  warpSpeedReduction: number;
  skillEfficiency: number;
  skillCapIncrease: number;
  stellarCoreMult: number;
  warpMomentum: number;
  unlockAll: boolean;
}

export function nexusEffects(purchased: ReadonlySet<string>): NexusEffects {
  const values = (type: AscensionEffect['type']) =>
    ASCENSION_TREE_NODES.filter(n => purchased.has(n.id) && n.effect.type === type).map(n => n.effect.value);
  // Upgrades of the same kind either replace each other (max) or stack (sum)
  const max = (type: AscensionEffect['type']) => Math.max(0, ...values(type));
  const sum = (type: AscensionEffect['type']) => values(type).reduce((a, b) => a + b, 0);
  const has = (type: AscensionEffect['type']) => values(type).length > 0;

  return {
    autoBuy: has('auto_buy'),
    autoWarp: has('auto_warp'),
    bulkBuy: Math.max(1, max('bulk_buy')),
    costReduction: max('cost_reduction'),
    productionBoost: sum('production_boost'),
    multiplierBoost: sum('multiplier_boost'),
    startingEnergy: Math.max(10, max('start_bonus')),
    warpSpeedReduction: max('warp_speed'),
    skillEfficiency: sum('skill_efficiency'),
    skillCapIncrease: sum('skill_cap'),
    stellarCoreMult: sum('stellar_core_mult'),
    warpMomentum: sum('warp_momentum'),
    unlockAll: has('remove_prerequisites'),
  };
}

/** Production multiplier from Stellar Cores ever earned */
export function coreGlobalMultiplier(totalCores: number): number {
  return 1 + totalCores;
}

// ---------------------------------------------------------------------------
// Dimensions
// ---------------------------------------------------------------------------

export interface DimensionEffects {
  productionBonus: number;
  multiplierPower: number;
  skillCapIncrease: number;
  stellarCoreBonus: number;
  crossDimensionBonus: number;
  prismAllAspects: number;
}

/** @param bonusFactor achievement reward scaling all dimensional bonuses */
export function dimensionEffects(dimensions: Iterable<Dimension>, bonusFactor = 1): DimensionEffects {
  const unlocked = Array.from(dimensions).filter(d => d.unlocked);
  const purchasedCount = (d: Dimension) => d.nodes.filter(n => n.level > 0).length;
  const allPurchased = unlocked.reduce((sum, d) => sum + purchasedCount(d), 0);

  let production = 1;
  let multiplierPower = 0;
  let skillCap = 0;
  let coreBonus = 0;
  let cross = 1;
  let prism = 0;

  for (const dim of unlocked) {
    for (const node of dim.nodes) {
      if (node.level <= 0) continue;
      const { type, value, special } = node.effect;
      switch (type) {
        case 'production_mult':
          production *= Math.pow(1 + value, node.level);
          break;
        case 'multiplier_power':
          multiplierPower += value * node.level;
          break;
        case 'skill_cap':
          skillCap += value * node.level;
          break;
        case 'stellar_core_bonus':
          coreBonus += value * node.level;
          break;
        case 'cross_dimension':
          if (special === 'crystal_synergy') {
            // Crystal Harmony adds multiplier power per purchased Crystal node
            multiplierPower += value * purchasedCount(dim);
          } else if (special === 'prism_synergy') {
            cross *= 1 + value * allPurchased;
          } else {
            cross *= 1 + value * purchasedCount(dim);
          }
          break;
        case 'special':
          if (special === 'all_aspects') prism += value * node.level;
          break;
      }
    }
  }

  return {
    productionBonus: 1 + (production - 1) * bonusFactor,
    multiplierPower: multiplierPower * bonusFactor,
    skillCapIncrease: skillCap,
    stellarCoreBonus: coreBonus,
    crossDimensionBonus: 1 + (cross - 1) * bonusFactor,
    prismAllAspects: prism,
  };
}

// ---------------------------------------------------------------------------
// Achievements
// ---------------------------------------------------------------------------

export interface AchievementEffects {
  energy: number;
  stellarCore: number;
  echoFragment: number;
  nexus: number;
  dimension: number;
  quantum: number;
  offline: number;
}

const ACHIEVEMENT_REWARDS: Record<keyof AchievementEffects, [string, number][]> = {
  energy: [['all_tiers_complete', 1.05], ['fast_tier5', 1.1], ['max_all_trees', 1.25]],
  stellarCore: [['stellar_400', 1.1]],
  echoFragment: [['transcend_100', 1.1], ['echo_5000', 1.2]],
  nexus: [['ascension_all_complete', 1.15], ['max_all_trees', 1.25]],
  dimension: [['all_dimensions_unlocked', 1.25], ['max_all_trees', 1.25]],
  quantum: [['all_synergies', 1.5], ['quantum_trinity', 2]],
  offline: [['progression_100hours', 1.05]],
};

export function achievementEffects(unlocked: ReadonlySet<string>): AchievementEffects {
  const result = {} as AchievementEffects;
  for (const key of Object.keys(ACHIEVEMENT_REWARDS) as (keyof AchievementEffects)[]) {
    result[key] = ACHIEVEMENT_REWARDS[key].reduce((m, [id, mult]) => (unlocked.has(id) ? m * mult : m), 1);
  }
  return result;
}

export const NO_ACHIEVEMENT_EFFECTS: AchievementEffects = achievementEffects(new Set());

// ---------------------------------------------------------------------------
// Stellar Network (skills)
// ---------------------------------------------------------------------------

export function skillCapBonus(nexus: NexusEffects, dims: DimensionEffects): number {
  return nexus.skillCapIncrease + dims.skillCapIncrease;
}

/** Cost of buying the given level of a skill, including all discounts */
export function skillCost(skill: SkillNode, level: number, nexus: NexusEffects, dims: DimensionEffects): Decimal {
  let cost = new Decimal(skill.cost).times(Decimal.pow(skill.costMultiplier, level)).floor();
  if (nexus.costReduction > 0) cost = cost.times(1 - nexus.costReduction);
  if (dims.prismAllAspects > 0) cost = cost.times(1 - dims.prismAllAspects);
  return cost;
}

/** Energy needed (together with all skills maxed) to warp out of a tier */
export function warpRequirement(tier: number, nexus: NexusEffects, dims: DimensionEffects): Decimal {
  const tierData = SKILL_TREE_TIERS.find(t => t.id === tier);
  if (!tierData) return new Decimal(Infinity);
  let required = new Decimal(tierData.requiredPoints);
  if (nexus.warpSpeedReduction > 0) required = required.times(1 - nexus.warpSpeedReduction);
  if (dims.prismAllAspects > 0) required = required.times(1 - dims.prismAllAspects);
  return required;
}

export interface ProductionContext {
  runPrestigeBonus: number;
  runWarps: number;
  totalCores: number;
  nexus: NexusEffects;
  dims: DimensionEffects;
  achievements: AchievementEffects;
}

export function energyProduction(skills: readonly SkillNode[], ctx: ProductionContext): Decimal {
  const { nexus, dims, achievements } = ctx;
  const nexusFactor = achievements.nexus;

  let baseProduction = 0;
  for (const skill of skills) {
    if (skill.effect.type === 'production' && skill.effect.resource === 'knowledge') {
      baseProduction += skill.effect.value * skill.level;
    }
  }

  // Strength boosts applied to every multiplier skill
  const multiplierBoost = nexus.multiplierBoost * nexusFactor;
  let total = new Decimal(1);
  for (const skill of skills) {
    if (skill.effect.type !== 'multiplier' || skill.effect.resource !== 'knowledge' || skill.level <= 0) continue;
    let effect = skill.effect.value;
    if (multiplierBoost > 0) effect = 1 + (effect - 1) * (1 + multiplierBoost);
    if (dims.multiplierPower > 0) effect = 1 + (effect - 1) * (1 + dims.multiplierPower);
    if (dims.prismAllAspects > 0) effect = 1 + (effect - 1) * (1 + dims.prismAllAspects);
    total = total.times(Decimal.pow(effect, skill.level));
  }

  total = total.times(ctx.runPrestigeBonus);
  const productionBoost = nexus.productionBoost * nexusFactor;
  if (productionBoost > 0) total = total.times(1 + productionBoost);
  total = total.times(coreGlobalMultiplier(ctx.totalCores));

  const skillEfficiency = nexus.skillEfficiency * nexusFactor;
  if (skillEfficiency > 0) {
    const maxed = skills.filter(s => s.level >= s.maxLevel).length;
    total = total.times(1 + skillEfficiency * maxed);
  }
  const coreMult = nexus.stellarCoreMult * nexusFactor;
  if (coreMult > 0) total = total.times(1 + coreMult * ctx.totalCores);
  const momentum = nexus.warpMomentum * nexusFactor;
  if (momentum > 0) total = total.times(1 + momentum * ctx.runWarps);

  total = total.times(dims.productionBonus).times(dims.crossDimensionBonus);
  if (dims.prismAllAspects > 0) total = total.times(1 + dims.prismAllAspects);
  total = total.times(achievements.energy);

  return total.times(baseProduction);
}

// ---------------------------------------------------------------------------
// Overcharge: once every Tier 5 skill is maxed, production grows with the time
// spent in that state. Waiting keeps paying, but with diminishing returns per
// order of magnitude, so idle time fills the bucket without skipping ahead.
// ---------------------------------------------------------------------------

export const OVERCHARGE = { tau: 60, power: 2 };

/** Production multiplier after `seconds` of Overcharge */
export function overchargeMultiplier(seconds: number): number {
  return Math.pow(1 + Math.max(0, seconds) / OVERCHARGE.tau, OVERCHARGE.power);
}

/**
 * Energy produced between t0 and t1 seconds of Overcharge, per unit of base production
 * (the integral of overchargeMultiplier).
 */
export function overchargeIntegral(t0: number, t1: number): number {
  const { tau, power } = OVERCHARGE;
  const f = (t: number) => (tau / (power + 1)) * Math.pow(1 + Math.max(0, t) / tau, power + 1);
  return f(t1) - f(t0);
}

// ---------------------------------------------------------------------------
// Transcendence rewards (completing Tier 5)
//
// Stellar Cores and Echo Fragments are record-based: the total ever earned is a
// function of the highest Energy reached when transcending. Each transcendence
// pays out the difference, so repeating short runs earns nothing, and waiting
// longer pays with diminishing returns.
// ---------------------------------------------------------------------------

export interface RewardCurve {
  /** Energy at which the first unit is earned */
  start: number;
  /** Total earned = scale * (1 + log10(energy / start)) ^ power */
  scale: number;
  power: number;
}

// Tuned with tools/balance-sim (npm run sim)
export const STELLAR_CORE_CURVE: RewardCurve = { start: 3.5e20, scale: 0.4, power: 2 };
export const ECHO_FRAGMENT_CURVE: RewardCurve = { start: 1e32, scale: 74, power: 1 };

function curveValue(curve: RewardCurve, energy: Decimal): number {
  if (energy.lt(curve.start)) return 0;
  const orders = energy.div(curve.start).log10().toNumber();
  return curve.scale * Math.pow(1 + orders, curve.power);
}

/** Energy needed for the curve to reach the given total (inverse of curveValue) */
function curveEnergy(curve: RewardCurve, total: number): Decimal {
  const orders = Math.pow(Math.max(total, curve.scale) / curve.scale, 1 / curve.power) - 1;
  return new Decimal(curve.start).times(Decimal.pow(10, orders));
}

/** Total Stellar Cores earned for a given best Energy */
export function stellarCoreTotal(bestEnergy: Decimal, dims: DimensionEffects, achievements: AchievementEffects): number {
  return Math.floor(curveValue(STELLAR_CORE_CURVE, bestEnergy) * (1 + dims.stellarCoreBonus) * achievements.stellarCore + 1e-9);
}

/** Energy at which the next Stellar Core is earned */
export function nextStellarCoreEnergy(earned: number, dims: DimensionEffects, achievements: AchievementEffects): Decimal {
  const mult = (1 + dims.stellarCoreBonus) * achievements.stellarCore;
  return curveEnergy(STELLAR_CORE_CURVE, (earned + 1) / mult);
}

/** Total Echo Fragments earned for a given best Energy */
export function echoFragmentTotal(bestEnergy: Decimal, achievements: AchievementEffects): number {
  return Math.floor(curveValue(ECHO_FRAGMENT_CURVE, bestEnergy) * achievements.echoFragment + 1e-9);
}

/** Energy at which the next Echo Fragment is earned */
export function nextEchoFragmentEnergy(earned: number, achievements: AchievementEffects): Decimal {
  return curveEnergy(ECHO_FRAGMENT_CURVE, (earned + 1) / achievements.echoFragment);
}
