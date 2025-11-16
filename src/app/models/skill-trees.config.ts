import { SkillNode, SkillTreeTier } from './skill-node.model';
import { Decimal } from '../utils/numbers';

// Tier 1: Basic foundation (4 nodes) - Diamond shape
export const TIER_1_SKILLS: SkillNode[] = [
  {
    id: 't1_root',
    name: 'Energy Core',
    description: 'Generates 200 Energy/s',
    level: 0,
    maxLevel: 1,
    cost: new Decimal(10),
    costMultiplier: 1.15,
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: {
      type: 'production',
      value: 200,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_left',
    name: 'Power Amplifier',
    description: '1.2x Energy multiplier',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(1000), // ~5s at 200/s
    costMultiplier: 1.35,
    unlocked: false,
    prerequisites: ['t1_root'],
    position: { x: -1, y: 1 },
    effect: {
      type: 'multiplier',
      value: 1.2,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_right',
    name: 'Energy Enhancer',
    description: '1.2x Energy multiplier',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(8000), // ~6s at 1,238/s
    costMultiplier: 1.35,
    unlocked: false,
    prerequisites: ['t1_root'],
    position: { x: 1, y: 1 },
    effect: {
      type: 'multiplier',
      value: 1.2,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_final',
    name: 'Synthesis Boost',
    description: '1.3x Energy multiplier',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(60000), // ~8s at 7,663/s
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_left', 't1_right'],
    position: { x: 0, y: 2 },
    effect: {
      type: 'multiplier',
      value: 1.3,
      resource: 'knowledge'
    }
  }
];

// Tier 2: Adds 2 more nodes (6 total) - Same 4 from Tier 1 + 2 new nodes
export const TIER_2_SKILLS: SkillNode[] = [
  // Include all Tier 1 nodes
  ...TIER_1_SKILLS,
  // New Tier 2 nodes
  {
    id: 't2_amplifier_b',
    name: 'Advanced Amplifier',
    description: '1.25x Energy multiplier',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(500000), // ~8s at 62,530/s
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_left'],
    position: { x: -2.5, y: 2 },
    effect: {
      type: 'multiplier',
      value: 1.25,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_generator_b',
    name: 'Power Conduit',
    description: '1.25x Energy multiplier',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(5000000), // ~9s at 582,155/s
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_right'],
    position: { x: 2.5, y: 2 },
    effect: {
      type: 'multiplier',
      value: 1.25,
      resource: 'knowledge'
    }
  }
];

// Tier 3: Adds 3 more nodes (9 total) - Tier 2 nodes + 3 new nodes
export const TIER_3_SKILLS: SkillNode[] = [
  // Include all Tier 2 nodes (which already includes Tier 1)
  ...TIER_2_SKILLS,
  // New Tier 3 nodes
  {
    id: 't3_amplifier_c',
    name: 'Resonance Amplifier',
    description: '1.3x Energy multiplier',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(50000000), // ~9s at 5.4M/s
    costMultiplier: 1.45,
    unlocked: false,
    prerequisites: ['t2_amplifier_b'],
    position: { x: -3.5, y: 3 },
    effect: {
      type: 'multiplier',
      value: 1.3,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_generator_c',
    name: 'Energy Harmonizer',
    description: '1.3x Energy multiplier',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(400000000), // ~9s at 44M/s
    costMultiplier: 1.45,
    unlocked: false,
    prerequisites: ['t2_generator_b'],
    position: { x: 3.5, y: 3 },
    effect: {
      type: 'multiplier',
      value: 1.3,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_convergence',
    name: 'Convergence Hub',
    description: '1.4x Energy multiplier',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(3500000000), // ~10s at 359M/s
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t3_amplifier_c', 't3_generator_c'],
    position: { x: 0, y: 3.5 },
    effect: {
      type: 'multiplier',
      value: 1.4,
      resource: 'knowledge'
    }
  }
];

// Tier 4: Adds 4 more nodes (13 total) - Tier 3 nodes + 4 new nodes
export const TIER_4_SKILLS: SkillNode[] = [
  // Include all Tier 3 nodes (which already includes Tier 1 & 2)
  ...TIER_3_SKILLS,
  // New Tier 4 nodes
  {
    id: 't4_amplifier_d',
    name: 'Quantum Amplifier',
    description: '1.4x Energy multiplier',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(40000000000), // ~11s at 3.78B/s
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t3_convergence'],
    position: { x: -4.5, y: 4 },
    effect: {
      type: 'multiplier',
      value: 1.4,
      resource: 'knowledge'
    }
  },
  {
    id: 't4_generator_d',
    name: 'Flux Generator',
    description: '1.4x Energy multiplier',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(450000000000), // ~11s at 39.8B/s
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t3_convergence'],
    position: { x: 4.5, y: 4 },
    effect: {
      type: 'multiplier',
      value: 1.4,
      resource: 'knowledge'
    }
  },
  {
    id: 't4_nexus_left',
    name: 'Nexus Alpha',
    description: '1.5x Energy multiplier',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(5000000000000), // ~12s at 419B/s
    costMultiplier: 1.55,
    unlocked: false,
    prerequisites: ['t4_amplifier_d'],
    position: { x: -2, y: 4.5 },
    effect: {
      type: 'multiplier',
      value: 1.5,
      resource: 'knowledge'
    }
  },
  {
    id: 't4_nexus_right',
    name: 'Nexus Beta',
    description: '1.5x Energy multiplier',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(60000000000000), // ~13s at 4.77T/s
    costMultiplier: 1.55,
    unlocked: false,
    prerequisites: ['t4_generator_d'],
    position: { x: 2, y: 4.5 },
    effect: {
      type: 'multiplier',
      value: 1.5,
      resource: 'knowledge'
    }
  }
];

// Tier 5: Adds 5 more nodes (18 total) - Tier 4 nodes + 5 new nodes
export const TIER_5_SKILLS: SkillNode[] = [
  // Include all Tier 4 nodes (which already includes Tier 1, 2 & 3)
  ...TIER_4_SKILLS,
  // New Tier 5 nodes
  {
    id: 't5_amplifier_e',
    name: 'Cosmic Amplifier',
    description: '1.5x Energy multiplier',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(700000000000000), // ~13s at 54.3T/s
    costMultiplier: 1.55,
    unlocked: false,
    prerequisites: ['t4_nexus_left'],
    position: { x: -5.5, y: 5 },
    effect: {
      type: 'multiplier',
      value: 1.5,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_generator_e',
    name: 'Stellar Generator',
    description: '1.5x Energy multiplier',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(8500000000000000), // ~14s at 618T/s
    costMultiplier: 1.55,
    unlocked: false,
    prerequisites: ['t4_nexus_right'],
    position: { x: 5.5, y: 5 },
    effect: {
      type: 'multiplier',
      value: 1.5,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_super_nexus',
    name: 'Super Nexus',
    description: '1.6x Energy multiplier',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(100000000000000000), // ~14s at 7.04Q/s
    costMultiplier: 1.6,
    unlocked: false,
    prerequisites: ['t5_generator_e', 't5_amplifier_e'],
    position: { x: 0, y: 5.5 },
    effect: {
      type: 'multiplier',
      value: 1.6,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_ultimate_left',
    name: 'Ultimate Synthesis Alpha',
    description: '1.7x Energy multiplier',
    level: 0,
    maxLevel: 4,
    cost: new Decimal(1100000000000000000), // ~15s at 73.8Q/s
    costMultiplier: 1.65,
    unlocked: false,
    prerequisites: ['t5_super_nexus'],
    position: { x: -3, y: 6 },
    effect: {
      type: 'multiplier',
      value: 1.7,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_ultimate_right',
    name: 'Ultimate Synthesis Beta',
    description: '1.7x Energy multiplier',
    level: 0,
    maxLevel: 4,
    cost: new Decimal(10000000000000000000), // ~16s at 616Q/s
    costMultiplier: 1.65,
    unlocked: false,
    prerequisites: ['t5_super_nexus'],
    position: { x: 3, y: 6 },
    effect: {
      type: 'multiplier',
      value: 1.7,
      resource: 'knowledge'
    }
  }
];

export const SKILL_TREE_TIERS: SkillTreeTier[] = [
  {
    id: 1,
    name: '⚡ Energy Seed',
    description: 'The foundation of all power',
    requiredPoints: new Decimal(2000000),
    skills: TIER_1_SKILLS,
    prestigeBonus: 2.0  // Warping grants 2x multiplier
  },
  {
    id: 2,
    name: '� Power Network',
    description: 'Expanding energy pathways',
    requiredPoints: new Decimal(400000000),
    skills: TIER_2_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 4x)
  },
  {
    id: 3,
    name: '⚙️ Synthesis Grid',
    description: 'Complex energy convergence',
    requiredPoints: new Decimal(250000000000),
    skills: TIER_3_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 8x)
  },
  {
    id: 4,
    name: '� Nexus Array',
    description: 'Unified power nexus',
    requiredPoints: new Decimal(3500000000000000),
    skills: TIER_4_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 16x)
  },
  {
    id: 5,
    name: '✨ Ultimate Synthesis',
    description: 'The pinnacle of energy mastery',
    requiredPoints: new Decimal(350000000000000000000),
    skills: TIER_5_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 32x)
  }
];


