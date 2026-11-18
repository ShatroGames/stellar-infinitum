import { Decimal } from '../utils/numbers';

export interface DimensionNode {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: number; // Cost in Echo Fragments
  costMultiplier: number;
  unlocked: boolean;
  prerequisites: string[]; // IDs of prerequisite nodes in this dimension
  position: { x: number; y: number };
  effect: DimensionEffect;
}

export interface DimensionEffect {
  type: 'production_mult' | 'multiplier_power' | 
        'skill_cap' | 'stellar_core_bonus' | 'cross_dimension' |
        'special';
  value: number;
  resource?: string;
  special?: string; // For unique mechanics
}

export interface Dimension {
  id: string;
  name: string;
  description: string;
  theme: 'void' | 'crystal' | 'quantum' | 'temporal' | 'prism';
  unlockCost: number; // Cost in Echo Fragments to unlock this dimension
  unlocked: boolean;
  nodes: DimensionNode[];
  mechanic: string; // Description of unique mechanic
  color: string; // For UI theming
}

export interface DimensionState {
  echoFragments: number;
  totalEchoFragments: number;
  dimensions: Map<string, Dimension>;
}

// Void Dimension: Expensive but exponential returns
const VOID_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'void_root',
    name: 'Void Gateway',
    description: 'Production ×2 per level',
    level: 0,
    maxLevel: 5,
    cost: 30,
    costMultiplier: 1,
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'production_mult', value: 1 }
  },
  {
    id: 'void_left',
    name: 'Dark Matter Infusion',
    description: 'Multiplier effects 3% stronger per level',
    level: 0,
    maxLevel: 3,
    cost: 55,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_root'],
    position: { x: -1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.03 }
  },
  {
    id: 'void_right',
    name: 'Entropy Collapse',
    description: 'Production ×2 per level',
    level: 0,
    maxLevel: 4,
    cost: 30,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_root'],
    position: { x: 1, y: 1 },
    effect: { type: 'production_mult', value: 1 }
  },
  {
    id: 'void_deep_left',
    name: 'Singularity Core',
    description: 'Production ×3 per level',
    level: 0,
    maxLevel: 3,
    cost: 48,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_left'],
    position: { x: -2, y: 2 },
    effect: { type: 'production_mult', value: 2 }
  },
  {
    id: 'void_deep_right',
    name: 'Void Resonance',
    description: 'For every Void node purchased, +15% production',
    level: 0,
    maxLevel: 1,
    cost: 31,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_right'],
    position: { x: 2, y: 2 },
    effect: { type: 'cross_dimension', value: 0.15, special: 'void_synergy' }
  },
  {
    id: 'void_convergence',
    name: 'Event Horizon',
    description: 'Production ×5 per level',
    level: 0,
    maxLevel: 2,
    cost: 70,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_deep_left', 'void_deep_right'],
    position: { x: 0, y: 3 },
    effect: { type: 'production_mult', value: 4 }
  },
  {
    id: 'void_ultimate',
    name: 'Cosmic Annihilation',
    description: 'Production ×10',
    level: 0,
    maxLevel: 1,
    cost: 100,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_convergence'],
    position: { x: 0, y: 4 },
    effect: { type: 'production_mult', value: 9 }
  }
];

