import { QuantumNode, QuantumTreeType, QuantumNodeType, Synergy } from './quantum.model';

// Matter Tree - Production Focus
const MATTER_NODES: QuantumNode[] = [
  {
    id: 'matter_1',
    tree: QuantumTreeType.MATTER,
    type: QuantumNodeType.PRODUCTION,
    name: 'Quantum Foam',
    description: 'Base matter generation',
    icon: '◦',
    level: 0,
    maxLevel: 10,
    baseCost: 10,
    costMultiplier: 1.5,
    productionBonus: 1,
    position: { x: 2, y: 0 }
  },
  {
    id: 'matter_2',
    tree: QuantumTreeType.MATTER,
    type: QuantumNodeType.PRODUCTION,
    name: 'Particle Genesis',
    description: 'Generate elementary particles',
    icon: '●',
    level: 0,
    maxLevel: 10,
    baseCost: 50,
    costMultiplier: 1.6,
    productionBonus: 5,
    requiredNodes: ['matter_1'],
    position: { x: 1, y: 1 }
  },
  {
    id: 'matter_3',
    tree: QuantumTreeType.MATTER,
    type: QuantumNodeType.PRODUCTION,
    name: 'Atomic Forge',
    description: 'Forge atoms from particles',
    icon: '⚛',
    level: 0,
    maxLevel: 10,
    baseCost: 250,
    costMultiplier: 1.7,
    productionBonus: 25,
    requiredNodes: ['matter_2'],
    position: { x: 0, y: 2 }
  },
  {
    id: 'matter_4',
    tree: QuantumTreeType.MATTER,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Mass Amplification',
    description: 'Multiply matter production',
    icon: '◉',
    level: 0,
    maxLevel: 5,
    baseCost: 500,
    costMultiplier: 2.0,
    multiplierBonus: 0.5,
    requiredNodes: ['matter_2'],
    position: { x: 2, y: 2 }
  },
  {
    id: 'matter_5',
    tree: QuantumTreeType.MATTER,
    type: QuantumNodeType.PRODUCTION,
    name: 'Molecular Assembly',
    description: 'Combine atoms into molecules',
    icon: '⬡',
    level: 0,
    maxLevel: 10,
    baseCost: 1000,
    costMultiplier: 1.8,
    productionBonus: 100,
    requiredNodes: ['matter_3', 'matter_4'],
    position: { x: 1, y: 3 }
  },
  {
    id: 'matter_6',
    tree: QuantumTreeType.MATTER,
    type: QuantumNodeType.SYNERGY,
    name: 'Matter-Energy Bridge',
    description: 'Links matter and energy production',
    icon: '⚡',
    level: 0,
    maxLevel: 1,
    baseCost: 2500,
    costMultiplier: 1.0,
    requiredNodes: ['matter_4'],
    position: { x: 3, y: 2 }
  },
  {
    id: 'matter_7',
    tree: QuantumTreeType.MATTER,
    type: QuantumNodeType.PRODUCTION,
    name: 'Complex Structures',
    description: 'Build intricate matter lattices',
    icon: '◈',
    level: 0,
    maxLevel: 10,
    baseCost: 5000,
    costMultiplier: 1.9,
    productionBonus: 500,
    requiredNodes: ['matter_5'],
    requiredQuantaGenerated: 100000,
    position: { x: 1, y: 4 }
  }
];

