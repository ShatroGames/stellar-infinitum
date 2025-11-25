import { Injectable } from '@angular/core';
@Injectable({
  providedIn: 'root'
})
export class SaveManagerService {
  private pendingSaves = new Map<string, () => void>();
  private saveTimeout: number | null = null;
  private readonly DEBOUNCE_MS = 1000; // Wait 1 second before saving
  private lastSaveTime = 0;
  private readonly MIN_SAVE_INTERVAL_MS = 5000; // Minimum 5 seconds between saves
  constructor() {
    window.addEventListener('beforeunload', () => {
      this.flushAll();
    });
  }
  scheduleSave(key: string, saveFn: () => void): void {
    this.pendingSaves.set(key, saveFn);
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = window.setTimeout(() => {
      this.flush();
    }, this.DEBOUNCE_MS);
  }
  flushAll(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.flush();
  }
  private flush(): void {
    const now = Date.now();
    if (now - this.lastSaveTime < this.MIN_SAVE_INTERVAL_MS && this.pendingSaves.size > 0) {
      this.saveTimeout = window.setTimeout(() => {
        this.flush();
      }, this.MIN_SAVE_INTERVAL_MS - (now - this.lastSaveTime));
      return;
    }
    if (this.pendingSaves.size === 0) {
      return;
    }
    this.pendingSaves.forEach(saveFn => {
      try {
        saveFn();
      } catch (error) {
        console.error('Failed to execute save operation:', error);
      }
    });
    this.pendingSaves.clear();
    this.lastSaveTime = now;
    this.saveTimeout = null;
  }
  forceSave(key: string): void {
    const saveFn = this.pendingSaves.get(key);
    if (saveFn) {
      try {
        saveFn();
        this.pendingSaves.delete(key);
      } catch (error) {
        console.error('Failed to force save:', error);
      }
    }
  }
}