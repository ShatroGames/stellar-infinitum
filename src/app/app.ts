import { Component, computed, effect, inject, signal } from '@angular/core';
import { StageService } from './core/stage.service';
import { SaveService } from './core/save.service';
import { Stage1Service } from './stages/stage1/stage1.service';
import { AchievementService } from './services/achievement.service';
import { TutorialService } from './services/tutorial.service';
import { SkillTreeComponent } from './components/skill-tree/skill-tree.component';
import { Stage1Panel } from './stages/stage1/stage1-panel/stage1-panel';
import { PlaceholderView } from './stages/placeholder/placeholder-view/placeholder-view';
import { CurrencyDisplay } from './components/currency-display/currency-display';
import { Notices } from './components/notices/notices';
import { Achievements } from './components/achievements/achievements';
import { OptionsComponent } from './components/options/options.component';
import { TutorialPopup } from './components/tutorial-popup/tutorial-popup';

type Tab = 'stage' | 'achievements' | 'options';

@Component({
  selector: 'app-root',
  imports: [
    SkillTreeComponent, Stage1Panel, PlaceholderView, CurrencyDisplay, Notices,
    Achievements, OptionsComponent, TutorialPopup,
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected stageService = inject(StageService);
  protected achievementService = inject(AchievementService);
  private tutorialService = inject(TutorialService);
  private stage1 = inject(Stage1Service);
  private saveService = inject(SaveService);

  protected activeTab = signal<Tab>('stage');
  protected stageNumber = computed(() => this.stageService.currentIndex() + 1);
  protected currentYear = new Date().getFullYear();

  constructor() {
    // Tutorials follow natural progression
    effect(() => {
      // Wait until notices (rebuilt-game notice, away summary) are dismissed
      if (this.saveService.legacyNotice() || this.stageService.awayReport()) return;
      if (this.stageService.stagesBeaten() >= 1) this.tutorialService.showPopup('stage_beaten');
      else if (this.stage1.tier() >= 2) this.tutorialService.showPopup('first_warp');
      else this.tutorialService.showPopup('game_start');
    });
  }
}
