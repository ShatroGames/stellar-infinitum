import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { SkillNode, PrestigeData, SkillTreeTier } from '../models/skill-node.model';
import { SKILL_TREE_TIERS } from '../models/skill-trees.config';
import { GameService } from './game.service';
import { AscensionService } from './ascension.service';
import { DimensionService } from './dimension.service';
import { SaveManagerService } from './save-manager.service';
import { AchievementService } from './achievement.service';
import { Decimal } from '../utils/numbers';
import {
  AchievementEffects, NO_ACHIEVEMENT_EFFECTS, echoFragmentTotal, energyProduction, nextEchoFragmentEnergy,
  nextStellarCoreEnergy, overchargeIntegral, overchargeMultiplier, skillCapBonus, skillCost, stellarCoreTotal,
  warpRequirement
} from '../economy/economy';

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
  
  private costCache: Map<string, { cost: Decimal; key: string }> = new Map();

  currentTier = computed(() => this.prestige().currentTier);
  totalAscensions = computed(() => this.prestige().currentRunAscensions);
  allTimeAscensions = computed(() => this.prestige().totalAscensions);
  prestigeBonus = computed(() => this.prestige().currentRunPrestigeBonus);
  
  // Public getter for prestige data (needed by AchievementService)
  getPrestigeData = computed(() => this.prestige());

  // --- Transcendence rewards (record-based, see economy.ts) ---------------

  private currentEnergy = computed(() => this.gameService.getResources()().get('knowledge')?.amount ?? new Decimal(0));

  /** Highest Energy that counts for rewards: the saved record or what is held now */
  private rewardEnergy = computed(() => {
    const best = new Decimal(this.prestige().bestEnergy ?? 0);
    return this.prestige().currentTier === 5 ? Decimal.max(best, this.currentEnergy()) : best;
  });

  /** Stellar Cores gained by transcending now */
  pendingStellarCores = computed(() => {
    const total = stellarCoreTotal(this.rewardEnergy(), this.dimensionService.effects(), this.achievementEffectsNow());
    return Math.max(0, total - this.ascensionService.totalPoints());
  });

  /** Energy needed for one more Stellar Core than transcending now would give */
  nextStellarCoreAt = computed(() => nextStellarCoreEnergy(
    this.ascensionService.totalPoints() + this.pendingStellarCores(),
    this.dimensionService.effects(), this.achievementEffectsNow()));

  /** Echo Fragments gained by transcending now (requires the complete Stellar Nexus) */
  potentialEchoFragments = computed(() => {
    if (!this.ascensionService.isTreeComplete()) return 0;
    const total = echoFragmentTotal(this.rewardEnergy(), this.achievementEffectsNow());
    return Math.max(0, total - this.dimensionService.totalEchoFragments());
  });

  nextEchoFragmentAt = computed(() => nextEchoFragmentEnergy(
    this.dimensionService.totalEchoFragments() + this.potentialEchoFragments(), this.achievementEffectsNow()));

  // --- Overcharge -----------------------------------------------------------

  /** Seconds of Overcharge this run (0 when not overcharging) */
  overchargeSeconds = signal(0);
  isOvercharging = computed(() => this.prestige().overchargeStart != null);
  overchargeMultiplier = computed(() => overchargeMultiplier(this.overchargeSeconds()));

  private updateOvercharge(): void {
    const prestige = this.prestige();
    if (prestige.overchargeStart == null && prestige.currentTier === 5 && this.areAllSkillsMaxed()) {
      this.prestige.update(p => ({ ...p, overchargeStart: Date.now() }));
      this.savePrestige();
    }
    const start = this.prestige().overchargeStart;
    if (start != null) {
      this.overchargeSeconds.set((Date.now() - start) / 1000);
      this.recalculateProduction();
    }
  }

  /** Overcharge keeps growing while offline; GameService only added the saved rate */
  private applyOfflineOvercharge(): void {
    const start = this.prestige().overchargeStart;
    const { seconds, savedAt } = this.gameService.offlineInfo;
    if (start == null || seconds <= 0) return;
    const t0 = Math.max(0, (savedAt - start) / 1000);
    const base = this.baseProduction();
    const extra = base.times(overchargeIntegral(t0, t0 + seconds) - overchargeMultiplier(t0) * seconds);
    if (extra.gt(0)) this.gameService.addResource('knowledge', extra);
  }

    constructor() {
    this.loadPrestige();
    this.initializeSkillTree();
    this.loadSkills();
    this.applyPrestigeBonus();
    this.applyOfflineOvercharge();
    this.updateOvercharge();
    
    // Start auto-buy loop with reduced frequency
    setInterval(() => {
      // Resources and Overcharge keep accumulating, but automation only runs while
      // the game is visible: not watching is the drawback of idling
      this.updateOvercharge();
      if (document.hidden) return;

      this.autoBuySkills(this.ascensionService);
      
      // Check for auto-warp (Tiers 1-4)
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
    return skillCost(skill, level, this.ascensionService.effects(), this.dimensionService.effects());
  }

  private achievementEffectsNow(): AchievementEffects {
    return this.achievementService?.effects() ?? NO_ACHIEVEMENT_EFFECTS;
  }

  /** Skill level cap bonus from the Stellar Nexus and dimensions */
  private skillCapBonus(): number {
    return skillCapBonus(this.ascensionService.effects(), this.dimensionService.effects());
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

  /** Energy production without Overcharge */
  private baseProduction(): Decimal {
    const prestige = this.prestige();
    return energyProduction(Array.from(this.skills().values()), {
      runPrestigeBonus: prestige.currentRunPrestigeBonus,
      runWarps: prestige.currentRunAscensions,
      totalCores: this.ascensionService.totalPoints(),
      nexus: this.ascensionService.effects(),
      dims: this.dimensionService.effects(),
      achievements: this.achievementEffectsNow(),
    });
  }

  // Public method to trigger production recalculation (e.g., from DimensionService)
  recalculateProduction(): void {
    const start = this.prestige().overchargeStart;
    const overcharge = start != null ? overchargeMultiplier((Date.now() - start) / 1000) : 1;
    this.gameService.setProductionRate('knowledge', this.baseProduction().times(overcharge));
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

    const requiredPoints = this.currentWarpRequirement();

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
    
    const required = this.currentWarpRequirement();
    
    const percentage = Math.min(100, current.div(required).times(100).toNumber());

    return { current, required, percentage };
  }

  private currentWarpRequirement(): Decimal {
    return warpRequirement(this.prestige().currentTier, this.ascensionService.effects(), this.dimensionService.effects());
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
    let bestEnergy = prestigeData.bestEnergy;
    if (isTier5) {
      // Record-based rewards: pay out the difference to the new record
      this.ascensionService.grantAscensionPoint(this.pendingStellarCores());
      const echoFragments = this.potentialEchoFragments();
      if (echoFragments > 0) {
        this.dimensionService.grantEchoFragments(echoFragments);
      }
      bestEnergy = this.rewardEnergy().toString();
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
      bestEnergy,
      overchargeStart: null
    });
    this.overchargeSeconds.set(0);

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
      bestEnergy: undefined,
      overchargeStart: null
    });
    this.initializeSkillTree();
  }
}
