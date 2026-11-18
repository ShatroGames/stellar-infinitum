/** Stage 1 (Stellar Network) simulation for every path, using the game's own formulas */
import { EXPANSIONS, TIERS, Theme } from '../../src/app/economy/stage1-content';

/**
 * Tuning overrides (environment variables, applied to the loaded content):
 *   S1_COST_SAVER=f2,f3,f4,f5     multiply Saver expansion costs per tier
 *   S1_COST_SPENDER=f2,f3,f4,f5   multiply Spender expansion costs per tier
 *   S1_REQ=r1,r2,r3,r4,r5         multiply each tier's Energy goal
 *   S1_INTEREST=k                 multiply Interest values
 *   S1_BULK=k                     multiply bulk discount values
 */
function applyOverrides(): void {
  const list = (name: string) => process.env[name]?.split(',').map(Number);
  for (const [theme, env] of [['saver', 'S1_COST_SAVER'], ['spender', 'S1_COST_SPENDER']] as const) {
    list(env)?.forEach((f, i) => EXPANSIONS[i + 2][theme].nodes.forEach(n => (n.cost *= f)));
  }
  list('S1_REQ')?.forEach((f, i) => (TIERS[i].requirement *= f));
  const scaleType = (type: string, k: number) => Object.values(EXPANSIONS).forEach(e =>
    Object.values(e).forEach(exp => exp.nodes.forEach(n => { if (n.type === type) n.value *= k; })));
  const interest = Number(process.env['S1_INTEREST'] ?? 1);
  if (interest !== 1) scaleType('interest', interest);
  const bulk = Number(process.env['S1_BULK'] ?? 1);
  if (bulk !== 1) scaleType('bulk_discount', bulk);
}
applyOverrides();
import {
  FINAL_TIER, Stage1State, advance, buildTree, buyAll, canWarp, initialState, warp,
} from '../../src/app/economy/stage1';
import { Profile, StageResult } from './profiles';

const MAX_SECONDS = 200 * 3600;
/** Time is advanced in steps of at most this long, so Interest follows Energy */
const STEP_SECONDS = 30;

/** One theme for the whole stage (chosen at the first warp) */
export const ALL_PATHS: Theme[][] = [
  ['saver', 'saver', 'saver', 'saver'],
  ['spender', 'spender', 'spender', 'spender'],
];

export const pathLabel = (path: Theme[]) => path.map(t => (t === 'saver' ? 'S' : 'P')).join('');

export function simulateStage1(profile: Profile, path: Theme[] = ['spender', 'spender', 'spender', 'spender']): StageResult {
  const state: Stage1State = initialState();
  let nodes = buildTree(1, state.path);
  let t = 0;
  let actions = 0;
  const milestones: [string, number][] = [];
  const visible = profile.checkInterval < 60;

  while (t < MAX_SECONDS) {
    let acted = buyAll(nodes, state) > 0;
    while (canWarp(nodes, state)) {
      if (state.tier === FINAL_TIER) {
        milestones.push(['beat stage', t]);
        return { seconds: t, milestones, actions: actions + 1 };
      }
      Object.assign(state, warp(state, path[state.tier - 1]));
      nodes = buildTree(state.tier, state.path);
      milestones.push([`reach tier ${state.tier}`, t]);
      acted = true;
      buyAll(nodes, state);
    }
    if (acted) actions++;

    let remaining = profile.checkInterval;
    while (remaining > 0) {
      const step = Math.min(STEP_SECONDS, remaining);
      advance(nodes, state, step, visible);
      remaining -= step;
    }
    t += profile.checkInterval;
  }
  return { seconds: Infinity, milestones, actions };
}
