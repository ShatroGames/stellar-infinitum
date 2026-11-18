import { Component, inject, signal } from '@angular/core';
import { StageService } from '../../core/stage.service';
import { SaveService } from '../../core/save.service';
import { formatNumber } from '../../utils/numbers';

/** "While you were away" summary and the notice about archived pre-rebuild saves */
@Component({
  selector: 'app-notices',
  templateUrl: './notices.html',
  styleUrl: './notices.css',
})
export class Notices {
  protected stageService = inject(StageService);
  protected saveService = inject(SaveService);
  protected copied = signal(false);
  protected fmt = (v: Parameters<typeof formatNumber>[0]) => formatNumber(v);

  duration(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${Math.max(1, m)}m`;
  }

  copyLegacySave(): void {
    const archive = this.saveService.legacyArchiveString();
    if (!archive) return;
    navigator.clipboard.writeText(archive).then(() => this.copied.set(true));
  }
}
