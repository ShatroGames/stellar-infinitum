import { SkillNode, SkillTreeTier } from './skill-node.model';
import { Decimal } from '../utils/numbers';
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
    cost: new Decimal(1000),
    costMultiplier: 1.35,
    unlocked: false,
    prerequisites: ['t1_root'],
    position: { x: -1.5, y: 1 },
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
    cost: new Decimal(8000),
    costMultiplier: 1.35,
    unlocked: false,
    prerequisites: ['t1_root'],
    position: { x: 1.5, y: 1 },
    effect: {
      type: 'multiplier',
      value: 1.2,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_middle',
    name: 'Stabilizer',
    description: 'Adds +400 Energy/s',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(3500),
    costMultiplier: 1.3,
    unlocked: false,
    prerequisites: ['t1_right', 't1_left'],
    position: { x: 0, y: 1.5 },
    effect: {
      type: 'production',
      value: 400,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_choice_left',
    name: 'Efficient Research',
    description: 'Reduces all node costs by 5% per level',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(25000),
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t1_middle'],
    position: { x: -2.5, y: 2.5 },
    mutuallyExclusive: ['t1_choice_right'],
    choiceGroup: 'tier1_choice1',
    effect: {
      type: 'cost_reduction',
      value: 0.05,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_choice_right',
    name: 'Rapid Advancement',
    description: '+50% Energy production, but costs increase by 20%',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(25000),
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t1_middle'],
    position: { x: 2.5, y: 2.5 },
    mutuallyExclusive: ['t1_choice_left'],
    choiceGroup: 'tier1_choice1',
    effect: {
      type: 'xp_boost',
      value: 0.5,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_left_synergy',
    name: 'Harmonic Amplifier',
    description: '1.15x multiplier, +5% per Efficient Research level',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(80000),
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_choice_left'],
    position: { x: -3, y: 3.5 },
    effect: {
      type: 'synergy',
      value: 1.15,
      resource: 'knowledge',
      synergyWith: 't1_choice_left'
    }
  },
  {
    id: 't1_right_synergy',
    name: 'Exponential Surge',
    description: '1.25x multiplier, +3% per Rapid Advancement level',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(80000),
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_choice_right'],
    position: { x: 3, y: 3.5 },
    effect: {
      type: 'synergy',
      value: 1.25,
      resource: 'knowledge',
      synergyWith: 't1_choice_right'
    }
  },
  {
    id: 't1_middle_path',
    name: 'Focused Production',
    description: 'Adds +800 Energy/s',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(50000),
    costMultiplier: 1.35,
    unlocked: false,
    prerequisites: ['t1_middle'],
    position: { x: 0, y: 3 },
    effect: {
      type: 'production',
      value: 800,
      resource: 'knowledge'
    }
  },
  {
    id: 't1_final',
    name: 'Synthesis Boost',
    description: '1.3x Energy multiplier',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(150000),
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_middle_path'],
    position: { x: 0, y: 4 },
    effect: {
      type: 'multiplier',
      value: 1.3,
      resource: 'knowledge'
    }
  }
];
export const TIER_2_SKILLS: SkillNode[] = [
  ...TIER_1_SKILLS,
  {
    id: 't2_amplifier_b',
    name: 'Advanced Amplifier',
    description: '1.25x Energy multiplier',
    level: 0,
    maxLevel: 10,
    cost: new Decimal(500000),
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_middle'],
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
    cost: new Decimal(5000000),
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t1_middle'],
    position: { x: 2.5, y: 2 },
    effect: {
      type: 'multiplier',
      value: 1.25,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_middle',
    name: 'Energy Matrix',
    description: 'Adds +2000 Energy/s',
    level: 0,
    maxLevel: 9,
    cost: new Decimal(2000000),
    costMultiplier: 1.38,
    unlocked: false,
    prerequisites: ['t1_final'],
    position: { x: 0, y: 4.5 },
    effect: {
      type: 'production',
      value: 2000,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_choice_left',
    name: 'Parallel Processing',
    description: '+100% to all production nodes',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(15000000),
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t2_amplifier_b', 't2_middle'],
    position: { x: -3.5, y: 5 },
    mutuallyExclusive: ['t2_choice_right'],
    choiceGroup: 'tier2_choice1',
    effect: {
      type: 'xp_boost',
      value: 1.0,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_choice_right',
    name: 'Quantum Efficiency',
    description: 'Multipliers are 50% more effective',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(15000000),
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t2_generator_b', 't2_middle'],
    position: { x: 3.5, y: 5 },
    mutuallyExclusive: ['t2_choice_left'],
    choiceGroup: 'tier2_choice1',
    effect: {
      type: 'xp_boost',
      value: 0.5,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_left_branch',
    name: 'Mass Fabrication',
    description: 'Adds +5000 Energy/s',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(40000000),
    costMultiplier: 1.42,
    unlocked: false,
    prerequisites: ['t2_middle'],
    position: { x: -4.5, y: 6 },
    effect: {
      type: 'production',
      value: 5000,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_right_branch',
    name: 'Exponential Core',
    description: '1.35x Energy multiplier',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(40000000),
    costMultiplier: 1.42,
    unlocked: false,
    prerequisites: ['t2_middle'],
    position: { x: 4.5, y: 6 },
    effect: {
      type: 'multiplier',
      value: 1.35,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_left_synergy',
    name: 'Production Overload',
    description: '1.2x multiplier, +8% per Parallel Processing level',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(80000000),
    costMultiplier: 1.45,
    unlocked: false,
    prerequisites: ['t2_left_branch', "t2_right_branch"],
    position: { x: -5, y: 7 },
    effect: {
      type: 'synergy',
      value: 1.2,
      resource: 'knowledge',
      synergyWith: 't2_choice_left'
    }
  },
  {
    id: 't2_right_synergy',
    name: 'Efficiency Cascade',
    description: '1.4x multiplier, +6% per Quantum Efficiency level',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(80000000),
    costMultiplier: 1.45,
    unlocked: false,
    prerequisites: ['t2_right_branch'],
    position: { x: 5, y: 7 },
    effect: {
      type: 'synergy',
      value: 1.4,
      resource: 'knowledge',
      synergyWith: 't2_choice_right'
    }
  },
  {
    id: 't2_middle_path',
    name: 'Energy Condenser',
    description: 'Adds +8000 Energy/s',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(100000000),
    costMultiplier: 1.4,
    unlocked: false,
    prerequisites: ['t2_middle'],
    position: { x: 0, y: 6 },
    effect: {
      type: 'production',
      value: 8000,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_convergence',
    name: 'Unified Field',
    description: '1.3x Energy multiplier',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(250000000),
    costMultiplier: 1.48,
    unlocked: false,
    prerequisites: ['t2_middle_path'],
    position: { x: 0, y: 7.5 },
    effect: {
      type: 'multiplier',
      value: 1.3,
      resource: 'knowledge'
    }
  },
  {
    id: 't2_final',
    name: 'Power Synthesis',
    description: '1.35x Energy multiplier',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(500000000),
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t2_convergence'],
    position: { x: 0, y: 8.5 },
    effect: {
      type: 'multiplier',
      value: 1.35,
      resource: 'knowledge'
    }
  }
];
export const TIER_3_SKILLS: SkillNode[] = [
  ...TIER_2_SKILLS,
  {
    id: 't3_amplifier_c',
    name: 'Resonance Amplifier',
    description: '1.3x Energy multiplier',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(1000000000),
    costMultiplier: 1.45,
    unlocked: false,
    prerequisites: ['t2_final'],
    position: { x: -2, y: 9 },
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
    cost: new Decimal(1000000000),
    costMultiplier: 1.45,
    unlocked: false,
    prerequisites: ['t2_final'],
    position: { x: 2, y: 9 },
    effect: {
      type: 'multiplier',
      value: 1.3,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_middle',
    name: 'Harmonic Resonator',
    description: 'Adds +20000 Energy/s',
    level: 0,
    maxLevel: 8,
    cost: new Decimal(3000000000),
    costMultiplier: 1.42,
    unlocked: false,
    prerequisites: ['t2_final'],
    position: { x: 0, y: 9.5 },
    effect: {
      type: 'production',
      value: 20000,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_choice_left',
    name: 'Temporal Compression',
    description: 'All costs scale 10% slower',
    level: 0,
    maxLevel: 4,
    cost: new Decimal(15000000000),
    costMultiplier: 1.55,
    unlocked: false,
    prerequisites: ['t3_amplifier_c', 't3_middle'],
    position: { x: -3.5, y: 10.5 },
    mutuallyExclusive: ['t3_choice_right'],
    choiceGroup: 'tier3_choice1',
    effect: {
      type: 'cost_reduction',
      value: 0.1,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_choice_right',
    name: 'Dimensional Breakthrough',
    description: '+200% base multiplier effectiveness',
    level: 0,
    maxLevel: 4,
    cost: new Decimal(15000000000),
    costMultiplier: 1.55,
    unlocked: false,
    prerequisites: ['t3_generator_c', 't3_middle'],
    position: { x: 3.5, y: 10.5 },
    mutuallyExclusive: ['t3_choice_left'],
    choiceGroup: 'tier3_choice1',
    effect: {
      type: 'xp_boost',
      value: 2.0,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_left_branch',
    name: 'Stabilized Field',
    description: 'Adds +50000 Energy/s',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(50000000000),
    costMultiplier: 1.48,
    unlocked: false,
    prerequisites: ['t3_amplifier_c'],
    position: { x: -4.5, y: 11.5 },
    effect: {
      type: 'production',
      value: 50000,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_right_branch',
    name: 'Multiplicative Cascade',
    description: '1.45x Energy multiplier',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(50000000000),
    costMultiplier: 1.48,
    unlocked: false,
    prerequisites: ['t3_amplifier_c'],
    position: { x: 4.5, y: 11.5 },
    effect: {
      type: 'multiplier',
      value: 1.45,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_left_synergy',
    name: 'Efficient Compression',
    description: '1.25x multiplier, +10% per Temporal Compression level',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(150000000000),
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t3_convergence'],
    position: { x: -5.5, y: 12.5 },
    effect: {
      type: 'synergy',
      value: 1.25,
      resource: 'knowledge',
      synergyWith: 't3_choice_left'
    }
  },
  {
    id: 't3_right_synergy',
    name: 'Breakthrough Amplifier',
    description: '1.5x multiplier, +8% per Dimensional Breakthrough level',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(150000000000),
    costMultiplier: 1.5,
    unlocked: false,
    prerequisites: ['t3_convergence'],
    position: { x: 5.5, y: 12.5 },
    effect: {
      type: 'synergy',
      value: 1.5,
      resource: 'knowledge',
      synergyWith: 't3_choice_right'
    }
  },
  {
    id: 't3_middle_path',
    name: 'Resonance Amplifier',
    description: 'Adds +100000 Energy/s',
    level: 0,
    maxLevel: 7,
    cost: new Decimal(100000000000),
    costMultiplier: 1.45,
    unlocked: false,
    prerequisites: ['t3_middle'],
    position: { x: 0, y: 11 },
    effect: {
      type: 'production',
      value: 100000,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_convergence',
    name: 'Unified Resonance',
    description: '1.4x Energy multiplier',
    level: 0,
    maxLevel: 6,
    cost: new Decimal(400000000000),
    costMultiplier: 1.52,
    unlocked: false,
    prerequisites: ['t3_middle_path'],
    position: { x: 0, y: 12 },
    effect: {
      type: 'multiplier',
      value: 1.4,
      resource: 'knowledge'
    }
  },
  {
    id: 't3_final',
    name: 'Synthesis Nexus',
    description: '1.45x Energy multiplier',
    level: 0,
    maxLevel: 5,
    cost: new Decimal(800000000000),
    costMultiplier: 1.55,
    unlocked: false,
    prerequisites: ['t3_convergence'],
    position: { x: 0, y: 13 },
    effect: {
      type: 'multiplier',
      value: 1.45,
      resource: 'knowledge'
    }
  }
];
export const TIER_4_SKILLS: SkillNode[] = [
  ...TIER_3_SKILLS,
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
export const TIER_5_SKILLS: SkillNode[] = [
  ...TIER_4_SKILLS,
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
    name: '◇ Energy Seed',
    description: 'The foundation of all power',
    requiredPoints: new Decimal(2000000),
    skills: TIER_1_SKILLS,
    prestigeBonus: 2.0  // Warping grants 2x multiplier
  },
  {
    id: 2,
    name: '◈ Power Network',
    description: 'Expanding energy pathways',
    requiredPoints: new Decimal(400000000),
    skills: TIER_2_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 4x)
  },
  {
    id: 3,
    name: '◆ Synthesis Grid',
    description: 'Complex energy convergence',
    requiredPoints: new Decimal(250000000000),
    skills: TIER_3_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 8x)
  },
  {
    id: 4,
    name: '◉ Nexus Array',
    description: 'Unified power nexus',
    requiredPoints: new Decimal(3500000000000000),
    skills: TIER_4_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 16x)
  },
  {
    id: 5,
    name: '✦ Ultimate Synthesis',
    description: 'The pinnacle of energy mastery',
    requiredPoints: new Decimal(350000000000000000000),
    skills: TIER_5_SKILLS,
    prestigeBonus: 2.0  // Warping grants another 2x multiplier (total 32x)
  }
];