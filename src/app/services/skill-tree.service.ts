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
  private productionCache: { value: number; timestamp: number } | null = null;
  private readonly PRODUCTION_CACHE_MS = 50; // Cache production for 50ms
  private costCache: Map<string, { cost: Decimal; level: number }> = new Map();

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
    return this.calculateEchoFragments(currentEnergy);
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
      if (this.achievementService?.hasAutoWarp() && this.canAscend()) {
        // Only auto-warp if not on Tier 5 (to prevent auto-transcending)
        if (this.prestige().currentTier < 5) {
          this.ascend(this.ascensionService);
        }
      }
      
      // No auto-transcend on Tier 5 anymore - player must manually ascend to gain Echo Fragments
    }, 200); // Run every 200ms instead of 100ms
  }

  private initializeSkillTree(): void {
    const currentTierData = SKILL_TREE_TIERS.find(t => t.id === this.prestige().currentTier);
    if (!currentTierData) return;

    const skillMap = new Map<string, SkillNode>();
    currentTierData.skills.forEach(skill => {
      // Apply skill cap increases from ascension and dimensions
      let maxLevel = skill.maxLevel;
      maxLevel += this.ascensionService.skillCapIncrease();
      maxLevel += this.dimensionService.totalSkillCapIncrease();
      
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
    
    // Check cache first
    const cached = this.costCache.get(skillId);
    if (cached && cached.level === skill.level) {
      return cached.cost;
    }
    
    let cost = skill.cost.times(Decimal.pow(skill.costMultiplier, skill.level)).floor();
    
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
    
    // Cache the result
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
      const ascensionBonus = this.ascensionService.skillCapIncrease();
      const dimensionBonus = this.dimensionService.totalSkillCapIncrease();

      currentTierData.skills.forEach(configSkill => {
        const existingSkill = updatedMap.get(configSkill.id);
        if (existingSkill) {
          const newMaxLevel = configSkill.maxLevel + ascensionBonus + dimensionBonus;
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
    
    // Calculate base production from all production skills
    let baseProduction = 0;
    this.skills().forEach(skill => {
      if (skill.effect.type === 'production' && skill.effect.resource === 'knowledge') {
        baseProduction += skill.effect.value * skill.level;
      }
    });

    // Calculate total multiplier from all multiplier skills (MULTIPLICATIVE)
    let totalMultiplier = 1;
    this.skills().forEach(skill => {
      if (skill.effect.type === 'multiplier' && skill.effect.resource === 'knowledge') {
        // Each level multiplies by the effect value
        // e.g., 1.5x multiplier at level 3 = 1.5^3 = 3.375x total
        let effectValue = skill.effect.value;
        
        // Apply ascension multiplier boost
        const multiplierBoost = this.ascensionService.multiplierBoost();
        if (multiplierBoost > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + multiplierBoost);
        }
        
        // Apply dimension multiplier power
        const dimensionMultiplierPower = this.dimensionService.totalMultiplierPower();
        if (dimensionMultiplierPower > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + dimensionMultiplierPower);
        }
        
        // Apply Prism "all aspects" bonus
        const prismBonus = this.dimensionService.prismAllAspectsBonus();
        if (prismBonus > 0) {
          effectValue = 1 + (effectValue - 1) * (1 + prismBonus);
        }
        
        // Multiply by the effect value raised to the skill level
        totalMultiplier *= Math.pow(effectValue, skill.level);
      }
    });

    // Apply prestige bonus to multiplier (use current run bonus, not total)
    const prestigeBonus = this.prestige().currentRunPrestigeBonus;
    totalMultiplier *= prestigeBonus;
    
    // Apply ascension production boost
    const productionBoost = this.ascensionService.productionBoost();
    if (productionBoost > 0) {
      totalMultiplier *= (1 + productionBoost);
    }

    // Apply global ascension points multiplier (0.1 per total point earned)
    const globalMultiplier = this.ascensionService.globalMultiplier();
    totalMultiplier *= globalMultiplier;

    // Apply skill efficiency bonus (bonus per maxed skill)
    const skillEfficiencyBonus = this.ascensionService.skillEfficiencyBonus();
    if (skillEfficiencyBonus > 0) {
      const maxedSkills = Array.from(this.skills().values()).filter(
        skill => skill.level >= skill.maxLevel
      ).length;
      if (maxedSkills > 0) {
        totalMultiplier *= (1 + skillEfficiencyBonus * maxedSkills);
      }
    }

    // Apply stellar core multiplier (bonus per Stellar Core owned)
    const stellarCoreMult = this.ascensionService.stellarCoreMult();
    if (stellarCoreMult > 0) {
      const stellarCores = this.ascensionService.totalPoints();
      if (stellarCores > 0) {
        totalMultiplier *= (1 + stellarCoreMult * stellarCores);
      }
    }

    // Apply warp momentum bonus (bonus per warp in current run)
    const warpMomentumBonus = this.ascensionService.warpMomentumBonus();
    if (warpMomentumBonus > 0) {
      const warpsThisRun = this.prestige().currentRunAscensions;
      if (warpsThisRun > 0) {
        totalMultiplier *= (1 + warpMomentumBonus * warpsThisRun);
      }
    }

    // Apply dimension bonuses
    const dimensionProductionBonus = this.dimensionService.totalProductionBonus();
    totalMultiplier *= dimensionProductionBonus;
    
    const dimensionCrossDimensionBonus = this.dimensionService.crossDimensionBonus();
    totalMultiplier *= dimensionCrossDimensionBonus;
    
    // Apply Prism "all aspects" bonus to production
    const prismBonus = this.dimensionService.prismAllAspectsBonus();
    if (prismBonus > 0) {
      totalMultiplier *= (1 + prismBonus);
    }

    // Set final production rate
    const finalProduction = baseProduction * totalMultiplier;
    
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
    if (!this.achievementService?.hasAutoBuy()) {
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
    if (isTier5) {
      // Calculate Stellar Core bonus from dimensions
      const stellarCoreBonus = this.dimensionService.totalStellarCoreBonus();
      const stellarCoresGranted = Math.floor(1 * (1 + stellarCoreBonus));
      
      for (let i = 0; i < stellarCoresGranted; i++) {
        this.ascensionService.grantAscensionPoint();
      }
      
      // Grant Echo Fragments based on Energy (only if ascension tree is complete)
      if (this.ascensionService.isTreeComplete()) {
        const currentEnergy = this.gameService.getResource('knowledge')?.amount || new Decimal(0);
        const echoFragments = this.calculateEchoFragments(currentEnergy);
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
      tierCompletions: completions
    });

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

    // Start tracking time for speed achievement (after everything is reset)
    this.achievementService?.onWarpStart();

    return true;
  }

  private calculateEchoFragments(energy: Decimal): number {
    // Base threshold: 10 trillion (10e12)
    const baseThreshold = new Decimal(1e35);
    
    // If energy is less than threshold, grant 1 EF
    if (energy.lt(baseThreshold)) {
      return 1;
    }
    
    // Calculate bonus EF based on how much energy exceeds the threshold
    // Formula: 1 + floor(log10(energy / baseThreshold))
    // Examples with maxed tree (~100x base threshold):
    // - 10T Energy: 1 EF
    // - 100T Energy: 2 EF (10x threshold)
    // - 1Q Energy: 3 EF (100x threshold)
    // - 10Q Energy: 4 EF (1000x threshold)
    const ratio = energy.div(baseThreshold);
    const logValue = ratio.log10();
    const bonusEF = Math.floor(logValue.toNumber());
    
    return Math.max(1, 1 + bonusEF);
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
      tierCompletions: new Map()
    });
    this.initializeSkillTree();
  }
}
