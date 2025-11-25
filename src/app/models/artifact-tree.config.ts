import { Artifact, ArtifactBranch, ArtifactEffectType } from './artifact.model';
export const ARTIFACTS: Artifact[] = [
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
    cost: 100000000000, // 100B
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
    cost: 1000000000000, // 1T
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
    cost: 10000000000000000, // 10Qa
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
    cost: 1000000000000000000, // 1Qi
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
    cost: 100000000000000000000, // 100Qi
    requiredTotalQuanta: 50000000000, // 50B
    prerequisites: ['prod_9'],
    effects: [
      { type: ArtifactEffectType.FLAT_PRODUCTION, value: 100000000, description: '+100,000,000% base production' }
    ],
    position: { x: 0, y: 9 }
  },
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
    cost: 100000000000, // 100B
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
    cost: 1000000000000, // 1T
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
    cost: 10000000000000000, // 10Qa
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
    cost: 1000000000000000000, // 1Qi
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
    cost: 100000000000000000000, // 100Qi
    requiredTotalQuanta: 50000000000, // 50B
    prerequisites: ['mult_9'],
    effects: [
      { type: ArtifactEffectType.MULTIPLIER, value: 250000, description: '250,000x total production' }
    ],
    position: { x: 1, y: 9 }
  },
  {
    id: 'res_1',
    name: 'Harmonic Resonator I',
    description: 'Creates weak resonance between artifacts (+5% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 1,
    cost: 50000000, // 50M
    requiredTotalQuanta: 50000000, // 50M
    prerequisites: [],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 5, description: '+5% production per artifact from other branches' }
    ],
    position: { x: 2, y: 0 }
  },
  {
    id: 'res_2',
    name: 'Harmonic Resonator II',
    description: 'Strengthens resonance between artifacts (+10% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 2,
    cost: 100000000, // 100M
    requiredTotalQuanta: 100000000, // 100M
    prerequisites: ['res_1'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 10, description: '+10% production per artifact from other branches' }
    ],
    position: { x: 2, y: 1 }
  },
  {
    id: 'res_3',
    name: 'Harmonic Resonator III',
    description: 'Amplifies resonance significantly (+20% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 3,
    cost: 1000000000, // 1B
    requiredTotalQuanta: 250000000, // 250M
    prerequisites: ['res_2'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 20, description: '+20% production per artifact from other branches' }
    ],
    position: { x: 2, y: 2 }
  },
  {
    id: 'res_4',
    name: 'Harmonic Resonator IV',
    description: 'Powerful resonance effects (+35% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 4,
    cost: 10000000000, // 10B
    requiredTotalQuanta: 500000000, // 500M
    prerequisites: ['res_3'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 35, description: '+35% production per artifact from other branches' }
    ],
    position: { x: 2, y: 3 }
  },
  {
    id: 'res_5',
    name: 'Harmonic Resonator V',
    description: 'Intense resonance cascade (+60% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 5,
    cost: 100000000000, // 100B
    requiredTotalQuanta: 1000000000, // 1B
    prerequisites: ['res_4'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 60, description: '+60% production per artifact from other branches' }
    ],
    position: { x: 2, y: 4 }
  },
  {
    id: 'res_6',
    name: 'Harmonic Resonator VI',
    description: 'Extreme resonance synergy (+100% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 6,
    cost: 1000000000000, // 1T
    requiredTotalQuanta: 2500000000, // 2.5B
    prerequisites: ['res_5'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 100, description: '+100% per artifact from other branches (doubles per artifact!)' }
    ],
    position: { x: 2, y: 5 }
  },
  {
    id: 'res_7',
    name: 'Harmonic Resonator VII',
    description: 'Overwhelming resonance power (+200% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 7,
    cost: 100000000000000, // 100T
    requiredTotalQuanta: 5000000000, // 5B
    prerequisites: ['res_6'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 200, description: '+200% per artifact from other branches (triples per artifact!)' }
    ],
    position: { x: 2, y: 6 }
  },
  {
    id: 'res_8',
    name: 'Harmonic Resonator VIII',
    description: 'Massive resonance amplification (+400% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 8,
    cost: 10000000000000000, // 10Qa
    requiredTotalQuanta: 10000000000, // 10B
    prerequisites: ['res_7'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 400, description: '+400% per artifact from other branches (5x per artifact!)' }
    ],
    position: { x: 2, y: 7 }
  },
  {
    id: 'res_9',
    name: 'Harmonic Resonator IX',
    description: 'Transcendent resonance cascade (+1000% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 9,
    cost: 1000000000000000000, // 1Qi
    requiredTotalQuanta: 25000000000, // 25B
    prerequisites: ['res_8'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 1000, description: '+1000% per artifact from other branches (11x per artifact!)' }
    ],
    position: { x: 2, y: 8 }
  },
  {
    id: 'res_10',
    name: 'Perfect Harmonic Convergence',
    description: 'Ultimate resonance - artifacts achieve perfect synergy (+5000% per other artifact)',
    branch: ArtifactBranch.RESONANCE,
    tier: 10,
    cost: 100000000000000000000, // 100Qi
    requiredTotalQuanta: 50000000000, // 50B
    prerequisites: ['res_9'],
    effects: [
      { type: ArtifactEffectType.RESONANCE, value: 5000, description: '+5000% per artifact from other branches (51x per artifact!)' }
    ],
    position: { x: 2, y: 9 }
  }
];