import { Artifact, ArtifactBranch, ArtifactEffectType } from './artifact.model';

export const ARTIFACTS: Artifact[] = [
  // ========================================
  // PRODUCTION BRANCH (10 tiers)
  // ========================================
  {
    id: 'prod_1',
    name: 'Energy Amplifier',
    description: 'Ancient technology that boosts base energy production',
    branch: ArtifactBranch.PRODUCTION,
    tier: 1,
    cost: 50000000, // 50M
    requiredTotalQuanta: 50000000, // 50M total Quanta
    prerequisites: [],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 100, description: '+100% base production' }
    ],
    position: { x: 0, y: 0 }
  },
  {
    id: 'prod_2',
    name: 'Quantum Resonator',
    description: 'Harmonizes quantum frequencies for enhanced output',
    branch: ArtifactBranch.PRODUCTION,
    tier: 2,
    cost: 100000000, // 100M
    requiredTotalQuanta: 100000000, // 100M
    prerequisites: ['prod_1'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 500, description: '+500% base production' }
    ],
    position: { x: 0, y: 1 }
  },
  {
    id: 'prod_3',
    name: 'Stellar Forge',
    description: 'Harnesses stellar cores to dramatically increase production',
    branch: ArtifactBranch.PRODUCTION,
    tier: 3,
    cost: 1000000000, // 1B
    requiredTotalQuanta: 250000000, // 250M
    prerequisites: ['prod_2'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 2000, description: '+2,000% base production' }
    ],
    position: { x: 0, y: 2 }
  },
  {
    id: 'prod_4',
    name: 'Dimensional Generator',
    description: 'Taps into parallel dimensions for immense power',
    branch: ArtifactBranch.PRODUCTION,
    tier: 4,
    cost: 10000000000, // 10B
    requiredTotalQuanta: 500000000, // 500M
    prerequisites: ['prod_3'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 10000, description: '+10,000% base production' }
    ],
    position: { x: 0, y: 3 }
  },
  {
    id: 'prod_5',
    name: 'Cosmic Accelerator',
    description: 'Accelerates fundamental forces to produce vast energy',
    branch: ArtifactBranch.PRODUCTION,
    tier: 5,
    cost: 1000000000000, // 1T
    requiredTotalQuanta: 1000000000, // 1B
    prerequisites: ['prod_4'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 50000, description: '+50,000% base production' }
    ],
    position: { x: 0, y: 4 }
  },
  {
    id: 'prod_6',
    name: 'Reality Shaper',
    description: 'Bends reality itself to maximize production',
    branch: ArtifactBranch.PRODUCTION,
    tier: 6,
    cost: 10000000000000, // 10T
    requiredTotalQuanta: 2500000000, // 2.5B
    prerequisites: ['prod_5'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 250000, description: '+250,000% base production' }
    ],
    position: { x: 0, y: 5 }
  },
  {
    id: 'prod_7',
    name: 'Universal Engine',
    description: 'Harnesses the energy of entire galaxies',
    branch: ArtifactBranch.PRODUCTION,
    tier: 7,
    cost: 100000000000000, // 100T
    requiredTotalQuanta: 5000000000, // 5B
    prerequisites: ['prod_6'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 1000000, description: '+1,000,000% base production' }
    ],
    position: { x: 0, y: 6 }
  },
  {
    id: 'prod_8',
    name: 'Infinity Core',
    description: 'Taps into infinite energy sources',
    branch: ArtifactBranch.PRODUCTION,
    tier: 8,
    cost: 1000000000000000, // 1Qa
    requiredTotalQuanta: 10000000000, // 10B
    prerequisites: ['prod_7'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 5000000, description: '+5,000,000% base production' }
    ],
    position: { x: 0, y: 7 }
  },
  {
    id: 'prod_9',
    name: 'Omniverse Reactor',
    description: 'Draws power from the multiverse itself',
    branch: ArtifactBranch.PRODUCTION,
    tier: 9,
    cost: 10000000000000000, // 10Qa
    requiredTotalQuanta: 25000000000, // 25B
    prerequisites: ['prod_8'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 25000000, description: '+25,000,000% base production' }
    ],
    position: { x: 0, y: 8 }
  },
  {
    id: 'prod_10',
    name: 'Absolute Genesis',
    description: 'The ultimate source of all production',
    branch: ArtifactBranch.PRODUCTION,
    tier: 10,
    cost: 100000000000000000, // 100Qa
    requiredTotalQuanta: 50000000000, // 50B
    prerequisites: ['prod_9'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 100000000, description: '+100,000,000% base production' }
    ],
    position: { x: 0, y: 9 }
  },

  // ========================================
  // MULTIPLIER BRANCH (10 tiers)
  // ========================================
  {
    id: 'mult_1',
    name: 'Power Conduit',
    description: 'Channels and amplifies existing production',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 1,
    cost: 50000000, // 50M
    requiredTotalQuanta: 50000000, // 50M
    prerequisites: [],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 2, description: '2x total production' }
    ],
    position: { x: 1, y: 0 }
  },
  {
    id: 'mult_2',
    name: 'Synergy Matrix',
    description: 'Creates powerful synergies between energy sources',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 2,
    cost: 100000000, // 100M
    requiredTotalQuanta: 100000000, // 100M
    prerequisites: ['mult_1'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 5, description: '5x total production' }
    ],
    position: { x: 1, y: 1 }
  },
  {
    id: 'mult_3',
    name: 'Exponential Lens',
    description: 'Focuses energy exponentially through quantum lensing',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 3,
    cost: 1000000000, // 1B
    requiredTotalQuanta: 250000000, // 250M
    prerequisites: ['mult_2'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 10, description: '10x total production' }
    ],
    position: { x: 1, y: 2 }
  },
  {
    id: 'mult_4',
    name: 'Cascade Amplifier',
    description: 'Creates cascading amplification effects',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 4,
    cost: 10000000000, // 10B
    requiredTotalQuanta: 500000000, // 500M
    prerequisites: ['mult_3'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 25, description: '25x total production' }
    ],
    position: { x: 1, y: 3 }
  },
  {
    id: 'mult_5',
    name: 'Singularity Compressor',
    description: 'Compresses energy like a black hole for extreme density',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 5,
    cost: 1000000000000, // 1T
    requiredTotalQuanta: 1000000000, // 1B
    prerequisites: ['mult_4'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 100, description: '100x total production' }
    ],
    position: { x: 1, y: 4 }
  },
  {
    id: 'mult_6',
    name: 'Hyperbolic Chamber',
    description: 'Time dilation effects multiply output exponentially',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 6,
    cost: 10000000000000, // 10T
    requiredTotalQuanta: 2500000000, // 2.5B
    prerequisites: ['mult_5'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 500, description: '500x total production' }
    ],
    position: { x: 1, y: 5 }
  },
  {
    id: 'mult_7',
    name: 'Quantum Superposition',
    description: 'Exists in multiple states simultaneously',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 7,
    cost: 100000000000000, // 100T
    requiredTotalQuanta: 5000000000, // 5B
    prerequisites: ['mult_6'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 2500, description: '2,500x total production' }
    ],
    position: { x: 1, y: 6 }
  },
  {
    id: 'mult_8',
    name: 'Temporal Recursion',
    description: 'Energy loops through time, multiplying infinitely',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 8,
    cost: 1000000000000000, // 1Qa
    requiredTotalQuanta: 10000000000, // 10B
    prerequisites: ['mult_7'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 10000, description: '10,000x total production' }
    ],
    position: { x: 1, y: 7 }
  },
  {
    id: 'mult_9',
    name: 'Probability Manipulator',
    description: 'Makes unlikely outcomes certain',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 9,
    cost: 10000000000000000, // 10Qa
    requiredTotalQuanta: 25000000000, // 25B
    prerequisites: ['mult_8'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 50000, description: '50,000x total production' }
    ],
    position: { x: 1, y: 8 }
  },
  {
    id: 'mult_10',
    name: 'Absolute Convergence',
    description: 'All timelines converge to maximum output',
    branch: ArtifactBranch.MULTIPLIER,
    tier: 10,
    cost: 100000000000000000, // 100Qa
    requiredTotalQuanta: 50000000000, // 50B
    prerequisites: ['mult_9'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 250000, description: '250,000x total production' }
    ],
    position: { x: 1, y: 9 }
  },

  // ========================================
  // EFFICIENCY BRANCH (10 tiers)
  // ========================================
  {
    id: 'eff_1',
    name: 'Idle Optimizer',
    description: 'Improves idle production efficiency',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 1,
    cost: 50000000, // 50M
    requiredTotalQuanta: 50000000, // 50M
    prerequisites: [],
    effects: [
      { type: ArtifactEffectType.IDLE_BONUS, value: 50, description: '+50% production while idle' }
    ],
    position: { x: 2, y: 0 }
  },
  {
    id: 'eff_2',
    name: 'Scaling Converter',
    description: 'Production scales with node upgrades',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 2,
    cost: 100000000, // 100M
    requiredTotalQuanta: 100000000, // 100M
    prerequisites: ['eff_1'],
    effects: [
      { type: ArtifactEffectType.SCALING_BONUS, value: 2, description: '+2% production per quantum node level' }
    ],
    position: { x: 2, y: 1 }
  },
  {
    id: 'eff_3',
    name: 'Bank Multiplier',
    description: 'Stored Quanta increases production',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 3,
    cost: 1000000000, // 1B
    requiredTotalQuanta: 250000000, // 250M
    prerequisites: ['eff_2'],
    effects: [
      { type: ArtifactEffectType.STORED_QUANTA_BONUS, value: 2, description: '+2% production per 10M stored Quanta' }
    ],
    position: { x: 2, y: 2 }
  },
  {
    id: 'eff_4',
    name: 'Persistent Engine',
    description: 'Production increases gradually over time',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 4,
    cost: 10000000000, // 10B
    requiredTotalQuanta: 500000000, // 500M
    prerequisites: ['eff_3'],
    effects: [
      { type: ArtifactEffectType.PERSISTENT_BONUS, value: 10, description: '+10% production per minute of active play (max 500%)' }
    ],
    position: { x: 2, y: 3 }
  },
  {
    id: 'eff_5',
    name: 'Quantum Catalyst',
    description: 'Boosts effectiveness of all other artifacts',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 5,
    cost: 1000000000000, // 1T
    requiredTotalQuanta: 1000000000, // 1B
    prerequisites: ['eff_4'],
    effects: [
      { type: ArtifactEffectType.EFFECTIVENESS_BONUS, value: 25, description: 'All artifact bonuses are 25% more effective' }
    ],
    position: { x: 2, y: 4 }
  },
  {
    id: 'eff_6',
    name: 'Advanced Scaling',
    description: 'Further enhanced node-based scaling',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 6,
    cost: 10000000000000, // 10T
    requiredTotalQuanta: 2500000000, // 2.5B
    prerequisites: ['eff_5'],
    effects: [
      { type: ArtifactEffectType.SCALING_BONUS, value: 5, description: '+5% production per quantum node level' }
    ],
    position: { x: 2, y: 5 }
  },
  {
    id: 'eff_7',
    name: 'Deep Storage Bonus',
    description: 'Massive Quanta reserves provide huge bonuses',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 7,
    cost: 100000000000000, // 100T
    requiredTotalQuanta: 5000000000, // 5B
    prerequisites: ['eff_6'],
    effects: [
      { type: ArtifactEffectType.STORED_QUANTA_BONUS, value: 5, description: '+5% production per 10M stored Quanta' }
    ],
    position: { x: 2, y: 6 }
  },
  {
    id: 'eff_8',
    name: 'Compound Interest',
    description: 'Bonuses compound with each other',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 8,
    cost: 1000000000000000, // 1Qa
    requiredTotalQuanta: 10000000000, // 10B
    prerequisites: ['eff_7'],
    effects: [
      { type: ArtifactEffectType.COMPOUND_BONUS, value: 2, description: '+2% compound production per minute (no cap)' }
    ],
    position: { x: 2, y: 7 }
  },
  {
    id: 'eff_9',
    name: 'Hyper Catalyst',
    description: 'Dramatically boosts artifact effectiveness',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 9,
    cost: 10000000000000000, // 10Qa
    requiredTotalQuanta: 25000000000, // 25B
    prerequisites: ['eff_8'],
    effects: [
      { type: ArtifactEffectType.EFFECTIVENESS_BONUS, value: 75, description: 'All artifact bonuses are 75% more effective' }
    ],
    position: { x: 2, y: 8 }
  },
  {
    id: 'eff_10',
    name: 'Infinite Compounding',
    description: 'Bonuses grow exponentially without limit',
    branch: ArtifactBranch.EFFICIENCY,
    tier: 10,
    cost: 100000000000000000, // 100Qa
    requiredTotalQuanta: 50000000000, // 50B
    prerequisites: ['eff_9'],
    effects: [
      { type: ArtifactEffectType.COMPOUND_BONUS, value: 10, description: '+10% compound production per minute (no cap)' }
    ],
    position: { x: 2, y: 9 }
  }
];
