export enum ArtifactBranch {
  PRODUCTION = 'production',
  MULTIPLIER = 'multiplier',
  RESONANCE = 'resonance',
  CROSS_BRANCH = 'cross-branch'
}

export enum ArtifactEffectType {
  FLAT_PRODUCTION = 'flat_production',
  MULTIPLIER = 'multiplier',
  RESONANCE = 'resonance',
  IDLE_BONUS = 'idle_bonus',
  SCALING_BONUS = 'scaling_bonus',
  STORED_QUANTA_BONUS = 'stored_quanta_bonus',
  PERSISTENT_BONUS = 'persistent_bonus',
  COMPOUND_BONUS = 'compound_bonus',
  EFFECTIVENESS_BONUS = 'effectiveness_bonus'
}

export interface ArtifactEffect {
  type: ArtifactEffectType;
  value: number; // Percentage or multiplier value
  description: string;
}

export interface Artifact {
  id: string;
  name: string;
  branch: ArtifactBranch;
  tier: number;
  description: string;
  icon?: string;
  cost: number; // Quanta cost to unlock
  requiredTotalQuanta?: number; // Milestone requirement
  prerequisites: string[]; // Other artifact IDs that must be unlocked first
  effects: ArtifactEffect[];
  position: { x: number; y: number }; // For visual layout
}

export interface ArtifactState {
  unlockedArtifacts: Set<string>;
  artifactUnlockTime: Map<string, number>; // For time-based bonuses
  systemUnlocked: boolean; // Unlocks at 50M total Quanta
}
