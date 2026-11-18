import { Injectable, computed, inject, signal } from '@angular/core';
import { Decimal } from '../utils/numbers';
import { SaveService } from './save.service';
import { StageModule, SummaryValue } from './stage';
import { Stage1Service } from '../stages/stage1/stage1.service';
import { PlaceholderStage } from '../stages/placeholder/placeholder-stage';

/** Base income granted to the next stage when a stage is beaten (stage chain) */
export const STAGE_CHAIN_INCOME = 1;

/** Absences shorter than this get no return summary */
const AWAY_SUMMARY_MIN_SECONDS = 60;
/** A loop gap longer than this counts as time away (throttled tab, sleep) */
const AWAY_GAP_SECONDS = 2;
const TICK_MS = 100;
const SAVE_EVERY_SECONDS = 10;

export interface AwayReport {
  seconds: number;
  gains: { label: string; gained: Decimal }[];
}

interface StagesSave {
  current: number;
  data: Record<string, unknown>;
}

/**
 * Owns the stage chain and the single game loop. Time keeps passing while the
 * player is away (hidden tab, closed game, sleeping computer), but only time-based
 * progress happens; the player makes every purchase and choice.
 */
@Injectable({ providedIn: 'root' })
export class StageService {
  private saveService = inject(SaveService);

  readonly stages: StageModule[] = [
    inject(Stage1Service),
    new PlaceholderStage('stage2', 'In development', 'Stage 2 currency'),
    new PlaceholderStage('stage3', 'In development', 'Stage 3 currency'),
  ];

  readonly currentIndex = signal(0);
  readonly current = computed(() => this.stages[this.currentIndex()]);
  readonly stagesBeaten = computed(() => this.currentIndex());
  /** Seconds the game has been running (not counting time away) */
  readonly playTime = signal(0);
  /** Pending "while you were away" summary */
  readonly awayReport = signal<AwayReport | null>(null);

  private lastTick = Date.now();
  private sinceSave = 0;
  private hiddenAt: number | null = null;
  private hiddenSnapshot: SummaryValue[] = [];

  constructor() {
    this.load();
    this.saveService.register('stages', () => this.serialize());
    this.saveService.register('stats', () => ({ playTime: this.playTime() }));
    this.applyTimeSinceSave();

    window.setInterval(() => this.loop(), TICK_MS);
    document.addEventListener('visibilitychange', () => this.onVisibilityChange());
  }

  /** Beat the current stage: the next stage's currency starts at +1/s */
  beatCurrentStage(): boolean {
    const stage = this.current();
    if (!stage.isComplete() || this.currentIndex() >= this.stages.length - 1) return false;
    this.currentIndex.update(i => i + 1);
    this.current().start(STAGE_CHAIN_INCOME);
    this.saveService.save();
    return true;
  }

  dismissAwayReport(): void {
    this.awayReport.set(null);
  }

  // --- loop ------------------------------------------------------------------------

  private loop(): void {
    const now = Date.now();
    const seconds = (now - this.lastTick) / 1000;
    this.lastTick = now;
    if (seconds <= 0) return;

    if (seconds > AWAY_GAP_SECONDS) {
      this.current().advanceTime(seconds);
    } else {
      this.current().tick(seconds, !document.hidden);
      if (!document.hidden) this.playTime.update(t => t + seconds);
    }

    this.sinceSave += seconds;
    if (this.sinceSave >= SAVE_EVERY_SECONDS) {
      this.sinceSave = 0;
      this.saveService.save();
    }
  }

  private onVisibilityChange(): void {
    if (document.hidden) {
      this.hiddenAt = Date.now();
      this.hiddenSnapshot = this.current().summary();
      this.saveService.save();
    } else if (this.hiddenAt !== null) {
      const seconds = (Date.now() - this.hiddenAt) / 1000;
      this.hiddenAt = null;
      // Let the loop catch up first so the summary includes the whole absence
      this.loop();
      this.reportAway(seconds, this.hiddenSnapshot, this.current().summary());
    }
  }

  /** Progress for the time the game was closed */
  private applyTimeSinceSave(): void {
    const savedAt = this.saveService.savedAt;
    if (savedAt === null) return;
    const seconds = Math.max(0, (Date.now() - savedAt) / 1000);
    const before = this.current().summary();
    this.current().advanceTime(seconds);
    this.reportAway(seconds, before, this.current().summary());
  }

  private reportAway(seconds: number, before: SummaryValue[], after: SummaryValue[]): void {
    if (seconds < AWAY_SUMMARY_MIN_SECONDS) return;
    const gains = after.map(a => ({
      label: a.label,
      gained: a.value.minus(before.find(b => b.label === a.label)?.value ?? new Decimal(0)),
    })).filter(g => g.gained.gt(0));
    if (gains.length) this.awayReport.set({ seconds, gains });
  }

  // --- save ----------------------------------------------------------------------------

  private serialize(): StagesSave {
    const data: Record<string, unknown> = {};
    for (const stage of this.stages) data[stage.id] = stage.serialize();
    return { current: this.currentIndex(), data };
  }

  private load(): void {
    const save = this.saveService.read<StagesSave>('stages');
    if (save) {
      this.currentIndex.set(Math.min(Math.max(0, save.current ?? 0), this.stages.length - 1));
      for (const stage of this.stages) stage.deserialize(save.data?.[stage.id]);
    }
    const stats = this.saveService.read<{ playTime?: number }>('stats');
    this.playTime.set(stats?.playTime ?? 0);
  }
}
