/**
 * Stage 1 content (docs/GAME_DESIGN.md, section 3, "Stage 1 content (v2)").
 *
 * Tier 1 is a fixed core. At the first warp the player picks Saver (idle) or
 * Spender (active); every later tier adds the next expansion of that theme
 * (no mixing). Numbers are tuned with tools/balance-sim.
 */

export type Theme = 'saver' | 'spender';

export type Stage1EffectType =
  | 'production'        // +value Energy/s per level
  | 'multiplier'        // ×value per level
  | 'interest'          // +value per level × log2(1 + minutes of production held) (Saver)
  | 'bulk_discount'     // "Buy all": levels after the first in one purchase cost value per level less (Saver)
  | 'level_count'       // +value per level, per node level owned this tier (Spender)
  | 'interest_power'    // Interest ×(1 + value per level per Saver choice) (Saver, Tier 3)
  | 'level_count_power' // Level count ×(1 + value per level per Spender choice) (Spender, Tier 3)
  | 'neighbor_mult'     // connected multiplier nodes +value per level stronger (Saver, Tier 4)
  | 'neighbor_levels'   // connected nodes +value max levels per level (Spender, Tier 4)
  | 'overcharge';       // once every Tier 5 node is maxed, production grows with time (Saver, Tier 5)

export interface Stage1NodeDef {
  id: string;
  name: string;
  description: string;
  type: Stage1EffectType;
  value: number;
  maxLevel: number;
  cost: number;
  costMultiplier: number;
  /** Nodes that must be maxed first */
  requires: string[];
  /** Grid position for the tree view (x: column, y: row) */
  position: { x: number; y: number };
}

export interface TierDef {
  tier: number;
  name: string;
  /** Energy needed (with every node maxed) to warp out; in Tier 5, to beat the stage */
  requirement: number;
  /** Production multiplier for the rest of the stage after warping out */
  warpBonus: number;
}

export const TIERS: TierDef[] = [
  { tier: 1, name: 'Energy Seed', requirement: 2e6, warpBonus: 2 },
  { tier: 2, name: 'Power Network', requirement: 1.6e8, warpBonus: 2 },
  { tier: 3, name: 'Synthesis Grid', requirement: 1.6e10, warpBonus: 2 },
  { tier: 4, name: 'Nexus Array', requirement: 6e12, warpBonus: 2 },
  { tier: 5, name: 'Ultimate Synthesis', requirement: 1.8e15, warpBonus: 1 },
];

export const CORE_NODES: Stage1NodeDef[] = [
  { id: 'core_root', name: 'Energy Core', description: 'Generates 200 Energy/s', type: 'production', value: 200,
    maxLevel: 1, cost: 10, costMultiplier: 1, requires: [], position: { x: 0, y: 0 } },
  { id: 'core_left', name: 'Power Amplifier', description: '×1.2 Energy per level', type: 'multiplier', value: 1.2,
    maxLevel: 10, cost: 1e3, costMultiplier: 1.35, requires: ['core_root'], position: { x: -1, y: 1 } },
  { id: 'core_right', name: 'Energy Enhancer', description: '×1.2 Energy per level', type: 'multiplier', value: 1.2,
    maxLevel: 10, cost: 8e3, costMultiplier: 1.35, requires: ['core_root'], position: { x: 1, y: 1 } },
  { id: 'core_final', name: 'Synthesis Boost', description: '×1.3 Energy per level', type: 'multiplier', value: 1.3,
    maxLevel: 8, cost: 6e4, costMultiplier: 1.4, requires: ['core_left', 'core_right'], position: { x: 0, y: 2 } },
];

/**
 * Each expansion is an entry node (requiring the previous tier's exit nodes)
 * with two children. The next tier's entry requires both children.
 */
export interface Expansion {
  theme: Theme;
  name: string;
  summary: string;
  nodes: [Stage1NodeDef, Stage1NodeDef, Stage1NodeDef];
}

