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
