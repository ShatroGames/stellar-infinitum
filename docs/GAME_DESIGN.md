# Stellar Infinitum: Game Design Document

Status: **draft for review.** We go through it section by section. Every point is tagged:

- **[Decided]**: agreed in discussion; the code should follow it.
- **[Implemented]**: true in the current code (`claude/upbeat-cray-zuxj54`), not yet confirmed as the intended design.
- **[Proposed]**: a suggestion that needs approval.
- **[Open]**: a question to answer.

Balance numbers live in `src/app/economy/economy.ts` and the config files in `src/app/models/`.
The simulator (`npm run sim`, see `tools/balance-sim/README.md`) measures pacing.

---

## 1. Vision and pillars

0. **Core concept: skill trees.** Every stage of the game is a skill tree or a tree-like structure, and new layers introduce new ways for trees to work, not just bigger numbers. **[Decided]** (section 1A catalogs the mechanics)
1. **Genre**: browser idle/incremental game with layered prestige systems. Space theme. **[Decided]**
2. **Length**: playtime is measured in game time, not real days. A loose target is around 50 h for a dedicated player and around 100 h for a casual one. These are guidelines; balance comes first. **[Decided]**
3. **Active play is clearly better than idling.** Not watching the game is the drawback: nothing is bought automatically while the game is hidden or closed. **[Decided]**
4. **The bucket principle**: idle time fills a bucket (resources, Overcharge) with diminishing returns. Emptying it, by buying, warping or transcending, takes the player. Idle time never skips a chunk of progression, and there are no caps that punish being away. **[Decided]**
5. **Transparency**: the game shows what an action will give ("+12 Stellar Cores · next at 1e41 Energy"). No hidden formulas the player has to guess. **[Decided]**
6. **No micromanagement settings**: automation follows fixed, simple rules, with no thresholds to configure. **[Decided]**
7. **Cosmic Collapse is the ultimate prestige.** It fundamentally changes the game. **[Decided]**
8. **New Game+** after victory, with a small perk per completion. **[Decided]** (details in section 9)
9. **Escalating stages**: each new stage has more content, is a bit more complex and takes longer than the previous one. **[Decided]**
10. **Stage chain**: each stage has its own currency. Beating a stage starts the next stage's currency at **+1/s**. A stage is beaten when its currency reaches a target, and targets grow each stage (naturally, since stages get longer and more complex). Previous currencies become redundant. **[Decided]**
11. **No missable achievements**: achievements come from natural progression; nothing conditional ("buy every x node") that can lock you out. **[Decided]**
12. **Idle vs active** means *how you play*: actively buying and making moves, versus checking in from time to time. It is not about whether the tab is visible. **[Decided]**

- **[Decided] 1.1**: Playtime splits about 50/50 before and after Collapse, **provided** the Quantum era brings about 50% more (or different) skill tree mechanics, so the second half feels like a new game rather than more of the same.

---

## 1A. Skill tree mechanics catalog

Every tree mechanic the game uses or could use, so each layer can introduce something new.

### Already in the game **[Implemented]**

| # | Mechanic | Where |
|---|---|---|
| T1 | Leveled nodes; children unlock when their parents are maxed | Stellar Network |
| T2 | Growing tree: each tier keeps the old nodes and adds new ones | Stellar Network tiers 1-5 |
| T3 | One-time purchase tree with prerequisites, bought with a meta currency | Stellar Nexus |
| T4 | Parallel trees that must be unlocked separately | Dimensions |
| T5 | Synergy nodes that scale with the number of purchased nodes in their tree | Dimensions |
| T6 | Cross-tree synergies triggered by owning specific node combinations | Quantum trees |
| T7 | Milestone-gated nodes (need a lifetime total, not just currency) | Quantum trees |
| T8 | Linear ladder branches where only the highest tier counts | Artifacts |

### New mechanics **[Proposed]**

