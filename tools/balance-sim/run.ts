/**
 * Balance simulator. Plays each built stage with the player profiles and
 * reports the game time needed to beat it.
 *
 *   npm run sim              # all stages
 *   npm run sim -- stage1    # one stage
 *   npm run sim -- stage1 -v # with milestones
 */
import { PROFILES, formatTime } from './profiles';
import { ALL_PATHS, pathLabel, simulateStage1 } from './stage1';
import { tierReport } from './stage1-report';

const args = process.argv.slice(2);
const verbose = args.includes('-v');
const wanted = args.filter(a => !a.startsWith('-'));

if (args.includes('--tiers')) {
  for (const path of [ALL_PATHS[0], ALL_PATHS[15]]) {
    console.log(`\n${pathLabel(path)}`);
    tierReport(path).forEach(l => console.log('  ' + l));
  }
}

if (!wanted.length || wanted.includes('stage1')) {
  console.log('\n=== stage1: time to beat, per path (S = Saver, P = Spender; order = Tiers 2-5) ===');
  console.log('  path   ' + PROFILES.map(p => p.name.padStart(12)).join(''));
  for (const path of ALL_PATHS) {
    const results = PROFILES.map(p => simulateStage1(p, path));
    console.log(`  ${pathLabel(path)}   ` + results.map(r => formatTime(r.seconds).padStart(12)).join(''));
    if (verbose) {
      results.forEach((r, i) => console.log(`      ${PROFILES[i].name}: ` +
        r.milestones.map(([l, s]) => `${l} @ ${formatTime(s)}`).join(', ')));
    }
  }
}
