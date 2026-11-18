import { Component, inject } from '@angular/core';
import { StageService } from '../../../core/stage.service';

/** Shown for stages that are not built yet */
@Component({
  selector: 'app-placeholder-view',
  template: `
    <div class="placeholder">
      <h2>{{ stageService.current().name }}</h2>
      <p>This stage is being built.</p>
      <p>Your {{ stageService.current().currencyName }} keeps growing at
        +{{ stageService.current().rate().toString() }}/s in the meantime.</p>
    </div>
  `,
  styles: [`
    .placeholder { padding: 48px 24px; text-align: center; color: #a3a3a3; }
    h2 { color: #e5e5e5; margin-bottom: 12px; }
    p + p { margin-top: 8px; }
  `],
})
export class PlaceholderView {
  protected stageService = inject(StageService);
}