| # | Mechanic | How it works | Fits |
|---|---|---|---|
| N1 | **Overdrive node** | Repeatable node that appears once the tree is maxed: ×N production per level, cost rises steeply. Auto-buy only buys it while you watch. | Tier 5 (answers the active-play gap, 2.3) |
| N2 | **Exclusive branches** | Pick one of 2-3 branches; switching costs something (respec). Real build choices. | Stellar Nexus, Crystal |
| N3 | **Node evolution** | A maxed node can evolve into one of two stronger variants. | Stellar Network (later loops) |
| N4 | **Adjacency bonuses** | Nodes boost their direct neighbors, so the layout and purchase order matter. | Prism |
| N5 | **Pruning / sacrifice** | Give up (reset) a branch for a permanent or stronger effect elsewhere. | Void |
| N6 | **Time-scaling nodes** | Effects grow with time in the current run (pairs with Overcharge). | Temporal |
| N7 | **Rolled nodes** | Effect values re-roll each transcend; you can lock one roll. | Quantum dimension |
| N8 | **Superposition nodes** | A node holds two possible effects; buying it "observes" it and fixes one, and it re-opens on the next reset. | Quantum era |
| N9 | **Entanglement** | Link two nodes in different trees so they share levels or effects; limited links. (The game already teases this.) | Quantum era |
| N10 | **Constellations (build your own tree)** | You place nodes and draw the connections yourself, with limited links; shape determines bonuses. | Quantum era |
| N11 | **Fog of war** | Nodes stay hidden until a neighbor is bought; exploring the tree is part of the reward. | Quantum era |
| N12 | **Flow trees** | The root produces a resource that flows down the edges to the leaves; upgrades widen edges or split flow. | Quantum era |
| N13 | **Socketing** | Items (artifacts) are inserted into node sockets to change what the node does. | Artifacts |
| N14 | **Mastery** | Nodes gain mastery from active time while maxed, giving small permanent bonuses. | Any layer (active play reward) |

The pre-Collapse half would use T1-T5 plus a few new ones (N1-N7). The Quantum era would bring T6-T8 plus several of N8-N13, which is the "50% more mechanics" the split depends on.

- **Player feedback**: "the game doesn't have any choices". **[Decided]** Meaningful choices should be a recurring theme across stages.
- **[Decided] N2 (exclusive branches)** is accepted; where it goes is decided per stage.
- **[Superseded] N1 (Overdrive)**: dropped in favor of Overcharge growing faster while visible (3.3).
- The other mechanics are decided per stage (sections 3-6).

---

## 2. Player activity model

| State | Production | Overcharge | Auto-buy / auto-warp | Manual actions |
|---|---|---|---|---|
| Watching (tab visible) | yes | grows | yes, once unlocked | yes |
| Tab hidden (other tab, minimized) | yes | grows | **paused** | n/a |
| Game closed | yes, credited on return (uncapped) | grows (credited on return) | **paused** | n/a |

- **[Decided]** The automation and accumulation rules above. **[Implemented]** for the Energy phase.
- **[Decided] 2.1**: In every stage, time-based progress (production, timers, Overcharge) continues while away; nothing is bought or chosen automatically.
- **[Decided] 2.2**: Returning players see a "while you were away" summary.

### Active vs idle **[Superseded]**

The earlier "active play gap" analysis (casual players matching active ones once automation was unlocked) is resolved by the new structure: Stage 1 is played once and mainly actively (3.6a), its choices are idle-vs-active (3.9), and Overcharge grows faster while visible (3.3).


---

## 3. Stage 1: Stellar Network (Energy)

Current code, for reference (the decisions below change it):

**Loop**: buy skill nodes with Energy, then warp to the next tier. Five tiers; each tier contains all nodes of the previous tier plus new ones (4, 6, 9, 13, 18 nodes). **[Implemented]**

- **Warp** (Tiers 1 to 4): requires all nodes maxed plus an Energy requirement. Resets Energy and nodes, grants ×2 production for the rest of the run, and moves to the next tier. **[Implemented]**
- **Transcend** (Tier 5): same requirements; returns to Tier 1 and pays out Stellar Cores and Echo Fragments (section 4). **[Implemented]**
- **Overcharge**: once every Tier 5 node is maxed, production grows ×(1 + t/60 s)². Resets on transcend; keeps growing while away. **[Implemented]**
- Nodes are almost all flat multipliers (×1.2 to ×1.7 per level), plus one production node. **[Implemented]**
- The first loop takes about 25 to 40 min for an active player; later tiers are no longer faster than earlier ones. **[Implemented]**

