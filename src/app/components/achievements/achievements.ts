import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AchievementService } from '../../services/achievement.service';
import { AchievementCategory } from '../../models/achievement.model';
@Component({
  selector: 'app-achievements',
  imports: [CommonModule],
  templateUrl: './achievements.html',
  styleUrl: './achievements.css',
})
export class Achievements {
  protected achievementService = inject(AchievementService);
  categories = Object.values(AchievementCategory);
  selectedCategory = signal<AchievementCategory>(AchievementCategory.ENERGY);
  selectCategory(category: AchievementCategory) {
    this.selectedCategory.set(category);
  }
  getAchievements(category: AchievementCategory) {
    return this.achievementService.getAchievementsByCategory(category);
  }
  getSelectedAchievements = computed(() => {
    return this.achievementService.getAchievementsByCategory(this.selectedCategory());
  });
  getCategoryProgress(category: AchievementCategory): string {
    const unlocked = this.achievementService.unlockedByCategory().get(category) || 0;
    const total = this.achievementService.totalByCategory().get(category) || 0;
    return `${unlocked}/${total}`;
  }
  getCategoryPercentage(category: AchievementCategory): number {
    const unlocked = this.achievementService.unlockedByCategory().get(category) || 0;
    const total = this.achievementService.totalByCategory().get(category) || 0;
    return total > 0 ? (unlocked / total) * 100 : 0;
  }
  formatPlayTime(): string {
    const seconds = this.achievementService['playTime']();
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }
}