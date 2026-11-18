/**
 * Prints orders of magnitude gained per level for every dimension node (measured
 * standalone on top of a full Stellar Nexus), used to price the nodes.
 */
import { ASCENSION_TREE_NODES } from '../../src/app/models/ascension-tree.model';
import { DIMENSIONS, Dimension } from '../../src/app/models/dimension.model';
import { SKILL_TREE_TIERS } from '../../src/app/models/skill-trees.config';
import { achievementEffects, dimensionEffects, energyProduction, nexusEffects, skillCapBonus } from '../../src/app/economy/economy';

const nexus = new Set(ASCENSION_TREE_NODES.map(n => n.id));
function logP(dims: Dimension[]): number {
  const nx = nexusEffects(nexus), dx = dimensionEffects(dims, 1), ax = achievementEffects(new Set());
  const cap = skillCapBonus(nx, dx);
  const skills = SKILL_TREE_TIERS[4].skills.map(s => ({ ...s, level: s.maxLevel + cap, maxLevel: s.maxLevel + cap }));
  return energyProduction(skills, { runPrestigeBonus: 16, runWarps: 4, totalCores: 72, nexus: nx, dims: dx, achievements: ax }).log10().toNumber();
}
const empty = DIMENSIONS.map(d => ({ ...d, unlocked: true, nodes: d.nodes.map(n => ({ ...n, level: 0 })) }));
const base = logP(empty);
const out: Record<string, number> = {};
for (const d of DIMENSIONS) {
  // Synergy nodes are measured with the rest of their dimension bought
  for (const n of d.nodes) {
    const dims = empty.map(x => x.id !== d.id ? x : { ...x, nodes: x.nodes.map(m => ({ ...m, level: m.id === n.id ? n.maxLevel : (n.effect.type === 'cross_dimension' ? m.maxLevel : 0) })) });
    const without = empty.map(x => x.id !== d.id ? x : { ...x, nodes: x.nodes.map(m => ({ ...m, level: m.id !== n.id && n.effect.type === 'cross_dimension' ? m.maxLevel : 0 })) });
    out[n.id] = (logP(dims) - logP(without)) / n.maxLevel;
  }
}
console.log(JSON.stringify(out));
