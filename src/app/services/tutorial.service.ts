import { Injectable, inject, signal } from '@angular/core';
import { SaveService } from '../core/save.service';

export interface TutorialPopup {
  id: string;
  title: string;
  content: string[];
  icon: string;
}

const POPUPS: TutorialPopup[] = [
  {
    id: 'game_start',
    title: 'Welcome to Stellar Infinitum',
    icon: '✨',
    content: [
      'Click nodes to level them up with Energy.',
      'A node unlocks once the nodes above it are maxed.',
      'Max every node and reach the Energy goal to warp to the next tier.',
    ],
  },
  {
    id: 'first_warp',
    title: 'Warp complete',
    icon: '➶',
    content: [
      'Each tier keeps the earlier nodes and adds new ones.',
      'Warping resets your Energy and nodes, but production stays boosted for this stage.',
      'Beat Tier 5 to complete Stage 1.',
    ],
  },
  {
    id: 'stage_beaten',
    title: 'Stage complete',
    icon: '◇',
    content: [
      'Each stage you beat starts the next stage\'s currency at +1 per second.',
      'The next stage is still being built. Its currency keeps growing in the meantime.',
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class TutorialService {
  private saveService = inject(SaveService);
  private shown = new Set<string>(this.saveService.read<string[]>('tutorials') ?? []);
  private currentPopup = signal<TutorialPopup | null>(null);

  constructor() {
    this.saveService.register('tutorials', () => Array.from(this.shown));
  }

  hasShown(id: string): boolean {
    return this.shown.has(id);
  }

  showPopup(id: string): void {
    if (this.shown.has(id) || this.currentPopup()) return;
    const popup = POPUPS.find(p => p.id === id);
    if (popup) this.currentPopup.set(popup);
  }

  dismissPopup(id: string): void {
    this.shown.add(id);
    this.currentPopup.set(null);
    this.saveService.save();
  }

  getCurrentPopup() {
    return this.currentPopup.asReadonly();
  }
}
