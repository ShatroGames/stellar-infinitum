import { Injectable } from '@angular/core';

/**
 * Centralized save manager that batches and debounces localStorage operations
 * to reduce I/O overhead and improve performance
 */
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
    // Save on page unload to ensure no data loss
    window.addEventListener('beforeunload', () => {
      this.flushAll();
    });
  }

  /**
   * Schedule a save operation. It will be debounced and batched with other saves.
   * @param key Unique identifier for this save operation
   * @param saveFn Function that performs the actual save
   */
  scheduleSave(key: string, saveFn: () => void): void {
    this.pendingSaves.set(key, saveFn);
    
    // Clear existing timeout
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
    }

    // Schedule new save
    this.saveTimeout = window.setTimeout(() => {
      this.flush();
    }, this.DEBOUNCE_MS);
  }

  /**
   * Immediately execute all pending save operations
   */
  flushAll(): void {
    if (this.saveTimeout !== null) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.flush();
  }

  /**
   * Execute pending saves if enough time has passed
   */
  private flush(): void {
    const now = Date.now();
    
    // Respect minimum save interval
    if (now - this.lastSaveTime < this.MIN_SAVE_INTERVAL_MS && this.pendingSaves.size > 0) {
      // Reschedule for later
      this.saveTimeout = window.setTimeout(() => {
        this.flush();
      }, this.MIN_SAVE_INTERVAL_MS - (now - this.lastSaveTime));
      return;
    }

    if (this.pendingSaves.size === 0) {
      return;
    }

    // Execute all pending saves in a batch
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

  /**
   * Force an immediate save for a specific key (bypasses debouncing)
   */
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
