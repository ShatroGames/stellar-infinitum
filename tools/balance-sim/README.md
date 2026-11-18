# Balance simulator

Plays each built stage headlessly and reports how long it takes to beat it, in game time.
It uses the real config files and the pure formulas in `src/app/economy/`, so it stays in sync
with the game.

```bash
npm run sim              # all stages
npm run sim -- stage1    # one stage
```

## Profiles (`profiles.ts`)

Idle vs active means *how you play* (docs/GAME_DESIGN.md):

- **active** checks in every 5 seconds and acts.
- **idle** checks in every 45 minutes and acts.

Between check-ins only time-based progress happens; the player makes every purchase.

## Adding a stage

1. Put the stage's formulas in `src/app/economy/<stage>.ts` (framework-free).
2. Write `tools/balance-sim/<stage>.ts` exporting `simulate<Stage>(profile): StageResult`.
3. Register it in `STAGES` in `run.ts`.

## Balancing notes

Learned while tuning the previous design: progress is a feedback loop. If one order of magnitude
of production earns more than it costs to buy that order again, a phase runs away; if it earns
much less, it stalls. Aim just below 1, and avoid big lump purchases that players must save for.
