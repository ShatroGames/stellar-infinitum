import { Injectable, computed, signal } from '@angular/core';
import { Decimal } from '../../utils/numbers';
import { SkillNode } from '../../models/skill-node.model';
import { StageModule, SummaryValue } from '../../core/stage';
import { CAPSTONES, EXPANSIONS, Expansion, TIERS, Theme } from '../../economy/stage1-content';
import * as eco from '../../economy/stage1';

interface Stage1Save {
  tier: number;
  path: Theme[];
  levels: Record<string, number>;
  energy: string;
  runBonus: number;
  overchargeTime: number;
}

/**
 * Stage 1: Stellar Network. Buy nodes with Energy, choose Saver or Spender at
 * each warp, and beat the stage in Tier 5. Played once (docs/GAME_DESIGN.md, section 3).
 */
@Injectable({ providedIn: 'root' })
export class Stage1Service implements StageModule {
  readonly id = 'stage1' as const;
  readonly name = 'Stellar Network';
  readonly currencyName = 'Energy';

  private readonly state = signal<eco.Stage1State>(eco.initialState());

  readonly tier = computed(() => this.state().tier);
  readonly path = computed(() => this.state().path);
  readonly nodes = computed(() => eco.buildTree(this.state().tier, this.state().path));
  readonly skills = computed<SkillNode[]>(() => {
    const state = this.state();
    const nodes = this.nodes();
    return nodes.map(n => ({
      id: n.id, name: n.name, description: n.description,
      level: eco.level(state, n.id), maxLevel: eco.maxLevel(n, nodes, state),
      cost: new Decimal(n.cost), costMultiplier: n.costMultiplier,
      unlocked: eco.isUnlocked(n, nodes, state), prerequisites: n.requires,
      position: n.position, effect: { type: n.type, value: n.value },
    }));
  });
  readonly production = computed(() => eco.production(this.nodes(), this.state()));
  readonly tierInfo = computed(() => TIERS[this.state().tier - 1]);
  readonly nextTierInfo = computed(() => TIERS[this.state().tier]);
  readonly requirement = computed(() => eco.requirement(this.state().tier));
  readonly allMaxed = computed(() => eco.allMaxed(this.nodes(), this.state()));
  readonly canWarp = computed(() => eco.canWarp(this.nodes(), this.state()));
  readonly isFinalTier = computed(() => this.state().tier === eco.FINAL_TIER);
  readonly prestigeBonus = computed(() => this.state().runBonus);
  readonly isOvercharging = computed(() => eco.isOvercharging(this.nodes(), this.state()));
  readonly overchargeMultiplier = computed(() => eco.overchargeMultiplier(this.state().overchargeTime));
  readonly interestBonus = computed(() => eco.interestBonus(this.nodes(), this.state()));
  readonly tallyBonus = computed(() => eco.tallyBonus(this.nodes(), this.state()));
  /** Theme chosen at the first warp (null in Tier 1) */
  readonly theme = computed(() => eco.chosenTheme(this.state()));
  /** Expansions offered at the next warp: both themes at the first warp, then your theme only */
  readonly nextChoices = computed<Expansion[] | null>(() => {
    const next = EXPANSIONS[this.state().tier + 1];
    if (!next) return null;
    const theme = this.theme();
    return theme ? [next[theme]] : [next.saver, next.spender];
  });
  /** Capstone that applies in Tier 5 */
  readonly capstone = computed(() => {
    const arch = eco.archetype(this.state());
    return arch ? { archetype: arch, ...CAPSTONES[arch] } : null;
  });

  // --- StageModule -------------------------------------------------------------

  currency(): Decimal { return this.state().energy; }
  rate(): Decimal { return this.production(); }
  target(): Decimal { return eco.requirement(eco.FINAL_TIER); }
  isComplete(): boolean { return this.isFinalTier() && this.canWarp(); }

  start(): void {
    this.state.set(eco.initialState());
  }

  tick(seconds: number, visible: boolean): void {
    this.mutate(s => eco.advance(this.nodes(), s, seconds, visible));
  }

  advanceTime(seconds: number): void {
    this.mutate(s => eco.advance(this.nodes(), s, seconds, false));
  }

  summary(): SummaryValue[] {
    return [{ label: 'Energy', value: this.state().energy }];
  }

  serialize(): Stage1Save {
    const s = this.state();
    return { tier: s.tier, path: s.path, levels: s.levels, energy: s.energy.toString(),
      runBonus: s.runBonus, overchargeTime: s.overchargeTime };
  }

  deserialize(data: unknown): void {
    const save = data as Partial<Stage1Save> | undefined;
    if (!save || !Array.isArray(save.path)) return;
    const tier = Math.min(Math.max(1, save.tier ?? 1), eco.FINAL_TIER);
    this.state.set({
      tier,
      path: save.path.slice(0, tier - 1),
      levels: { ...(save.levels ?? {}) },
      energy: new Decimal(save.energy ?? eco.STAGE1_START_ENERGY),
      runBonus: save.runBonus ?? 1,
      overchargeTime: save.overchargeTime ?? 0,
    });
  }

  // --- player actions ------------------------------------------------------------

  getSkill(id: string): SkillNode | undefined {
    return this.skills().find(s => s.id === id);
  }

  isUnlocked(id: string): boolean {
    return this.getSkill(id)?.unlocked ?? false;
  }

  getUpgradeCost(id: string): Decimal {
    const node = this.nodes().find(n => n.id === id);
    return node ? eco.cost(node, eco.level(this.state(), id), this.nodes(), this.state()) : new Decimal(Infinity);
  }

  canUpgrade(id: string): boolean {
    const node = this.nodes().find(n => n.id === id);
    return !!node && eco.canBuy(node, this.nodes(), this.state());
  }

  upgrade(id: string): boolean {
    const node = this.nodes().find(n => n.id === id);
    if (!node) return false;
    let bought = false;
    this.mutate(s => (bought = eco.buy(node, this.nodes(), s)));
    return bought;
  }

  /** Buy the cheapest affordable levels until nothing is affordable (bulk discount applies) */
  buyAll(): number {
    let bought = 0;
    this.mutate(s => (bought = eco.buyAll(this.nodes(), s)));
    return bought;
  }

  /** Warp to the next tier; the theme only matters at the first warp */
  warp(theme: Theme): boolean {
    if (!this.canWarp() || this.isFinalTier()) return false;
    this.state.set(eco.warp(this.state(), theme));
    return true;
  }

  private mutate(change: (s: eco.Stage1State) => void): void {
    const current = this.state();
    const copy: eco.Stage1State = { ...current, path: [...current.path], levels: { ...current.levels } };
    change(copy);
    this.state.set(copy);
  }
}
