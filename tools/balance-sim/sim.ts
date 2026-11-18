/**
 * Balance simulator for the pre-collapse game.
 *
 * Plays the game headlessly with simple player profiles, using the real config
 * files and the shared formulas in src/app/economy/economy.ts, and reports how
 * long each milestone takes in game time.
 *
 *   npm run sim                 # both profiles
 *   npm run sim -- active       # one profile
 */
import { Decimal } from '../../src/app/utils/numbers';
import { SkillNode } from '../../src/app/models/skill-node.model';
import { SKILL_TREE_TIERS } from '../../src/app/models/skill-trees.config';
import { ASCENSION_TREE_NODES } from '../../src/app/models/ascension-tree.model';
import { DIMENSIONS, Dimension, DimensionNode } from '../../src/app/models/dimension.model';
import {
  AchievementEffects, DimensionEffects, NexusEffects, achievementEffects, dimensionEffects,
  echoFragmentTotal, energyProduction, nexusEffects, skillCapBonus, skillCost, stellarCoreTotal,
  warpRequirement, STELLAR_CORE_CURVE, ECHO_FRAGMENT_CURVE, OVERCHARGE, overchargeIntegral,
} from '../../src/app/economy/economy';

if (process.env['OC']) [OVERCHARGE.tau, OVERCHARGE.power] = process.env['OC'].split(',').map(Number);

// Curve overrides for tuning: CORE=scale,power[,start] EF=scale,power[,start]
for (const [env, curve] of [['CORE', STELLAR_CORE_CURVE], ['EF', ECHO_FRAGMENT_CURVE]] as const) {
  const v = process.env[env];
  if (v) {
    const [scale, power, start] = v.split(',').map(Number);
    Object.assign(curve, { scale, power }, start ? { start } : {});
  }
}

// ---------------------------------------------------------------------------
// Player profiles
// ---------------------------------------------------------------------------

interface Profile {
  name: string;
  /** Seconds between moments the player looks at the game and acts */
  checkInterval: number;
  /** Seconds the game stays visible after each check-in (automation only runs while visible) */
  visibleFor: number;
  /**
   * Overcharge time before transcending, as a multiple of the time the run took to
   * reach Overcharge (0 = transcend as soon as anything is gained)
   */
  dwell: number;
}

const PROFILES: Profile[] = [
  { name: 'active', checkInterval: 10, visibleFor: Infinity, dwell: Number(process.env['DWELL'] ?? 20) },
  { name: 'casual', checkInterval: 15 * 60, visibleFor: 30, dwell: 0 },
];

/** Auto-buy runs every 200ms and buys up to `bulkBuy` levels per run */
const AUTO_BUY_TICK = 0.2;
const MAX_HOURS = 3000;

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

class Sim {
  t = 0;
  tier = 1;
  runBonus = 1;
  runWarps = 0;
  totalWarps = 0;
  transcends = 0;
  runStart = 0;
  energy = new Decimal(10);
  skills: SkillNode[] = [];
  totalCores = 0;
  cores = 0;
  bestEnergy = new Decimal(0);
  nexus = new Set<string>();
  ef = 0;
  totalEf = 0;
  dims: Dimension[] = DIMENSIONS.map(d => ({ ...d, nodes: d.nodes.map(n => ({ ...n })) }));
  manualActions = 0;
  milestones: [string, number, number, number][] = [];
  private reached = new Set<string>();
  private lastRate = 0;

  // Cached derived values, refreshed by refresh()
  nx!: NexusEffects;
  dx!: DimensionEffects;
  ax!: AchievementEffects;
  production = new Decimal(0);

  constructor(public profile: Profile) {
    this.refresh();
    this.startTier();
  }

