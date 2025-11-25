import { Injectable, signal, computed } from '@angular/core';
interface EternalState {
  totalVictories: number; // Number of times player has won and reset
  firstVictoryTime?: number; // Timestamp of first victory
  lastResetTime?: number; // Timestamp of last full reset
  totalPlaytimeSessions: number; // Total playtime across all runs (seconds)
}
@Injectable({
  providedIn: 'root',
})
export class EternalProgress {
  private readonly STORAGE_KEY = 'stellarInfinitum_eternal';
  private state = signal<EternalState>({
    totalVictories: 0,
    totalPlaytimeSessions: 0
  });
  totalVictories = computed(() => this.state().totalVictories);
  firstVictoryTime = computed(() => this.state().firstVictoryTime);
  hasEverWon = computed(() => this.state().totalVictories > 0);
  constructor() {
    this.loadState();
  }
  recordVictory(): void {
    const now = Date.now();
    this.state.update(s => ({
      ...s,
      totalVictories: s.totalVictories + 1,
      firstVictoryTime: s.firstVictoryTime || now
    }));
    this.saveState();
  }
  recordReset(): void {
    this.state.update(s => ({
      ...s,
      lastResetTime: Date.now()
    }));
    this.saveState();
  }
  getStats(): EternalState {
    return this.state();
  }
  private saveState(): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.state()));
  }
  private loadState(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      this.state.set({
        totalVictories: data.totalVictories || 0,
        firstVictoryTime: data.firstVictoryTime,
        lastResetTime: data.lastResetTime,
        totalPlaytimeSessions: data.totalPlaytimeSessions || 0
      });
    } catch (e) {
      console.error('Failed to load eternal progress:', e);
    }
  }
}