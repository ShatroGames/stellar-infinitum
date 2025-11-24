// Probability Forge - Final endgame feature
// Theme: Manipulate probability to force favorable outcomes

export enum OutcomeRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  MYTHIC = 'mythic'
}

export interface ProbabilityOutcome {
  id: string;
  name: string;
  description: string;
  rarity: OutcomeRarity;
  multiplier: number; // Quanta multiplier when obtained
  icon: string;
  discovered: boolean;
  obtainedCount: number; // How many times obtained (for pity/streak)
}

export interface FateWeight {
  id: string;
  name: string;
  description: string;
  type: 'rarity_shift' | 'reroll' | 'pity' | 'duplicate_protection' | 'streak_bonus' | 'exponential_scaling';
  cost: number; // Fate Tokens to unlock
  level: number; // Current level
  maxLevel: number;
  effect: any; // Type-specific effect data
  unlocked: boolean;
}

export interface PullResult {
  outcome: ProbabilityOutcome;
  isNew: boolean;
  streakBonus: number;
  finalMultiplier: number;
}

export interface ProbabilityForgeState {
  systemUnlocked: boolean;
  fateTokens: number;
  totalPulls: number;
  
  // Collection
  discoveredOutcomes: Set<string>;
  outcomeObtainedCounts: Map<string, number>;
  
  // Probability modifiers
  unlockedWeights: Set<string>;
  weightLevels: Map<string, number>;
  
  // Streak tracking
  currentStreak: number;
  bestStreak: number;
  pullsSinceMythic: number; // For pity system
  
  // Statistics
  rarityPullCounts: Map<OutcomeRarity, number>;
  totalMultiplierGained: number;
}