- **[Decided] 3.1 Choices**: no option may be clearly better. Options should play differently, and every path should reach the next milestone within about ±10% of the others in the simulator. Auto-buy never chooses for you.
- **[Decided] 3.2 Archetypes**: choices combine into synergies; a "pure" path (same theme) and a "hybrid" path (all themes) unlock different capstones.
- **[Decided] 3.3 Overcharge grows faster while the game is visible** (diminishing returns stay). There is a point where waiting stops paying, which encourages actively moving on. N1 Overdrive is dropped.
- **[Decided] 3.4 Structure: A (tier identity) + B (warp destinations).** Choices from 3.1 happen at the warp; archetypes from 3.2 come from the path.
  - Later, side note: **E. Challenges** (optional restricted runs with permanent rewards).

### Stage 1 sketch **[Proposed]**

- **Tier 1**: a fixed 4-node core tree, no choices (tutorial).
- **Each warp** (1→2 … 4→5): choose one of **2 destinations**. The chosen expansion grows onto the tree for the rest of the run. Earlier nodes stay, and their levels reset on warp as before. The run's choices form its **path**.
- **Themes** (each tier has its own content per theme):

| Theme | Playstyle | Example nodes |
|---|---|---|
| Nebula (growth) | Big multipliers, steeper costs | ×1.6 nodes, high caps |
| Pulsar (speed) | Cheaper nodes, lower warp requirements, faster runs | Discounts, requirement cuts |
| Binary (synergy) | Nodes scaling with other nodes | Per-maxed-node bonuses, boosting pairs |

- **Tier rules (A)**: T2 first destination; T3 synergy nodes reacting to the path; T4 neighbor bonuses; T5 capstone by archetype (pure: 3+ picks of one theme; hybrid: all three themes; mixed: otherwise), then Overcharge.
- **Balance**: all 16 paths within about ±10% (simulator).
- **Size**: about 3 nodes per theme per tier, about 36 expansion nodes (today the tiers add 14).

- **[Decided] 3.5**: Nebula / Pulsar / Binary are fine for now. Use proper nouns and thematic words sparingly; names can change later.
- **[Decided] 3.7**: The map shows every path of the run in advance so players can plan.
- **[Decided] 3.8**: **Two options per warp** (16 paths per run). Each warp offers two of the three themes; the map shows which.
- **[Decided] 3.6a**: Stage 1 is mainly active play: buying and warping by hand.
- **[Decided] 3.6b**: **Stage 2 is reworked (option 4)**. After the first transcend, the Stellar Network becomes a background generator, and Stage 2 has its own tree. Players return to Stage 1 to run new paths.
  - **[Decided]** Beating Stage 1 grants a **flat Energy production** in the background. There is no path collection (busy-work trial and error) and no up-front numbers per path (they would remove the choice). The map shows destinations (3.7), but not which path is best.
  - **[Decided] 3.9**: **Stage 1 is played once, not replayed.** The warp choices are between **idle and active play**, so decisions matter through how you want to play Stage 1. This works because Stage 1 is comparatively short.
  - **[Decided] 3.10**: The reward for beating Stage 1 is fixed: **+1/s of Stage 2's currency** (stage chain, pillar 10). Stage 1 is beaten by reaching its Energy target (completing Tier 5).

### Consequences of 3.9 / 3.10 **[Proposed]**

- **Warp choices = idle vs active**: each warp offers an idle-leaning and an active-leaning expansion. Idle example: production that grows while away. Active example: bonuses that grow while visible.
- **Archetypes**: pure idle, pure active and hybrid paths unlock different capstones.
- **Balance rule** (replaces "all paths within ±10%"): each option is clearly better for its own play style; each path gets its matching player through Stage 1 in a similar time.
- **The Nebula / Pulsar / Binary themes are replaced** by idle / active.
- **[Decided] 3.11**: **Overcharge becomes an idle-path option** (one of the warp choices), growing faster while visible (3.3).
- Record-based Stellar Cores/Echo Fragments and the current Stellar Nexus are replaced by the new Stage 2/3 designs.

