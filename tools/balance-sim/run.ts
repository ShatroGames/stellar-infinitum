/**
 * Balance simulator. Plays each built stage with the player profiles and
 * reports the game time needed to beat it.
 *
 *   npm run sim              # all stages, all profiles
 *   npm run sim -- stage1    # one stage
 */
import { PROFILES, Profile, StageResult, formatTime } from './profiles';
import { simulateStage1 } from './stage1';

const STAGES: Record<string, (profile: Profile) => StageResult> = {
  stage1: simulateStage1,
};

const wanted = process.argv.slice(2);
for (const [stage, simulate] of Object.entries(STAGES)) {
  if (wanted.length && !wanted.includes(stage)) continue;
  console.log(`\n=== ${stage} ===`);
  for (const profile of PROFILES) {
    const result = simulate(profile);
    console.log(`  ${profile.name.padEnd(7)} (checks every ${formatTime(profile.checkInterval)}): ` +
      `beaten in ${formatTime(result.seconds)}, ${result.actions} check-ins with actions`);
    for (const [label, seconds] of result.milestones) {
      console.log(`      ${formatTime(seconds).padStart(10)}  ${label}`);
    }
  }
}
