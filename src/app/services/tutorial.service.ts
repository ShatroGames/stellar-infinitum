import { Injectable, signal } from '@angular/core';

export interface TutorialPopup {
  id: string;
  title: string;
  content: string[];
  icon: string;
  shown: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TutorialService {
  private shownPopups = signal<Set<string>>(new Set());
  private currentPopup = signal<TutorialPopup | null>(null);

  private tutorialPopups: Map<string, TutorialPopup> = new Map([
    ['game_start', {
      id: 'game_start',
      title: 'Welcome to Stellar Infinitum!',
      content: [
        '⚡ Click on skill nodes to upgrade them and increase Energy production',
        '🎯 Max out all skills and reach the Energy goal to unlock Warp',
        '✦ Warping resets progress but doubles your production multiplier',
        '📈 Progress through 5 expanding tiers, each adding new skills'
      ],
      icon: '🌟',
      shown: false
    }],
    ['first_warp', {
      id: 'first_warp',
      title: 'First Warp Complete!',
      content: [
        '✦ You\'ve unlocked the next tier with more skills',
        '⚡ Your production multiplier has doubled!',
        '🎯 Complete all 5 tiers to unlock the Stellar Nexus',
        '💡 Each warp makes future runs faster'
      ],
      icon: '✦',
      shown: false
    }],
    ['stellar_nexus', {
      id: 'stellar_nexus',
      title: 'Stellar Nexus Unlocked!',
      content: [
        '★ Complete Tier 5 to earn Stellar Cores',
        '🌟 Spend Cores on permanent upgrades that persist through warps',
        '⚙️ Unlock Auto-Buy and Auto-Warp for automation',
        '🚀 Permanent upgrades make each run significantly faster'
      ],
      icon: '★',
      shown: false
    }],
    ['first_transcend', {
      id: 'first_transcend',
      title: 'Transcendence Achieved!',
      content: [
        '◆ You\'ve gained Echo Fragments - a new permanent currency',
        '🌌 Unlock Dimensional Echoes for powerful dimensional upgrades',
        '💎 Each transcend grants more fragments based on total Energy',
        '⚡ Dimensional upgrades affect ALL production globally'
      ],
      icon: '◆',
      shown: false
    }],
    ['dimensional_echoes', {
      id: 'dimensional_echoes',
      title: 'Dimensional Echoes Unlocked!',
      content: [
        '🌌 5 dimensions, each with unique upgrade paths',
        '💎 Spend Echo Fragments to unlock powerful bonuses',
        '🔄 Max out 4 dimensions to unlock Cosmic Collapse',
        '⚛️ Collapse leads to the ultimate prestige: Quantum Weaving'
      ],
      icon: '🌌',
      shown: false
    }],
    ['cosmic_collapse', {
      id: 'cosmic_collapse',
      title: 'Cosmic Collapse Available!',
      content: [
        '🌌 You can now trigger Cosmic Collapse',
        '⚛️ Unlocks Quantum Weaving - 3 parallel skill trees',
        '🔗 Create Entanglements between nodes for hybrid effects',
        '⚠️ WARNING: Resets ALL progress except Achievements!'
      ],
      icon: '🌌',
      shown: false
    }],
    ['artifacts_unlocked', {
      id: 'artifacts_unlocked',
      title: 'Ancient Artifacts Discovered!',
      content: [
        '🔬 You\'ve unlocked the Ancient Tech Tree!',
        '⚛️ Research artifacts to massively boost Quanta production',
        '📈 Three branches: Production, Multiplier, and Efficiency',
        '⬡ Unlock Cross-Branch artifacts for ultimate power',
        '💡 All quantum trees should be maxed by now - artifacts are your new path forward!'
      ],
      icon: '🔬',
      shown: false
    }]
  ]);

  hasShown(popupId: string): boolean {
    return this.shownPopups().has(popupId);
  }

  showPopup(popupId: string): void {
    if (this.hasShown(popupId)) return;

    const popup = this.tutorialPopups.get(popupId);
    if (popup) {
      this.currentPopup.set({ ...popup, shown: true });
    }
  }

  dismissPopup(popupId: string): void {
    this.shownPopups.update(shown => {
      const newSet = new Set(shown);
      newSet.add(popupId);
      return newSet;
    });
    this.currentPopup.set(null);
    this.save();
  }

  getCurrentPopup() {
    return this.currentPopup;
  }

  private save(): void {
    const data = Array.from(this.shownPopups());
    localStorage.setItem('stellarInfinitum_tutorials', JSON.stringify(data));
  }

  loadSaveData(): void {
    const saved = localStorage.getItem('stellarInfinitum_tutorials');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.shownPopups.set(new Set(data));
      } catch (e) {
        console.error('Failed to load tutorial data', e);
      }
    }
  }

  reset(): void {
    this.shownPopups.set(new Set());
    this.currentPopup.set(null);
    localStorage.removeItem('stellarInfinitum_tutorials');
  }
}