// Crystal Dimension: Cheap but with unique restrictions
const CRYSTAL_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'crystal_root',
    name: 'Crystal Lattice',
    description: 'Multiplier effects 1% stronger per level',
    level: 0,
    maxLevel: 10,
    cost: 18,
    costMultiplier: 1,
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'multiplier_power', value: 0.01 }
  },
  {
    id: 'crystal_left',
    name: 'Prismatic Refraction',
    description: 'Production ×1.5 per level',
    level: 0,
    maxLevel: 8,
    cost: 18,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_root'],
    position: { x: -1.5, y: 1 },
    effect: { type: 'production_mult', value: 0.5 }
  },
  {
    id: 'crystal_center',
    name: 'Stellar Crystallization',
    description: 'Stellar Cores earned +10% per level',
    level: 0,
    maxLevel: 5,
    cost: 8,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_root'],
    position: { x: 0, y: 1 },
    effect: { type: 'stellar_core_bonus', value: 0.1 }
  },
  {
    id: 'crystal_right',
    name: 'Faceted Growth',
    description: 'Skill level caps +1',
    level: 0,
    maxLevel: 1,
    cost: 60,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_root'],
    position: { x: 1.5, y: 1 },
    effect: { type: 'skill_cap', value: 1 }
  },
  {
    id: 'crystal_branch_left',
    name: 'Gemstone Amplifier',
    description: 'Multiplier effects 1% stronger per level',
    level: 0,
    maxLevel: 6,
    cost: 19,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_left'],
    position: { x: -2.5, y: 2 },
    effect: { type: 'multiplier_power', value: 0.01 }
  },
  {
    id: 'crystal_branch_right',
    name: 'Diamond Optimization',
    description: 'Stellar Cores earned +15% per level',
    level: 0,
    maxLevel: 4,
    cost: 12,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_right'],
    position: { x: 2.5, y: 2 },
    effect: { type: 'stellar_core_bonus', value: 0.15 }
  },
  {
    id: 'crystal_deep',
    name: 'Crystal Harmony',
    description: 'For every Crystal node purchased, multiplier effects 0.5% stronger',
    level: 0,
    maxLevel: 1,
    cost: 89,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_center', 'crystal_left', 'crystal_right'],
    position: { x: 0, y: 2.5 },
    effect: { type: 'cross_dimension', value: 0.005, special: 'crystal_synergy' }
  },
  {
    id: 'crystal_ultimate_left',
    name: 'Eternal Clarity',
    description: 'Stellar Cores earned +50% per level',
    level: 0,
    maxLevel: 2,
    cost: 40,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_branch_left', 'crystal_deep'],
    position: { x: -1.5, y: 3.5 },
    effect: { type: 'stellar_core_bonus', value: 0.5 }
  },
  {
    id: 'crystal_ultimate_right',
    name: 'Perfect Structure',
    description: 'Production ×1.5 per level',
    level: 0,
    maxLevel: 5,
    cost: 18,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_branch_right', 'crystal_deep'],
    position: { x: 1.5, y: 3.5 },
    effect: { type: 'production_mult', value: 0.5 }
  }
];

// Quantum Dimension: Random/probabilistic effects
const QUANTUM_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'quantum_root',
    name: 'Superposition',
    description: 'Production ×1.6 per level',
    level: 0,
    maxLevel: 6,
    cost: 20,
    costMultiplier: 1,
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'production_mult', value: 0.6 }
  },
  {
    id: 'quantum_left',
    name: 'Wave Function',
    description: 'Multiplier effects 1% stronger per level',
    level: 0,
    maxLevel: 4,
    cost: 19,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_root'],
    position: { x: -1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.01 }
  },
  {
    id: 'quantum_right',
    name: 'Particle Acceleration',
    description: 'Multiplier effects 1% stronger per level',
    level: 0,
    maxLevel: 5,
    cost: 19,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_root'],
    position: { x: 1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.01 }
  },
  {
    id: 'quantum_entangle_left',
    name: 'Quantum Entanglement',
    description: 'Production ×2 per level',
    level: 0,
    maxLevel: 4,
    cost: 30,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_left'],
    position: { x: -2, y: 2 },
    effect: { type: 'production_mult', value: 1 }
  },
  {
    id: 'quantum_entangle_right',
    name: 'Heisenberg Uncertainty',
    description: 'Production ×2 per level',
    level: 0,
    maxLevel: 4,
    cost: 30,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_right'],
    position: { x: 2, y: 2 },
    effect: { type: 'production_mult', value: 1 }
  },
  {
    id: 'quantum_synergy',
    name: 'Quantum Coherence',
    description: 'For every Quantum node purchased, +10% production',
    level: 0,
    maxLevel: 1,
    cost: 26,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_entangle_left', 'quantum_entangle_right'],
    position: { x: 0, y: 2.5 },
    effect: { type: 'cross_dimension', value: 0.1, special: 'quantum_synergy' }
  },
  {
    id: 'quantum_collapse',
    name: 'Quantum Collapse',
    description: 'Multiplier effects 2% stronger per level',
    level: 0,
    maxLevel: 2,
    cost: 37,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_synergy'],
    position: { x: 0, y: 3.5 },
    effect: { type: 'multiplier_power', value: 0.02 }
  },
  {
    id: 'quantum_ultimate',
    name: 'Schrödinger\'s Boost',
    description: 'Production ×10',
    level: 0,
    maxLevel: 1,
    cost: 100,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_collapse'],
    position: { x: 0, y: 4.5 },
    effect: { type: 'production_mult', value: 9 }
  }
];