// Energy Tree - Multiplier Focus
const ENERGY_NODES: QuantumNode[] = [
  {
    id: 'energy_1',
    tree: QuantumTreeType.ENERGY,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Quantum Field',
    description: 'Base energy amplification',
    icon: '〰',
    level: 0,
    maxLevel: 10,
    baseCost: 10,
    costMultiplier: 1.5,
    multiplierBonus: 0.1,
    position: { x: 6, y: 0 }
  },
  {
    id: 'energy_2',
    tree: QuantumTreeType.ENERGY,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Wave Function',
    description: 'Probability amplification',
    icon: '∿',
    level: 0,
    maxLevel: 10,
    baseCost: 50,
    costMultiplier: 1.6,
    multiplierBonus: 0.25,
    requiredNodes: ['energy_1'],
    position: { x: 7, y: 1 }
  },
  {
    id: 'energy_3',
    tree: QuantumTreeType.ENERGY,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Photon Stream',
    description: 'Harness pure light energy',
    icon: '✦',
    level: 0,
    maxLevel: 10,
    baseCost: 250,
    costMultiplier: 1.7,
    multiplierBonus: 0.5,
    requiredNodes: ['energy_2'],
    position: { x: 8, y: 2 }
  },
  {
    id: 'energy_4',
    tree: QuantumTreeType.ENERGY,
    type: QuantumNodeType.PRODUCTION,
    name: 'Zero Point',
    description: 'Extract energy from vacuum',
    icon: '○',
    level: 0,
    maxLevel: 10,
    baseCost: 500,
    costMultiplier: 2.0,
    productionBonus: 50,
    requiredNodes: ['energy_2'],
    position: { x: 6, y: 2 }
  },
  {
    id: 'energy_5',
    tree: QuantumTreeType.ENERGY,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Resonance Cascade',
    description: 'Exponential energy buildup',
    icon: '⚡',
    level: 0,
    maxLevel: 5,
    baseCost: 1000,
    costMultiplier: 1.8,
    multiplierBonus: 1.0,
    requiredNodes: ['energy_3', 'energy_4'],
    position: { x: 7, y: 3 }
  },
  {
    id: 'energy_6',
    tree: QuantumTreeType.ENERGY,
    type: QuantumNodeType.SYNERGY,
    name: 'Energy-Time Nexus',
    description: 'Links energy and time effects',
    icon: '⏱',
    level: 0,
    maxLevel: 1,
    baseCost: 2500,
    costMultiplier: 1.0,
    requiredNodes: ['energy_4'],
    position: { x: 5, y: 2 }
  },
  {
    id: 'energy_7',
    tree: QuantumTreeType.ENERGY,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Singularity Core',
    description: 'Ultimate energy concentration',
    icon: '◉',
    level: 0,
    maxLevel: 10,
    baseCost: 5000,
    costMultiplier: 1.9,
    multiplierBonus: 2.0,
    requiredNodes: ['energy_5'],
    requiredQuantaGenerated: 100000,
    position: { x: 7, y: 4 }
  }
];

// Time Tree - Speed and Automation Focus
const TIME_NODES: QuantumNode[] = [
  {
    id: 'time_1',
    tree: QuantumTreeType.TIME,
    type: QuantumNodeType.PRODUCTION,
    name: 'Temporal Flow',
    description: 'Accelerate time progression',
    icon: '⟳',
    level: 0,
    maxLevel: 10,
    baseCost: 10,
    costMultiplier: 1.5,
    productionBonus: 0.5,
    position: { x: 10, y: 0 }
  },
  {
    id: 'time_2',
    tree: QuantumTreeType.TIME,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Causality Loop',
    description: 'Effects repeat through time',
    icon: '⟲',
    level: 0,
    maxLevel: 10,
    baseCost: 50,
    costMultiplier: 1.6,
    multiplierBonus: 0.15,
    requiredNodes: ['time_1'],
    position: { x: 11, y: 1 }
  },
  {
    id: 'time_3',
    tree: QuantumTreeType.TIME,
    type: QuantumNodeType.PRODUCTION,
    name: 'Chrono Compression',
    description: 'Compress time to boost output',
    icon: '⧗',
    level: 0,
    maxLevel: 10,
    baseCost: 250,
    costMultiplier: 1.7,
    productionBonus: 20,
    requiredNodes: ['time_2'],
    position: { x: 12, y: 2 }
  },
  {
    id: 'time_4',
    tree: QuantumTreeType.TIME,
    type: QuantumNodeType.SPECIAL,
    name: 'Future Echo',
    description: 'Gain production from your next upgrade',
    icon: '⇉',
    level: 0,
    maxLevel: 5,
    baseCost: 500,
    costMultiplier: 2.0,
    multiplierBonus: 0.2,
    requiredNodes: ['time_2'],
    position: { x: 10, y: 2 }
  },
  {
    id: 'time_5',
    tree: QuantumTreeType.TIME,
    type: QuantumNodeType.MULTIPLIER,
    name: 'Parallel Timelines',
    description: 'Production exists in multiple timelines',
    icon: '⫴',
    level: 0,
    maxLevel: 10,
    baseCost: 1000,
    costMultiplier: 1.8,
    multiplierBonus: 0.75,
    requiredNodes: ['time_3', 'time_4'],
    position: { x: 11, y: 3 }
  },
  {
    id: 'time_6',
    tree: QuantumTreeType.TIME,
    type: QuantumNodeType.SYNERGY,
    name: 'Time-Matter Convergence',
    description: 'Links time and matter production',
    icon: '⚛',
    level: 0,
    maxLevel: 1,
    baseCost: 2500,
    costMultiplier: 1.0,
    requiredNodes: ['time_4'],
    position: { x: 9, y: 2 }
  },
  {
    id: 'time_7',
    tree: QuantumTreeType.TIME,
    type: QuantumNodeType.SPECIAL,
    name: 'Eternal Moment',
    description: 'Freeze time to multiply all effects',
    icon: '⧖',
    level: 0,
    maxLevel: 5,
    baseCost: 5000,
    costMultiplier: 1.9,
    multiplierBonus: 1.5,
    requiredNodes: ['time_5'],
    requiredQuantaGenerated: 100000,
    position: { x: 11, y: 4 }
  }
];

