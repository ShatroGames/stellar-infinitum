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
    description: 'All production increased by 10%',
    level: 0,
    maxLevel: 5,
    cost: 1,
    costMultiplier: 4, // Increased from 3 to make subsequent levels more expensive
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'production_mult', value: 0.10 }
  },
  {
    id: 'void_left',
    name: 'Dark Matter Infusion',
    description: 'Multiplier effects are 3% more powerful',
    level: 0,
    maxLevel: 3,
    cost: 3,
    costMultiplier: 5,
    unlocked: false,
    prerequisites: ['void_root'],
    position: { x: -1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.03 }
  },
  {
    id: 'void_right',
    name: 'Entropy Collapse',
    description: 'Production increased by 22%',
    level: 0,
    maxLevel: 4,
    cost: 3,
    costMultiplier: 4,
    unlocked: false,
    prerequisites: ['void_root'],
    position: { x: 1, y: 1 },
    effect: { type: 'production_mult', value: 0.22 }
  },
  {
    id: 'void_deep_left',
    name: 'Singularity Core',
    description: 'Production increased by 25%',
    level: 0,
    maxLevel: 3,
    cost: 8,
    costMultiplier: 6,
    unlocked: false,
    prerequisites: ['void_left'],
    position: { x: -2, y: 2 },
    effect: { type: 'production_mult', value: 0.25 }
  },
  {
    id: 'void_deep_right',
    name: 'Void Resonance',
    description: 'For every Void node purchased, +2% production',
    level: 0,
    maxLevel: 1,
    cost: 10,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_right'],
    position: { x: 2, y: 2 },
    effect: { type: 'cross_dimension', value: 0.02, special: 'void_synergy' }
  },
  {
    id: 'void_convergence',
    name: 'Event Horizon',
    description: 'Production increased by 35%',
    level: 0,
    maxLevel: 2,
    cost: 15,
    costMultiplier: 4,
    unlocked: false,
    prerequisites: ['void_deep_left', 'void_deep_right'],
    position: { x: 0, y: 3 },
    effect: { type: 'production_mult', value: 0.35 }
  },
  {
    id: 'void_ultimate',
    name: 'Cosmic Annihilation',
    description: 'All production multiplied by 2x',
    level: 0,
    maxLevel: 1,
    cost: 25,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['void_convergence'],
    position: { x: 0, y: 4 },
    effect: { type: 'production_mult', value: 1.0 }
  }
];

