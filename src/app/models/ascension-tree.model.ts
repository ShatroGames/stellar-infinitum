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
        'skill_efficiency' | 'stellar_core_mult' | 'warp_momentum' | 'auto_warp' | 
        'remove_prerequisites';
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
    description: 'Start each warp with 1M Energy instead of 10',
    cost: 1,
    purchased: false,
    position: { x: 0, y: 1 },
    requires: ['auto_buy'],
    effect: { type: 'start_bonus', value: 1000000 }
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
    requires: ['auto_warp'],
    effect: { type: 'bulk_buy', value: 10 }
  },
  {
    id: 'skill_efficiency',
    name: 'Skill Synergy',
    description: 'Each maxed skill node grants +2% production to all other skills',
    cost: 2,
    purchased: false,
    position: { x: 0, y: 4 },
    requires: ['auto_warp'],
    effect: { type: 'skill_efficiency', value: 0.02 }
  },
  {
    id: 'multiplier_boost',
    name: 'Multiplier Amplification',
    description: 'All multiplier effects are 5% stronger',
    cost: 2,
    purchased: false,
    position: { x: 2, y: 4 },
    requires: ['auto_warp'],
    effect: { type: 'multiplier_boost', value: 0.05 }
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
    requires: ['skill_efficiency', 'bulk_buy_10', 'multiplier_boost'],
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
    description: 'Increase all skill level caps by 2',
    cost: 4,
    purchased: false,
    position: { x: 0, y: 6 },
    requires: ['warp_speed_2', 'cost_reduce_25', 'production_100'],
    effect: { type: 'skill_cap', value: 2 }
  },
  {
    id: 'production_200',
    name: 'Power Enhancement IV',
    description: 'Increase all production by 150%',
    cost: 4,
    purchased: false,
    position: { x: 2, y: 6 },
    requires: ['warp_speed_2', 'cost_reduce_25', 'production_100'],
    effect: { type: 'production_boost', value: 1.5 }
  },
  
  // === ROW 7: Ultimate Tier I (3 nodes) ===
  {
    id: 'stellar_core_mult',
    name: 'Core Resonance',
    description: 'Each Stellar Core you own increases production by 20%',
    cost: 5,
    purchased: false,
    position: { x: -1, y: 7 },
    requires: ['bulk_buy_max', 'skill_cap_increase', 'production_200'],
    effect: { type: 'stellar_core_mult', value: 0.20 }
  },
  {
    id: 'warp_momentum',
    name: 'Momentum Cascade',
    description: 'Each warp in the current run increases production by 15%',
    cost: 6,
    purchased: false,
    position: { x: 1, y: 7 },
    requires: ['bulk_buy_max', 'skill_cap_increase', 'production_200'],
    effect: { type: 'warp_momentum', value: 0.15 }
  },
  {
    id: 'mega_boost',
    name: 'Transcendent Power',
    description: 'All production and multipliers increased by 300%',
    cost: 8,
    purchased: false,
    position: { x: 0, y: 7 },
    requires: ['bulk_buy_max', 'skill_cap_increase', 'production_200'],
    effect: { type: 'production_boost', value: 3.0 }
  },
  
  // === ROW 8: Final Tier (1 node) ===
  {
    id: 'unlock_all',
    name: 'Omnipotent Network',
    description: 'Removes all skill node prerequisites - purchase any node at any time',
    cost: 15,
    purchased: false,
    position: { x: 0, y: 8 },
    requires: ['stellar_core_mult', 'warp_momentum', 'mega_boost'],
    effect: { type: 'remove_prerequisites', value: 1 }
  }
];