### Stage 1 content (v2) **[Decided]**

v1 (timers: "time since last purchase" / "purchases in the last 60 s") was rejected as too complicated.

#### The idea

- **Active play** buys almost as soon as something is affordable. It is naturally stronger: buying sooner means producing more sooner.
- **Idle play** spends currency every once in a while. Its options must **offset the delay**, so idle play is somewhat comparable.
- No timers. Every effect depends on something visible right now.

#### The two themes

| | **Saver** (idle) | **Spender** (active) |
|---|---|---|
| Rewards | Holding Energy and buying in big batches | Buying often, in many small steps |
| Core mechanic | **Interest**: production bonus based on unspent Energy | **Fine steps**: nodes with many cheap levels; bonuses per level bought |
| Example | +10% production per order of magnitude of Energy held | A node with 25 levels of ×1.05 instead of 5 levels of ×1.28 |
| Second mechanic | **Bulk discount**: buying several levels at once costs less per level ("Buy max" button) | **Level count**: +x% production per node level bought this tier |

Why this balances: an idle player holds a lot of Energy between check-ins (big Interest bonus), then spends it all at once (Bulk discount). An active player holds almost nothing, so Interest does little, but gets every cheap level the moment it is affordable.

#### Per tier (same tier rules as before)

| Tier | Rule | Saver option | Spender option |
|---|---|---|---|
| 1 | Fixed core, no choice | – | – |
| 2 | First choice | Interest node + bulk discount | Fine-step multiplier + level-count node |
| 3 | Path synergies | Interest stronger per Saver choice | Level-count stronger per Spender choice |
| 4 | Neighbor bonuses | Connected nodes count Energy held ×2 for Interest | Connected nodes get +5 cheap levels |
| 5 | Final choice | Overcharge (decided as the idle option) | Fine-step capstone node |

**Capstone** (shown on the map from the start):

| Path | Capstone |
|---|---|
| 3-4 Saver | Interest counts double |
| 3-4 Spender | Every level bought makes all nodes 1% cheaper (this tier) |
| 2 + 2 | Both effects at +50% |

#### Balance targets **[Proposed]**

- Active player on a Spender path: about **45 min**.
- Idle player (checks in every 45 min) on a Saver path: about **3 h** (today: 15 h).
- Mismatched paths noticeably slower; active play stays faster overall.

#### Open questions

- **[Decided] 3.12**: Saver (Interest + Bulk discount) vs Spender (Fine steps + Level count).
- **[Decided] 3.13**: Overcharge stays as Tier 5's Saver option.
- **[Decided] 3.15 (revised)**: **No mixed paths.** Saver or Spender is chosen once, at the first warp; Tiers 3-5 automatically deepen that theme (no further choices). Only two paths exist; the Balanced capstone is removed.
- **[Decided] 3.14 (revised)**: The idle target is raised (the 3 h target was not reachable because every warp resets Energy). Active target stays about 45 min.
- **Interest** measures Energy held in **minutes of production**: active players hold little, idle players hold a lot. (Measuring orders of magnitude held did not separate the play styles.)

#### Current balance (simulator)

| Path | Active (acts every 5 s) | Idle (checks every 45 min) |
|---|---|---|
| Spender | **47 min** | 13.5 h |
| Saver | 1.6 h | **12.75 h** |

