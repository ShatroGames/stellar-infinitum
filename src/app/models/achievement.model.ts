import { Decimal } from '../utils/numbers';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt?: number; // timestamp
  secret?: boolean; // Hidden until unlocked
  reward?: AchievementReward;
}

export interface AchievementReward {
  type: 'multiplier' | 'unlock' | 'cosmetic' | 'automation';
  description: string;
  value?: number;
  unlockId?: string; // For automation unlocks like 'auto_buy', 'auto_warp'
}

export enum AchievementCategory {
  ENERGY = 'Energy',
  STELLAR = 'Stellar',
  ASCENSION = 'Ascension',
  DIMENSION = 'Dimension',
  PROGRESSION = 'Progression',
  SPEED = 'Speed',
  SPECIAL = 'Special'
}

export const ACHIEVEMENTS: Achievement[] = [
  // Energy Milestones
  {
    id: 'energy_1k',
    name: 'Spark of Power',
    description: 'Reach 1,000 Energy',
    icon: '⚡',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },
  {
    id: 'energy_1m',
    name: 'Energy Surge',
    description: 'Reach 1,000,000 Energy',
    icon: '⚡',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },
  {
    id: 'energy_1b',
    name: 'Power Overwhelming',
    description: 'Reach 1,000,000,000 Energy',
    icon: '⚡',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },
  {
    id: 'energy_1t',
    name: 'Cosmic Battery',
    description: 'Reach 1,000,000,000,000 Energy',
    icon: '⚡',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },
  {
    id: 'energy_1qa',
    name: 'Stellar Dynamo',
    description: 'Reach 1e15 Energy',
    icon: '⚡',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },

  // Production Milestones
  {
    id: 'production_100',
    name: 'Efficient Generator',
    description: 'Reach 100 Energy/sec production',
    icon: '⚙',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },
  {
    id: 'production_10k',
    name: 'Power Plant',
    description: 'Reach 10,000 Energy/sec production',
    icon: '⚙',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },
  {
    id: 'production_1m',
    name: 'Industrial Complex',
    description: 'Reach 1,000,000 Energy/sec production',
    icon: '⚙',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },
  {
    id: 'production_1b',
    name: 'Stellar Forge',
    description: 'Reach 1,000,000,000 Energy/sec production',
    icon: '⚙',
    category: AchievementCategory.ENERGY,
    unlocked: false
  },

  // Skill Tree Achievements
  {
    id: 'first_skill',
    name: 'First Steps',
    description: 'Purchase your first skill',
    icon: '✦',
    category: AchievementCategory.STELLAR,
    unlocked: false
  },
  {
    id: 'tier1_complete',
    name: 'Energy Seed Mastery',
    description: 'Max out all skills in Energy Seed',
    icon: '✦',
    category: AchievementCategory.STELLAR,
    unlocked: false
  },
  {
    id: 'tier2_complete',
    name: 'Power Network Mastery',
    description: 'Max out all skills in Power Network',
    icon: '✦',
    category: AchievementCategory.STELLAR,
    unlocked: false
  },
  {
    id: 'tier3_complete',
    name: 'Synthesis Grid Mastery',
    description: 'Max out all skills in Synthesis Grid',
    icon: '✦',
    category: AchievementCategory.STELLAR,
    unlocked: false
  },
  {
    id: 'tier4_complete',
    name: 'Nexus Array Mastery',
    description: 'Max out all skills in Nexus Array',
    icon: '✦',
    category: AchievementCategory.STELLAR,
    unlocked: false
  },
  {
    id: 'tier5_complete',
    name: 'Ultimate Synthesis Mastery',
    description: 'Max out all skills in Ultimate Synthesis',
    icon: '✦',
    category: AchievementCategory.STELLAR,
    unlocked: false,
    reward: {
      type: 'automation',
      description: 'Unlock Auto-Buy: Automatically purchase skills when affordable',
      unlockId: 'auto_buy'
    }
  },
  {
    id: 'all_tiers_complete',
    name: 'Stellar Network Complete',
    description: 'Max out all tiers in the Stellar Network',
    icon: '✦',
    category: AchievementCategory.STELLAR,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+5% Energy production',
      value: 1.05
    }
  },

  // Ascension Achievements
  {
    id: 'first_warp',
    name: 'Space-Time Novice',
    description: 'Complete your first warp',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'warp_5',
    name: 'Warp Veteran',
    description: 'Complete 5 warps',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false,
    reward: {
      type: 'automation',
      description: 'Unlock Auto-Warp: Automatically warp when requirements are met (Tiers 1-4)',
      unlockId: 'auto_warp'
    }
  },
  {
    id: 'warp_10',
    name: 'Master Navigator',
    description: 'Complete 10 warps',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'warp_25',
    name: 'Reality Bender',
    description: 'Complete 25 warps',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'stellar_100',
    name: 'Stellar Collector',
    description: 'Accumulate 100 Stellar Cores',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'stellar_250',
    name: 'Stellar Hoarder',
    description: 'Accumulate 250 Stellar Cores',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'stellar_400',
    name: 'Stellar Magnate',
    description: 'Accumulate 400 Stellar Cores',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+10% Stellar Core gain',
      value: 1.1
    }
  },
  {
    id: 'ascension_unlocked',
    name: 'Nexus Awakening',
    description: 'Unlock the Stellar Nexus',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'ascension_tier1_complete',
    name: 'Foundation Architect',
    description: 'Max out all Foundation tier nodes',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'ascension_tier2_complete',
    name: 'Enhancement Expert',
    description: 'Max out all Enhancement tier nodes',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'ascension_tier3_complete',
    name: 'Transcendence Master',
    description: 'Max out all Transcendence tier nodes',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false
  },
  {
    id: 'ascension_all_complete',
    name: 'Stellar Nexus Complete',
    description: 'Max out all Stellar Nexus nodes',
    icon: '★',
    category: AchievementCategory.ASCENSION,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+15% all Stellar Nexus bonuses',
      value: 1.15
    }
  },

  // Dimension Achievements
  {
    id: 'dimensions_unlocked',
    name: 'Dimensional Awakening',
    description: 'Unlock the Dimensional Echoes',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'first_transcend',
    name: 'Echo Seeker',
    description: 'Complete your first transcendence',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'transcend_10',
    name: 'Echo Collector',
    description: 'Complete 10 transcendences',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'transcend_50',
    name: 'Echo Master',
    description: 'Complete 50 transcendences',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'transcend_100',
    name: 'Echo Incarnate',
    description: 'Complete 100 transcendences',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+10% Echo Fragment gain',
      value: 1.1
    }
  },
  {
    id: 'echo_100',
    name: 'Fragment Gatherer',
    description: 'Accumulate 100 Echo Fragments',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'echo_500',
    name: 'Fragment Collector',
    description: 'Accumulate 500 Echo Fragments',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'echo_1000',
    name: 'Fragment Hoarder',
    description: 'Accumulate 1,000 Echo Fragments',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'echo_5000',
    name: 'Fragment Magnate',
    description: 'Accumulate 5,000 Echo Fragments',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+20% Echo Fragment gain',
      value: 1.2
    }
  },
  {
    id: 'dimension_void_unlocked',
    name: 'Void Walker',
    description: 'Unlock the Void Dimension',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'dimension_crystal_unlocked',
    name: 'Crystal Architect',
    description: 'Unlock the Crystal Dimension',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'dimension_quantum_unlocked',
    name: 'Quantum Explorer',
    description: 'Unlock the Quantum Dimension',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'dimension_temporal_unlocked',
    name: 'Time Weaver',
    description: 'Unlock the Temporal Dimension',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'dimension_prism_unlocked',
    name: 'Prism Master',
    description: 'Unlock the Prismatic Dimension',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false
  },
  {
    id: 'all_dimensions_unlocked',
    name: 'Dimensional Sovereign',
    description: 'Unlock all dimensions',
    icon: '◆',
    category: AchievementCategory.DIMENSION,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+25% all dimensional bonuses',
      value: 1.25
    }
  },

  // Progression Achievements
  {
    id: 'progression_1hour',
    name: 'Committed Explorer',
    description: 'Play for 1 hour',
    icon: '⏱',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'progression_10hours',
    name: 'Dedicated Researcher',
    description: 'Play for 10 hours',
    icon: '⏱',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'progression_100hours',
    name: 'Eternal Student',
    description: 'Play for 100 hours',
    icon: '⏱',
    category: AchievementCategory.PROGRESSION,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+5% offline production',
      value: 1.05
    }
  },
  {
    id: 'no_warp_1b',
    name: 'Patient Accumulator',
    description: 'Reach 1B Energy without warping',
    icon: '⏱',
    category: AchievementCategory.PROGRESSION,
    unlocked: false,
    secret: true
  },
  {
    id: 'fast_warp',
    name: 'Speed Runner',
    description: 'Complete a warp in under 5 minutes',
    icon: '⏱',
    category: AchievementCategory.SPEED,
    unlocked: false
  },
  {
    id: 'fast_tier5',
    name: 'Lightning Fast',
    description: 'Reach Tier 5 in under 1 hour',
    icon: '⏱',
    category: AchievementCategory.SPEED,
    unlocked: false,
    secret: true,
    reward: {
      type: 'multiplier',
      description: '+10% Energy production',
      value: 1.1
    }
  },

  // Special Achievements
  {
    id: 'welcome',
    name: 'Welcome to Stellar Infinitum',
    description: 'Start your journey',
    icon: '✨',
    category: AchievementCategory.SPECIAL,
    unlocked: false
  },
  {
    id: 'save_import',
    name: 'Traveler Between Worlds',
    description: 'Import a save file',
    icon: '✨',
    category: AchievementCategory.SPECIAL,
    unlocked: false,
    secret: true
  },
  {
    id: 'offline_8hours',
    name: 'Long Journey',
    description: 'Return after 8 hours offline',
    icon: '✨',
    category: AchievementCategory.SPECIAL,
    unlocked: false
  },
  {
    id: 'overflow_prevention',
    name: 'Number Wrangler',
    description: 'Reach numbers requiring scientific notation',
    icon: '✨',
    category: AchievementCategory.SPECIAL,
    unlocked: false,
    secret: true
  },
  {
    id: 'max_all_trees',
    name: 'Perfect Harmony',
    description: 'Max out all skill trees simultaneously',
    icon: '✨',
    category: AchievementCategory.SPECIAL,
    unlocked: false,
    secret: true,
    reward: {
      type: 'multiplier',
      description: '+25% all bonuses',
      value: 1.25
    }
  },
  
  // Quantum / Collapse Achievements
  {
    id: 'cosmic_collapse',
    name: 'Big Crunch',
    description: 'Trigger the Cosmic Collapse',
    icon: '🌌',
    category: AchievementCategory.SPECIAL,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: 'Quantum progression begins',
      value: 1
    }
  },
  {
    id: 'quantum_beginner',
    name: 'Quantum Initiate',
    description: 'Generate 100,000 Quanta',
    icon: '⚛',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'quantum_intermediate',
    name: 'Quantum Adept',
    description: 'Generate 1,000,000 Quanta',
    icon: '⚛',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'first_synergy',
    name: 'Synergistic',
    description: 'Activate your first synergy',
    icon: '✦',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'all_synergies',
    name: 'Master of Synergy',
    description: 'Activate all 7 synergies simultaneously',
    icon: '✦',
    category: AchievementCategory.PROGRESSION,
    unlocked: false,
    reward: {
      type: 'multiplier',
      description: '+50% to all quantum effects',
      value: 1.5
    }
  },
  {
    id: 'first_entanglement',
    name: 'Quantum Entangled',
    description: 'Create your first entanglement',
    icon: '⚡',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'many_entanglements',
    name: 'Entanglement Web',
    description: 'Maintain 5 entanglements simultaneously',
    icon: '⚡',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'max_matter_tree',
    name: 'Master of Matter',
    description: 'Max all nodes in the Matter tree',
    icon: '◦',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'max_energy_tree',
    name: 'Master of Energy',
    description: 'Max all nodes in the Energy tree',
    icon: '∿',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'max_time_tree',
    name: 'Master of Time',
    description: 'Max all nodes in the Time tree',
    icon: '⟳',
    category: AchievementCategory.PROGRESSION,
    unlocked: false
  },
  {
    id: 'quantum_trinity',
    name: 'Trinity Complete',
    description: 'Max all three quantum trees',
    icon: '✦',
    category: AchievementCategory.PROGRESSION,
    unlocked: false,
    secret: true,
    reward: {
      type: 'multiplier',
      description: '+100% to all quantum production',
      value: 2.0
    }
  }
];
