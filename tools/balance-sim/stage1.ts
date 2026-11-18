/** Stage 1 (Stellar Network) simulation for every path, using the game's own formulas */
import { Theme } from '../../src/app/economy/stage1-content';
import {
  FINAL_TIER, Stage1State, advance, buildTree, buyAll, canWarp, initialState, warp,
} from '../../src/app/economy/stage1';
import { Profile, StageResult } from './profiles';

const MAX_SECONDS = 200 * 3600;
/** Time is advanced in steps of at most this long, so Interest follows Energy */
const STEP_SECONDS = 30;

export const ALL_PATHS: Theme[][] = [];
for (let i = 0; i < 16; i++) {
  ALL_PATHS.push([0, 1, 2, 3].map(b => ((i >> (3 - b)) & 1 ? 'spender' : 'saver')));
}

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
