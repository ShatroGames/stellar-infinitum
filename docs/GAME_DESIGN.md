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
- **[Open] N1 (Overdrive)**: solves the active-play gap. During Overcharge there is nothing to buy, so watching gains nothing; Overdrive is bought only while watching. Alternatives: N14 Mastery, or Overcharge growing faster while visible.
- The other mechanics are decided per stage (sections 3-6).

---

## 2. Player activity model

| State | Production | Overcharge | Auto-buy / auto-warp | Manual actions |
|---|---|---|---|---|
| Watching (tab visible) | yes | grows | yes, once unlocked | yes |
| Tab hidden (other tab, minimized) | yes | grows | **paused** | n/a |
| Game closed | yes, credited on return (uncapped) | grows (credited on return) | **paused** | n/a |

- **[Decided]** The automation and accumulation rules above. **[Implemented]** for the Energy phase.
- **[Implemented]** The Quantum phase gets no offline progress (a closed tab earns nothing). This doesn't match the table.
- **[Open] 2.1**: Should closed-tab progress in the Quantum phase work the same way (Quanta accumulate, nothing is bought)?
- **[Open] 2.2**: Should returning players see a "while you were away" summary?

### Known gap: why active play isn't clearly better yet

The simulator shows a casual player (looking for 30 s every 15 min) reaching Collapse about as fast as an active one (25 h vs 26 h). Once automation is unlocked, a whole run (Tiers 1 to 5) completes within the 30 seconds of watching. After that, Tier 5 has nothing left to buy, and Overcharge grows whether or not anyone watches.

So pillar 3 needs **things worth doing while watching, during Overcharge**. Options:

- **[Proposed] A. Overdrive**: a repeatable Tier 5 upgrade, available during Overcharge, bought with Energy (×N production, cost rises steeply). Auto-buy buys it only while the game is visible, so watching keeps compounding. Idle time still fills Overcharge, but only active time keeps buying.
- **[Proposed] B. Choices, not clicks**: mutually exclusive Stellar Nexus or dimension options. Attentive players optimize better, but this doesn't reward attention over time.
- **[Proposed] C. Active-only boosts**: for example, Overcharge grows faster while visible.

- **[Open] 2.3**: Which of these (or something else)? My recommendation is A, possibly combined with B later.

---

## 3. Layer 0: Stellar Network (Energy)

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
- **Revisit in Stage 2**: concepts built for repeated runs (Overcharge, record-based Stellar Cores and Echo Fragments, the current Stellar Nexus). Overcharge could become an idle option in Stage 1.

---

## 4. Stage 2 (replaces Transcendence and the Stellar Nexus)

- **[Decided] 4.1**: Stage 2 runs on **its own currency** (name TBD), starting at +1/s from beating Stage 1 (stage chain). Energy becomes redundant.
- **[Decided] 4.3**: Stage 2 has **its own reset loop**.
- **[Open] 4.2**: What kind of tree is it? Concepts **[Proposed]**:
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

- **[Open] 4.1**: Where should automation come from: achievements (free, guaranteed) or Nexus purchases (a spending choice)? Whichever we don't pick should be replaced with something meaningful.
- **[Open] 4.2**: Is +100% production per SC ever earned the intended strength? It's the main reason later runs speed up.
- **[Proposed] 4.3**: Some Nexus branches become mutually exclusive choices (pillar 3, option B).

---

## 5. Stage 3 (to replace Dimensional Echoes)

- **[Decided]** Stage 1 running only once is fine: every later stage has its own prestige loop, so each stage is "played again" in its own way.
- **[Decided]** Stage 3 can build on Stage 2 or be a unique concept (still tree-like), with its own currency and reset.
- **[Open] 5.0**: Concepts **[Proposed]**. Each adds about one new idea:
  - Building on Stage 2:
    - **S1. Grove**: 3 drafted trees at once; offers go to a tree of your choice; buy links between trees to share effects.
    - **S2. Seeds and fusion**: keep a few seed nodes through resets; fuse two maxed nodes into a stronger one (all recipes visible).
    - **S3. Build your own draft pool**: pick the cards in your pool before each run (deck-building).
  - New concepts:
    - **S4. Star life cycles**: stars age and go supernova, seeding 1-3 children; timing (age longer vs harvest early) is the choice.
    - **S5. Research over time**: nodes researched over time in parallel slots; planning the queue is the choice; each era offers one of two branches.
    - **S6. Roots**: a tree grows downward into a visible grid and taps deposits; choosing directions is the choice.
  - Recommendation: S2 (building on Stage 2) or S4 (new concept); keep S5 in reserve for Stage 4.

### Old Stage 3: Dimensional Echoes (for reference, to be replaced)

