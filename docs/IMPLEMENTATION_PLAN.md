# Implementation plan

Status: **draft for review.** Turns `docs/GAME_DESIGN.md` into build steps.

Each phase ends with something playable and a simulator report, and is reviewed before the next one starts. Work stays on a branch; the live game (`main`) is untouched until you decide to release.

---

## What is kept, rebuilt or removed

| Part | Decision | Why |
|---|---|---|
| Angular app shell, routing, build/deploy setup | **Keep** | Works; the visual rebuild comes later |
| `utils/numbers.ts` (break_eternity Decimal, formatting) | **Keep** | Needed for every stage |
| `save-manager.service.ts` (throttled saving, flush on unload, suspend on reset) | **Keep** | Fixed and working |
| `economy/economy.ts` approach (pure formulas shared with the simulator) | **Keep the approach**, replace the contents | One source of truth per stage |
| `tools/balance-sim` | **Keep the framework**, restructure per stage | Balance every stage |
| Options (export/import/reset), tutorial popups, eternal progress | **Keep, adapt** | Small changes for the new save format and stages |
| Achievement service | **Keep the service**, rebuild the list (cosmetic, natural progression only) | Section 7 |
| Stellar Network (`skill-tree` service/components, tier config) | **Rebuild** as Stage 1 | Warp destinations, idle/active, manual play |
| Stellar Nexus, Dimensions, Collapse panel | **Remove**, replaced by Stage 2 and Stage 3 | Sections 4-5 |
| Quantum trees, Artifacts, Probability Forge, victory screen | **Remove** | Dropped (section 6); victory screen rebuilt later |
| Dev panel | **Keep, unused** (developer tool) | Handy for testing; not shipped in the UI |

Removed code stays in git history.

---

## Phase 0: Foundation

1. **Stage framework**: a `StageService` that knows the current stage, holds each stage's currency, checks the completion target, and starts the next stage's currency at +1/s (stage chain). Stages are self-contained modules with a common interface (tick, save, load, offline progress, completion check).
2. **One versioned save**: a single save with a schema version instead of a dozen localStorage keys, so future changes can migrate saves cleanly.
3. **Game loop and away time**: one loop with elapsed time. Time-based progress continues while hidden or closed; nothing is bought or chosen automatically. Includes the "while you were away" summary.
4. **Remove the old systems** (Nexus, Dimensions, Quantum, Artifacts, Forge) and their UI and achievements.
5. **Simulator per stage**: each stage gets its own simulation, with two profiles matching the design's meaning of idle vs active:
   - **active** acts every few seconds;
   - **idle** checks in every 30-60 min.

   Each reports time to beat the stage.
6. **Functional UI shell**: a stage view plus resources, options and achievements. Plain and functional (the visual rebuild comes later).

**Decision needed before Phase 0**: what happens to existing players' saves (see the end of this document).

## Phase 1: Stage 1 (Stellar Network)

1. Tiers 1-5 with a fixed Tier 1 core; at each warp, choose **one of two destinations** (idle-leaning vs active-leaning), shown on a map of the whole run.
2. Tier rules: T3 synergy nodes reacting to the path, T4 neighbor bonuses, T5 capstone by archetype (pure idle, pure active, hybrid). Overcharge is one of the idle options and grows faster while visible.
3. Manual play: no auto-buy or auto-warp in Stage 1.
4. Beating Tier 5 beats the stage and starts Stage 2's currency at +1/s.
5. **Content draft for review first**: the concrete node list per tier and destination, before balancing.
6. Balance: each path is clearly better for its own play style, and gets its matching player through the stage in a similar time.

## Phase 2: Stage 2 (drafted tree)

1. Draft loop: pay to see 3 node cards, attach one to a free slot, level nodes.
2. Starting pool of about 8 node types (Generator, Amplifier, Splitter, Mirror, Catalyst, Seedling, Spark, Keystone), refined during balancing.
3. Reset: a permanent multiplier from the largest tree ever (R1) plus pool unlocks at record milestones (R2), with a reset preview.
4. Completion: the Stage 2 currency reaches its target, starting Stage 3's currency at +1/s.
5. Balance with the simulator.

## Phase 3: Stage 3 (leveling nodes)

1. Nodes level up on their own timers, each level taking longer; they keep leveling while closed.
2. Stage currency = total level. Reset (new era) grants era currency = total level; accumulated era currency unlocks new nodes at thresholds.
3. Each node's best level ever gives it a speed boost in later eras. Reset preview (C5).
4. Completion: total level in one era reaches the target, which leads to Collapse.
5. Balance; then decide whether C1-C4 are needed after playtesting.

## Phase 4: Collapse and transformed stages

1. Design Stages 1', 2', 3' in the design doc first:
   - 1' adds more complexity or much more content;
   - 2' adds deck-building;
   - 3' is decided after Stage 3 is played.
2. Collapse transition (one-time), then build 1', 2', 3' as variants of the stage modules.
3. Victory on beating Stage 3'. Escalation across Collapse (each stage longer and more complex than the previous).

## Phase 5: New Game+, achievements, tutorials

1. New Game+ after victory: NG+1 to NG+6 each speed up one stage ×1.5; ends after NG+6; achievements and eternal stats carry over.
2. Achievement list rebuilt: cosmetic, natural progression only.
3. Tutorials for each stage.

## Phase 6: Visual rebuild

A complete visual redesign, once the gameplay is in place.

---

## Decision needed

**Existing saves.** The new stages share almost nothing with the old save data. Options:

1. **Fresh start with a notice**: old saves are archived (kept in the browser, exportable) and the player starts from Stage 1, with a message explaining the rebuild.
2. **Partial conversion**: e.g., players who were past the first loop start at Stage 2. Complicated, and the old and new progress don't map well.
3. **Separate release**: publish the rebuild as a new version or address and leave the old game as it is.

Recommendation: **1**, or **3** if you want the old version to stay playable.
