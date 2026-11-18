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
  type: string;
  value: number;
  resource?: string;
}