// Crystal Dimension: Cheap but with unique restrictions
const CRYSTAL_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'crystal_root',
    name: 'Crystal Lattice',
    description: 'Multiplier effects are 6% more powerful',
    level: 0,
    maxLevel: 10,
    cost: 1,
    costMultiplier: 2.0, // Increased from 1.5 to make subsequent levels more expensive
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'multiplier_power', value: 0.06 }
  },
  {
    id: 'crystal_left',
    name: 'Prismatic Refraction',
    description: 'Production increased by 12%',
    level: 0,
    maxLevel: 8,
    cost: 2,
    costMultiplier: 1.6,
    unlocked: false,
    prerequisites: ['crystal_root'],
    position: { x: -1.5, y: 1 },
    effect: { type: 'production_mult', value: 0.12 }
  },
  {
    id: 'crystal_center',
    name: 'Stellar Crystallization',
    description: 'Stellar Cores granted on transcendence increased by 10%',
    level: 0,
    maxLevel: 5,
    cost: 2,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['crystal_root'],
    position: { x: 0, y: 1 },
    effect: { type: 'stellar_core_bonus', value: 0.10 }
  },
  {
    id: 'crystal_right',
    name: 'Faceted Growth',
    description: 'Skill level caps increased by 1',
    level: 0,
    maxLevel: 3,
    cost: 3,
    costMultiplier: 3,
    unlocked: false,
    prerequisites: ['crystal_root'],
    position: { x: 1.5, y: 1 },
    effect: { type: 'skill_cap', value: 1 }
  },
  {
    id: 'crystal_branch_left',
    name: 'Gemstone Amplifier',
    description: 'Multiplier effects are 2% more powerful',
    level: 0,
    maxLevel: 6,
    cost: 4,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['crystal_left'],
    position: { x: -2.5, y: 2 },
    effect: { type: 'multiplier_power', value: 0.02 }
  },
  {
    id: 'crystal_branch_right',
    name: 'Diamond Optimization',
    description: 'Stellar Core bonus increased by 15%',
    level: 0,
    maxLevel: 4,
    cost: 4,
    costMultiplier: 2.5,
    unlocked: false,
    prerequisites: ['crystal_right'],
    position: { x: 2.5, y: 2 },
    effect: { type: 'stellar_core_bonus', value: 0.15 }
  },
  {
    id: 'crystal_deep',
    name: 'Crystal Harmony',
    description: 'For every Crystal node purchased, +1% to all multipliers',
    level: 0,
    maxLevel: 1,
    cost: 8,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['crystal_center', 'crystal_left', 'crystal_right'],
    position: { x: 0, y: 2.5 },
    effect: { type: 'cross_dimension', value: 0.01, special: 'crystal_synergy' }
  },
  {
    id: 'crystal_ultimate_left',
    name: 'Eternal Clarity',
    description: 'Stellar Core generation increased by 50%',
    level: 0,
    maxLevel: 2,
    cost: 12,
    costMultiplier: 3,
    unlocked: false,
    prerequisites: ['crystal_branch_left', 'crystal_deep'],
    position: { x: -1.5, y: 3.5 },
    effect: { type: 'stellar_core_bonus', value: 0.50 }
  },
  {
    id: 'crystal_ultimate_right',
    name: 'Perfect Structure',
    description: 'Production increased by 30%',
    level: 0,
    maxLevel: 5,
    cost: 12,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['crystal_branch_right', 'crystal_deep'],
    position: { x: 1.5, y: 3.5 },
    effect: { type: 'production_mult', value: 0.30 }
  }
];

// Quantum Dimension: Random/probabilistic effects
const QUANTUM_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'quantum_root',
    name: 'Superposition',
    description: 'Production increased by 15%',
    level: 0,
    maxLevel: 6,
    cost: 1,
    costMultiplier: 2.5, // Increased from 2 to make subsequent levels more expensive
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'production_mult', value: 0.15 }
  },
  {
    id: 'quantum_left',
    name: 'Wave Function',
    description: 'Multiplier effects are 4% more powerful',
    level: 0,
    maxLevel: 4,
    cost: 2,
    costMultiplier: 2.5,
    unlocked: false,
    prerequisites: ['quantum_root'],
    position: { x: -1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.04 }
  },
  {
    id: 'quantum_right',
    name: 'Particle Acceleration',
    description: 'Multiplier power increased by 6%',
    level: 0,
    maxLevel: 5,
    cost: 2,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['quantum_root'],
    position: { x: 1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.06 }
  },
  {
    id: 'quantum_entangle_left',
    name: 'Quantum Entanglement',
    description: 'Production increased by 20%',
    level: 0,
    maxLevel: 4,
    cost: 5,
    costMultiplier: 3,
    unlocked: false,
    prerequisites: ['quantum_left'],
    position: { x: -2, y: 2 },
    effect: { type: 'production_mult', value: 0.20 }
  },
  {
    id: 'quantum_entangle_right',
    name: 'Heisenberg Uncertainty',
    description: 'Production increased by 28%',
    level: 0,
    maxLevel: 4,
    cost: 5,
    costMultiplier: 2.5,
    unlocked: false,
    prerequisites: ['quantum_right'],
    position: { x: 2, y: 2 },
    effect: { type: 'production_mult', value: 0.28 }
  },
  {
    id: 'quantum_synergy',
    name: 'Quantum Coherence',
    description: 'For every Quantum node, +3% production',
    level: 0,
    maxLevel: 1,
    cost: 10,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_entangle_left', 'quantum_entangle_right'],
    position: { x: 0, y: 2.5 },
    effect: { type: 'cross_dimension', value: 0.03, special: 'quantum_synergy' }
  },
  {
    id: 'quantum_collapse',
    name: 'Quantum Collapse',
    description: 'Multiplier effects are 8% more powerful',
    level: 0,
    maxLevel: 2,
    cost: 15,
    costMultiplier: 4,
    unlocked: false,
    prerequisites: ['quantum_synergy'],
    position: { x: 0, y: 3.5 },
    effect: { type: 'multiplier_power', value: 0.08 }
  },
  {
    id: 'quantum_ultimate',
    name: 'Schrödinger\'s Boost',
    description: 'All production multiplied by 1.5x',
    level: 0,
    maxLevel: 1,
    cost: 20,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['quantum_collapse'],
    position: { x: 0, y: 4.5 },
    effect: { type: 'production_mult', value: 0.50 }
  }
];

