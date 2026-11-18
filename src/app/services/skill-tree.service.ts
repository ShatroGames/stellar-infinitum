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
  
  // Lazy-loaded to avoid circular dependency
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
  
  // Cache for expensive calculations
  private productionCache: { value: Decimal; timestamp: number } | null = null;
  private readonly PRODUCTION_CACHE_MS = 50; // Cache production for 50ms
  private costCache: Map<string, { cost: Decimal; key: string }> = new Map();

  currentTier = computed(() => this.prestige().currentTier);
  totalAscensions = computed(() => this.prestige().currentRunAscensions);
  allTimeAscensions = computed(() => this.prestige().totalAscensions);
  prestigeBonus = computed(() => this.prestige().currentRunPrestigeBonus);
  
  // Public getter for prestige data (needed by AchievementService)
  getPrestigeData = computed(() => this.prestige());

  // Calculate potential Echo Fragments from current Energy
  potentialEchoFragments = computed(() => {
    if (!this.ascensionService.isTreeComplete() || this.prestige().currentTier !== 5) {
      return 0;
    }
    const currentEnergy = this.gameService.getResource('knowledge')?.amount || new Decimal(0);
    const progress = this.prestige().echoFragmentProgress ?? 0;
    return Math.floor(this.calculateEchoFragments(currentEnergy) + progress + 1e-9);
  });

  constructor() {
    this.loadPrestige();
    this.initializeSkillTree();
    this.loadSkills();
    this.applyPrestigeBonus();
    
    // Start auto-buy loop with reduced frequency
    setInterval(() => {
      this.autoBuySkills(this.ascensionService);
      
      // Check for auto-warp (Tiers 1-4) - now using achievement service
      if (this.hasAutoWarp() && this.canAscend()) {
        // Only auto-warp if not on Tier 5 (to prevent auto-transcending)
        if (this.prestige().currentTier < 5) {
          this.ascend(this.ascensionService);
        }
      }
      
      // No auto-transcend on Tier 5 anymore - player must manually ascend to gain Echo Fragments
    }, 200); // Run every 200ms instead of 100ms
  }

  /** Automation can come from an achievement or from the Stellar Nexus node */
  private hasAutoBuy(): boolean {
    return !!this.achievementService?.hasAutoBuy() || this.ascensionService.hasAutoBuy();
  }

  private hasAutoWarp(): boolean {
    return !!this.achievementService?.hasAutoWarp() || this.ascensionService.hasAutoWarp();
  }

  private initializeSkillTree(): void {
    const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
    if (!currentTierData) return;

    const skillMap = new Map<string, SkillNode>();
    currentTierData.skills.forEach(skill => {
      // Apply skill cap increases from ascension and dimensions
      const maxLevel = skill.maxLevel + this.skillCapBonus();
      
      // Ensure cost is a Decimal when initializing
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
    
    // Cache is keyed on level and active discounts so it never goes stale
    const ascensionReduction = this.ascensionService.costReduction();
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    const key = `${skill.level}|${ascensionReduction}|${prismBonus}`;
    const cached = this.costCache.get(skillId);
    if (cached && cached.key === key) {
      return cached.cost;
    }
    
    const cost = this.costAtLevel(skill, skill.level);
    this.costCache.set(skillId, { cost, key });
    return cost;
  }

  /** Cost of buying the given level of a skill, including all discounts */
  private costAtLevel(skill: SkillNode, level: number): Decimal {
    let cost = new Decimal(skill.cost).times(Decimal.pow(skill.costMultiplier, level)).floor();
    
    // Apply ascension cost reduction
    const ascensionReduction = this.ascensionService.costReduction();
    if (ascensionReduction > 0) {
      cost = cost.times(1 - ascensionReduction);
    }
    
    // Apply Prism "all aspects" bonus to costs (makes them cheaper)
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    if (prismBonus > 0) {
      cost = cost.times(1 - prismBonus);
    }
    
    return cost;
  }

  /** Skill level cap bonus from the Stellar Nexus and dimensions */
  private skillCapBonus(): number {
    return this.ascensionService.skillCapIncrease() + this.dimensionService.totalSkillCapIncrease();
  }

  upgradeSkill(skillId: string): boolean {
    if (!this.canUpgrade(skillId)) {
      return false;
    }

    const skill = this.skills().get(skillId);
    if (!skill) return false;

    const cost = this.getUpgradeCost(skillId);
    if (this.gameService.spend('knowledge', cost)) {
      // Invalidate cost cache for this skill
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
    // Recalculate all production after any skill change
    this.recalculateProduction();
  }

  // Public method to update skill max levels when dimension/ascension bonuses change
  updateSkillMaxLevels(): void {
    this.skills.update(skillMap => {
      const updatedMap = new Map(skillMap);
      const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
      if (!currentTierData) return skillMap;

      // Recalculate max levels for all skills based on current bonuses
      const capBonus = this.skillCapBonus();

      currentTierData.skills.forEach(configSkill => {
        const existingSkill = updatedMap.get(configSkill.id);
        if (existingSkill) {
          const newMaxLevel = configSkill.maxLevel + capBonus;
          // Only update if the max level changed
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

  // Public method to trigger production recalculation (e.g., from DimensionService)
  recalculateProduction(): void {
    // Clear cache when recalculating
    this.productionCache = null;

    const skills = Array.from(this.skills().values());

    // Achievement rewards (AchievementService is lazy-loaded; default to no bonus)
    const energyAchievementMult = this.achievementService?.energyProductionMultiplier() ?? 1;
    // Scales every bonus that comes from a Stellar Nexus node
    const nexusFactor = this.achievementService?.ascensionBonusMultiplier() ?? 1;

    // Calculate base production from all production skills
    let baseProduction = 0;
    skills.forEach(skill => {
      if (skill.effect.type === 'production' && skill.effect.resource === 'knowledge') {
        baseProduction += skill.effect.value * skill.level;
      }
    });

    // Strength boosts applied to every multiplier skill
    const multiplierBoost = this.ascensionService.multiplierBoost() * nexusFactor;
    const dimensionMultiplierPower = this.dimensionService.totalMultiplierPower();
    const prismBonus = this.dimensionService.prismAllAspectsBonus();

    // Total multiplier is a Decimal: late-game values can exceed the range of a JS number
    let totalMultiplier = new Decimal(1);
    skills.forEach(skill => {
      if (skill.effect.type === 'multiplier' && skill.effect.resource === 'knowledge' && skill.level > 0) {
        // Each level multiplies by the effect value
        // e.g., 1.5x multiplier at level 3 = 1.5^3 = 3.375x total
        let effectValue = skill.effect.value;
        if (multiplierBoost > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + multiplierBoost);
        }
        if (dimensionMultiplierPower > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + dimensionMultiplierPower);
        }
        if (prismBonus > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + prismBonus);
        }
        totalMultiplier = totalMultiplier.times(Decimal.pow(effectValue, skill.level));
      }
    });

    // Apply prestige bonus to multiplier (use current run bonus, not total)
    totalMultiplier = totalMultiplier.times(this.prestige().currentRunPrestigeBonus);
    
    // Apply ascension production boost
    const productionBoost = this.ascensionService.productionBoost() * nexusFactor;
    if (productionBoost > 0) {
      totalMultiplier = totalMultiplier.times(1 + productionBoost);
    }

    // Apply global multiplier: +100% per Stellar Core ever earned
    totalMultiplier = totalMultiplier.times(this.ascensionService.globalMultiplier());

    // Apply skill efficiency bonus (bonus per maxed skill)
    const skillEfficiencyBonus = this.ascensionService.skillEfficiencyBonus() * nexusFactor;
    if (skillEfficiencyBonus > 0) {
      const maxedSkills = skills.filter(skill => skill.level >= skill.maxLevel).length;
      totalMultiplier = totalMultiplier.times(1 + skillEfficiencyBonus * maxedSkills);
    }

    // Apply stellar core multiplier (bonus per Stellar Core owned)
    const stellarCoreMult = this.ascensionService.stellarCoreMult() * nexusFactor;
    if (stellarCoreMult > 0) {
      totalMultiplier = totalMultiplier.times(1 + stellarCoreMult * this.ascensionService.totalPoints());
    }

    // Apply warp momentum bonus (bonus per warp in current run)
    const warpMomentumBonus = this.ascensionService.warpMomentumBonus() * nexusFactor;
    if (warpMomentumBonus > 0) {
      totalMultiplier = totalMultiplier.times(1 + warpMomentumBonus * this.prestige().currentRunAscensions);
    }

    // Apply dimension bonuses
    totalMultiplier = totalMultiplier
      .times(this.dimensionService.totalProductionBonus())
      .times(this.dimensionService.crossDimensionBonus());
    
    // Apply Prism "all aspects" bonus to production
    if (prismBonus > 0) {
      totalMultiplier = totalMultiplier.times(1 + prismBonus);
    }

    // Apply achievement rewards
    totalMultiplier = totalMultiplier.times(energyAchievementMult);

    const finalProduction = totalMultiplier.times(baseProduction);
    
    // Cache the result
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
    // If unlock_all is purchased, all nodes can be unlocked immediately
    if (this.ascensionService.hasUnlockAll()) {
      return true;
    }
    
    return skill.prerequisites.every(prereqId => {
      const prereq = this.skills().get(prereqId);
      return prereq && prereq.level >= prereq.maxLevel;
    });
  }

  autoBuySkills(ascensionService?: any): void {
    if (!this.hasAutoBuy()) {
      return;
    }

    const bulkAmount = ascensionService?.bulkBuyAmount() || 1;
    let purchasesMade = 0;
    let shouldSave = false;

    // Try to buy skills in order of cost (cheapest first)
    const affordableSkills = Array.from(this.skills().values())
      .filter(skill => this.canUpgrade(skill.id))
      .sort((a, b) => {
        const costA = this.getUpgradeCost(a.id);
        const costB = this.getUpgradeCost(b.id);
        return costA.cmp(costB);
      });

    // Batch all purchases before updating signal
    const updates: Map<string, SkillNode> = new Map();
    
    for (const skill of affordableSkills) {
      let currentSkill = skill;
      let bought = 0;
      
      while (bought < bulkAmount && currentSkill.level < currentSkill.maxLevel) {
        // Calculate cost based on current level in this batch
        const cost = this.costAtLevel(currentSkill, currentSkill.level);
        
        if (this.gameService.spend('knowledge', cost)) {
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

    // Apply all updates in a single signal update
    if (updates.size > 0) {
      // Clear cost cache for all updated skills
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
      
      // Save manager will handle debouncing
      this.saveSkills();
    }
  }

  saveSkills(): void {
    // Only save node IDs, levels, and unlocked status
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
        
        // Build skill map from current tier's config
        const currentTier = SKILL_TREE_TIERS[this.prestige().currentTier - 1];
        const skillMap = new Map<string, SkillNode>();
        
        currentTier.skills.forEach(configSkill => {
          const savedSkill = savedSkills.find((s: any) => s.id === configSkill.id);
          skillMap.set(configSkill.id, {
            ...configSkill,
            // Level caps from the Nexus/dimensions are not part of the config
            maxLevel: configSkill.maxLevel + this.skillCapBonus(),
            cost: new Decimal(configSkill.cost),
            level: savedSkill?.level ?? 0,
            unlocked: savedSkill?.unlocked ?? configSkill.unlocked
          });
        });
        
        this.skills.set(skillMap);
        
        // Recalculate production based on all skills
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

    // Calculate required points with warp speed reductions
    let requiredPoints = currentTierData.requiredPoints;
    
    const ascensionReduction = this.ascensionService.warpSpeedReduction();
    if (ascensionReduction > 0) {
      requiredPoints = requiredPoints.times(1 - ascensionReduction);
    }
    
    // Apply Prism "all aspects" bonus to warp speed
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    if (prismBonus > 0) {
      requiredPoints = requiredPoints.times(1 - prismBonus);
    }

    // Check if we have enough skill points
    const points = this.gameService.getResource('knowledge');
    if (!points || points.amount.lt(requiredPoints)) {
      return false;
    }

    // Check if all skills are maxed
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
    
    // Apply warp speed reductions to required points
    let required = currentTierData.requiredPoints;
    
    const ascensionReduction = this.ascensionService.warpSpeedReduction();
    if (ascensionReduction > 0) {
      required = required.times(1 - ascensionReduction);
    }
    
    // Apply Prism "all aspects" bonus
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

    // Track warp completion for speed achievements
    this.achievementService?.onWarpComplete();

    const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
    if (!currentTierData) return false;

    // Update prestige data
    const prestigeData = this.prestige();
    const completions = new Map(prestigeData.tierCompletions);
    const tierCompletions = completions.get(prestigeData.currentTier) || 0;
    completions.set(prestigeData.currentTier, tierCompletions + 1);

    // Grant ascension point if completing Tier 5
    const isTier5 = prestigeData.currentTier === 5;
    let coreProgress = prestigeData.stellarCoreProgress ?? 0;
    let echoProgress = prestigeData.echoFragmentProgress ?? 0;
    if (isTier5) {
      // Stellar Core gain: dimension bonuses plus achievement rewards. Fractions are
      // carried over to the next transcendence instead of being rounded away.
      const stellarCoreBonus = this.dimensionService.totalStellarCoreBonus();
      const achievementCoreMult = this.achievementService?.stellarCoreMultiplier() ?? 1;
      const coreGain = (1 + stellarCoreBonus) * achievementCoreMult + (prestigeData.stellarCoreProgress ?? 0);
      const stellarCoresGranted = Math.floor(coreGain + 1e-9);
      coreProgress = Math.max(0, coreGain - stellarCoresGranted);
      
      for (let i = 0; i < stellarCoresGranted; i++) {
        this.ascensionService.grantAscensionPoint();
      }
      
      // Grant Echo Fragments based on Energy (only if ascension tree is complete)
      if (this.ascensionService.isTreeComplete()) {
        const currentEnergy = this.gameService.getResource('knowledge')?.amount || new Decimal(0);
        const echoGain = this.calculateEchoFragments(currentEnergy) + echoProgress;
        const echoFragments = Math.floor(echoGain + 1e-9);
        echoProgress = Math.max(0, echoGain - echoFragments);
        if (echoFragments > 0) {
          this.dimensionService.grantEchoFragments(echoFragments);
        }
      }
    }

    // After Tier 5, loop back to Tier 1 and reset run bonuses
    const newTier = isTier5 ? 1 : prestigeData.currentTier + 1;
    
    // Calculate new bonuses
    let newRunPrestigeBonus: number;
    let newRunAscensions: number;
    let newTotalPrestigeBonus: number;
    
    if (isTier5) {
      // Reset run bonuses but keep total tracker
      newRunPrestigeBonus = 1;
      newRunAscensions = 0;
      newTotalPrestigeBonus = prestigeData.totalPrestigeBonus * currentTierData.prestigeBonus;
    } else {
      // Normal progression - increase run bonuses
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
      tierCompletions: completions,
      stellarCoreProgress: coreProgress,
      echoFragmentProgress: echoProgress
    });

    // Start timing the next warp (for the speed achievement)
    this.achievementService?.onWarpStart();

    // Calculate starting energy
    const startingEnergy = this.ascensionService.startingEnergy();

    // Reset knowledge to starting amount
    this.gameService.resetGame();
    this.gameService.addResource('knowledge', startingEnergy);

    // Initialize new skill tree with ascension effects
    this.initializeSkillTree();

    // Recalculate production with prestige bonus and ascension effects
    this.recalculateProduction();

    this.savePrestige();
    this.saveSkills();

    return true;
  }

  private calculateEchoFragments(energy: Decimal): number {
    // Base threshold: 1e35 Energy
    const baseThreshold = new Decimal(1e35);
    
    // Formula: 1 + floor(log10(energy / baseThreshold)), minimum 1
    // - below 1e35 Energy: 1 EF
    // - 1e36 Energy: 2 EF
    // - 1e37 Energy: 3 EF
    let baseEF = 1;
    if (energy.gte(baseThreshold)) {
      const bonusEF = Math.floor(energy.div(baseThreshold).log10().toNumber());
      baseEF = Math.max(1, 1 + bonusEF);
    }
    
    // Achievement rewards. The result may be fractional; fractions are carried
    // over between transcendences (see echoFragmentProgress).
    const achievementMult = this.achievementService?.echoFragmentMultiplier() ?? 1;
    return baseEF * achievementMult;
  }

  private applyPrestigeBonus(): void {
    // Recalculate production which will include prestige bonus
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
      tierCompletions: new Map(),
      stellarCoreProgress: 0,
      echoFragmentProgress: 0
    });
    this.initializeSkillTree();
  }
}