- Spender is clearly better for active play (2×).
- Saver is only slightly better for idle play (about 6%). Idle play is limited by rebuilding each tier from zero: production climbs about 2-3 orders of magnitude per check-in, so every tier needs 3-4 check-ins regardless of theme.
- **[Open] 3.16**: Accept this, or reduce how many check-ins a tier needs (fewer or cheaper levels per tier, or keeping part of the tree's levels on warp)?

---

## 4. Stage 2 (replaces Transcendence and the Stellar Nexus)

- **[Decided] 4.1**: Stage 2 runs on **its own currency** (name TBD), starting at +1/s from beating Stage 1 (stage chain). Energy becomes redundant.
- **[Decided] 4.3**: Stage 2 has **its own reset loop**.
- **[Decided] 4.2**: concept A (drafted tree), see below. Options considered:
  - **A. Drafted tree (roguelite)**: each step offers 3 nodes; you attach one. Every run's tree is different. "Supernova" resets it for a meta currency that adds node types or better offers.
  - **B. Orbits**: nodes sit on rotating rings and give bonuses when aligned. Fast rings give small, frequent bonuses; slow rings big, rare ones. Active players time locks or rotations. The reset unlocks rings.
  - **C. Twin trees in tension**: two opposing trees share one budget; their balance gives bonuses at certain ratios, and some nodes need you to lean hard to one side. "Rebalance" resets both for a meta currency.
  - **D. Living tree**: branch tips appear over time; you choose what grows and prune to redirect. A "season" ends the tree for a meta currency.
  - Recommendation: A, possibly with C's two node families inside the draft pool.
- **[Decided]** Concept **A (drafted tree)** is the direction, with the R1 + R2 reset below. It must be **balanced** (simulator), and the reset stays simple because later stages must escalate.

### Concept A detail **[Proposed]**

- **Loop**: start with a Core node. Pay Energy for a **draft**: see 3 node cards, attach one to a free slot (each node has 1-2 child slots). Draft cost rises per pick. Placed nodes level up with Energy like Stage 1. The only new ideas are random offers and placement.
- **Starting node pool** (about 8):

| Node | Effect |
|---|---|
| Generator | +Energy/s |
| Amplifier | ×2 to everything below it in its branch |
| Splitter | +1 child slot |
| Mirror | copies 50% of its parent's effect |
| Catalyst | drafts 10% cheaper |
| Seedling | grows over time (idle pick) |
| Spark | strong while you keep buying (active pick) |
| Keystone | big bonus if its branch has 5+ nodes |

- **Reset options**:
  - R1: a permanent multiplier based on the largest tree ever grown (record-based, one number).
  - R2: record milestones add new node types to the pool.
  - R3: keep one seed node into the next tree (saved for a later stage).
  - Recommendation: **R1 + R2**. The reset screen shows e.g. "Reset now: ×4.6 → ×6.1, next unlock at 30 nodes".
- **End of stage**: Stage 2's currency reaches its target (larger than Stage 1's); that starts Stage 3's currency at +1/s.
- **Complexity budget**: Stage 1 = buying + warp choice. Stage 2 adds drafting, placement and one reset number. Stage 3 can add a spending currency, seeds or interactions between stages.
- **[Decided] 4.4**: Yes, through the stage chain (pillar 10).

### Old Stage 2 (for reference, to be replaced)

- **Stellar Cores (SC)**: record-based. Total SC ever earned = 0.4 × (1 + log10(best Energy / 3.5e20))², times bonuses. Each transcend pays out the difference, so repeating short runs gives nothing. **[Implemented]**
- SC are spent in the **Stellar Nexus** (21 nodes, 72 SC in total) and also boost production by +100% per SC ever earned. **[Implemented]**
- **Automation**: auto-buy unlocks on the first warp (achievement); auto-warp (Tiers 1 to 4) unlocks after 5 warps. Transcending is always manual. **[Implemented]**
- The Nexus nodes "Automated Systems" and "Automated Warping" duplicate the achievement automation, so they're effectively dead purchases. **[Implemented]**

- **[Obsolete]** Questions about the old Nexus (automation source, Stellar Core strength) no longer apply.
- **[Proposed] 4.3**: Some Nexus branches become mutually exclusive choices (pillar 3, option B).

---

## 5. Stage 3 (to replace Dimensional Echoes)

