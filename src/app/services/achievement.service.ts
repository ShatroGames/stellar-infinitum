import { Injectable, signal, computed, inject, Injector } from '@angular/core';
import { Achievement, ACHIEVEMENTS, AchievementCategory } from '../models/achievement.model';
import { GameService } from './game.service';
import { AscensionService } from './ascension.service';
import { DimensionService } from './dimension.service';
import { SkillTreeService } from './skill-tree.service';
import { QuantumService } from './quantum.service';
import { QuantumTreeType } from '../models/quantum.model';
import { Decimal } from '../utils/numbers';

export interface AchievementNotification {
  achievement: Achievement;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class AchievementService {
  private gameService = inject(GameService);
  private injector = inject(Injector);
  private ascensionService = inject(AscensionService);
  private dimensionService = inject(DimensionService);
  private quantumService = inject(QuantumService);

  // Lazy-loaded to avoid circular dependency  
  private _skillTreeService: SkillTreeService | null = null;
  private getSkillTreeService(): SkillTreeService | null {
    if (!this._skillTreeService) {
      try {
        this._skillTreeService = this.injector.get(SkillTreeService, null, { optional: true });
      } catch (e) {
        return null;
      }
    }
    return this._skillTreeService;
  }

  private get skillTreeService(): SkillTreeService | null {
    return this.getSkillTreeService();
  }

  private achievements = signal<Map<string, Achievement>>(new Map());
  private notifications = signal<AchievementNotification[]>([]);
  private playTime = signal<number>(0); // in seconds
  private sessionStartTime = Date.now();
  private warpStartTime?: number;
  private hasWarped = signal<boolean>(false);

  // Computed values
  unlockedCount = computed(() => {
    return Array.from(this.achievements().values()).filter(a => a.unlocked).length;
  });

  totalCount = computed(() => {
    return this.achievements().size;
  });

  unlockedByCategory = computed(() => {
    const map = new Map<AchievementCategory, number>();
    Array.from(this.achievements().values()).forEach(achievement => {
      if (achievement.unlocked) {
        const count = map.get(achievement.category) || 0;
        map.set(achievement.category, count + 1);
      }
    });
    return map;
  });

  totalByCategory = computed(() => {
    const map = new Map<AchievementCategory, number>();
    Array.from(this.achievements().values()).forEach(achievement => {
      const count = map.get(achievement.category) || 0;
      map.set(achievement.category, count + 1);
    });
    return map;
  });

  // Achievement multiplier bonuses
  energyProductionMultiplier = computed(() => {
    let multiplier = 1;
    const achievements = Array.from(this.achievements().values());
    
    if (achievements.find(a => a.id === 'all_tiers_complete' && a.unlocked)) {
      multiplier *= 1.05;
    }
    if (achievements.find(a => a.id === 'fast_tier5' && a.unlocked)) {
      multiplier *= 1.1;
    }
    if (achievements.find(a => a.id === 'max_all_trees' && a.unlocked)) {
      multiplier *= 1.25;
    }
    
    return multiplier;
  });

  stellarCoreMultiplier = computed(() => {
    let multiplier = 1;
    const achievements = Array.from(this.achievements().values());
    
    if (achievements.find(a => a.id === 'stellar_400' && a.unlocked)) {
      multiplier *= 1.1;
    }
    
    return multiplier;
  });

  echoFragmentMultiplier = computed(() => {
    let multiplier = 1;
    const achievements = Array.from(this.achievements().values());
    
    if (achievements.find(a => a.id === 'transcend_100' && a.unlocked)) {
      multiplier *= 1.1;
    }
    if (achievements.find(a => a.id === 'echo_5000' && a.unlocked)) {
      multiplier *= 1.2;
    }
    
    return multiplier;
  });

  ascensionBonusMultiplier = computed(() => {
    let multiplier = 1;
    const achievements = Array.from(this.achievements().values());
    
    if (achievements.find(a => a.id === 'ascension_all_complete' && a.unlocked)) {
      multiplier *= 1.15;
    }
    if (achievements.find(a => a.id === 'max_all_trees' && a.unlocked)) {
      multiplier *= 1.25;
    }
    
    return multiplier;
  });

  dimensionBonusMultiplier = computed(() => {
    let multiplier = 1;
    const achievements = Array.from(this.achievements().values());
    
    if (achievements.find(a => a.id === 'all_dimensions_unlocked' && a.unlocked)) {
      multiplier *= 1.25;
    }
    if (achievements.find(a => a.id === 'max_all_trees' && a.unlocked)) {
      multiplier *= 1.25;
    }
    
    return multiplier;
  });

  // Automation unlocks from achievements
  hasAutoBuy = computed(() => {
    const achievement = this.achievements().get('tier5_complete');
    return achievement?.unlocked ?? false;
  });

  hasAutoWarp = computed(() => {
    const achievement = this.achievements().get('warp_5');
    return achievement?.unlocked ?? false;
  });

  constructor() {
    this.initializeAchievements();
    this.loadSaveDataInternal();
    this.startTracking();
    
    // Welcome achievement
    setTimeout(() => this.checkAchievement('welcome'), 1000);
  }

  private loadSaveDataInternal(): void {
    const saved = localStorage.getItem('treefinite_achievements');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.loadSaveData(data);
      } catch (e) {
        console.error('Failed to load achievements:', e);
      }
    }
  }

  private saveData(): void {
    const data = this.getSaveData();
    localStorage.setItem('treefinite_achievements', JSON.stringify(data));
  }

  private initializeAchievements(): void {
    const achievementMap = new Map<string, Achievement>();
    ACHIEVEMENTS.forEach(achievement => {
      achievementMap.set(achievement.id, { ...achievement });
    });
    this.achievements.set(achievementMap);
  }

  private startTracking(): void {
    // Check achievements every second
    setInterval(() => {
      this.playTime.update(time => time + 1);
      this.checkAllAchievements();
    }, 1000);
  }

  private checkAllAchievements(): void {
    const energy = this.gameService.getResource('knowledge')?.amount || new Decimal(0);
    const production = this.gameService.getResource('knowledge')?.productionRate || new Decimal(0);
    const stellarCores = this.ascensionService.totalPoints();
    const echoFragments = this.dimensionService.totalEchoFragments();
    const totalWarps = this.skillTreeService?.allTimeAscensions() || 0;
    const totalTranscends = this.dimensionService.totalEchoFragments(); // Use total fragments as proxy for transcends
    const currentTier = this.skillTreeService?.currentTier() || 1;

    // Energy milestones
    if (energy.gte(1000)) this.checkAchievement('energy_1k');
    if (energy.gte(1e6)) this.checkAchievement('energy_1m');
    if (energy.gte(1e9)) this.checkAchievement('energy_1b');
    if (energy.gte(1e12)) this.checkAchievement('energy_1t');
    if (energy.gte(1e15)) this.checkAchievement('energy_1qa');

    // Production milestones
    if (production.gte(100)) this.checkAchievement('production_100');
    if (production.gte(10000)) this.checkAchievement('production_10k');
    if (production.gte(1e6)) this.checkAchievement('production_1m');
    if (production.gte(1e9)) this.checkAchievement('production_1b');

    // Skill tree achievements
    if (this.hasAnySkillPurchased()) this.checkAchievement('first_skill');
    if (this.isTierComplete(1)) this.checkAchievement('tier1_complete');
    if (this.isTierComplete(2)) this.checkAchievement('tier2_complete');
    if (this.isTierComplete(3)) this.checkAchievement('tier3_complete');
    if (this.isTierComplete(4)) this.checkAchievement('tier4_complete');
    if (this.isTierComplete(5)) this.checkAchievement('tier5_complete');
    if (this.areAllTiersComplete()) this.checkAchievement('all_tiers_complete');

    // Ascension achievements
    if (stellarCores > 0) this.checkAchievement('ascension_unlocked');
    if (totalWarps >= 1) this.checkAchievement('first_warp');
    if (totalWarps >= 5) this.checkAchievement('warp_5');
    if (totalWarps >= 10) this.checkAchievement('warp_10');
    if (totalWarps >= 25) this.checkAchievement('warp_25');
    if (stellarCores >= 100) this.checkAchievement('stellar_100');
    if (stellarCores >= 250) this.checkAchievement('stellar_250');
    if (stellarCores >= 400) this.checkAchievement('stellar_400');

    // Ascension tree completion
    if (this.isAscensionTierComplete(1)) this.checkAchievement('ascension_tier1_complete');
    if (this.isAscensionTierComplete(2)) this.checkAchievement('ascension_tier2_complete');
    if (this.isAscensionTierComplete(3)) this.checkAchievement('ascension_tier3_complete');
    if (this.areAllAscensionTiersComplete()) this.checkAchievement('ascension_all_complete');

    // Dimension achievements
    if (echoFragments > 0) this.checkAchievement('dimensions_unlocked');
    if (totalTranscends >= 1) this.checkAchievement('first_transcend');
    if (totalTranscends >= 10) this.checkAchievement('transcend_10');
    if (totalTranscends >= 50) this.checkAchievement('transcend_50');
    if (totalTranscends >= 100) this.checkAchievement('transcend_100');
    if (echoFragments >= 100) this.checkAchievement('echo_100');
    if (echoFragments >= 500) this.checkAchievement('echo_500');
    if (echoFragments >= 1000) this.checkAchievement('echo_1000');
    if (echoFragments >= 5000) this.checkAchievement('echo_5000');

    // Individual dimension unlocks
    const dimensions = this.dimensionService.dimensions();
    if (dimensions.get('void')?.unlocked) this.checkAchievement('dimension_void_unlocked');
    if (dimensions.get('crystal')?.unlocked) this.checkAchievement('dimension_crystal_unlocked');
    if (dimensions.get('quantum')?.unlocked) this.checkAchievement('dimension_quantum_unlocked');
    if (dimensions.get('temporal')?.unlocked) this.checkAchievement('dimension_temporal_unlocked');
    if (dimensions.get('prism')?.unlocked) this.checkAchievement('dimension_prism_unlocked');
    if (this.areAllDimensionsUnlocked()) this.checkAchievement('all_dimensions_unlocked');

    // Quantum achievements (only check if collapsed)
    if (this.quantumService?.hasCollapsed()) {
      const quantaGenerated = this.quantumService.totalQuantaGenerated();
      const activeSynergies = this.quantumService.getActiveSynergies();
      
      this.checkAchievement('cosmic_collapse');
      if (quantaGenerated >= 100000) this.checkAchievement('quantum_beginner');
      if (quantaGenerated >= 1000000) this.checkAchievement('quantum_intermediate');
      if (activeSynergies.length >= 1) this.checkAchievement('first_synergy');
      if (activeSynergies.length >= 7) this.checkAchievement('all_synergies');
      
      // Check if specific trees are maxed
      if (this.isQuantumTreeMaxed('Matter')) this.checkAchievement('max_matter_tree');
      if (this.isQuantumTreeMaxed('Energy')) this.checkAchievement('max_energy_tree');
      if (this.isQuantumTreeMaxed('Time')) this.checkAchievement('max_time_tree');
      if (this.isQuantumTreeMaxed('Matter') && this.isQuantumTreeMaxed('Energy') && this.isQuantumTreeMaxed('Time')) {
        this.checkAchievement('quantum_trinity');
      }
    }

    // Progression achievements
    const playTimeHours = this.playTime() / 3600;
    if (playTimeHours >= 1) this.checkAchievement('progression_1hour');
    if (playTimeHours >= 10) this.checkAchievement('progression_10hours');
    if (playTimeHours >= 100) this.checkAchievement('progression_100hours');

    // Special achievements
    if (energy.gte(1e9) && !this.hasWarped()) this.checkAchievement('no_warp_1b');
    if (energy.gte(1e100)) this.checkAchievement('overflow_prevention');
    if (this.areAllTreesMaxedSimultaneously()) this.checkAchievement('max_all_trees');
  }

  private checkAchievement(id: string): void {
    const achievement = this.achievements().get(id);
    if (achievement && !achievement.unlocked) {
      this.unlockAchievement(id);
    }
  }

  unlockAchievement(id: string): void {
    this.achievements.update(map => {
      const newMap = new Map(map);
      const achievement = newMap.get(id);
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedAt = Date.now();
        newMap.set(id, achievement);
        
        // Add notification
        this.notifications.update(notifs => {
          const newNotifs = [...notifs, { achievement, timestamp: Date.now() }];
          // Keep only last 5 notifications
          return newNotifs.slice(-5);
        });
        
        // Remove notification after 5 seconds
        setTimeout(() => {
          this.notifications.update(notifs => 
            notifs.filter(n => n.achievement.id !== id)
          );
        }, 5000);
        
        // Save achievements when unlocked
        this.saveData();
      }
      return newMap;
    });
  }

  getAchievements() {
    return this.achievements.asReadonly();
  }

  getNotifications() {
    return this.notifications.asReadonly();
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return Array.from(this.achievements().values())
      .filter(a => a.category === category)
      .sort((a, b) => {
        // Unlocked first, then by ID
        if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
        return a.id.localeCompare(b.id);
      });
  }

  // Warp tracking for speed achievements
  onWarpStart(): void {
    this.warpStartTime = Date.now();
  }

  onWarpComplete(): void {
    this.hasWarped.set(true);
    if (this.warpStartTime) {
      const duration = (Date.now() - this.warpStartTime) / 1000;
      if (duration < 300) { // 5 minutes
        this.checkAchievement('fast_warp');
      }
    }

    const sessionDuration = (Date.now() - this.sessionStartTime) / 1000 / 3600;
    if (this.skillTreeService?.currentTier() === 5 && sessionDuration < 1) {
      this.checkAchievement('fast_tier5');
    }
  }

  // Track offline time
  recordOfflineTime(seconds: number): void {
    this.playTime.update(time => time + seconds);
    if (seconds >= 28800) { // 8 hours
      this.checkAchievement('offline_8hours');
    }
  }

  // Helper methods
  private hasAnySkillPurchased(): boolean {
    const nodes = this.skillTreeService?.getSkills();
    if (!nodes) return false;
    return Array.from(nodes().values()).some((node: any) => node.level > 0);
  }

  private isTierComplete(tier: number): boolean {
    // Check if the tier has ever been completed (warped from)
    const prestige = this.skillTreeService?.getPrestigeData();
    if (!prestige) return false;
    const tierCompletions = prestige.tierCompletions;
    if (!tierCompletions) return false;
    
    // tierCompletions is a Map, so use .get() to check
    const completions = tierCompletions.get(tier);
    return completions !== undefined && completions > 0;
  }

  private areAllTiersComplete(): boolean {
    // Check if all tiers 1-5 have been completed at least once
    return [1, 2, 3, 4, 5].every(tier => this.isTierComplete(tier));
  }

  private isAscensionTierComplete(tier: number): boolean {
    // Check if nodes in specific tier position range are purchased
    // Tier 1: y=0-1, Tier 2: y=2-3, Tier 3: y=4-5
    const nodes = this.ascensionService.nodes();
    const tierNodes = Array.from(nodes.values()).filter(node => {
      const y = node.position.y;
      if (tier === 1) return y >= 0 && y <= 1;
      if (tier === 2) return y >= 2 && y <= 3;
      if (tier === 3) return y >= 4 && y <= 5;
      return false;
    });
    return tierNodes.length > 0 && tierNodes.every(node => node.purchased);
  }

  private areAllAscensionTiersComplete(): boolean {
    const nodes = this.ascensionService.nodes();
    return Array.from(nodes.values()).every(node => node.purchased);
  }

  private areAllDimensionsUnlocked(): boolean {
    const dimensions = this.dimensionService.dimensions();
    return ['void', 'crystal', 'quantum', 'temporal', 'prism']
      .every(dim => dimensions.get(dim)?.unlocked === true);
  }

  private areAllTreesMaxedSimultaneously(): boolean {
    return this.areAllTiersComplete() && 
           this.areAllAscensionTiersComplete() &&
           this.areAllDimensionsUnlocked();
  }

  // Save/load
  getSaveData(): any {
    // Only save minimal data: id, unlocked status, and unlock timestamp
    const minimalAchievements = Array.from(this.achievements().values())
      .filter(a => a.unlocked) // Only save unlocked achievements
      .map(a => ({
        id: a.id,
        unlockedAt: a.unlockedAt
      }));
    
    return {
      achievements: minimalAchievements,
      playTime: this.playTime(),
      hasWarped: this.hasWarped()
    };
  }

  loadSaveData(data: any): void {
    if (data.achievements) {
      const map = new Map<string, Achievement>();
      
      // Start with all achievement definitions
      ACHIEVEMENTS.forEach(definition => {
        const saved = data.achievements.find((a: any) => a.id === definition.id);
        if (saved) {
          // Merge: use definition but mark as unlocked with timestamp
          map.set(definition.id, {
            ...definition,
            unlocked: true,
            unlockedAt: saved.unlockedAt
          });
        } else {
          // Achievement not unlocked yet
          map.set(definition.id, { ...definition });
        }
      });
      
      this.achievements.set(map);
    }
    if (typeof data.playTime === 'number') {
      this.playTime.set(data.playTime);
    }
    if (typeof data.hasWarped === 'boolean') {
      this.hasWarped.set(data.hasWarped);
    }
  }

  // Check if a quantum tree is fully maxed
  private isQuantumTreeMaxed(treeName: string): boolean {
    const tree = treeName as keyof typeof QuantumTreeType;
    const treeType = QuantumTreeType[tree];
    if (!treeType) return false;

    const nodes = this.quantumService.getNodesForTree(treeType);
    return nodes.every(node => {
      const state = this.quantumService.getNodeState(node.id);
      return state && state.level >= node.maxLevel;
    });
  }

  reset(): void {
    // Re-initialize all achievements to locked state
    this.initializeAchievements();
    
    // Reset tracking data
    this.playTime.set(0);
    this.sessionStartTime = Date.now();
    this.warpStartTime = undefined;
    this.hasWarped.set(false);
    
    // Clear notifications
    this.notifications.set([]);
    
    // Clear saved data
    localStorage.removeItem('treefinite_achievements');
    
    // Re-trigger welcome achievement after a delay
    setTimeout(() => this.checkAchievement('welcome'), 1000);
  }
}