// Synergies - activated when specific node combinations are met
export const QUANTUM_SYNERGIES: Synergy[] = [
  {
    id: 'synergy_matter_energy',
    name: 'Mass-Energy Equivalence',
    description: 'Matter and Energy nodes boost each other',
    requiredNodes: ['matter_6', 'energy_1'],
    effect: {
      type: 'multiplier',
      value: 0.5,
      description: '+50% to all production'
    },
    icon: '⚡'
  },
  {
    id: 'synergy_energy_time',
    name: 'Temporal Energization',
    description: 'Energy flows faster through time',
    requiredNodes: ['energy_6', 'time_1'],
    effect: {
      type: 'multiplier',
      value: 0.75,
      description: '+75% to multipliers'
    },
    icon: '⏱'
  },
  {
    id: 'synergy_time_matter',
    name: 'Accelerated Genesis',
    description: 'Matter forms faster over time',
    requiredNodes: ['time_6', 'matter_1'],
    effect: {
      type: 'production',
      value: 100,
      description: '+100 Quanta/sec'
    },
    icon: '⚛'
  },
  {
    id: 'synergy_trinity',
    name: 'Quantum Trinity',
    description: 'All three forces unite',
    requiredNodes: ['matter_6', 'energy_6', 'time_6'],
    effect: {
      type: 'multiplier',
      value: 2.0,
      description: '+200% to all effects'
    },
    icon: '✦'
  },
  {
    id: 'synergy_advanced_matter',
    name: 'Dense Matter',
    description: 'Advanced matter structures',
    requiredNodes: ['matter_3', 'matter_5', 'matter_7'],
    effect: {
      type: 'production',
      value: 200,
      description: '+200 Quanta/sec'
    },
    icon: '◈'
  },
  {
    id: 'synergy_advanced_energy',
    name: 'Hyper Energized',
    description: 'Peak energy efficiency',
    requiredNodes: ['energy_3', 'energy_5', 'energy_7'],
    effect: {
      type: 'multiplier',
      value: 1.5,
      description: '+150% to production'
    },
    icon: '◉'
  },
  {
    id: 'synergy_advanced_time',
    name: 'Temporal Mastery',
    description: 'Perfect time manipulation',
    requiredNodes: ['time_3', 'time_5', 'time_7'],
    effect: {
      type: 'multiplier',
      value: 1.0,
      description: '+100% to all nodes'
    },
    icon: '⧖'
  }
];

export const QUANTUM_NODES = [...MATTER_NODES, ...ENERGY_NODES, ...TIME_NODES];