// Temporal Dimension: Effects get stronger over time
const TEMPORAL_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'temporal_root',
    name: 'Time Stream',
    description: 'Production increased by 10%',
    level: 0,
    maxLevel: 8,
    cost: 1,
    costMultiplier: 2.5, // Increased from 2 to make subsequent levels more expensive
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'production_mult', value: 0.10 }
  },
  {
    id: 'temporal_left',
    name: 'Temporal Acceleration',
    description: 'Production increased by 30%',
    level: 0,
    maxLevel: 5,
    cost: 2,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['temporal_root'],
    position: { x: -1, y: 1 },
    effect: { type: 'production_mult', value: 0.30 }
  },
  {
    id: 'temporal_right',
    name: 'Chronos Blessing',
    description: 'Multiplier effects are 8% more powerful',
    level: 0,
    maxLevel: 6,
    cost: 2,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['temporal_root'],
    position: { x: 1, y: 1 },
    effect: { type: 'multiplier_power', value: 0.08 }
  },
  {
    id: 'temporal_loop',
    name: 'Time Dilation',
    description: 'Skill cap increased by 2',
    level: 0,
    maxLevel: 3,
    cost: 4,
    costMultiplier: 3,
    unlocked: false,
    prerequisites: ['temporal_left', 'temporal_right'],
    position: { x: 0, y: 2 },
    effect: { type: 'skill_cap', value: 2 }
  },
  {
    id: 'temporal_branch_left',
    name: 'Past Echo',
    description: 'Production increased by 18%',
    level: 0,
    maxLevel: 5,
    cost: 6,
    costMultiplier: 2.5,
    unlocked: false,
    prerequisites: ['temporal_loop'],
    position: { x: -1.5, y: 3 },
    effect: { type: 'production_mult', value: 0.18 }
  },
  {
    id: 'temporal_branch_right',
    name: 'Future Vision',
    description: 'Skill level caps increased by 1',
    level: 0,
    maxLevel: 2,
    cost: 7,
    costMultiplier: 4,
    unlocked: false,
    prerequisites: ['temporal_loop'],
    position: { x: 1.5, y: 3 },
    effect: { type: 'skill_cap', value: 1 }
  },
  {
    id: 'temporal_synergy',
    name: 'Temporal Convergence',
    description: 'For every Temporal node, +2.5% production',
    level: 0,
    maxLevel: 1,
    cost: 12,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['temporal_branch_left', 'temporal_branch_right'],
    position: { x: 0, y: 4 },
    effect: { type: 'cross_dimension', value: 0.025, special: 'temporal_synergy' }
  },
  {
    id: 'temporal_ultimate',
    name: 'Eternal Moment',
    description: 'Multiplier effects are 10% more powerful',
    level: 0,
    maxLevel: 2,
    cost: 18,
    costMultiplier: 3,
    unlocked: false,
    prerequisites: ['temporal_synergy'],
    position: { x: 0, y: 5 },
    effect: { type: 'multiplier_power', value: 0.10 }
  }
];