- **[Decided]** Stage 1 running only once is fine: every later stage has its own prestige loop, so each stage is "played again" in its own way.
- **[Decided]** Stage 3 can build on Stage 2 or be a unique concept (still tree-like), with its own currency and reset.
- **[Decided] 5.0**: S5 (time instead of cost), then reshaped into your concept below. Options considered:
  - Building on Stage 2:
    - **S1. Grove**: 3 drafted trees at once; offers go to a tree of your choice; buy links between trees to share effects.
    - **S2. Seeds and fusion**: keep a few seed nodes through resets; fuse two maxed nodes into a stronger one (all recipes visible).
    - **S3. Build your own draft pool**: pick the cards in your pool before each run (deck-building).
  - New concepts:
    - **S4. Star life cycles**: stars age and go supernova, seeding 1-3 children; timing (age longer vs harvest early) is the choice.
    - **S5. Research over time**: nodes researched over time in parallel slots; planning the queue is the choice; each era offers one of two branches.
    - **S6. Roots**: a tree grows downward into a visible grid and taps deposits; choosing directions is the choice.
  - Recommendation: S2 (building on Stage 2) or S4 (new concept); keep S5 in reserve for Stage 4.
- **[Decided]** Stage 3 is built on the S5 idea (time instead of cost), using **your concept** below. The earlier S5 detail (slots, queues, Accelerate, era fork) is superseded.

### Stage 3 concept (your design) **[Decided]**

- Start with a **base node** that levels up on its own timer (a few seconds); each level takes a bit longer than the previous one.
- A node's levels give it a **speed boost in the next era**.
- **Era currency** on reset = **total levels of all nodes**.
- **New nodes unlock** when era currency reaches thresholds.

### Stage 3 decisions

- **[Decided] 5.5**: A node's speed boost comes from its **best level ever** (record).
- **[Decided] 5.6**: Era currency is **only an unlock threshold** (never spent).
- **[Decided] 5.7**: **The Stage 3 currency is the total level** of all nodes. Nodes generate nothing; no node effects, no Overclock. The stage is beaten when the total level in one era reaches the target, starting Stage 4's currency at +1/s.
- **[Decided] 5.8**: Nodes keep leveling while the game is closed.
- **[Decided] 5.9**: Unlock thresholds use era currency **accumulated over all resets**.

### More complexity for Stage 3

- **C1. Focus**: one chosen node levels ×2 as fast; switch freely. Active choice, no currency.
- **C2. Node rhythms**: "sprint" nodes level fast but slow down steeply; "steady" nodes are slow but slow down gently. All levels count equally (idle vs active built into the nodes).
- **C3. Unlock choice**: at each threshold, unlock one of two nodes (permanent, or revisited each era?).
- **C4. Tree dependency**: a child can't level beyond its parent's level.
- **C5. Reset preview** **[Decided]**: "Reset now: +412 era currency, next unlock at 1,000".
- **[Open, revisit later]** C1-C4. Stages are self-contained, so extra complexity can be added when Stage 3 is built and playtested.

### Old Stage 3: Dimensional Echoes (for reference, to be replaced)

- Unlocked when the Stellar Nexus is complete. **Echo Fragments (EF)** are record-based like SC: total EF = 74 × (1 + log10(best Energy / 1e32)). **[Implemented]**
- Five dimensions (Void, Crystal, Quantum, Temporal, Prism), each a small tree of 7 to 10 nodes. Unlock costs are 0/10/20/30/40 EF. **[Implemented]**
- Each maxed dimension adds about +7 to +12 orders of magnitude of production. Node costs are proportional to what a node adds, at a flat cost per level. Effects: production multipliers, "multiplier effects stronger", skill caps, Stellar Core gain, per-node synergies, and Prism's "all aspects". **[Implemented]**
- The dimension themes ("expensive with exponential returns", "time-based", "uncertainty") are only names; mechanically they're all the same. **[Implemented]**

- **[Obsolete]** Questions about the old dimensions (identities, how many) no longer apply.

---

## 6. Cosmic Collapse (second half)

- **[Decided]** Collapse is a **transformation, not a numbers reset**: stages already reset their own numbers. (Before, every layer boosted Energy until you could collapse; that structure no longer exists.)
- **[Decided] Option B**: after the last pre-Collapse stage, Collapse replays Stages 1-3 in a **quantum-transformed** form. Each transformed stage adds new mechanics (the "50% more mechanics" from section 1A) while staying familiar.
- **[Decided]** The old Quantum content is **dropped**: Quantum trees, Artifacts, Probability Forge (and their achievements).
- **Direction per transformed stage**:
  - **Stage 1'**: more complex, or simply much more content. **[Decided]**
  - **Stage 2'**: a more involved card system, possibly deck-building (see S3 idea). **[Decided]**
  - **Stage 3'**: decided once Stage 3's own complexity is settled. **[Open]**
