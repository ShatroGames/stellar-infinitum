import { Component, computed, inject } from '@angular/core';
import { Stage1Service } from '../stage1.service';
import { StageService } from '../../../core/stage.service';
import { Decimal, formatNumber } from '../../../utils/numbers';

/** Warp progress, requirements and the warp / beat-stage button for Stage 1 */
@Component({
  selector: 'app-stage1-panel',
  templateUrl: './stage1-panel.html',
  styleUrl: './stage1-panel.css',
})
export class Stage1Panel {
  protected stage1 = inject(Stage1Service);
  private stageService = inject(StageService);

  progress = computed(() => {
    const current = this.stage1.currency();
    const required = this.stage1.requirement();
    // Log scale: Energy grows exponentially, so a linear bar would sit near 0% for most of a tier
    const ratio = current.lte(1) ? 0 : Math.min(1, current.log10().toNumber() / Math.max(1, required.log10().toNumber()));
    return { current, required, percentage: ratio * 100 };
  });

  format(value: Decimal | number): string {
    return formatNumber(value, 0);
  }

  warp(): void {
    this.stage1.warp();
  }

  beatStage(): void {
    this.stageService.beatCurrentStage();
  }
}
