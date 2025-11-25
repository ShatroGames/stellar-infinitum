import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { SkillNode, PrestigeData, SkillTreeTier } from '../models/skill-node.model';
import { SKILL_TREE_TIERS } from '../models/skill-trees.config';
import { GameService } from './game.service';
import { AscensionService } from './ascension.service';
import { DimensionService } from './dimension.service';
import { SaveManagerService } from './save-manager.service';
import { AchievementService } from './achievement.service';
import { Decimal } from '../utils/numbers';
@Injectable({
  providedIn: 'root'
})
export class SkillTreeService {
  private gameService = inject(GameService);
  private ascensionService = inject(AscensionService);
  private dimensionService = inject(DimensionService);
  private injector = inject(Injector);
  private saveManager = inject(SaveManagerService);
  private skills = signal<Map<string, SkillNode>>(new Map());
  private _achievementService: AchievementService | null = null;
  private get achievementService(): AchievementService | null {
    if (!this._achievementService) {
      try {
        this._achievementService = this.injector.get(AchievementService, null, { optional: true });
      } catch (e) {
        return null;
      }
    }
    return this._achievementService;
  }
  private prestige = signal<PrestigeData>({
    currentTier: 1,
    totalAscensions: 0,
    currentRunAscensions: 0,
    totalPrestigeBonus: 1,
    currentRunPrestigeBonus: 1,
    tierCompletions: new Map()
  });
  private productionCache: { value: number; timestamp: number } | null = null;
  private readonly PRODUCTION_CACHE_MS = 50; // Cache production for 50ms
  private costCache: Map<string, { cost: Decimal; level: number }> = new Map();
  currentTier = computed(() => this.prestige().currentTier);
  totalAscensions = computed(() => this.prestige().currentRunAscensions);
  allTimeAscensions = computed(() => this.prestige().totalAscensions);
  prestigeBonus = computed(() => this.prestige().currentRunPrestigeBonus);
  getPrestigeData = computed(() => this.prestige());
  potentialEchoFragments = computed(() => {
    if (!this.ascensionService.isTreeComplete() || this.prestige().currentTier !== 5) {
      return 0;
    }
    const currentEnergy = this.gameService.getResource('knowledge')?.amount || new Decimal(0);
    return this.calculateEchoFragments(currentEnergy);
  });
  constructor() {
    this.loadPrestige();
    this.initializeSkillTree();
    this.loadSkills();
    this.applyPrestigeBonus();
    setInterval(() => {
      this.autoBuySkills(this.ascensionService);
      if (this.achievementService?.hasAutoWarp() && this.canAscend()) {
        if (this.prestige().currentTier < 5) {
          this.ascend(this.ascensionService);
        }
      }
    }, 200); // Run every 200ms instead of 100ms
  }
  private initializeSkillTree(): void {
    const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
    if (!currentTierData) return;
    const skillMap = new Map<string, SkillNode>();
    currentTierData.skills.forEach(skill => {
      let maxLevel = skill.maxLevel;
      maxLevel += this.ascensionService.skillCapIncrease();
      maxLevel += this.dimensionService.totalSkillCapIncrease();
      skillMap.set(skill.id, { 
        ...skill,
        maxLevel,
        cost: new Decimal(skill.cost)
      });
    });
    this.skills.set(skillMap);
  }
  getSkills() {
    return this.skills.asReadonly();
  }
  getSkill(id: string): SkillNode | undefined {
    return this.skills().get(id);
  }
  canUpgrade(skillId: string): boolean {
    const skill = this.skills().get(skillId);
    if (!skill || !skill.unlocked || skill.level >= skill.maxLevel) {
      return false;
    }
    const cost = this.getUpgradeCost(skillId);
    return this.gameService.canAfford('knowledge', cost);
  }
  getUpgradeCost(skillId: string): Decimal {
    const skill = this.skills().get(skillId);
    if (!skill) return new Decimal(0);
    const cached = this.costCache.get(skillId);
    if (cached && cached.level === skill.level) {
      return cached.cost;
    }
    let cost = skill.cost.times(Decimal.pow(skill.costMultiplier, skill.level)).floor();
    const ascensionReduction = this.ascensionService.costReduction();
    if (ascensionReduction > 0) {
      cost = cost.times(1 - ascensionReduction);
    }
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    if (prismBonus > 0) {
      cost = cost.times(1 - prismBonus);
    }
    this.costCache.set(skillId, { cost, level: skill.level });
    return cost;
  }
  upgradeSkill(skillId: string): boolean {
    if (!this.canUpgrade(skillId)) {
      return false;
    }
    const skill = this.skills().get(skillId);
    if (!skill) return false;
    const cost = this.getUpgradeCost(skillId);
    if (this.gameService.spend('knowledge', cost)) {
      this.costCache.delete(skillId);
      this.skills.update(skillMap => {
        const newMap = new Map(skillMap);
        const updatedSkill = { ...skill, level: skill.level + 1 };
        newMap.set(skillId, updatedSkill);
        return newMap;
      });
      this.applySkillEffect(skill);
      this.checkUnlocks();
      this.saveSkills();
      return true;
    }
    return false;
  }
  private applySkillEffect(skill: SkillNode): void {
    this.recalculateProduction();
  }
  updateSkillMaxLevels(): void {
    this.skills.update(skillMap => {
      const updatedMap = new Map(skillMap);
      const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
      if (!currentTierData) return skillMap;
      const ascensionBonus = this.ascensionService.skillCapIncrease();
      const dimensionBonus = this.dimensionService.totalSkillCapIncrease();
      currentTierData.skills.forEach(configSkill => {
        const existingSkill = updatedMap.get(configSkill.id);
        if (existingSkill) {
          const newMaxLevel = configSkill.maxLevel + ascensionBonus + dimensionBonus;
          if (existingSkill.maxLevel !== newMaxLevel) {
            updatedMap.set(configSkill.id, {
              ...existingSkill,
              maxLevel: newMaxLevel
            });
          }
        }
      });
      return updatedMap;
    });
  }
  recalculateProduction(): void {
    this.productionCache = null;
    let baseProduction = 0;
    this.skills().forEach(skill => {
      if (skill.effect.type === 'production' && skill.effect.resource === 'knowledge') {
        baseProduction += skill.effect.value * skill.level;
      }
    });
    let totalMultiplier = 1;
    this.skills().forEach(skill => {
      if (skill.effect.type === 'multiplier' && skill.effect.resource === 'knowledge') {
        let effectValue = skill.effect.value;
        const multiplierBoost = this.ascensionService.multiplierBoost();
        if (multiplierBoost > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + multiplierBoost);
        }
        const dimensionMultiplierPower = this.dimensionService.totalMultiplierPower();
        if (dimensionMultiplierPower > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + dimensionMultiplierPower);
        }
        const prismBonus = this.dimensionService.prismAllAspectsBonus();
        if (prismBonus > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + prismBonus);
        }
        totalMultiplier *= Math.pow(effectValue, skill.level);
      }
    });
    const prestigeBonus = this.prestige().currentRunPrestigeBonus;
    totalMultiplier *= prestigeBonus;
    const productionBoost = this.ascensionService.productionBoost();
    if (productionBoost > 0) {
      totalMultiplier *= (1 + productionBoost);
    }
    const globalMultiplier = this.ascensionService.globalMultiplier();
    totalMultiplier *= globalMultiplier;
    const skillEfficiencyBonus = this.ascensionService.skillEfficiencyBonus();
    if (skillEfficiencyBonus > 0) {
      const maxedSkills = Array.from(this.skills().values()).filter(
        skill => skill.level >= skill.maxLevel
      ).length;
      if (maxedSkills > 0) {
        totalMultiplier *= (1 + skillEfficiencyBonus * maxedSkills);
      }
    }
    const stellarCoreMult = this.ascensionService.stellarCoreMult();
    if (stellarCoreMult > 0) {
      const stellarCores = this.ascensionService.totalPoints();
      if (stellarCores > 0) {
        totalMultiplier *= (1 + stellarCoreMult * stellarCores);
      }
    }
    const warpMomentumBonus = this.ascensionService.warpMomentumBonus();
    if (warpMomentumBonus > 0) {
      const warpsThisRun = this.prestige().currentRunAscensions;
      if (warpsThisRun > 0) {
        totalMultiplier *= (1 + warpMomentumBonus * warpsThisRun);
      }
    }
    const dimensionProductionBonus = this.dimensionService.totalProductionBonus();
    totalMultiplier *= dimensionProductionBonus;
    const dimensionCrossDimensionBonus = this.dimensionService.crossDimensionBonus();
    totalMultiplier *= dimensionCrossDimensionBonus;
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    if (prismBonus > 0) {
      totalMultiplier *= (1 + prismBonus);
    }
    const finalProduction = baseProduction * totalMultiplier;
    this.productionCache = {
      value: finalProduction,
      timestamp: Date.now()
    };
    this.gameService.setProductionRate('knowledge', finalProduction);
  }
  private checkUnlocks(): void {
    this.skills.update(skillMap => {
      let hasChanges = false;
      const newMap = new Map(skillMap);
      newMap.forEach((skill, id) => {
        if (!skill.unlocked && this.canUnlock(skill)) {
          const updatedSkill = { ...skill, unlocked: true };
          newMap.set(id, updatedSkill);
          hasChanges = true;
        }
      });
      return hasChanges ? newMap : skillMap; // Only return new map if there were changes
    });
  }
  private canUnlock(skill: SkillNode): boolean {
    if (this.ascensionService.hasUnlockAll()) {
      return true;
    }
    return skill.prerequisites.every(prereqId => {
      const prereq = this.skills().get(prereqId);
      return prereq && prereq.level >= prereq.maxLevel;
    });
  }
  autoBuySkills(ascensionService?: any): void {
    if (!this.achievementService?.hasAutoBuy()) {
      return;
    }
    const bulkAmount = ascensionService?.bulkBuyAmount() || 1;
    let purchasesMade = 0;
    let shouldSave = false;
    const affordableSkills = Array.from(this.skills().values())
      .filter(skill => this.canUpgrade(skill.id))
      .sort((a, b) => {
        const costA = this.getUpgradeCost(a.id);
        const costB = this.getUpgradeCost(b.id);
        return costA.cmp(costB);
      });
    const updates: Map<string, SkillNode> = new Map();
    for (const skill of affordableSkills) {
      let currentSkill = skill;
      let bought = 0;
      while (bought < bulkAmount && currentSkill.level < currentSkill.maxLevel) {
        let cost = currentSkill.cost.times(Decimal.pow(currentSkill.costMultiplier, currentSkill.level)).floor();
        const reduction = this.ascensionService.costReduction();
        if (reduction > 0) {
          cost = cost.times(1 - reduction);
        }
        if (this.gameService.canAfford('knowledge', cost) && this.gameService.spend('knowledge', cost)) {
          currentSkill = { ...currentSkill, level: currentSkill.level + 1 };
          updates.set(skill.id, currentSkill);
          bought++;
          shouldSave = true;
        } else {
          break;
        }
      }
      purchasesMade += bought;
      if (purchasesMade >= bulkAmount) break;
    }
    if (updates.size > 0) {
      updates.forEach((skill, id) => this.costCache.delete(id));
      this.skills.update(skillMap => {
        const newMap = new Map(skillMap);
        updates.forEach((skill, id) => {
          newMap.set(id, skill);
        });
        return newMap;
      });
      this.recalculateProduction();
      this.checkUnlocks();
      this.saveSkills();
    }
  }
  saveSkills(): void {
    const minimalSkills = Array.from(this.skills().entries())
      .map(([id, skill]) => ({
        id,
        level: skill.level,
        unlocked: skill.unlocked
      }));
    this.saveManager.scheduleSave('skills', () => {
      localStorage.setItem('treefinite_skills', JSON.stringify(minimalSkills));
    });
  }
  loadSkills(): void {
    const saved = localStorage.getItem('treefinite_skills');
    if (saved) {
      try {
        const savedSkills = JSON.parse(saved);
        const currentTier = SKILL_TREE_TIERS[this.prestige().currentTier - 1];
        const skillMap = new Map<string, SkillNode>();
        currentTier.skills.forEach(configSkill => {
          const savedSkill = savedSkills.find((s: any) => s.id === configSkill.id);
          skillMap.set(configSkill.id, {
            ...configSkill,
            level: savedSkill?.level ?? 0,
            unlocked: savedSkill?.unlocked ?? configSkill.unlocked
          });
        });
        this.skills.set(skillMap);
        this.recalculateProduction();
      } catch (e) {
        console.error('Failed to load skills:', e);
      }
    }
  }
  loadPrestige(): void {
    const saved = localStorage.getItem('treefinite_prestige');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.prestige.set({
          ...data,
          tierCompletions: new Map(data.tierCompletions)
        });
      } catch (e) {
        console.error('Failed to load prestige:', e);
      }
    }
  }
  savePrestige(): void {
    const data = {
      ...this.prestige(),
      tierCompletions: Array.from(this.prestige().tierCompletions.entries())
    };
    this.saveManager.scheduleSave('prestige', () => {
      localStorage.setItem('treefinite_prestige', JSON.stringify(data));
    });
  }
  canAscend(): boolean {
    const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
    if (!currentTierData) return false;
    let requiredPoints = currentTierData.requiredPoints;
    const ascensionReduction = this.ascensionService.warpSpeedReduction();
    if (ascensionReduction > 0) {
      requiredPoints = requiredPoints.times(1 - ascensionReduction);
    }
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    if (prismBonus > 0) {
      requiredPoints = requiredPoints.times(1 - prismBonus);
    }
    const points = this.gameService.getResource('knowledge');
    if (!points || points.amount.lt(requiredPoints)) {
      return false;
    }
    return this.areAllSkillsMaxed();
  }
  areAllSkillsMaxed(): boolean {
    const skills = Array.from(this.skills().values());
    return skills.length > 0 && skills.every(skill => skill.level >= skill.maxLevel);
  }
  getAscensionProgress(): { current: Decimal; required: Decimal; percentage: number } {
    const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
    if (!currentTierData) {
      return { current: new Decimal(0), required: new Decimal(0), percentage: 0 };
    }
    const points = this.gameService.getResource('knowledge');
    const current = points ? points.amount : new Decimal(0);
    let required = currentTierData.requiredPoints;
    const ascensionReduction = this.ascensionService.warpSpeedReduction();
    if (ascensionReduction > 0) {
      required = required.times(1 - ascensionReduction);
    }
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    if (prismBonus > 0) {
      required = required.times(1 - prismBonus);
    }
    const percentage = Math.min(100, current.div(required).times(100).toNumber());
    return { current, required, percentage };
  }
  getCurrentTierInfo(): SkillTreeTier | undefined {
    return SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
  }
  getNextTierInfo(): SkillTreeTier | undefined {
    return SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier + 1);
  }
  ascend(ascensionService?: any): boolean {
    if (!this.canAscend()) {
      return false;
    }
    this.achievementService?.onWarpComplete();
    const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
    if (!currentTierData) return false;
    const prestigeData = this.prestige();
    const completions = new Map(prestigeData.tierCompletions);
    const tierCompletions = completions.get(prestigeData.currentTier) || 0;
    completions.set(prestigeData.currentTier, tierCompletions + 1);
    const isTier5 = prestigeData.currentTier === 5;
    if (isTier5) {
      const stellarCoreBonus = this.dimensionService.totalStellarCoreBonus();
      const stellarCoresGranted = Math.floor(1 * (1 + stellarCoreBonus));
      for (let i = 0; i < stellarCoresGranted; i++) {
        this.ascensionService.grantAscensionPoint();
      }
      if (this.ascensionService.isTreeComplete()) {
        const currentEnergy = this.gameService.getResource('knowledge')?.amount || new Decimal(0);
        const echoFragments = this.calculateEchoFragments(currentEnergy);
        if (echoFragments > 0) {
          this.dimensionService.grantEchoFragments(echoFragments);
        }
      }
    }
    const newTier = isTier5 ? 1 : prestigeData.currentTier + 1;
    let newRunPrestigeBonus: number;
    let newRunAscensions: number;
    let newTotalPrestigeBonus: number;
    if (isTier5) {
      newRunPrestigeBonus = 1;
      newRunAscensions = 0;
      newTotalPrestigeBonus = prestigeData.totalPrestigeBonus * currentTierData.prestigeBonus;
    } else {
      newRunPrestigeBonus = prestigeData.currentRunPrestigeBonus * currentTierData.prestigeBonus;
      newRunAscensions = prestigeData.currentRunAscensions + 1;
      newTotalPrestigeBonus = prestigeData.totalPrestigeBonus * currentTierData.prestigeBonus;
    }
    this.prestige.set({
      currentTier: newTier,
      totalAscensions: prestigeData.totalAscensions + 1,
      currentRunAscensions: newRunAscensions,
      totalPrestigeBonus: newTotalPrestigeBonus,
      currentRunPrestigeBonus: newRunPrestigeBonus,
      tierCompletions: completions
    });
    const startingEnergy = this.ascensionService.startingEnergy();
    this.gameService.resetGame();
    this.gameService.addResource('knowledge', startingEnergy);
    this.initializeSkillTree();
    this.recalculateProduction();
    this.savePrestige();
    this.saveSkills();
    this.achievementService?.onWarpStart();
    return true;
  }
  private calculateEchoFragments(energy: Decimal): number {
    const baseThreshold = new Decimal(1e35);
    if (energy.lt(baseThreshold)) {
      return 1;
    }
    const ratio = energy.div(baseThreshold);
    const logValue = ratio.log10();
    const bonusEF = Math.floor(logValue.toNumber());
    return Math.max(1, 1 + bonusEF);
  }
  private applyPrestigeBonus(): void {
    this.recalculateProduction();
  }
  resetSkills(): void {
    localStorage.removeItem('treefinite_skills');
    this.initializeSkillTree();
  }
  resetAll(): void {
    localStorage.removeItem('treefinite_skills');
    localStorage.removeItem('treefinite_prestige');
    this.prestige.set({
      currentTier: 1,
      totalAscensions: 0,
      currentRunAscensions: 0,
      totalPrestigeBonus: 1,
      currentRunPrestigeBonus: 1,
      tierCompletions: new Map()
    });
    this.initializeSkillTree();
  }
}