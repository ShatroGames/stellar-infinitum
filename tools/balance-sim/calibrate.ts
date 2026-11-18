/**
 * One-off calibration helper for Stage 1: prints, per tier, the cost scale factor
 * and requirement that make new nodes cost about C seconds and the warp goal
 * about W seconds of that tier's maxed production (geometric mean of both themes).
 */
import { Decimal } from '../../src/app/utils/numbers';
import { EXPANSIONS, TIERS, Theme } from '../../src/app/economy/stage1-content';
import { Stage1State, buildTree, baseProduction, cost, maxLevel } from '../../src/app/economy/stage1';

const COST_SECONDS = [0, 60, 120, 180, 240, 300];
const GOAL_SECONDS = [30, 60, 90, 120, 180];

function maxed(tier: number, path: Theme[], runBonus: number) {
  const state: Stage1State = { tier, path, levels: {}, energy: new Decimal(1e12), runBonus, overchargeTime: 0 };
  const nodes = buildTree(tier, path);
  let newCost = new Decimal(0);
  const newIds = tier >= 2 ? EXPANSIONS[tier][path[tier - 2]].nodes.map(n => n.id) : [];
  for (let pass = 0; pass < 3; pass++) {
    for (const n of nodes) {
      while ((state.levels[n.id] ?? 0) < maxLevel(n, nodes, state)) {
        if (newIds.includes(n.id)) newCost = newCost.plus(cost(n, state.levels[n.id] ?? 0, nodes, state));
        state.levels[n.id] = (state.levels[n.id] ?? 0) + 1;
      }
    }
  }
  return { prod: baseProduction(nodes, state), newCost };
}

let runBonus = 1;
for (let tier = 1; tier <= TIERS.length; tier++) {
  const results = (['saver', 'spender'] as Theme[]).map(theme =>
    maxed(tier, Array(tier - 1).fill(theme), runBonus));
  const logProd = (results[0].prod.log10().toNumber() + results[1].prod.log10().toNumber()) / 2;
  const goal = Math.pow(10, logProd) * GOAL_SECONDS[tier - 1];
  const factors = results.map(r => tier === 1 ? 1 : Math.pow(10, logProd) * COST_SECONDS[tier] / r.newCost.toNumber());
  console.log(`T${tier}: maxed prod 1e${logProd.toFixed(2)}, goal ${goal.toExponential(2)}, ` +
    `cost factor saver ${factors[0].toExponential(2)} spender ${factors[1].toExponential(2)}`);
  runBonus *= TIERS[tier - 1].warpBonus;
}
