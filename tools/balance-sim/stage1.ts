/** Stage 1 (Stellar Network) simulation, using the game's own formulas */
import { Decimal } from '../../src/app/utils/numbers';
import { SkillNode } from '../../src/app/models/skill-node.model';
import { SKILL_TREE_TIERS } from '../../src/app/models/skill-trees.config';
import {
  STAGE1_START_ENERGY, energyProduction, isUnlocked, skillCost, warpBonus, warpRequirement,
} from '../../src/app/economy/stage1';
import { Profile, StageResult } from './profiles';

const MAX_SECONDS = 500 * 3600;

export function simulateStage1(profile: Profile): StageResult {
  let t = 0;
  let tier = 1;
  let runBonus = 1;
  let energy = new Decimal(STAGE1_START_ENERGY);
  let skills = buildTier(1);
  let actions = 0;
  const milestones: [string, number][] = [];

  const map = () => new Map(skills.map(s => [s.id, s]));
  const production = () => energyProduction(skills, runBonus);
  const allMaxed = () => skills.every(s => s.level >= s.maxLevel);

  /** Buy cheapest-first until nothing is affordable */
  const buyAll = (): boolean => {
    let bought = false;
    for (;;) {
      const m = map();
      const options = skills.filter(s => s.level < s.maxLevel && isUnlocked(s, m))
        .map(s => ({ s, cost: skillCost(s, s.level) }))
        .sort((a, b) => a.cost.cmp(b.cost));
      const next = options[0];
      if (!next || energy.lt(next.cost)) return bought;
      energy = energy.minus(next.cost);
      next.s.level++;
      bought = true;
    }
  };

  while (t < MAX_SECONDS) {
    // Check-in: buy, warp as far as possible, or beat the stage
    let acted = buyAll();
    while (allMaxed() && energy.gte(warpRequirement(tier))) {
      if (tier === SKILL_TREE_TIERS.length) {
        milestones.push(['beat stage', t]);
        return { seconds: t, milestones, actions: actions + 1 };
      }
      runBonus *= warpBonus(tier);
      tier++;
      energy = new Decimal(STAGE1_START_ENERGY);
      skills = buildTier(tier);
      milestones.push([`reach tier ${tier}`, t]);
      acted = true;
      buyAll();
    }
    if (acted) actions++;

    // Wait until the next check-in
    energy = energy.plus(production().times(profile.checkInterval));
    t += profile.checkInterval;
  }
  return { seconds: Infinity, milestones, actions };
}

function buildTier(tier: number): SkillNode[] {
  return SKILL_TREE_TIERS[tier - 1].skills.map(s => ({ ...s, cost: new Decimal(s.cost), level: 0 }));
}
