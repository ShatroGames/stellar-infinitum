/** Per-tier numbers for Stage 1: production when maxed, total node cost, requirement */
import { Decimal } from '../../src/app/utils/numbers';
import { TIERS, Theme } from '../../src/app/economy/stage1-content';
import { Stage1State, buildTree, baseProduction, cost, maxLevel, requirement } from '../../src/app/economy/stage1';

export function tierReport(path: Theme[]): string[] {
  const lines: string[] = [];
  let runBonus = 1;
  for (let tier = 1; tier <= TIERS.length; tier++) {
    const state: Stage1State = { tier, path: path.slice(0, tier - 1), levels: {}, energy: new Decimal(1e10), runBonus, overchargeTime: 0 };
    const nodes = buildTree(tier, state.path);
    // Cost of maxing everything (levels bought in order, ignoring discounts)
    let total = new Decimal(0);
    for (let pass = 0; pass < 3; pass++) {
      for (const n of nodes) {
        while ((state.levels[n.id] ?? 0) < maxLevel(n, nodes, state)) {
          total = total.plus(cost(n, state.levels[n.id] ?? 0, nodes, state));
          state.levels[n.id] = (state.levels[n.id] ?? 0) + 1;
        }
      }
    }
    const prod = baseProduction(nodes, state);
    lines.push(`T${tier} (${path.slice(0, tier - 1).map(t => t[0].toUpperCase()).join('') || '-'}): ` +
      `maxed production 1e${prod.log10().toNumber().toFixed(1)}/s, total cost 1e${total.log10().toNumber().toFixed(1)}, ` +
      `requirement 1e${requirement(tier).log10().toNumber().toFixed(1)}, ` +
      `req/prod ${requirement(tier).div(prod).toNumber().toFixed(0)} s`);
    runBonus *= TIERS[tier - 1].warpBonus;
  }
  return lines;
}