// Temporal Dimension: Effects get stronger over time
const TEMPORAL_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'temporal_root',
    name: 'Time Stream',
    description: 'Production ×1.5 per level',
    level: 0,
    maxLevel: 8,
    cost: 18,
    costMultiplier: 1,
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'production_mult', value: 0.5 }
  },
  {
    id: 'temporal_left',
    name: 'Temporal Acceleration',
    description: 'Production ×2 per level',
    level: 0,
    maxLevel: 5,
    cost: 30,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_root'],
    position: { x: -1, y: 1 },
    effect: { type: 'production_mult', value: 1 }
  },
  {
    id: 'temporal_right',
    name: 'Chronos Blessing',
    description: 'Multiplier effects 1% stronger per level',
    level: 0,
    maxLevel: 6,
    cost: 19,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_root'],
    position: { x: 1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.01 }
  },
  {
    id: 'temporal_loop',
    name: 'Time Dilation',
    description: 'Skill level caps +1',
    level: 0,
    maxLevel: 1,
    cost: 60,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_left', 'temporal_right'],
    position: { x: 0, y: 2 },
    effect: { type: 'skill_cap', value: 1 }
  },
  {
    id: 'temporal_branch_left',
    name: 'Past Echo',
    description: 'Production ×2 per level',
    level: 0,
    maxLevel: 5,
    cost: 30,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_loop'],
    position: { x: -1.5, y: 3 },
    effect: { type: 'production_mult', value: 1 }
  },
  {
    id: 'temporal_branch_right',
    name: 'Future Vision',
    description: 'Skill level caps +1',
    level: 0,
    maxLevel: 1,
    cost: 60,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_loop'],
    position: { x: 1.5, y: 3 },
    effect: { type: 'skill_cap', value: 1 }
  },
  {
    id: 'temporal_synergy',
    name: 'Temporal Convergence',
    description: 'For every Temporal node purchased, +10% production',
    level: 0,
    maxLevel: 1,
    cost: 26,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_branch_left', 'temporal_branch_right'],
    position: { x: 0, y: 4 },
    effect: { type: 'cross_dimension', value: 0.1, special: 'temporal_synergy' }
  },
  {
    id: 'temporal_ultimate',
    name: 'Eternal Moment',
    description: 'Multiplier effects 2% stronger per level',
    level: 0,
    maxLevel: 2,
    cost: 37,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_synergy'],
    position: { x: 0, y: 5 },
    effect: { type: 'multiplier_power', value: 0.02 }
  }
];

