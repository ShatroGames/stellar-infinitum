import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillTreeService } from '../../services/skill-tree.service';
import { AscensionService } from '../../services/ascension.service';
import { Decimal, formatNumber } from '../../utils/numbers';

@Component({
  selector: 'app-prestige-panel',
  imports: [CommonModule],
  templateUrl: './prestige-panel.component.html',
  styleUrl: './prestige-panel.component.css'
})
export class PrestigePanelComponent {
  private skillTreeService = inject(SkillTreeService);
  private ascensionService = inject(AscensionService);

  currentTier = computed(() => this.skillTreeService.getCurrentTierInfo());
  nextTier = computed(() => this.skillTreeService.getNextTierInfo());
  totalAscensions = this.skillTreeService.totalAscensions;
  prestigeBonus = this.skillTreeService.prestigeBonus;
  ascensionPoints = this.ascensionService.points;
  totalAscensionPoints = this.ascensionService.totalPoints;
  
  progress = computed(() => this.skillTreeService.getAscensionProgress());
  allSkillsMaxed = computed(() => this.skillTreeService.areAllSkillsMaxed());
  canAscend = computed(() => this.skillTreeService.canAscend());

  formatNumber(value: Decimal | number): string {
    return formatNumber(value, 0);
  }

  formatBonus(multiplier: number): string {
    return multiplier.toFixed(1) + 'x';
  }

  onAscend(): void {
    this.skillTreeService.ascend();
  }
}
