import { Decimal } from '../utils/numbers';
export interface SkillNode {
  id: string;
  name: string;
  description: string;
  level: number;
  maxLevel: number;
  cost: Decimal;
  costMultiplier: number;
  unlocked: boolean;
  prerequisites: string[]; // IDs of prerequisite skills
  position: { x: number; y: number }; // For visual layout
  effect: SkillEffect;
}
export interface SkillEffect {
  type: 'production' | 'multiplier' | 'unlock' | 'automation';
  value: number;
  resource?: string;
}
export interface SkillTreeTier {
  id: number;
  name: string;
  description: string;
  requiredPoints: Decimal; // Skill points needed to ascend
  skills: SkillNode[];
  prestigeBonus: number; // Multiplier bonus for completing this tier
}
export interface PrestigeData {
  currentTier: number;
  totalAscensions: number; // Total warps across all runs
  currentRunAscensions: number; // Warps in the current ascension cycle
  totalPrestigeBonus: number; // Cumulative bonus from all ascensions
  currentRunPrestigeBonus: number; // Bonus for the current cycle (resets on Tier 5 completion)
  tierCompletions: Map<number, number>; // How many times each tier was completed
}
export interface GameState {
  resources: Map<string, Decimal>;
  productionRates: Map<string, Decimal>;
  skills: Map<string, SkillNode>;
  lastUpdate: number;
  totalPlayTime: number;
  prestige: PrestigeData;
}