- Unlocked when the Stellar Nexus is complete. **Echo Fragments (EF)** are record-based like SC: total EF = 74 × (1 + log10(best Energy / 1e32)). **[Implemented]**
- Five dimensions (Void, Crystal, Quantum, Temporal, Prism), each a small tree of 7 to 10 nodes. Unlock costs are 0/10/20/30/40 EF. **[Implemented]**
- Each maxed dimension adds about +7 to +12 orders of magnitude of production. Node costs are proportional to what a node adds, at a flat cost per level. Effects: production multipliers, "multiplier effects stronger", skill caps, Stellar Core gain, per-node synergies, and Prism's "all aspects". **[Implemented]**
- The dimension themes ("expensive with exponential returns", "time-based", "uncertainty") are only names; mechanically they're all the same. **[Implemented]**

- **[Open] 5.1**: Should each dimension get a real identity? Suggestions:
  - **Temporal**: makes Overcharge grow faster.
  - **Void**: boosts the ×2 warp bonus.
  - **Quantum**: a random bonus rolled each transcend.
  - **Crystal**: paired nodes where buying one locks out the other.
  - **Prism**: synergies across dimensions.
- **[Open] 5.2**: Keep all five dimensions, or cut to fewer, deeper ones?

---

## 6. Layer 3: Cosmic Collapse and the Quantum era

- **Collapse**: requires every dimension node maxed. It's one-way: everything before it is gone, and the game switches to the Quantum era. **[Implemented]** It's the ultimate prestige and changes the game fundamentally. **[Decided]**
- **Quanta** come from three trees (Matter, Energy, Time; 21 nodes) with additive production and multipliers, plus 7 synergies (node combinations). **[Implemented]**
- **Artifacts** unlock at 50M Quanta in total: three branches of 10 tiers, and only the highest tier of each branch counts. **[Implemented]**
- **Probability Forge** unlocks at 1e18 total Quanta with every artifact branch at tier 10:
  - Fate Tokens buy random pulls (100 outcomes in 5 rarities), and every pull multiplies Quanta production.
  - Fate Weights shift the odds (rarity shift, rerolls, pity, duplicate protection, streaks).
  - **[Implemented]**
- **Victory**: 1e170 total Quanta. Reaching it relies almost entirely on Forge pulls compounding (about 300 pulls). **[Implemented]**
- Quanta and the Forge multiplier still use plain JS numbers, which can overflow. **[Implemented]**
- No simulator coverage yet.

- **[Open] 6.1**: Does the Quantum era need prestige-like steps (bucket principle), or is it a final sprint where progress just accumulates?
- **[Open] 6.2**: Artifacts: keep the ladder, or turn them into a choice (equip N of M)?
- **[Open] 6.3**: Forge: should the multiplier come from distinct discoveries (a collection) rather than every pull? Which Fate Weights should we keep?
- **[Open] 6.4**: Victory threshold: where should it be, and what should the last hours feel like?

---

## 7. Achievements

- 65 achievements across several categories. Most rewards are small multipliers to one system (+5% to +25%); two unlock automation. **[Implemented]**
- Two achievements can't be earned, because the entanglement system they refer to doesn't exist. **[Implemented]**
- Some achievements reward being away ("Return after 8 hours offline", "+5% offline production"), which contradicts pillar 3. **[Implemented]**

- **[Decided]** No missable or conditional achievements (pillar 11); achievements of a stage come naturally while playing it.
- **[Open] 7.1**: Should achievements carry gameplay rewards at all, or be mostly cosmetic?
- **[Open] 7.2**: Cut or retheme the entanglement and offline achievements?

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

- **[Implemented]** At victory, the victory screen appears; you can keep playing. Eternal progress counts victories and survives a full reset.
- **[Decided]** New Game+ grants a small perk per completion. The early game speeds up first, and each further NG+ speeds up a later stage.
- **[Proposed]** NG+1 makes the first loop faster, NG+2 the Nexus phase, NG+3 Dimensions, NG+4 the Quantum era. Each is a modest boost (around 1.5 to 2× for that stage).
- **[Open] 9.1**: What carries over into NG+ (achievements? cosmetics?), and does it have an end?

---

## 10. Presentation (UI and visuals)

From the initial review. Not yet discussed:

- Compact, queued achievement toasts instead of large yellow cards covering the tabs.
- Skill trees drawn as trees, with connection lines.
- A sticky resource bar on mobile.
- The Quantum page fitting all three trees.
- Integer formatting, log-scale progress bars, and labels for unlabelled multipliers.
- Starfield/nebula background and warp/collapse transitions.

- **[Open] 10.1**: Is there a visual direction or reference you have in mind, and how high a priority is this compared with balance?

---

## Review order

We go through it one section at a time: 1 → 2 → 3 → 4 → 5 → 6 → 9 → 7 → 10. Decisions get tagged **[Decided]** here before any code changes.
