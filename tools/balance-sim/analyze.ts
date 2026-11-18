/** Orders of magnitude of Tier 5 production contributed by each system (all maxed). */
import { Decimal } from '../../src/app/utils/numbers';
import { SKILL_TREE_TIERS } from '../../src/app/models/skill-trees.config';
import { ASCENSION_TREE_NODES } from '../../src/app/models/ascension-tree.model';
import { DIMENSIONS, Dimension } from '../../src/app/models/dimension.model';
import { achievementEffects, dimensionEffects, energyProduction, nexusEffects, skillCapBonus } from '../../src/app/economy/economy';

const allNexus = new Set(ASCENSION_TREE_NODES.map(n => n.id));
function logP(dims: Dimension[], nexus: Set<string>, cores: number): number {
  const nx = nexusEffects(nexus);
  const ax = achievementEffects(new Set());
  const dx = dimensionEffects(dims, 1);
  const cap = skillCapBonus(nx, dx);
  const skills = SKILL_TREE_TIERS[4].skills.map(s => ({ ...s, level: s.maxLevel + cap, maxLevel: s.maxLevel + cap }));
  return energyProduction(skills, { runPrestigeBonus: 16, runWarps: 4, totalCores: cores, nexus: nx, dims: dx, achievements: ax }).log10().toNumber();
}
const maxed = (ids: string[]) => DIMENSIONS.map(d => ({ ...d, unlocked: ids.includes(d.id), nodes: d.nodes.map(n => ({ ...n, level: ids.includes(d.id) ? n.maxLevel : 0 })) }));
const cost = (d: Dimension) => d.unlockCost + d.nodes.reduce((s, n) => { let c = 0; for (let l = 0; l < n.maxLevel; l++) c += Math.floor(n.cost * n.costMultiplier ** l); return s + c; }, 0);

console.log('Tier 5 maxed, no meta:', logP(maxed([]), new Set(), 0).toFixed(1));
console.log('+ full Nexus, 72 cores:', logP(maxed([]), allNexus, 72).toFixed(1));
const base = logP(maxed([]), allNexus, 72);
for (const d of DIMENSIONS) console.log(`  + ${d.id.padEnd(8)} maxed: +${(logP(maxed([d.id]), allNexus, 72) - base).toFixed(1)} orders, cost ${cost(d)} EF`);
console.log('  all dims maxed: +' + (logP(maxed(DIMENSIONS.map(d => d.id)), allNexus, 72) - base).toFixed(1));

// Sensitivity: orders added by one unit of each effect type on top of full Nexus
const fake = (type: any, value: number, special?: string): Dimension[] => [{ ...DIMENSIONS[0], unlocked: true,
  nodes: [{ ...DIMENSIONS[0].nodes[0], level: 1, maxLevel: 1, effect: { type, value, special } }] }];
for (const [label, dims] of [
  ['+0.1 multiplier power', fake('multiplier_power', 0.1)],
  ['+1.0 multiplier power', fake('multiplier_power', 1)],
  ['+1 skill cap', fake('skill_cap', 1)],
  ['+5 skill cap', fake('skill_cap', 5)],
  ['+100% production', fake('production_mult', 1)],
  ['prism all aspects 0.4', fake('special', 0.4, 'all_aspects')],
] as [string, Dimension[]][]) {
  console.log(`  ${label.padEnd(24)} +${(logP(dims, allNexus, 72) - base).toFixed(2)} orders`);
}
