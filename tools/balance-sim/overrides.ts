/**
 * Tuning overrides for Stage 1 (environment variables, applied to the loaded content
 * before any simulation). Used while tuning; final values are written into
 * src/app/economy/stage1-content.ts.
 *
 *   S1_COST_SAVER=f2,f3,f4,f5     multiply Saver expansion costs per tier
 *   S1_COST_SPENDER=f2,f3,f4,f5   multiply Spender expansion costs per tier
 *   S1_COST_CORE=f                multiply core node costs
 *   S1_REQ=r1,r2,r3,r4,r5         multiply each tier's Energy goal
 *   S1_INTEREST=k                 multiply Interest values
 *   S1_BULK=k                     multiply bulk discount values
 *   S1_MULT=k                     scale every multiplier node's bonus (1.2 → 1 + 0.2k)
 *   S1_WARP=b                     warp bonus per warp
 */
import { CORE_NODES, EXPANSIONS, TIERS } from '../../src/app/economy/stage1-content';

const list = (name: string) => process.env[name]?.split(',').map(Number);
const num = (name: string) => (process.env[name] ? Number(process.env[name]) : undefined);
const allNodes = () => [...CORE_NODES, ...Object.values(EXPANSIONS).flatMap(e => Object.values(e).flatMap(x => x.nodes))];

for (const [theme, env] of [['saver', 'S1_COST_SAVER'], ['spender', 'S1_COST_SPENDER']] as const) {
  list(env)?.forEach((f, i) => EXPANSIONS[i + 2][theme].nodes.forEach(n => (n.cost *= f)));
}
const core = num('S1_COST_CORE');
if (core) CORE_NODES.forEach(n => { if (n.type !== 'production') n.cost *= core; });
list('S1_REQ')?.forEach((f, i) => (TIERS[i].requirement *= f));
const interest = num('S1_INTEREST');
if (interest) allNodes().forEach(n => { if (n.type === 'interest') n.value *= interest; });
const bulk = num('S1_BULK');
if (bulk) allNodes().forEach(n => { if (n.type === 'bulk_discount') n.value *= bulk; });
const mult = num('S1_MULT');
if (mult) allNodes().forEach(n => { if (n.type === 'multiplier') n.value = 1 + (n.value - 1) * mult; });
const warp = num('S1_WARP');
if (warp) TIERS.forEach(t => { if (t.warpBonus > 1) t.warpBonus = warp; });