// Define all possible outcomes (100 total)
export const PROBABILITY_OUTCOMES: ProbabilityOutcome[] = [
  // COMMON (40 outcomes) - 1.1x to 1.5x multipliers
  { id: 'c1', name: 'Hydrogen Atom', description: 'The simplest element', rarity: OutcomeRarity.COMMON, multiplier: 1.1, icon: '⚛️', discovered: false, obtainedCount: 0 },
  { id: 'c2', name: 'Photon Burst', description: 'A particle of light', rarity: OutcomeRarity.COMMON, multiplier: 1.1, icon: '💡', discovered: false, obtainedCount: 0 },
  { id: 'c3', name: 'Electron Spin', description: 'Quantum angular momentum', rarity: OutcomeRarity.COMMON, multiplier: 1.1, icon: '🔄', discovered: false, obtainedCount: 0 },
  { id: 'c4', name: 'Quark Interaction', description: 'Fundamental particle collision', rarity: OutcomeRarity.COMMON, multiplier: 1.15, icon: '🔬', discovered: false, obtainedCount: 0 },
  { id: 'c5', name: 'Neutrino Flux', description: 'Ghost particles passing through', rarity: OutcomeRarity.COMMON, multiplier: 1.15, icon: '👻', discovered: false, obtainedCount: 0 },
  { id: 'c6', name: 'Magnetic Field', description: 'Invisible force lines', rarity: OutcomeRarity.COMMON, multiplier: 1.2, icon: '🧲', discovered: false, obtainedCount: 0 },
  { id: 'c7', name: 'Sound Wave', description: 'Vibrations in matter', rarity: OutcomeRarity.COMMON, multiplier: 1.2, icon: '🔊', discovered: false, obtainedCount: 0 },
  { id: 'c8', name: 'Heat Energy', description: 'Random molecular motion', rarity: OutcomeRarity.COMMON, multiplier: 1.2, icon: '🔥', discovered: false, obtainedCount: 0 },
  { id: 'c9', name: 'Ice Crystal', description: 'Frozen water structure', rarity: OutcomeRarity.COMMON, multiplier: 1.25, icon: '❄️', discovered: false, obtainedCount: 0 },
  { id: 'c10', name: 'Rock Formation', description: 'Solid mineral cluster', rarity: OutcomeRarity.COMMON, multiplier: 1.25, icon: '🪨', discovered: false, obtainedCount: 0 },
  { id: 'c11', name: 'Water Molecule', description: 'H2O compound', rarity: OutcomeRarity.COMMON, multiplier: 1.3, icon: '💧', discovered: false, obtainedCount: 0 },
  { id: 'c12', name: 'Carbon Chain', description: 'Organic molecule basis', rarity: OutcomeRarity.COMMON, multiplier: 1.3, icon: '⛓️', discovered: false, obtainedCount: 0 },
  { id: 'c13', name: 'DNA Strand', description: 'Genetic information', rarity: OutcomeRarity.COMMON, multiplier: 1.35, icon: '🧬', discovered: false, obtainedCount: 0 },
  { id: 'c14', name: 'Protein Fold', description: 'Biological machine', rarity: OutcomeRarity.COMMON, multiplier: 1.35, icon: '🔗', discovered: false, obtainedCount: 0 },
  { id: 'c15', name: 'Cell Division', description: 'Life replicating', rarity: OutcomeRarity.COMMON, multiplier: 1.4, icon: '🦠', discovered: false, obtainedCount: 0 },
  { id: 'c16', name: 'Neural Spark', description: 'Thought begins', rarity: OutcomeRarity.COMMON, multiplier: 1.4, icon: '⚡', discovered: false, obtainedCount: 0 },
  { id: 'c17', name: 'Gravity Wave', description: 'Spacetime ripple', rarity: OutcomeRarity.COMMON, multiplier: 1.45, icon: '🌊', discovered: false, obtainedCount: 0 },
  { id: 'c18', name: 'Time Dilation', description: 'Relative temporal flow', rarity: OutcomeRarity.COMMON, multiplier: 1.45, icon: '⏱️', discovered: false, obtainedCount: 0 },
  { id: 'c19', name: 'Quantum Tunnel', description: 'Probability breach', rarity: OutcomeRarity.COMMON, multiplier: 1.5, icon: '🚇', discovered: false, obtainedCount: 0 },
  { id: 'c20', name: 'Phase Transition', description: 'Matter changes state', rarity: OutcomeRarity.COMMON, multiplier: 1.5, icon: '🔄', discovered: false, obtainedCount: 0 },
  { id: 'c21', name: 'Solar Wind', description: 'Stellar particle stream', rarity: OutcomeRarity.COMMON, multiplier: 1.1, icon: '💨', discovered: false, obtainedCount: 0 },
  { id: 'c22', name: 'Cosmic Ray', description: 'High energy particle', rarity: OutcomeRarity.COMMON, multiplier: 1.15, icon: '☄️', discovered: false, obtainedCount: 0 },
  { id: 'c23', name: 'Aurora Borealis', description: 'Magnetic light show', rarity: OutcomeRarity.COMMON, multiplier: 1.2, icon: '🌌', discovered: false, obtainedCount: 0 },
  { id: 'c24', name: 'Lightning Strike', description: 'Electric discharge', rarity: OutcomeRarity.COMMON, multiplier: 1.25, icon: '⚡', discovered: false, obtainedCount: 0 },
  { id: 'c25', name: 'Rainbow Spectrum', description: 'Light refraction', rarity: OutcomeRarity.COMMON, multiplier: 1.3, icon: '🌈', discovered: false, obtainedCount: 0 },
  { id: 'c26', name: 'Earthquake Tremor', description: 'Tectonic movement', rarity: OutcomeRarity.COMMON, multiplier: 1.1, icon: '📳', discovered: false, obtainedCount: 0 },
  { id: 'c27', name: 'Volcanic Eruption', description: 'Molten rock release', rarity: OutcomeRarity.COMMON, multiplier: 1.15, icon: '🌋', discovered: false, obtainedCount: 0 },
  { id: 'c28', name: 'Ocean Current', description: 'Water circulation', rarity: OutcomeRarity.COMMON, multiplier: 1.2, icon: '🌊', discovered: false, obtainedCount: 0 },
  { id: 'c29', name: 'Cloud Formation', description: 'Atmospheric moisture', rarity: OutcomeRarity.COMMON, multiplier: 1.25, icon: '☁️', discovered: false, obtainedCount: 0 },
  { id: 'c30', name: 'Wind Gust', description: 'Air pressure differential', rarity: OutcomeRarity.COMMON, multiplier: 1.3, icon: '💨', discovered: false, obtainedCount: 0 },
  { id: 'c31', name: 'Snowflake', description: 'Unique ice crystal', rarity: OutcomeRarity.COMMON, multiplier: 1.35, icon: '❄️', discovered: false, obtainedCount: 0 },
  { id: 'c32', name: 'Rain Drop', description: 'Falling water', rarity: OutcomeRarity.COMMON, multiplier: 1.4, icon: '💧', discovered: false, obtainedCount: 0 },
  { id: 'c33', name: 'Seed Sprouting', description: 'Life emerges', rarity: OutcomeRarity.COMMON, multiplier: 1.45, icon: '🌱', discovered: false, obtainedCount: 0 },
  { id: 'c34', name: 'Flower Bloom', description: 'Beauty unfolds', rarity: OutcomeRarity.COMMON, multiplier: 1.5, icon: '🌸', discovered: false, obtainedCount: 0 },
  { id: 'c35', name: 'Tree Growth', description: 'Organic expansion', rarity: OutcomeRarity.COMMON, multiplier: 1.1, icon: '🌳', discovered: false, obtainedCount: 0 },
  { id: 'c36', name: 'Bee Pollination', description: 'Life spreads', rarity: OutcomeRarity.COMMON, multiplier: 1.15, icon: '🐝', discovered: false, obtainedCount: 0 },
  { id: 'c37', name: 'Bird Migration', description: 'Seasonal journey', rarity: OutcomeRarity.COMMON, multiplier: 1.2, icon: '🦅', discovered: false, obtainedCount: 0 },
  { id: 'c38', name: 'Fish School', description: 'Collective movement', rarity: OutcomeRarity.COMMON, multiplier: 1.25, icon: '🐟', discovered: false, obtainedCount: 0 },
  { id: 'c39', name: 'Coral Reef', description: 'Marine ecosystem', rarity: OutcomeRarity.COMMON, multiplier: 1.3, icon: '🪸', discovered: false, obtainedCount: 0 },
  { id: 'c40', name: 'Mushroom Spore', description: 'Fungal reproduction', rarity: OutcomeRarity.COMMON, multiplier: 1.35, icon: '🍄', discovered: false, obtainedCount: 0 },

  // UNCOMMON (30 outcomes) - 2x to 5x multipliers
  { id: 'u1', name: 'Fusion Reaction', description: 'Stars are born', rarity: OutcomeRarity.UNCOMMON, multiplier: 2, icon: '💫', discovered: false, obtainedCount: 0 },
  { id: 'u2', name: 'Supernova Remnant', description: 'Stellar death echo', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.2, icon: '💥', discovered: false, obtainedCount: 0 },
  { id: 'u3', name: 'Nebula Cloud', description: 'Star nursery', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.4, icon: '☁️', discovered: false, obtainedCount: 0 },
  { id: 'u4', name: 'Planetary Core', description: 'Molten metal heart', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.6, icon: '🌍', discovered: false, obtainedCount: 0 },
  { id: 'u5', name: 'Moon Formation', description: 'Satellite creation', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.8, icon: '🌙', discovered: false, obtainedCount: 0 },
  { id: 'u6', name: 'Asteroid Belt', description: 'Orbital debris field', rarity: OutcomeRarity.UNCOMMON, multiplier: 3, icon: '☄️', discovered: false, obtainedCount: 0 },
  { id: 'u7', name: 'Comet Tail', description: 'Icy wanderer', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.2, icon: '☄️', discovered: false, obtainedCount: 0 },
  { id: 'u8', name: 'Solar Eclipse', description: 'Celestial alignment', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.4, icon: '🌑', discovered: false, obtainedCount: 0 },
  { id: 'u9', name: 'Meteor Shower', description: 'Cosmic fireworks', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.6, icon: '🌠', discovered: false, obtainedCount: 0 },
  { id: 'u10', name: 'Pulsar Rhythm', description: 'Cosmic lighthouse', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.8, icon: '📡', discovered: false, obtainedCount: 0 },
  { id: 'u11', name: 'Magnetar Flare', description: 'Magnetic explosion', rarity: OutcomeRarity.UNCOMMON, multiplier: 4, icon: '🧲', discovered: false, obtainedCount: 0 },
  { id: 'u12', name: 'Quasar Jet', description: 'Galactic power beam', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.2, icon: '🚀', discovered: false, obtainedCount: 0 },
  { id: 'u13', name: 'Dark Matter Halo', description: 'Invisible mass', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.4, icon: '🌑', discovered: false, obtainedCount: 0 },
  { id: 'u14', name: 'Wormhole Portal', description: 'Spacetime shortcut', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.6, icon: '🕳️', discovered: false, obtainedCount: 0 },
  { id: 'u15', name: 'Quantum Entanglement', description: 'Spooky action', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.8, icon: '🔗', discovered: false, obtainedCount: 0 },
  { id: 'u16', name: 'Hawking Radiation', description: 'Black hole evaporation', rarity: OutcomeRarity.UNCOMMON, multiplier: 5, icon: '☢️', discovered: false, obtainedCount: 0 },
  { id: 'u17', name: 'Cosmic Inflation', description: 'Exponential expansion', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.1, icon: '📈', discovered: false, obtainedCount: 0 },
  { id: 'u18', name: 'Higgs Boson', description: 'God particle', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.3, icon: '⚛️', discovered: false, obtainedCount: 0 },
  { id: 'u19', name: 'Antimatter Spark', description: 'Mirror existence', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.5, icon: '✨', discovered: false, obtainedCount: 0 },
  { id: 'u20', name: 'Zero Point Energy', description: 'Vacuum fluctuation', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.7, icon: '⚡', discovered: false, obtainedCount: 0 },
  { id: 'u21', name: 'Bose Condensate', description: 'Quantum collective', rarity: OutcomeRarity.UNCOMMON, multiplier: 2.9, icon: '❄️', discovered: false, obtainedCount: 0 },
  { id: 'u22', name: 'Fermi Surface', description: 'Electron sea', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.1, icon: '🌊', discovered: false, obtainedCount: 0 },
  { id: 'u23', name: 'Superconductor', description: 'Perfect conductor', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.3, icon: '⚡', discovered: false, obtainedCount: 0 },
  { id: 'u24', name: 'Superfluidity', description: 'Frictionless flow', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.5, icon: '💧', discovered: false, obtainedCount: 0 },
  { id: 'u25', name: 'Quantum Computer', description: 'Superposition logic', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.7, icon: '💻', discovered: false, obtainedCount: 0 },
  { id: 'u26', name: 'Neural Network', description: 'Artificial mind', rarity: OutcomeRarity.UNCOMMON, multiplier: 3.9, icon: '🧠', discovered: false, obtainedCount: 0 },
  { id: 'u27', name: 'Dyson Sphere', description: 'Star enclosure', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.1, icon: '🌐', discovered: false, obtainedCount: 0 },
  { id: 'u28', name: 'Orbital Ring', description: 'Space infrastructure', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.3, icon: '💍', discovered: false, obtainedCount: 0 },
  { id: 'u29', name: 'Generation Ship', description: 'Interstellar ark', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.5, icon: '🚀', discovered: false, obtainedCount: 0 },
  { id: 'u30', name: 'Terraformed World', description: 'Engineered paradise', rarity: OutcomeRarity.UNCOMMON, multiplier: 4.7, icon: '🌍', discovered: false, obtainedCount: 0 },

  // RARE (20 outcomes) - 10x to 50x multipliers
  { id: 'r1', name: 'Spiral Galaxy', description: 'Billions of stars swirl', rarity: OutcomeRarity.RARE, multiplier: 10, icon: '🌌', discovered: false, obtainedCount: 0 },
  { id: 'r2', name: 'Elliptical Galaxy', description: 'Ancient stellar sphere', rarity: OutcomeRarity.RARE, multiplier: 12, icon: '⭕', discovered: false, obtainedCount: 0 },
  { id: 'r3', name: 'Galaxy Collision', description: 'Cosmic merger', rarity: OutcomeRarity.RARE, multiplier: 15, icon: '💥', discovered: false, obtainedCount: 0 },
  { id: 'r4', name: 'Supermassive Black Hole', description: 'Galactic anchor', rarity: OutcomeRarity.RARE, multiplier: 18, icon: '🕳️', discovered: false, obtainedCount: 0 },
  { id: 'r5', name: 'Active Galactic Nucleus', description: 'Feeding monster', rarity: OutcomeRarity.RARE, multiplier: 20, icon: '💫', discovered: false, obtainedCount: 0 },
  { id: 'r6', name: 'Galaxy Cluster', description: 'Gravitationally bound group', rarity: OutcomeRarity.RARE, multiplier: 22, icon: '🌐', discovered: false, obtainedCount: 0 },
  { id: 'r7', name: 'Cosmic Filament', description: 'Large-scale structure', rarity: OutcomeRarity.RARE, multiplier: 25, icon: '🕸️', discovered: false, obtainedCount: 0 },
  { id: 'r8', name: 'Great Attractor', description: 'Mysterious gravity source', rarity: OutcomeRarity.RARE, multiplier: 28, icon: '🧲', discovered: false, obtainedCount: 0 },
  { id: 'r9', name: 'Void Region', description: 'Empty cosmic space', rarity: OutcomeRarity.RARE, multiplier: 30, icon: '⬛', discovered: false, obtainedCount: 0 },
  { id: 'r10', name: 'Cosmic Web', description: 'Universe-spanning network', rarity: OutcomeRarity.RARE, multiplier: 32, icon: '🕸️', discovered: false, obtainedCount: 0 },
  { id: 'r11', name: 'Dark Energy Field', description: 'Accelerating expansion', rarity: OutcomeRarity.RARE, multiplier: 35, icon: '🌑', discovered: false, obtainedCount: 0 },
  { id: 'r12', name: 'Observable Universe', description: 'All that can be seen', rarity: OutcomeRarity.RARE, multiplier: 38, icon: '🔭', discovered: false, obtainedCount: 0 },
  { id: 'r13', name: 'Multiverse Bubble', description: 'Parallel reality', rarity: OutcomeRarity.RARE, multiplier: 40, icon: '🫧', discovered: false, obtainedCount: 0 },
  { id: 'r14', name: 'Quantum Foam', description: 'Spacetime at Planck scale', rarity: OutcomeRarity.RARE, multiplier: 42, icon: '🫧', discovered: false, obtainedCount: 0 },
  { id: 'r15', name: 'String Vibration', description: 'Fundamental resonance', rarity: OutcomeRarity.RARE, multiplier: 44, icon: '🎸', discovered: false, obtainedCount: 0 },
  { id: 'r16', name: 'Brane Collision', description: 'Higher dimensional impact', rarity: OutcomeRarity.RARE, multiplier: 46, icon: '💥', discovered: false, obtainedCount: 0 },
  { id: 'r17', name: 'Calabi-Yau Manifold', description: 'Curled extra dimensions', rarity: OutcomeRarity.RARE, multiplier: 48, icon: '🌀', discovered: false, obtainedCount: 0 },
  { id: 'r18', name: 'Loop Quantum Gravity', description: 'Discrete spacetime', rarity: OutcomeRarity.RARE, multiplier: 50, icon: '🔗', discovered: false, obtainedCount: 0 },
  { id: 'r19', name: 'Holographic Principle', description: 'Surface encodes volume', rarity: OutcomeRarity.RARE, multiplier: 45, icon: '📽️', discovered: false, obtainedCount: 0 },
  { id: 'r20', name: 'AdS/CFT Duality', description: 'Gravity-quantum link', rarity: OutcomeRarity.RARE, multiplier: 43, icon: '🔄', discovered: false, obtainedCount: 0 },

  // EPIC (8 outcomes) - 100x to 500x multipliers
  { id: 'e1', name: 'Theory of Everything', description: 'All forces unified', rarity: OutcomeRarity.EPIC, multiplier: 100, icon: '📚', discovered: false, obtainedCount: 0 },
  { id: 'e2', name: 'Perfect Symmetry', description: 'Universal balance', rarity: OutcomeRarity.EPIC, multiplier: 150, icon: '⚖️', discovered: false, obtainedCount: 0 },
  { id: 'e3', name: 'Time Crystal', description: 'Perpetual motion', rarity: OutcomeRarity.EPIC, multiplier: 200, icon: '💎', discovered: false, obtainedCount: 0 },
  { id: 'e4', name: 'Consciousness Field', description: 'Universal awareness', rarity: OutcomeRarity.EPIC, multiplier: 250, icon: '🧠', discovered: false, obtainedCount: 0 },
  { id: 'e5', name: 'Eternal Inflation', description: 'Infinite universes born', rarity: OutcomeRarity.EPIC, multiplier: 300, icon: '♾️', discovered: false, obtainedCount: 0 },
  { id: 'e6', name: 'Vacuum Decay', description: 'False vacuum collapse', rarity: OutcomeRarity.EPIC, multiplier: 350, icon: '💥', discovered: false, obtainedCount: 0 },
  { id: 'e7', name: 'Big Crunch', description: 'Universe contracts', rarity: OutcomeRarity.EPIC, multiplier: 400, icon: '🌀', discovered: false, obtainedCount: 0 },
  { id: 'e8', name: 'Phoenix Cycle', description: 'Death and rebirth', rarity: OutcomeRarity.EPIC, multiplier: 450, icon: '🔥', discovered: false, obtainedCount: 0 },

  // MYTHIC (2 outcomes) - 1000x+ multipliers
  { id: 'm1', name: 'Omega Point', description: 'Final state of maximum complexity', rarity: OutcomeRarity.MYTHIC, multiplier: 1000, icon: '🎯', discovered: false, obtainedCount: 0 },
  { id: 'm2', name: 'Absolute Certainty', description: 'Probability becomes 1', rarity: OutcomeRarity.MYTHIC, multiplier: 5000, icon: '✨', discovered: false, obtainedCount: 0 }
];