  achievementsUnlocked(): Set<string> {
    const ids = new Set<string>();
    const nexusDone = this.nexus.size === ASCENSION_TREE_NODES.length;
    const allDims = this.dims.every(d => d.unlocked);
    if (this.totalWarps >= 1) ids.add('tier1_complete');
    if (this.transcends > 0) ids.add('all_tiers_complete').add('tier5_complete');
    if (this.totalWarps >= 5) ids.add('warp_5');
    if (nexusDone) ids.add('ascension_all_complete');
    if (allDims) ids.add('all_dimensions_unlocked');
    if (this.transcends > 0 && nexusDone && allDims) ids.add('max_all_trees');
    if (this.totalCores >= 400) ids.add('stellar_400');
    if (this.transcends >= 100) ids.add('transcend_100');
    if (this.totalEf >= 5000) ids.add('echo_5000');
    return ids;
  }

  get autoBuy(): boolean { return this.nx.autoBuy || this.achievementsUnlocked().has('tier1_complete'); }
  get autoWarp(): boolean { return this.nx.autoWarp || this.achievementsUnlocked().has('warp_5'); }

  refresh(): void {
    this.nx = nexusEffects(this.nexus);
    this.ax = achievementEffects(this.achievementsUnlocked());
    this.dx = dimensionEffects(this.dims, this.ax.dimension);
    const cap = skillCapBonus(this.nx, this.dx);
    const config = SKILL_TREE_TIERS[this.tier - 1].skills;
    for (const s of this.skills) {
      const base = config.find(c => c.id === s.id);
      if (base) s.maxLevel = base.maxLevel + cap;
    }
    this.recalc();
  }

  recalc(): void {
    this.production = energyProduction(this.skills, {
      runPrestigeBonus: this.runBonus, runWarps: this.runWarps, totalCores: this.totalCores,
      nexus: this.nx, dims: this.dx, achievements: this.ax,
    });
  }

  startTier(): void {
    const cap = skillCapBonus(this.nx, this.dx);
    this.skills = SKILL_TREE_TIERS[this.tier - 1].skills.map(s => ({ ...s, level: 0, maxLevel: s.maxLevel + cap }));
    this.energy = new Decimal(this.nx.startingEnergy);
    this.recalc();
  }

  mark(name: string): void {
    if (this.reached.has(name)) return;
    this.reached.add(name);
    this.milestones.push([name, this.t, this.transcends, Decimal.max(this.bestEnergy, this.energy).log10().toNumber()]);
  }

  // --- skills --------------------------------------------------------------

  unlocked(s: SkillNode): boolean {
    return this.nx.unlockAll || s.prerequisites.every(id => {
      const p = this.skills.find(x => x.id === id)!;
      return p.level >= p.maxLevel;
    });
  }

  cheapestSkill(): { skill: SkillNode; cost: Decimal } | null {
    let best: { skill: SkillNode; cost: Decimal } | null = null;
    for (const s of this.skills) {
      if (s.level >= s.maxLevel || !this.unlocked(s)) continue;
      const cost = skillCost(s, s.level, this.nx, this.dx);
      if (!best || cost.lt(best.cost)) best = { skill: s, cost };
    }
    return best;
  }

  /** Buy cheapest-first; returns number of levels bought */
  buySkills(limit = Infinity): number {
    let bought = 0;
    while (bought < limit) {
      const c = this.cheapestSkill();
      if (!c || this.energy.lt(c.cost)) break;
      this.energy = this.energy.minus(c.cost);
      c.skill.level++;
      bought++;
    }
    if (bought) this.recalc();
    return bought;
  }

  allMaxed(): boolean { return this.skills.every(s => s.level >= s.maxLevel); }

  canWarp(): boolean {
    return this.allMaxed() && this.energy.gte(warpRequirement(this.tier, this.nx, this.dx));
  }

  // --- warping and transcending ------------------------------------------

  warp(): void {
    const prestigeBonus = SKILL_TREE_TIERS[this.tier - 1].prestigeBonus;
    this.totalWarps++;
    this.runWarps++;
    this.runBonus *= prestigeBonus;
    this.tier++;
    this.mark(`reach tier ${this.tier}`);
    this.refresh();
    this.startTier();
  }

  private best(): Decimal { return Decimal.max(this.bestEnergy, this.energy); }