// Prism Dimension: Balanced bonuses to everything
const PRISM_DIMENSION_NODES: DimensionNode[] = [
  {
    id: 'prism_root',
    name: 'Prismatic Core',
    description: 'All aspects improved by 5%',
    level: 0,
    maxLevel: 8,
    cost: 1,
    costMultiplier: 2, // Increased from 2 to make subsequent levels more expensive
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: { type: 'special', value: 0.05, special: 'all_aspects' }
  },
  {
    id: 'prism_production',
    name: 'Radiant Power',
    description: 'Production increased by 25%',
    level: 0,
    maxLevel: 6,
    cost: 2,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['prism_root'],
    position: { x: -2, y: 1 },
    effect: { type: 'production_mult', value: 0.25 }
  },
  {
    id: 'prism_cost',
    name: 'Efficient Spectrum',
    description: 'Production increased by 32%',
    level: 0,
    maxLevel: 6,
    cost: 2,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['prism_root'],
    position: { x: 2, y: 1 },
    effect: { type: 'production_mult', value: 0.32 }
  },
  {
    id: 'prism_multiplier',
    name: 'Amplified Light',
    description: 'Multiplier effects are 5% more powerful',
    level: 0,
    maxLevel: 6,
    cost: 2,
    costMultiplier: 2,
    unlocked: false,
    prerequisites: ['prism_root'],
    position: { x: 0, y: 1 },
    effect: { type: 'multiplier_power', value: 0.05 }
  },
  {
    id: 'prism_warp',
    name: 'Light Speed',
    description: 'Stellar Core bonus increased by 20%',
    level: 0,
    maxLevel: 4,
    cost: 4,
    costMultiplier: 2.5,
    unlocked: false,
    prerequisites: ['prism_production', 'prism_multiplier'],
    position: { x: -1, y: 2 },
    effect: { type: 'stellar_core_bonus', value: 0.20 }
  },
  {
    id: 'prism_retention',
    name: 'Spectrum Amplifier',
    description: 'Production increased by 25%',
    level: 0,
    maxLevel: 3,
    cost: 4,
    costMultiplier: 3,
    unlocked: false,
    prerequisites: ['prism_cost', 'prism_multiplier'],
    position: { x: 1, y: 2 },
    effect: { type: 'production_mult', value: 0.25 }
  },
  {
    id: 'prism_synergy',
    name: 'Rainbow Resonance',
    description: 'For every node in ALL dimensions, +0.5% production',
    level: 0,
    maxLevel: 1,
    cost: 10,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_warp', 'prism_retention'],
    position: { x: 0, y: 3 },
    effect: { type: 'cross_dimension', value: 0.005, special: 'prism_synergy' }
  },
  {
    id: 'prism_cap',
    name: 'Limitless Refraction',
    description: 'Skill level caps increased by 2',
    level: 0,
    maxLevel: 2,
    cost: 12,
    costMultiplier: 4,
    unlocked: false,
    prerequisites: ['prism_synergy'],
    position: { x: -1, y: 4 },
    effect: { type: 'skill_cap', value: 2 }
  },
  {
    id: 'prism_stellar',
    name: 'Prismatic Ascension',
    description: 'Stellar Core generation increased by 100%',
    level: 0,
    maxLevel: 2,
    cost: 15,
    costMultiplier: 4,
    unlocked: false,
    prerequisites: ['prism_synergy'],
    position: { x: 1, y: 4 },
    effect: { type: 'stellar_core_bonus', value: 1.0 }
  },
  {
    id: 'prism_ultimate',
    name: 'Chromatic Singularity',
    description: 'All production multiplied by 3x',
    level: 0,
    maxLevel: 1,
    cost: 30,
    costMultiplier: 1,
    unlocked: false,
    prerequisites: ['prism_cap', 'prism_stellar'],
    position: { x: 0, y: 5 },
    effect: { type: 'production_mult', value: 2.0 }
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
    unlockCost: 15,
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
    unlockCost: 20,
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
    unlockCost: 25,
    unlocked: false,
    nodes: PRISM_DIMENSION_NODES,
    mechanic: 'Enhances everything equally with cross-dimensional synergies',
    color: '#8b5cf6'
  }
];