function expansion(tier: number, theme: Theme, name: string, summary: string,
                   nodes: Omit<Stage1NodeDef, 'requires' | 'position'>[]): Expansion {
  const row = 2 * tier - 1;
  // Entry prerequisites depend on the previous tier's choice; resolved in buildTree()
  const entryRequires = tier === 2 ? ['core_final'] : [];
  const [entry, left, right] = nodes;
  return {
    theme, name, summary,
    nodes: [
      { ...entry, requires: entryRequires, position: { x: 0, y: row } },
      { ...left, requires: [entry.id], position: { x: -1, y: row + 1 } },
      { ...right, requires: [entry.id], position: { x: 1, y: row + 1 } },
    ],
  };
}

export const EXPANSIONS: Record<number, Record<Theme, Expansion>> = {
  2: {
    saver: expansion(2, 'saver', 'Reserve', 'Interest on held Energy and discounts on buying in bulk', [
      { id: 's2_interest', name: 'Interest', description: '+20% Energy per level, growing with how many minutes of production you hold',
        type: 'interest', value: 0.2, maxLevel: 5, cost: 1.2e06, costMultiplier: 2 },
      { id: 's2_bulk', name: 'Bulk Order', description: '"Buy all": extra levels of a node bought together cost 10% less per level of this node (up to 50%)',
        type: 'bulk_discount', value: 0.1, maxLevel: 5, cost: 2.4e06, costMultiplier: 2 },
      { id: 's2_vault', name: 'Vault', description: '×1.5 Energy per level', type: 'multiplier', value: 1.5,
        maxLevel: 5, cost: 4.8e06, costMultiplier: 2.2 },
    ]),
    spender: expansion(2, 'spender', 'Momentum', 'Many cheap levels and bonuses for every level owned', [
      { id: 'p2_steps', name: 'Fine Steps', description: '×1.06 Energy per level', type: 'multiplier', value: 1.06,
        maxLevel: 25, cost: 2.7e04, costMultiplier: 1.25 },
      { id: 'p2_tally', name: 'Tally', description: '+0.2% Energy per level for each node level owned',
        type: 'level_count', value: 0.002, maxLevel: 5, cost: 9e04, costMultiplier: 2 },
      { id: 'p2_spark', name: 'Spark', description: '×1.04 Energy per level', type: 'multiplier', value: 1.04,
        maxLevel: 30, cost: 5.4e04, costMultiplier: 1.2 },
    ]),
  },
  3: {
    saver: expansion(3, 'saver', 'Deep Reserve', 'Interest grows with every Saver tier', [
      { id: 's3_patience', name: 'Patience', description: 'Interest +25% per level for each Saver tier you have',
        type: 'interest_power', value: 0.25, maxLevel: 4, cost: 7.3e07, costMultiplier: 2.2 },
      { id: 's3_vault', name: 'Strongroom', description: '×1.6 Energy per level', type: 'multiplier', value: 1.6,
        maxLevel: 5, cost: 2.2e08, costMultiplier: 2.4 },
      { id: 's3_interest', name: 'Compound Interest', description: '+30% Energy per level, growing with how many minutes of production you hold',
        type: 'interest', value: 0.3, maxLevel: 5, cost: 4.4e08, costMultiplier: 2.2 },
    ]),
    spender: expansion(3, 'spender', 'Rhythm', 'Level bonuses grow with every Spender tier', [
      { id: 'p3_rhythm', name: 'Rhythm', description: 'Tally effects +25% per level for each Spender tier you have',
        type: 'level_count_power', value: 0.25, maxLevel: 4, cost: 8.4e06, costMultiplier: 2.2 },
      { id: 'p3_steps', name: 'Finer Steps', description: '×1.05 Energy per level', type: 'multiplier', value: 1.05,
        maxLevel: 30, cost: 4.2e06, costMultiplier: 1.22 },
      { id: 'p3_tally', name: 'Ledger', description: '+0.3% Energy per level for each node level owned',
        type: 'level_count', value: 0.003, maxLevel: 5, cost: 5.1e07, costMultiplier: 2.2 },
    ]),
  },
  4: {
    saver: expansion(4, 'saver', 'Foundations', 'Strengthens connected nodes', [
      { id: 's4_roots', name: 'Root Network', description: 'Connected multiplier nodes +5% stronger per level',
        type: 'neighbor_mult', value: 0.05, maxLevel: 5, cost: 3.8e10, costMultiplier: 2.3 },
      { id: 's4_vault', name: 'Treasury', description: '×1.7 Energy per level', type: 'multiplier', value: 1.7,
        maxLevel: 5, cost: 9.6e10, costMultiplier: 2.5 },
      { id: 's4_bulk', name: 'Wholesale', description: '"Buy all": extra levels of a node bought together cost 10% less per level of this node (up to 50%)',
        type: 'bulk_discount', value: 0.1, maxLevel: 4, cost: 1.9e11, costMultiplier: 2.3 },
    ]),
    spender: expansion(4, 'spender', 'Relays', 'Gives connected nodes more levels', [
      { id: 'p4_relay', name: 'Relay', description: 'Connected nodes +2 max levels per level',
        type: 'neighbor_levels', value: 2, maxLevel: 5, cost: 1.4e07, costMultiplier: 2.3 },
      { id: 'p4_steps', name: 'Micro Steps', description: '×1.05 Energy per level', type: 'multiplier', value: 1.05,
        maxLevel: 30, cost: 7.2e06, costMultiplier: 1.25 },
      { id: 'p4_spark', name: 'Flicker', description: '×1.04 Energy per level', type: 'multiplier', value: 1.04,
        maxLevel: 40, cost: 2.2e07, costMultiplier: 1.2 },
    ]),
  },
  5: {
    saver: expansion(5, 'saver', 'Overcharge', 'Production keeps growing once the tree is complete', [
      { id: 's5_overcharge', name: 'Overcharge', description: 'Once every node is maxed, production grows over time (twice as fast while you watch)',
        type: 'overcharge', value: 1, maxLevel: 1, cost: 9.7e12, costMultiplier: 1 },
      { id: 's5_vault', name: 'Sanctum', description: '×1.8 Energy per level', type: 'multiplier', value: 1.8,
        maxLevel: 5, cost: 1.9e13, costMultiplier: 2.5 },
      { id: 's5_interest', name: 'Dividends', description: '+50% Energy per level, growing with how many minutes of production you hold',
        type: 'interest', value: 0.5, maxLevel: 5, cost: 3.2e13, costMultiplier: 2.4 },
    ]),
    spender: expansion(5, 'spender', 'Cascade', 'The finest steps of all', [
      { id: 'p5_cascade', name: 'Cascade', description: '×1.04 Energy per level', type: 'multiplier', value: 1.04,
        maxLevel: 50, cost: 8.1e11, costMultiplier: 1.15 },
      { id: 'p5_tally', name: 'Census', description: '+0.4% Energy per level for each node level owned',
        type: 'level_count', value: 0.004, maxLevel: 5, cost: 3.9e12, costMultiplier: 2.3 },
      { id: 'p5_steps', name: 'Nano Steps', description: '×1.05 Energy per level', type: 'multiplier', value: 1.05,
        maxLevel: 40, cost: 1.6e12, costMultiplier: 1.2 },
    ]),
  },
};

/** Tier 5 capstone of each theme */
export const CAPSTONES: Record<Theme, { name: string; description: string }> = {
  saver: { name: 'Unbroken Vault', description: 'Interest counts double' },
  spender: { name: 'Endless Motion', description: 'Every node level owned makes all nodes 1% cheaper' },
};

export const OVERCHARGE = { tau: 60, power: 2, visibleSpeed: 2 };