  pendingCores(): number {
    return Math.max(0, stellarCoreTotal(this.best(), this.dx, this.ax) - this.totalCores);
  }

  pendingEf(): number {
    if (this.nexus.size !== ASCENSION_TREE_NODES.length) return 0;
    return Math.max(0, echoFragmentTotal(this.best(), this.ax) - this.totalEf);
  }

  transcend(): void {
    const cores = this.pendingCores();
    const ef = this.pendingEf();
    this.bestEnergy = this.best();
    this.cores += cores;
    this.totalCores += cores;
    this.ef += ef;
    this.totalEf += ef;
    this.transcends++;
    this.overchargeStart = null;
    this.lastRate = 0;
    this.mark('first transcend');
    this.tier = 1;
    this.runBonus = 1;
    this.runWarps = 0;
    this.runStart = this.t;
    this.spendCores();
    this.spendEf();
    this.refresh();
    this.startTier();
  }

  /** Reward value the player is chasing right now (EF once dimensions are open) */
  pendingReward(): number {
    return this.nexus.size === ASCENSION_TREE_NODES.length ? this.pendingEf() : this.pendingCores();
  }

  wantsTranscend(): boolean {
    if (this.tier !== 5 || !this.canWarp()) return false;
    if (this.pendingCores() + this.pendingEf() < 1) return false;
    if (this.overchargeStart === null) return false;
    const setup = this.overchargeStart - this.runStart;
    return this.t - this.overchargeStart >= Math.min(900, Math.max(60, this.profile.dwell * setup));
  }

  // --- spending meta currencies --------------------------------------------

  spendCores(): void {
    for (;;) {
      const options = ASCENSION_TREE_NODES.filter(n => !this.nexus.has(n.id) && n.cost <= this.cores
        && (n.requires ?? []).every(r => this.nexus.has(r)));
      if (!options.length) break;
      const node = options.reduce((a, b) => (b.cost < a.cost ? b : a));
      this.cores -= node.cost;
      this.nexus.add(node.id);
    }
    if (this.nexus.size === ASCENSION_TREE_NODES.length) this.mark('stellar nexus complete');
  }

  dimNodeCost(n: DimensionNode): number {
    return Math.floor(n.cost * Math.pow(n.costMultiplier, n.level));
  }

  dimNodeAvailable(d: Dimension, n: DimensionNode): boolean {
    return d.unlocked && n.level < n.maxLevel && n.prerequisites.every(id => {
      const p = d.nodes.find(x => x.id === id)!;
      return p.level >= p.maxLevel;
    });
  }

  spendEf(): void {
    for (;;) {
      let best: { cost: number; apply: () => void; label: string } | null = null;
      for (const d of this.dims) {
        if (!d.unlocked) {
          if (!best || d.unlockCost < best.cost) best = { cost: d.unlockCost, apply: () => { d.unlocked = true; }, label: `unlock ${d.id}` };
          continue;
        }
        for (const n of d.nodes) {
          if (!this.dimNodeAvailable(d, n)) continue;
          const cost = this.dimNodeCost(n);
          if (!best || cost < best.cost) best = { cost, apply: () => { n.level++; }, label: n.id };
        }
      }
      if (!best || best.cost > this.ef) {
        if (process.env['TRACE'] && best) this.trace(`waiting for ${best.label}: costs ${best.cost} EF, have ${this.ef}`);
        break;
      }
      this.ef -= best.cost;
      best.apply();
      if (process.env['TRACE']) this.trace(`bought ${best.label} (${best.cost} EF), production now 1e${this.production.log10().toNumber().toFixed(1)}`);
    }
    for (const d of this.dims) {
      if (d.unlocked) this.mark(`unlock ${d.id}`);
      if (d.unlocked && d.nodes.every(n => n.level >= n.maxLevel)) this.mark(`max ${d.id}`);
    }
  }

  trace(msg: string): void {
    console.log(`  [${(this.t / 3600).toFixed(2)}h] ${msg}`);
  }

  collapseReady(): boolean {
    // Mirrors CollapsePanel: all dimensions maxed
    return this.dims.every(d => d.nodes.every(n => n.level >= n.maxLevel));
  }

