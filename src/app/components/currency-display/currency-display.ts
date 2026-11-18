import { Component, inject } from '@angular/core';
import { StageService } from '../../core/stage.service';
import { formatNumber } from '../../utils/numbers';

/** The current stage's currency and rate */
@Component({
  selector: 'app-currency-display',
  template: `
    <div class="currency">
      <span class="label">{{ stageService.current().currencyName }}</span>
      <span class="amount">{{ fmt(stageService.current().currency()) }}</span>
      <span class="rate">+{{ fmt(stageService.current().rate()) }}/s</span>
    </div>
  `,
  styles: [`
    .currency {
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: baseline;
      gap: 2px 12px;
      padding: 16px 20px;
      border: 1px solid #262626;
      border-radius: 12px;
      background: #141414;
    }
    .label { color: #a3a3a3; font-size: 0.85rem; grid-column: 1 / -1; }
    .amount { font-size: 1.75rem; font-weight: 700; color: #60a5fa; font-variant-numeric: tabular-nums; }
    .rate { color: #4ade80; font-size: 0.9rem; font-variant-numeric: tabular-nums; }
  `],
})
export class CurrencyDisplay {
  protected stageService = inject(StageService);
  protected fmt = (v: Parameters<typeof formatNumber>[0]) => formatNumber(v);
}