- **[Decided] 6.1**: **One Collapse**: the turning point between the two halves. Further replays come from New Game+.
- **[Decided] 6.2**: Collapse grants nothing itself; the transformation is the reward.
- **[Decided] 6.3**: Escalation continues across Collapse: Stage 1' is longer and more complex than Stage 3, and so on.
- **[Decided] 6.4**: **Victory = beating Stage 3'** (the last transformed stage).

**Full structure**: Stage 1 → Stage 2 → Stage 3 → *Collapse* → Stage 1' → Stage 2' → Stage 3' → *Victory* → New Game+.

## 7. Achievements

- 65 achievements across several categories. Most rewards are small multipliers to one system (+5% to +25%); two unlock automation. **[Implemented]**
- Two achievements can't be earned, because the entanglement system they refer to doesn't exist. **[Implemented]**
- Some achievements reward being away ("Return after 8 hours offline", "+5% offline production"), which contradicts pillar 3. **[Implemented]**

- **[Decided]** No missable or conditional achievements (pillar 11); achievements of a stage come naturally while playing it.
- **[Decided] 7.1**: Achievements give **no gameplay bonuses** (cosmetic only).
- **[Decided] 7.2**: The achievement list is rebuilt for the new stages (old Quantum achievements dropped; nothing rewards being away, per pillar 3).

---

## 8. Economy principles (how balance works)

These explain the numbers; they're not player-facing.

1. **One source of truth**: formulas live in `economy.ts`, and the services and the simulator both use them. **[Implemented]**
2. **Feedback just below 1**: one order of magnitude of production should earn slightly less currency than it costs to buy that order again. Above 1, a phase runs away; well below 1, it stalls. **[Implemented]**
3. **No lump purchases**: saving for a big purchase stalls the loop, so unlocks and big nodes are kept cheap. **[Implemented]**
4. **Record-based meta currencies** with visible "next at" thresholds. **[Implemented]**
5. **Retune with the simulator after content changes.** Pacing is sensitive: a ±7% change in a currency scale can move a phase by about 2×. **[Implemented]**

---

## 9. Victory and New Game+

- **[Decided]** Victory = beating Stage 3' (section 6). After victory, the player can start New Game+.
- **[Decided] 9.1**: Each NG+ completion speeds up one stage by about **1.5× (timers/production)**, in order: NG+1 → Stage 1, NG+2 → Stage 2, NG+3 → Stage 3, NG+4 → Stage 1', NG+5 → Stage 2', NG+6 → Stage 3'.
- **[Decided] 9.2**: New Game+ **ends after NG+6**: the game is complete, and later replays grant no new perks.
- **[Decided] 9.3**: Achievements and eternal stats carry over; everything else starts fresh. NG+ has **no achievements of its own**.
- **[Decided] 9.4**: NG+ restarts from the normal (untransformed) Stage 1, so Collapse keeps its impact.

---

## 10. Presentation (UI and visuals)

From the initial review. Not yet discussed:

- Compact, queued achievement toasts instead of large yellow cards covering the tabs.
- Skill trees drawn as trees, with connection lines.
- A sticky resource bar on mobile.
- The Quantum page fitting all three trees.
- Integer formatting, log-scale progress bars, and labels for unlabelled multipliers.
- Starfield/nebula background and warp/collapse transitions.

- **[Decided] 10.1**: The UI needs a complete visual rebuild, done **after** the stages are rebuilt. Until then, UI is functional only.

---

## Remaining open questions

- **Stage 1 content**: the concrete nodes per tier and destination (drafted during implementation, reviewed before balancing).
- **5.x**: Extra Stage 3 complexity (C1-C4), revisit when built.
- **6**: Stage 3' design (after Stage 3 is settled), plus details of Stages 1' and 2'.
- Stage currency names (keep proper nouns sparse).
