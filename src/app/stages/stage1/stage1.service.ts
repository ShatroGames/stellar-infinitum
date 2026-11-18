import { Injectable, computed, signal } from '@angular/core';
import { Decimal } from '../../utils/numbers';
import { SkillNode, SkillTreeTier } from '../../models/skill-node.model';
import { SKILL_TREE_TIERS } from '../../models/skill-trees.config';
import { StageModule, SummaryValue } from '../../core/stage';
import {
  STAGE1_START_ENERGY, energyProduction, isUnlocked, skillCost, warpBonus, warpRequirement
} from '../../economy/stage1';

interface Stage1Save {
  tier: number;
  runBonus: number;
  energy: string;
  levels: Record<string, number>;
}

const FINAL_TIER = SKILL_TREE_TIERS.length;

/**
 * Stage 1: Stellar Network. Buy nodes with Energy, warp through five tiers by
 * hand, and beat the stage in Tier 5. Played once (docs/GAME_DESIGN.md, section 3).
 */
@Injectable({ providedIn: 'root' })
export class Stage1Service implements StageModule {
  readonly id = 'stage1' as const;
  readonly name = 'Stellar Network';
  readonly currencyName = 'Energy';

  readonly tier = signal(1);
  private readonly runBonus = signal(1);
  private readonly energy = signal(new Decimal(STAGE1_START_ENERGY));
  private readonly skillMap = signal(new Map<string, SkillNode>());

  readonly skills = computed(() => Array.from(this.skillMap().values()));
  readonly production = computed(() => energyProduction(this.skills(), this.runBonus()));
  readonly tierInfo = computed<SkillTreeTier>(() => SKILL_TREE_TIERS[this.tier() - 1]);
  readonly nextTierInfo = computed<SkillTreeTier | undefined>(() => SKILL_TREE_TIERS[this.tier()]);
  readonly requirement = computed(() => warpRequirement(this.tier()));
  readonly allMaxed = computed(() => this.skills().every(s => s.level >= s.maxLevel));
  readonly canWarp = computed(() => this.allMaxed() && this.energy().gte(this.requirement()));
  readonly isFinalTier = computed(() => this.tier() === FINAL_TIER);
  readonly prestigeBonus = computed(() => this.runBonus());

  constructor() {
    this.buildTier(1);
  }

  // --- StageModule -------------------------------------------------------------

  currency(): Decimal { return this.energy(); }
  rate(): Decimal { return this.production(); }
  target(): Decimal { return warpRequirement(FINAL_TIER); }
  isComplete(): boolean { return this.isFinalTier() && this.canWarp(); }

  start(): void {
    this.tier.set(1);
    this.runBonus.set(1);
    this.energy.set(new Decimal(STAGE1_START_ENERGY));
    this.buildTier(1);
  }

  tick(seconds: number): void {
    this.addEnergy(this.production().times(seconds));
  }

  advanceTime(seconds: number): void {
    this.addEnergy(this.production().times(seconds));
  }

  summary(): SummaryValue[] {
    return [{ label: 'Energy', value: this.energy() }];
  }

  serialize(): Stage1Save {
    const levels: Record<string, number> = {};
    this.skillMap().forEach((s, id) => (levels[id] = s.level));
    return { tier: this.tier(), runBonus: this.runBonus(), energy: this.energy().toString(), levels };
  }

  deserialize(data: unknown): void {
    const save = data as Partial<Stage1Save> | undefined;
    if (!save) return;
    const tier = Math.min(Math.max(1, save.tier ?? 1), FINAL_TIER);
    this.tier.set(tier);
    this.runBonus.set(save.runBonus ?? 1);
    this.energy.set(new Decimal(save.energy ?? STAGE1_START_ENERGY));
    this.buildTier(tier, save.levels ?? {});
  }

  // --- player actions ------------------------------------------------------------

  getSkill(id: string): SkillNode | undefined {
    return this.skillMap().get(id);
  }

  isUnlocked(id: string): boolean {
    const skill = this.skillMap().get(id);
    return !!skill && isUnlocked(skill, this.skillMap());
  }

  getUpgradeCost(id: string): Decimal {
    const skill = this.skillMap().get(id);
    return skill ? skillCost(skill, skill.level) : new Decimal(Infinity);
  }

  canUpgrade(id: string): boolean {
    const skill = this.skillMap().get(id);
    return !!skill && skill.level < skill.maxLevel && this.isUnlocked(id)
      && this.energy().gte(this.getUpgradeCost(id));
  }

  upgrade(id: string): boolean {
    if (!this.canUpgrade(id)) return false;
    const cost = this.getUpgradeCost(id);
    this.energy.update(e => e.minus(cost));
    this.skillMap.update(map => {
      const next = new Map(map);
      const skill = next.get(id)!;
      next.set(id, { ...skill, level: skill.level + 1 });
      return next;
    });
    return true;
  }

  /** Warp to the next tier (Tiers 1-4). Beating Tier 5 is handled by the stage service. */
  warp(): boolean {
    if (!this.canWarp() || this.isFinalTier()) return false;
    this.runBonus.update(b => b * warpBonus(this.tier()));
    this.tier.update(t => t + 1);
    this.energy.set(new Decimal(STAGE1_START_ENERGY));
    this.buildTier(this.tier());
    return true;
  }

  // --- internals -------------------------------------------------------------------

  private addEnergy(amount: Decimal): void {
    if (amount.gt(0)) this.energy.update(e => e.plus(amount));
  }

  private buildTier(tier: number, levels: Record<string, number> = {}): void {
    const map = new Map<string, SkillNode>();
    for (const config of SKILL_TREE_TIERS[tier - 1].skills) {
      map.set(config.id, {
        ...config,
        cost: new Decimal(config.cost),
        level: Math.min(levels[config.id] ?? 0, config.maxLevel),
      });
    }
    this.skillMap.set(map);
  }
}
