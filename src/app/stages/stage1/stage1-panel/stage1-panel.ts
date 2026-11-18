import { Component, computed, inject } from '@angular/core';
import { Stage1Service } from '../stage1.service';
import { StageService } from '../../../core/stage.service';
import { CAPSTONES, EXPANSIONS, Theme } from '../../../economy/stage1-content';
import { Decimal, formatNumber } from '../../../utils/numbers';

/** Warp progress, warp choices, the run map and the beat-stage button for Stage 1 */
@Component({
  selector: 'app-stage1-panel',
  templateUrl: './stage1-panel.html',
  styleUrl: './stage1-panel.css',
})
export class Stage1Panel {
  protected stage1 = inject(Stage1Service);
  private stageService = inject(StageService);
  protected capstones = CAPSTONES;

  progress = computed(() => {
    const current = this.stage1.currency();
    const required = this.stage1.requirement();
    // Log scale: Energy grows exponentially, so a linear bar would sit near 0% for most of a tier
    const ratio = current.lte(1) ? 0 : Math.min(1, current.log10().toNumber() / Math.max(1, required.log10().toNumber()));
    return { current, required, percentage: ratio * 100 };
  });

  /** Every tier of both paths, with the chosen path highlighted (map, decision 3.7) */
  map = computed(() => [2, 3, 4, 5].map(tier => ({
    tier,
    options: [EXPANSIONS[tier].saver, EXPANSIONS[tier].spender],
    chosen: this.stage1.theme() ?? undefined,
    current: this.stage1.tier() + 1 === tier,
  })));

  format(value: Decimal | number): string {
    return formatNumber(value, 0);
  }

  minutes(value: number): string {
    return value >= 60 ? '60+ min' : `${value.toFixed(value < 10 ? 1 : 0)} min`;
  }

  bonus(value: number): string {
    return formatNumber(value, 2);
  }

  warp(theme: Theme): void {
    this.stage1.warp(theme);
  }

  buyAll(): void {
    this.stage1.buyAll();
  }

  beatStage(): void {
    this.stageService.beatCurrentStage();
  }
}
