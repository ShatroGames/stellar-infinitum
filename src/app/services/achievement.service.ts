import { Injectable, computed, inject, signal } from '@angular/core';
import { Achievement, ACHIEVEMENTS, AchievementCategory } from '../models/achievement.model';
import { SaveService } from '../core/save.service';
import { StageService } from '../core/stage.service';
import { Stage1Service } from '../stages/stage1/stage1.service';

export interface AchievementNotification {
  achievement: Achievement;
  timestamp: number;
}

interface AchievementsSave {
  unlocked: { id: string; at?: number }[];
}

const NOTIFICATION_MS = 4000;

@Injectable({ providedIn: 'root' })
export class AchievementService {
  private saveService = inject(SaveService);
  private stageService = inject(StageService);
  private stage1 = inject(Stage1Service);

  private achievements = signal(new Map<string, Achievement>());
  private notifications = signal<AchievementNotification[]>([]);

  readonly unlockedCount = computed(() => Array.from(this.achievements().values()).filter(a => a.unlocked).length);
  readonly totalCount = computed(() => this.achievements().size);
  readonly unlockedByCategory = computed(() => this.countBy(a => a.unlocked));
  readonly totalByCategory = computed(() => this.countBy(() => true));
  readonly playTime = this.stageService.playTime;

  constructor() {
    const saved = this.saveService.read<AchievementsSave>('achievements');
    const map = new Map<string, Achievement>();
    for (const def of ACHIEVEMENTS) {
      const entry = saved?.unlocked.find(u => u.id === def.id);
      map.set(def.id, { ...def, unlocked: !!entry, unlockedAt: entry?.at });
    }
    this.achievements.set(map);
    this.saveService.register('achievements', () => ({
      unlocked: Array.from(this.achievements().values()).filter(a => a.unlocked).map(a => ({ id: a.id, at: a.unlockedAt })),
    }));
    window.setInterval(() => this.check(), 1000);
  }

  getAchievements() {
    return this.achievements.asReadonly();
  }

  getNotifications() {
    return this.notifications.asReadonly();
  }

  getAchievementsByCategory(category: AchievementCategory): Achievement[] {
    return Array.from(this.achievements().values()).filter(a => a.category === category);
  }

  private check(): void {
    const beaten = this.stageService.stagesBeaten();
    const inStage1 = this.stageService.current().id === 'stage1';
    this.unlockIf('welcome', true);
    this.unlockIf('stage1_beaten', beaten >= 1);
    if (inStage1) {
      const energy = this.stage1.currency();
      this.unlockIf('first_node', this.stage1.skills().some(s => s.level > 0) || this.stage1.tier() > 1);
      this.unlockIf('energy_1m', energy.gte(1e6));
      this.unlockIf('energy_1t', energy.gte(1e12));
      this.unlockIf('first_warp', this.stage1.tier() >= 2);
      this.unlockIf('tier_3', this.stage1.tier() >= 3);
      this.unlockIf('tier_5', this.stage1.tier() >= 5);
    } else {
      // Everything in a beaten stage was reached on the way (no missable achievements)
      for (const a of ACHIEVEMENTS) if (a.category === AchievementCategory.STAGE1) this.unlockIf(a.id, true);
    }
  }

  private unlockIf(id: string, condition: boolean): void {
    const achievement = this.achievements().get(id);
    if (!condition || !achievement || achievement.unlocked) return;
    const unlocked = { ...achievement, unlocked: true, unlockedAt: Date.now() };
    this.achievements.update(map => new Map(map).set(id, unlocked));
    this.notifications.update(list => [...list, { achievement: unlocked, timestamp: Date.now() }].slice(-3));
    window.setTimeout(() => this.notifications.update(list => list.filter(n => n.achievement.id !== id)), NOTIFICATION_MS);
    this.saveService.save();
  }

  private countBy(predicate: (a: Achievement) => boolean): Map<AchievementCategory, number> {
    const counts = new Map<AchievementCategory, number>();
    this.achievements().forEach(a => {
      if (predicate(a)) counts.set(a.category, (counts.get(a.category) ?? 0) + 1);
    });
    return counts;
  }
}