// Prism Dimension: Balanced bonuses to everything
const PRISM_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'prism_root',
    name: 'Prismatic Core',
    description: 'All aspects improved by 2% per level',
    level: 0,
    maxLevel: 8,
    cost: 37,
    costMultiplier: 1,
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'special', value: 0.02, special: 'all_aspects' }
  },
  {
    id: 'prism_production',
    name: 'Radiant Power',
    description: 'Production ×1.5 per level',
    level: 0,
    maxLevel: 6,
    cost: 18,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_root'],
    position: { x: -2, y: 1 },
    effect: { type: 'production_mult', value: 0.5 }
  },
  {
    id: 'prism_cost',
    name: 'Efficient Spectrum',
    description: 'Production ×1.5 per level',
    level: 0,
    maxLevel: 6,
    cost: 18,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_root'],
    position: { x: 2, y: 1 },
    effect: { type: 'production_mult', value: 0.5 }
  },
  {
    id: 'prism_multiplier',
    name: 'Amplified Light',
    description: 'Multiplier effects 1% stronger per level',
    level: 0,
    maxLevel: 6,
    cost: 19,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_root'],
    position: { x: 0, y: 1 },
    effect: { type: 'multiplier_power', value: 0.01 }
  },
  {
    id: 'prism_warp',
    name: 'Light Speed',
    description: 'Stellar Cores earned +20% per level',
    level: 0,
    maxLevel: 4,
    cost: 16,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_production', 'prism_multiplier'],
    position: { x: -1, y: 2 },
    effect: { type: 'stellar_core_bonus', value: 0.2 }
  },
  {
    id: 'prism_retention',
    name: 'Spectrum Amplifier',
    description: 'Production ×2 per level',
    level: 0,
    maxLevel: 3,
    cost: 30,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_cost', 'prism_multiplier'],
    position: { x: 1, y: 2 },
    effect: { type: 'production_mult', value: 1 }
  },
  {
    id: 'prism_synergy',
    name: 'Rainbow Resonance',
    description: 'For every node in ALL dimensions, +2% production',
    level: 0,
    maxLevel: 1,
    cost: 8,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_warp', 'prism_retention'],
    position: { x: 0, y: 3 },
    effect: { type: 'cross_dimension', value: 0.02, special: 'prism_synergy' }
  },
  {
    id: 'prism_cap',
    name: 'Limitless Refraction',
    description: 'Skill level caps +1',
    level: 0,
    maxLevel: 1,
    cost: 60,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_synergy'],
    position: { x: -1, y: 4 },
    effect: { type: 'skill_cap', value: 1 }
  },
  {
    id: 'prism_stellar',
    name: 'Prismatic Ascension',
    description: 'Stellar Cores earned +100% per level',
    level: 0,
    maxLevel: 2,
    cost: 80,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_synergy'],
    position: { x: 1, y: 4 },
    effect: { type: 'stellar_core_bonus', value: 1 }
  },
  {
    id: 'prism_ultimate',
    name: 'Chromatic Singularity',
    description: 'Production ×10',
    level: 0,
    maxLevel: 1,
    cost: 100,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_cap', 'prism_stellar'],
    position: { x: 0, y: 5 },
    effect: { type: 'production_mult', value: 9 }
  }
];

export const DIMENSIONS: Dimension[] = [
  {
    id: 'void',
    name: '◇ Void Dimension',
    description: 'Expensive investments with exponential returns',
    theme: 'void',
    unlockCost: 0, // Free first dimension
    unlocked: false,
    nodes: VOID_DIMENSION_NODES,
    mechanic: 'Costs scale aggressively but provide powerful bonuses',
    color: '#4338ca'
  },
  {
    id: 'crystal',
    name: '◈ Crystal Dimension',
    description: 'Affordable upgrades with steady progression',
    theme: 'crystal',
    unlockCost: 10,
    unlocked: false,
    nodes: CRYSTAL_DIMENSION_NODES,
    mechanic: 'Lower costs allow frequent upgrades and experimentation',
    color: '#06b6d4'
  },
  {
    id: 'quantum',
    name: '◉ Quantum Dimension',
    description: 'Balanced power with uncertainty',
    theme: 'quantum',
    unlockCost: 20,
    unlocked: false,
    nodes: QUANTUM_DIMENSION_NODES,
    mechanic: 'Strong effects with moderate costs',
    color: '#f59e0b'
  },
  {
    id: 'temporal',
    name: '◐ Temporal Dimension',
    description: 'Time-based benefits and acceleration',
    theme: 'temporal',
    unlockCost: 30,
    unlocked: false,
    nodes: TEMPORAL_DIMENSION_NODES,
    mechanic: 'Focus on speed and efficiency over time',
    color: '#ec4899'
  },
  {
    id: 'prism',
    name: '◆ Prism Dimension',
    description: 'Harmonious balance across all systems',
    theme: 'prism',
    unlockCost: 40,
    unlocked: false,
    nodes: PRISM_DIMENSION_NODES,
    mechanic: 'Enhances everything equally with cross-dimensional synergies',
    color: '#8b5cf6'
  }
];
