import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ResourceDisplayComponent } from './components/resource-display/resource-display.component';
import { SkillTreeComponent } from './components/skill-tree/skill-tree.component';
import { PrestigePanelComponent } from './components/prestige-panel/prestige-panel.component';
import { AscensionTreeComponent } from './components/ascension-tree/ascension-tree.component';
import { DimensionPanelComponent } from './components/dimension-panel/dimension-panel';
import { QuantumDisplayComponent } from './components/quantum-display/quantum-display.component';
import { ArtifactTreeComponent } from './components/artifact-tree/artifact-tree.component';
import { ProbabilityForgeComponent } from './components/probability-forge/probability-forge';
import { OptionsComponent } from './components/options/options.component';
import { Achievements } from './components/achievements/achievements';
import { QuantumTree } from './components/quantum-tree/quantum-tree';
import { CollapsePanel } from './components/collapse-panel/collapse-panel';
import { TutorialPopup } from './components/tutorial-popup/tutorial-popup';
import { VictoryScreen } from './components/victory-screen/victory-screen';
import { AscensionService } from './services/ascension.service';
import { DimensionService } from './services/dimension.service';
import { AchievementService } from './services/achievement.service';
import { QuantumService } from './services/quantum.service';
import { ArtifactService } from './services/artifact.service';
import { ProbabilityForgeService } from './services/probability-forge.service';
import { TutorialService } from './services/tutorial.service';
import { SkillTreeService } from './services/skill-tree.service';
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    ResourceDisplayComponent,
    SkillTreeComponent, 
    PrestigePanelComponent, 
    AscensionTreeComponent, 
    DimensionPanelComponent, 
    QuantumTree, 
    CollapsePanel, 
    QuantumDisplayComponent, 
    ArtifactTreeComponent,
    ProbabilityForgeComponent,
    OptionsComponent, 
    Achievements, 
    TutorialPopup,
    VictoryScreen
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Stellar Infinitum');
  protected ascensionService = inject(AscensionService);
  protected dimensionService = inject(DimensionService);
  protected achievementService = inject(AchievementService);
  protected quantumService = inject(QuantumService);
  protected artifactService = inject(ArtifactService);
  protected probabilityForgeService = inject(ProbabilityForgeService);
  protected tutorialService = inject(TutorialService);
  protected skillTreeService = inject(SkillTreeService);
  public currentYear = new Date().getFullYear();
  activeTab = signal<'skill' | 'ascension' | 'dimensions' | 'quantum' | 'artifacts' | 'forge' | 'collapse' | 'achievements' | 'options'>('skill');
  hasCollapsed = computed(() => this.quantumService.hasCollapsed());
  canAccessCollapse = computed(() => {
    const dimensions = this.dimensionService.dimensions();
    const dimensionArray = Array.from(dimensions.values());
    const maxedDimensions = dimensionArray.filter(dim => 
      dim.nodes.every(node => node.level >= node.maxLevel)
    );
    return maxedDimensions.length >= 4;
  });
  constructor() {
    if (this.quantumService.hasCollapsed()) {
      this.activeTab.set('quantum');
    }
    this.tutorialService.loadSaveData();
    if (!this.tutorialService.hasShown('game_start')) {
      setTimeout(() => this.tutorialService.showPopup('game_start'), 500);
    }
    this.monitorTutorialTriggers();
  }
  private monitorTutorialTriggers(): void {
    setInterval(() => {
      if (!this.tutorialService.hasShown('first_warp') && 
          this.skillTreeService.allTimeAscensions() > 0) {
        this.tutorialService.showPopup('first_warp');
      }
      if (!this.tutorialService.hasShown('stellar_nexus') && 
          this.ascensionService.totalPoints() > 0) {
        this.tutorialService.showPopup('stellar_nexus');
      }
      if (!this.tutorialService.hasShown('first_transcend') && 
          this.dimensionService.totalEchoFragments() > 0) {
        this.tutorialService.showPopup('first_transcend');
      }
      if (!this.tutorialService.hasShown('dimensional_echoes') && 
          this.ascensionService.isTreeComplete()) {
        this.tutorialService.showPopup('dimensional_echoes');
      }
      if (!this.tutorialService.hasShown('cosmic_collapse') && 
          this.canAccessCollapse()) {
        this.tutorialService.showPopup('cosmic_collapse');
      }
      if (!this.tutorialService.hasShown('artifacts_unlocked') && 
          this.artifactService.systemUnlocked()) {
        this.tutorialService.showPopup('artifacts_unlocked');
        this.activeTab.set('artifacts');
      }
    }, 1000);
  }
}