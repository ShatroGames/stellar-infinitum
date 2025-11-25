import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProbabilityForgeService } from '../../services/probability-forge.service';
import { OutcomeRarity, PullResult } from '../../models/probability-forge.model';
import { formatNumber } from '../../utils/numbers';
@Component({
  selector: 'app-probability-forge',
  imports: [CommonModule],
  templateUrl: './probability-forge.html',
  styleUrl: './probability-forge.css'
})
export class ProbabilityForgeComponent {
  probabilityService = inject(ProbabilityForgeService);
  OutcomeRarity = OutcomeRarity;
  lastPull: PullResult | null = null;
  showPullAnimation = false;
  systemUnlocked = this.probabilityService.systemUnlocked;
  fateTokens = this.probabilityService.fateTokens;
  totalPulls = this.probabilityService.totalPulls;
  discoveredCount = this.probabilityService.discoveredCount;
  currentStreak = this.probabilityService.currentStreak;
  totalMultiplier = this.probabilityService.totalMultiplier;
  tokenGenerationRate = this.probabilityService.tokenGenerationRate;
  pullCost = this.probabilityService.pullCost;
  canAffordPull = this.probabilityService.canAffordPull;
  outcomes = computed(() => this.probabilityService.getOutcomes());
  fateWeights = computed(() => this.probabilityService.getFateWeights());
  currentProbabilities = computed(() => this.probabilityService.getCurrentProbabilities());
  collectionProgress = computed(() => this.probabilityService.getCollectionProgress());
  selectedTab: 'pull' | 'collection' | 'weights' | 'stats' = 'pull';
  formatNumber = formatNumber;
  Math = Math; // Expose Math to template
  performPull(): void {
    try {
      this.lastPull = this.probabilityService.pull();
      this.showPullAnimation = true;
      setTimeout(() => {
        this.showPullAnimation = false;
      }, 3000);
    } catch (error) {
      console.error('Pull failed:', error);
    }
  }
  unlockWeight(weightId: string): void {
    this.probabilityService.unlockWeight(weightId);
  }
  upgradeWeight(weightId: string): void {
    this.probabilityService.upgradeWeight(weightId);
  }
  getRarityColor(rarity: OutcomeRarity): string {
    switch (rarity) {
      case OutcomeRarity.COMMON: return '#9e9e9e';
      case OutcomeRarity.UNCOMMON: return '#4caf50';
      case OutcomeRarity.RARE: return '#2196f3';
      case OutcomeRarity.EPIC: return '#9c27b0';
      case OutcomeRarity.MYTHIC: return '#ffc107';
      default: return '#fff';
    }
  }
  getRarityName(rarity: OutcomeRarity): string {
    return rarity.charAt(0).toUpperCase() + rarity.slice(1);
  }
}