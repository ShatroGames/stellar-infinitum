import { SkillNode, SkillTreeTier } from './skill-node.model';
import { Decimal } from '../utils/numbers';

// Tier 1: Basic foundation (4 nodes) - Diamond shape
export const TIER_1_SKILLS: SkillNode[] = [
  {
    id: 't1_root',
    name: 'Energy Core',
    description: 'Generates 10 Energy/s',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(10),
    costMultiplier: 1.5,
    unlocked: true,
    prerequisites: [],
    position: { x: 0, y: 0 },
    effect: {
      type: 'production',
      value: 10,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_left',
    name: 'Amplifier A',
    description: '2x Energy multiplier',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(100),
    costMultiplier: 1.8,
    unlocked: false,
    prerequisites: ['t1_root'],
    position: { x: -1, y: 1 },
    effect: {
      type: 'multiplier',
      value: 2,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_right',
    name: 'Generator A',
    description: 'Generates 50 Energy/s',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(100),
    costMultiplier: 1.7,
    unlocked: false,
    prerequisites: ['t1_root'],
    position: { x: 1, y: 1 },
    effect: {
      type: 'production',
      value: 50,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_final',
    name: 'Synthesis Node',
    description: 'Generates 100 Energy/s',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(2000),
    costMultiplier: 1.6,
    unlocked: false,
    prerequisites: ['t1_left', 't1_right'],
    position: { x: 0, y: 2 },
    effect: {
      type: 'production',
      value: 100,
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
    name: 'Amplifier B',
    description: 'Generates 200 Energy/s',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(5000),
    costMultiplier: 2.0,
    unlocked: false,
    prerequisites: ['t1_left'],
    position: { x: -2.5, y: 2 },
    effect: {
      type: 'production',
      value: 200,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_generator_b',
    name: 'Generator B',
    description: 'Generates 300 Energy/s',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(5000),
    costMultiplier: 2.0,
    unlocked: false,
    prerequisites: ['t1_right'],
    position: { x: 2.5, y: 2 },
    effect: {
      type: 'production',
      value: 300,
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
    name: 'Amplifier C',
    description: 'Generates 500 Energy/s',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(50000),
    costMultiplier: 2.1,
    unlocked: false,
    prerequisites: ['t2_amplifier_b'],
    position: { x: -3.5, y: 3 },
    effect: {
      type: 'production',
      value: 500,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_generator_c',
    name: 'Generator C',
    description: 'Generates 800 Energy/s',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(50000),
    costMultiplier: 2.1,
    unlocked: false,
    prerequisites: ['t2_generator_b'],
    position: { x: 3.5, y: 3 },
    effect: {
      type: 'production',
      value: 800,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_convergence',
    name: 'Convergence Hub',
    description: '3x Energy production multiplier',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(500000),
    costMultiplier: 2.5,
    unlocked: false,
    prerequisites: ['t3_amplifier_c', 't3_generator_c'],
    position: { x: 0, y: 3.5 },
    effect: {
      type: 'multiplier',
      value: 3,
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
    name: 'Amplifier D',
    description: 'Generates 1500 Energy/s',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(5000000),
    costMultiplier: 2.2,
    unlocked: false,
    prerequisites: ['t3_convergence'],
    position: { x: -4.5, y: 4 },
    effect: {
      type: 'production',
      value: 1500,
      resource: 'knowledge'
    }
  },
  {
    id: 't4_generator_d',
    name: 'Generator D',
    description: 'Generates 2500 Energy/s',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(5000000),
    costMultiplier: 2.2,
    unlocked: false,
    prerequisites: ['t3_convergence'],
    position: { x: 4.5, y: 4 },
    effect: {
      type: 'production',
      value: 2500,
      resource: 'knowledge'
    }
  },
  {
    id: 't4_nexus_left',
    name: 'Nexus Alpha',
    description: '4x Energy production multiplier',
    level: 0,
    maxLevel: 4,
    cost: new Decimal(50000000),
    costMultiplier: 2.8,
    unlocked: false,
    prerequisites: ['t4_amplifier_d'],
    position: { x: -2, y: 4.5 },
    effect: {
      type: 'multiplier',
      value: 4,
      resource: 'knowledge'
    }
  },
  {
    id: 't4_nexus_right',
    name: 'Nexus Beta',
    description: '4x Energy production multiplier',
    level: 0,
    maxLevel: 4,
    cost: new Decimal(50000000),
    costMultiplier: 2.8,
    unlocked: false,
    prerequisites: ['t4_generator_d'],
    position: { x: 2, y: 4.5 },
    effect: {
      type: 'multiplier',
      value: 4,
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
    name: 'Amplifier E',
    description: 'Generates 5000 Energy/s',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(500000000),
    costMultiplier: 2.3,
    unlocked: false,
    prerequisites: ['t4_nexus_left'],
    position: { x: -5.5, y: 5 },
    effect: {
      type: 'production',
      value: 5000,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_generator_e',
    name: 'Generator E',
    description: 'Generates 8000 Energy/s',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(500000000),
    costMultiplier: 2.3,
    unlocked: false,
    prerequisites: ['t4_nexus_right'],
    position: { x: 5.5, y: 5 },
    effect: {
      type: 'production',
      value: 8000,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_super_nexus',
    name: 'Super Nexus',
    description: '5x Energy production multiplier',
    level: 0,
    maxLevel: 4,
    cost: new Decimal(5000000000),
    costMultiplier: 2.8,
    unlocked: false,
    prerequisites: ['t5_generator_e', 't5_amplifier_e'],
    position: { x: 0, y: 5.5 },
    effect: {
      type: 'multiplier',
      value: 5,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_ultimate_left',
    name: 'Ultimate Synthesis Alpha',
    description: '6x Energy production multiplier',
    level: 0,
    maxLevel: 3,
    cost: new Decimal(50000000000),
    costMultiplier: 3.0,
    unlocked: false,
    prerequisites: ['t5_super_nexus'],
    position: { x: -3, y: 6 },
    effect: {
      type: 'multiplier',
      value: 6,
      resource: 'knowledge'
    }
  },
  {
    id: 't5_ultimate_right',
    name: 'Ultimate Synthesis Beta',
    description: '6x Energy production multiplier',
    level: 0,
    maxLevel: 3,
    cost: new Decimal(50000000000),
    costMultiplier: 3.0,
    unlocked: false,
    prerequisites: ['t5_super_nexus'],
    position: { x: 3, y: 6 },
    effect: {
      type: 'multiplier',
      value: 6,
      resource: 'knowledge'
    }
  }
];

export const SKILL_TREE_TIERS: SkillTreeTier[] = [
  {
    id: 1,
    name: '⚡ Energy Seed',
    description: 'The foundation of all power',
    requiredPoints: new Decimal(100000),
    skills: TIER_1_SKILLS,
    prestigeBonus: 2.0
  },
  {
    id: 2,
    name: '� Power Network',
    description: 'Expanding energy pathways',
    requiredPoints: new Decimal(500000),
    skills: TIER_2_SKILLS,
    prestigeBonus: 4.0
  },
  {
    id: 3,
    name: '⚙️ Synthesis Grid',
    description: 'Complex energy convergence',
    requiredPoints: new Decimal(50000000),
    skills: TIER_3_SKILLS,
    prestigeBonus: 8.0
  },
  {
    id: 4,
    name: '� Nexus Array',
    description: 'Unified power nexus',
    requiredPoints: new Decimal(5000000000),
    skills: TIER_4_SKILLS,
    prestigeBonus: 16.0
  },
  {
    id: 5,
    name: '✨ Ultimate Synthesis',
    description: 'The pinnacle of energy mastery',
    requiredPoints: new Decimal(1000000000000),
    skills: TIER_5_SKILLS,
    prestigeBonus: 32.0
  }
];
