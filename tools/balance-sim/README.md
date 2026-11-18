# Balance simulator

Plays the pre-collapse game headlessly with two player profiles and reports how
long each milestone takes in game time. It uses the real config files and the
shared formulas in `src/app/economy/economy.ts`, so it stays in sync with the game.

```bash
npm run sim            # both profiles
npm run sim -- active  # one profile
```

Profiles (see `PROFILES` in `sim.ts`):

- **active** checks in every 10 s and transcends after an Overcharge dwell of
  20x the run's setup time (60 s to 15 min).
- **casual** checks in every 15 min and transcends whenever it would gain something.

Tuning overrides (environment variables, no code changes needed):

| Variable | Meaning |
| --- | --- |
| `CORE=scale,power[,start]` | Stellar Core reward curve |
| `EF=scale,power[,start]` | Echo Fragment reward curve |
| `OC=tau,power` | Overcharge growth |
| `DWELL=n` | active profile dwell multiplier |
| `TRACE=1` | log every Echo Fragment purchase |

Helpers:

- `analyze.ts` prints how many orders of magnitude each system adds to Tier 5 production.
- `price-dims.ts` prints orders of magnitude per level for every dimension node
  (used to price dimension nodes at a constant Echo Fragment cost per order).

Run them with `npx tsc -p tools/balance-sim` and then
`node tools/balance-sim/out/tools/balance-sim/<file>.js`.

## Why the numbers look the way they do

Progress is a feedback loop: Energy records earn currencies, currencies buy
production, production raises the next record. If one order of magnitude of
production earns more currency than it costs to buy that order again, the phase
runs away in minutes; if it earns much less, it stalls for days. The game is
tuned to sit just below 1, and Overcharge keeps waiting meaningful so a small
shortfall costs a little more time instead of an exponential wall. Big lump
purchases (unlocks, skill-cap nodes) are kept cheap for the same reason:
saving for them stalls the loop.
