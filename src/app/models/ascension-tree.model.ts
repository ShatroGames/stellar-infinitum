import Decimal from 'break_eternity.js';

export interface AscensionNode {
  id: string;
  name: string;
  description: string;
  cost: number; // Cost in Ascension Points
  purchased: boolean;
  position: { x: number; y: number }; // For visual layout
  requires?: string[]; // IDs of nodes that must be purchased first
  effect: AscensionEffect;
}

export interface AscensionEffect {
  type: 'auto_buy' | 'bulk_buy' | 'cost_reduction' | 'production_boost' | 
        'start_bonus' | 'warp_speed' | 'skill_cap' | 'multiplier_boost' |
        'offline_bonus' | 'prestige_keep' | 'auto_warp';
  value: number;
}

export interface AscensionState {
  points: number;
  totalPoints: number;
  nodes: Map<string, AscensionNode>;
}

export const ASCENSION_TREE_NODES: AscensionNode[] = [
  // === ROW 0: Root Node ===
  {
    id: 'auto_buy',
    name: 'Automated Systems',
    description: 'Automatically purchase skill upgrades when you can afford them',
    cost: 1,
    purchased: false,
    position: { x: 0, y: 0 },
    effect: { type: 'auto_buy', value: 1 }
  },
  
  // === ROW 1: Primary Upgrades (3 nodes) ===
  {
    id: 'bulk_buy_5',
    name: 'Bulk Processing I',
    description: 'Buy up to 5 levels at once',
    cost: 1,
    purchased: false,
    position: { x: -2, y: 1 },
    requires: ['auto_buy'],
    effect: { type: 'bulk_buy', value: 5 }
  },
  {
    id: 'start_energy',
    name: 'Momentum Start',
    description: 'Start each warp with 1000 Energy instead of 10',
    cost: 1,
    purchased: false,
    position: { x: 0, y: 1 },
    requires: ['auto_buy'],
    effect: { type: 'start_bonus', value: 1000 }
  },
  {
    id: 'production_25',
    name: 'Power Enhancement I',
    description: 'Increase all production by 25%',
    cost: 1,
    purchased: false,
    position: { x: 2, y: 1 },
    requires: ['auto_buy'],
    effect: { type: 'production_boost', value: 0.25 }
  },
  
  // === ROW 2: Secondary Upgrades (3 nodes) ===
  {
    id: 'cost_reduce_10',
    name: 'Cost Optimization I',
    description: 'Reduce all skill costs by 10%',
    cost: 1,
    purchased: false,
    position: { x: -3, y: 2 },
    requires: ['bulk_buy_5', 'production_25', 'start_energy'],
    effect: { type: 'cost_reduction', value: 0.10 }
  },
  {
    id: 'warp_speed_1',
    name: 'Warp Acceleration I',
    description: 'Reduce warp requirements by 20%',
    cost: 2,
    purchased: false,
    position: { x: 0, y: 2 },
    requires: ['bulk_buy_5', 'production_25', 'start_energy'],
    effect: { type: 'warp_speed', value: 0.20 }
  },
  {
    id: 'production_50',
    name: 'Power Enhancement II',
    description: 'Increase all production by 50%',
    cost: 2,
    purchased: false,
    position: { x: 3, y: 2 },
    requires: ['bulk_buy_5', 'production_25', 'start_energy'],
    effect: { type: 'production_boost', value: 0.50 }
  },
  
  // === ROW 3: Auto-Warp (1 node) ===
  {
    id: 'auto_warp',
    name: 'Automated Warping',
    description: 'Automatically warp when all skills are maxed and requirements are met',
    cost: 2,
    purchased: false,
    position: { x: 0, y: 3 },
    requires: ['cost_reduce_10', 'warp_speed_1', 'production_50'],
    effect: { type: 'auto_warp', value: 1 }
  },
  
  // === ROW 4: Tertiary Upgrades (3 nodes) ===
  {
    id: 'bulk_buy_10',
    name: 'Bulk Processing II',
    description: 'Buy up to 10 levels at once',
    cost: 2,
    purchased: false,
    position: { x: -2, y: 4 },
    requires: ['cost_reduce_10', 'production_25', 'start_energy'],
    effect: { type: 'bulk_buy', value: 10 }
  },
  {
    id: 'offline_bonus',
    name: 'Persistent Training',
    description: 'Gain 50% more resources while offline',
    cost: 2,
    purchased: false,
    position: { x: 0, y: 4 },
    requires: ['warp_speed_1', 'production_50', 'cost_reduce_10'],
    effect: { type: 'offline_bonus', value: 0.50 }
  },
  {
    id: 'multiplier_boost',
    name: 'Multiplier Amplification',
    description: 'All multiplier effects are 20% stronger',
    cost: 2,
    purchased: false,
    position: { x: 2, y: 4 },
    requires: ['production_50', 'bulk_buy_10', 'start_energy'],
    effect: { type: 'multiplier_boost', value: 0.20 }
  },
  
  // === ROW 5: Advanced Upgrades (3 nodes) ===
  {
    id: 'cost_reduce_25',
    name: 'Cost Optimization II',
    description: 'Reduce all skill costs by 25%',
    cost: 3,
    purchased: false,
    position: { x: -3, y: 5 },
    requires: ['bulk_buy_10', 'production_25', 'start_energy'],
    effect: { type: 'cost_reduction', value: 0.25 }
  },
  {
    id: 'warp_speed_2',
    name: 'Warp Acceleration II',
    description: 'Reduce warp requirements by 40%',
    cost: 3,
    purchased: false,
    position: { x: 0, y: 5 },
    requires: ['offline_bonus', 'bulk_buy_10', 'multiplier_boost'],
    effect: { type: 'warp_speed', value: 0.40 }
  },
  {
    id: 'production_100',
    name: 'Power Enhancement III',
    description: 'Increase all production by 100%',
    cost: 3,
    purchased: false,
    position: { x: 3, y: 5 },
    requires: ['multiplier_boost', 'bulk_buy_10', 'start_energy'],
    effect: { type: 'production_boost', value: 1.0 }
  },
  
  // === ROW 6: Convergence Tier (3 nodes) ===
  {
    id: 'bulk_buy_max',
    name: 'Quantum Processing',
    description: 'Buy maximum affordable levels at once',
    cost: 4,
    purchased: false,
    position: { x: -2, y: 6 },
    requires: ['warp_speed_2', 'cost_reduce_25', 'production_100'],
    effect: { type: 'bulk_buy', value: 999 }
  },
  {
    id: 'skill_cap_increase',
    name: 'Limitless Growth',
    description: 'Increase all skill level caps by 5',
    cost: 4,
    purchased: false,
    position: { x: 0, y: 6 },
    requires: ['warp_speed_2', 'cost_reduce_25', 'production_100'],
    effect: { type: 'skill_cap', value: 5 }
  },
  {
    id: 'production_200',
    name: 'Power Enhancement IV',
    description: 'Increase all production by 200%',
    cost: 4,
    purchased: false,
    position: { x: 2, y: 6 },
    requires: ['warp_speed_2', 'cost_reduce_25', 'production_100'],
    effect: { type: 'production_boost', value: 2.0 }
  },
  
  // === ROW 7: Ultimate Tier I (3 nodes) ===
  {
    id: 'prestige_keep_10',
    name: 'Energy Retention I',
    description: 'Keep 10% of Energy when warping',
    cost: 5,
    purchased: false,
    position: { x: -1, y: 7 },
    requires: ['bulk_buy_max', 'skill_cap_increase', 'production_200'],
    effect: { type: 'prestige_keep', value: 0.10 }
  },
  {
    id: 'prestige_keep_25',
    name: 'Energy Retention II',
    description: 'Keep 25% of Energy when warping',
    cost: 6,
    purchased: false,
    position: { x: 1, y: 7 },
    requires: ['bulk_buy_max', 'skill_cap_increase', 'production_200'],
    effect: { type: 'prestige_keep', value: 0.25 }
  },
  {
    id: 'mega_boost',
    name: 'Transcendent Power',
    description: 'All production and multipliers increased by 500%',
    cost: 8,
    purchased: false,
    position: { x: 0, y: 7 },
    requires: ['bulk_buy_max', 'skill_cap_increase', 'production_200'],
    effect: { type: 'production_boost', value: 5.0 }
  }
];
