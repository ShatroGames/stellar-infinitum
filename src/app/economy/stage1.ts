/**
 * Pure formulas for Stage 1 (Stellar Network). Framework-free so the balance
 * simulator (tools/balance-sim) uses exactly the same numbers as the game.
 */
import { Decimal } from '../utils/numbers';
import { SkillNode } from '../models/skill-node.model';
import { SKILL_TREE_TIERS } from '../models/skill-trees.config';

export const STAGE1_START_ENERGY = 10;

/** Cost of buying the given level of a node */
export function skillCost(skill: SkillNode, level: number): Decimal {
  return new Decimal(skill.cost).times(Decimal.pow(skill.costMultiplier, level)).floor();
}

/** Energy needed (with every node maxed) to warp out of a tier, or to beat the stage in Tier 5 */
export function warpRequirement(tier: number): Decimal {
  const tierData = SKILL_TREE_TIERS.find(t => t.id === tier);
  return tierData ? new Decimal(tierData.requiredPoints) : new Decimal(Infinity);
}

/** Production multiplier gained by warping out of a tier */
export function warpBonus(tier: number): number {
  return SKILL_TREE_TIERS.find(t => t.id === tier)?.prestigeBonus ?? 1;
}

/** Energy per second */
export function energyProduction(skills: readonly SkillNode[], runBonus: number): Decimal {
  let base = 0;
  let multiplier = new Decimal(runBonus);
  for (const skill of skills) {
    if (skill.effect.type === 'production') base += skill.effect.value * skill.level;
    if (skill.effect.type === 'multiplier' && skill.level > 0) {
      multiplier = multiplier.times(Decimal.pow(skill.effect.value, skill.level));
    }
  }
  return multiplier.times(base);
}

/** A node can be levelled once every prerequisite is maxed */
export function isUnlocked(skill: SkillNode, skills: ReadonlyMap<string, SkillNode>): boolean {
  return skill.prerequisites.every(id => {
    const prereq = skills.get(id);
    return !!prereq && prereq.level >= prereq.maxLevel;
  });
}