  // --- main loop ------------------------------------------------------------

  checkIn(): void {
    if (!this.autoBuy && this.buySkills() > 0) this.manualActions++;
    while (this.tier < 5 && this.canWarp() && !this.autoWarp) {
      this.warp();
      this.manualActions++;
      this.buySkills();
    }
    if (this.wantsTranscend()) {
      this.transcend();
      this.manualActions++;
    }
  }

  run(): void {
    let nextCheck = 0;
    let visibleUntil = 0;
    const limit = MAX_HOURS * 3600;
    while (this.t < limit && !this.collapseReady()) {
      if (this.t >= nextCheck - 1e-9) {
        this.checkIn();
        visibleUntil = this.t + this.profile.visibleFor;
        nextCheck = this.t + this.profile.checkInterval;
      }
      // Automation (only while the game is visible)
      const visible = this.t < visibleUntil;
      let boughtThisTick = 0;
      if (visible && this.autoBuy) boughtThisTick = this.buySkills(this.nx.bulkBuy);
      if (visible && this.autoWarp && this.tier < 5 && this.canWarp()) { this.warp(); continue; }
      if (boughtThisTick > 0) { this.advance(AUTO_BUY_TICK); continue; }

      // Jump to the next interesting moment
      let dt = nextCheck - this.t;
      if (visible) dt = Math.min(dt, visibleUntil - this.t);
      const rate = this.production;
      if (rate.gt(0)) {
        const target = this.nextTarget();
        if (target && visible && (this.autoBuy || this.autoWarp)) {
          const wait = target.minus(this.energy).div(rate).toNumber();
          if (wait > 0) dt = Math.min(dt, Math.max(AUTO_BUY_TICK, wait));
          else dt = Math.min(dt, AUTO_BUY_TICK);
        }
      }
      this.advance(Math.max(dt, 1e-3));
    }
  }

  /** Energy amount at which automation can do something new */
  nextTarget(): Decimal | null {
    if (!this.allMaxed()) return this.cheapestSkill()?.cost ?? null;
    if (this.tier < 5) return warpRequirement(this.tier, this.nx, this.dx);
    return null;
  }

  /** Time Overcharge started (Tier 5 with every skill maxed), or null */
  overchargeStart: number | null = null;

  advance(dt: number): void {
    if (this.overchargeStart === null && this.tier === 5 && this.allMaxed()) this.overchargeStart = this.t;
    if (this.overchargeStart !== null) {
      const t0 = this.t - this.overchargeStart;
      this.energy = this.energy.plus(this.production.times(overchargeIntegral(t0, t0 + dt)));
    } else {
      this.energy = this.energy.plus(this.production.times(dt));
    }
    this.t += dt;
  }
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function fmt(seconds: number): string {
  const h = seconds / 3600;
  return h < 1 ? `${(seconds / 60).toFixed(1)} min` : `${h.toFixed(2)} h`;
}

const wanted = process.argv.slice(2);
for (const profile of PROFILES.filter(p => !wanted.length || wanted.includes(p.name))) {
  const started = Date.now();
  const sim = new Sim(profile);
  sim.run();
  console.log(`\n=== ${profile.name} (checks every ${profile.checkInterval}s, dwell ${profile.dwell}x setup) ===`);
  for (const [name, t, tr, logE] of sim.milestones) {
    console.log(`${fmt(t).padStart(10)}  ${name.padEnd(26)} (transcends: ${tr}, best energy 1e${logE.toFixed(1)})`);
  }
  const done = sim.collapseReady();
  console.log(`${fmt(sim.t).padStart(10)}  ${done ? 'COLLAPSE READY' : 'stopped at time limit'}`);
  console.log(`  transcends ${sim.transcends}, warps ${sim.totalWarps}, manual actions ${sim.manualActions}, ` +
    `cores ${sim.totalCores}, EF earned ${sim.totalEf}  [${((Date.now() - started) / 1000).toFixed(1)}s]`);
}