// Fate Weights that modify probabilities
export const FATE_WEIGHTS: FateWeight[] = [
  // Rarity shift weights (increase specific rarity chances)
  { id: 'shift_uncommon', name: 'Uncommon Bias', description: 'Increase Uncommon chance by 2% per level', type: 'rarity_shift', cost: 50, level: 0, maxLevel: 10, effect: { rarity: OutcomeRarity.UNCOMMON, increase: 2 }, unlocked: false },
  { id: 'shift_rare', name: 'Rare Attunement', description: 'Increase Rare chance by 1% per level', type: 'rarity_shift', cost: 200, level: 0, maxLevel: 10, effect: { rarity: OutcomeRarity.RARE, increase: 1 }, unlocked: false },
  { id: 'shift_epic', name: 'Epic Magnetism', description: 'Increase Epic chance by 0.5% per level', type: 'rarity_shift', cost: 800, level: 0, maxLevel: 10, effect: { rarity: OutcomeRarity.EPIC, increase: 0.5 }, unlocked: false },
  { id: 'shift_mythic', name: 'Mythic Convergence', description: 'Increase Mythic chance by 0.2% per level', type: 'rarity_shift', cost: 3000, level: 0, maxLevel: 15, effect: { rarity: OutcomeRarity.MYTHIC, increase: 0.2 }, unlocked: false },
  
  // Reroll system
  { id: 'reroll_1', name: 'Second Chance', description: 'Reroll once per pull', type: 'reroll', cost: 100, level: 0, maxLevel: 1, effect: { rerolls: 1 }, unlocked: false },
  { id: 'reroll_2', name: 'Third Chance', description: 'Reroll twice per pull', type: 'reroll', cost: 500, level: 0, maxLevel: 1, effect: { rerolls: 2 }, unlocked: false },
  { id: 'reroll_3', name: 'Infinite Chances', description: 'Reroll until satisfied', type: 'reroll', cost: 2000, level: 0, maxLevel: 1, effect: { rerolls: -1 }, unlocked: false },
  
  // Pity system
  { id: 'pity_rare', name: 'Rare Guarantee', description: 'Guaranteed Rare after 50 pulls without one', type: 'pity', cost: 400, level: 0, maxLevel: 1, effect: { rarity: OutcomeRarity.RARE, threshold: 50 }, unlocked: false },
  { id: 'pity_epic', name: 'Epic Guarantee', description: 'Guaranteed Epic after 100 pulls without one', type: 'pity', cost: 1500, level: 0, maxLevel: 1, effect: { rarity: OutcomeRarity.EPIC, threshold: 100 }, unlocked: false },
  { id: 'pity_mythic', name: 'Mythic Guarantee', description: 'Guaranteed Mythic after 200 pulls without one', type: 'pity', cost: 5000, level: 0, maxLevel: 1, effect: { rarity: OutcomeRarity.MYTHIC, threshold: 200 }, unlocked: false },
  
  // Duplicate protection
  { id: 'dupe_protection', name: 'Anti-Duplication Field', description: 'New outcomes 3x more likely than discovered ones', type: 'duplicate_protection', cost: 1000, level: 0, maxLevel: 1, effect: { newBonus: 3 }, unlocked: false },
  
  // Streak bonuses
  { id: 'streak_bonus', name: 'Hot Streak', description: 'Each consecutive rare+ pull increases multiplier by 10%', type: 'streak_bonus', cost: 600, level: 0, maxLevel: 10, effect: { bonusPerLevel: 10 }, unlocked: false },
  
  // Exponential scaling
  { id: 'expo_scaling', name: 'Cascade Effect', description: 'Each Mythic found increases future Mythic chance by 0.1%', type: 'exponential_scaling', cost: 10000, level: 0, maxLevel: 1, effect: { perMythic: 0.1 }, unlocked: false }
];
