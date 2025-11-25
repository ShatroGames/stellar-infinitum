import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DimensionService } from '../../services/dimension.service';
import { QuantumService } from '../../services/quantum.service';
import { SkillTreeService } from '../../services/skill-tree.service';
import { AscensionService } from '../../services/ascension.service';
import { GameService } from '../../services/game.service';
import { AchievementService } from '../../services/achievement.service';
@Component({
  selector: 'app-collapse-panel',
  imports: [CommonModule],
  templateUrl: './collapse-panel.html',
  styleUrl: './collapse-panel.css'
})
export class CollapsePanel {
  private dimensionService = inject(DimensionService);
  private quantumService = inject(QuantumService);
  private skillTreeService = inject(SkillTreeService);
  private ascensionService = inject(AscensionService);
  private gameService = inject(GameService);
  private achievementService = inject(AchievementService);
  protected showConfirmation = false;
  protected showCollapseAnimation = false;
  private readonly PRE_COLLAPSE_ACHIEVEMENT_IDS = [
    'first_skill', 'tier1_complete', 'tier2_complete', 'tier3_complete', 
    'tier4_complete', 'tier5_complete', 'all_tiers_complete',
    'first_warp', 'warp_5', 'warp_10', 'warp_25',
    'stellar_100', 'stellar_250', 'stellar_400',
    'ascension_unlocked', 'ascension_tier1_complete', 'ascension_tier2_complete',
    'ascension_tier3_complete', 'ascension_all_complete',
    'dimensions_unlocked', 'first_transcend', 'transcend_10', 'transcend_50', 'transcend_100',
    'echo_100', 'echo_500', 'echo_1000', 'echo_5000',
    'dimension_void_unlocked', 'dimension_crystal_unlocked', 'dimension_quantum_unlocked',
    'dimension_temporal_unlocked', 'dimension_prism_unlocked', 'all_dimensions_unlocked'
  ];
  dimensionsMaxed = computed(() => {
    const dimensions = this.dimensionService.dimensions();
    const allDimensions = ['void', 'crystal', 'quantum', 'temporal', 'prism'];
    const allUnlocked = allDimensions.every(id => {
      const dim = dimensions.get(id);
      return dim?.unlocked ?? false;
    });
    if (!allUnlocked) return false;
    return Array.from(dimensions.values()).every(dim => 
      dim.nodes.every(node => node.level >= node.maxLevel)
    );
  });
  allPreCollapseAchievements = computed(() => {
    const achievements = this.achievementService.getAchievements()();
    return this.PRE_COLLAPSE_ACHIEVEMENT_IDS.every(id => {
      const achievement = achievements.get(id);
      return achievement?.unlocked ?? false;
    });
  });
  missingAchievements = computed(() => {
    const achievements = this.achievementService.getAchievements()();
    return this.PRE_COLLAPSE_ACHIEVEMENT_IDS
      .filter(id => {
        const achievement = achievements.get(id);
        return !achievement?.unlocked;
      })
      .map(id => achievements.get(id))
      .filter(a => a !== undefined);
  });
  canCollapse = computed(() => {
    return this.dimensionsMaxed() && this.allPreCollapseAchievements();
  });
  initiateCollapse(): void {
    if (!this.canCollapse()) return;
    this.showConfirmation = true;
  }
  confirmCollapse(): void {
    this.showConfirmation = false;
    this.showCollapseAnimation = true;
    setTimeout(() => {
      this.quantumService.initializeQuantumState();
      this.dimensionService.reset();
      setTimeout(() => {
        this.showCollapseAnimation = false;
      }, 500);
    }, 4000); // Animation duration
  }
  cancelCollapse(): void {
    this.showConfirmation = false;
  }
}