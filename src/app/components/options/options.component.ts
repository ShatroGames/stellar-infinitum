import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SaveService } from '../../core/save.service';

@Component({
  selector: 'app-options',
  imports: [FormsModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class OptionsComponent {
  private saveService = inject(SaveService);

  showImportDialog = false;
  importText = '';
  exportMessage = '';
  importMessage = '';
  hasLegacySave = this.saveService.legacyArchiveString() !== null;

  exportSave(): void {
    this.copy(this.saveService.exportString(), 'Save copied to clipboard.');
  }

  copyLegacySave(): void {
    const archive = this.saveService.legacyArchiveString();
    if (archive) this.copy(archive, 'Old (pre-rebuild) save copied to clipboard.');
  }

  openImportDialog(): void {
    this.showImportDialog = true;
    this.importText = '';
    this.importMessage = '';
  }

  closeImportDialog(): void {
    this.showImportDialog = false;
  }

  importSave(): void {
    if (!this.importText.trim()) {
      this.importMessage = 'Paste a save first.';
      return;
    }
    try {
      this.saveService.importString(this.importText);
      this.importMessage = 'Save imported. Reloading…';
      setTimeout(() => window.location.reload(), 800);
    } catch (error) {
      this.importMessage = 'This save could not be read: ' + (error as Error).message;
    }
  }

  fullReset(): void {
    if (!confirm('Erase all progress, including achievements? This cannot be undone.')) return;
    this.saveService.wipe();
    window.location.reload();
  }

  private copy(text: string, success: string): void {
    navigator.clipboard.writeText(text)
      .then(() => this.exportMessage = success)
      .catch(() => this.exportMessage = 'Copying to the clipboard failed.');
    setTimeout(() => this.exportMessage = '', 4000);
  }
}
