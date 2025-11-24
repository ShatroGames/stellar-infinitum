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
import { DevPanelComponent } from "./components/dev-panel/dev-panel.component";

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet, 
    ResourceDisplayComponent, 
    DevPanelComponent, 
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
  protected achievementService = inject(AchievementService); // Initialize to start achievement tracking
  protected quantumService = inject(QuantumService);
  protected artifactService = inject(ArtifactService);
  protected probabilityForgeService = inject(ProbabilityForgeService);
  protected tutorialService = inject(TutorialService);
  protected skillTreeService = inject(SkillTreeService);
  public currentYear = new Date().getFullYear();

  activeTab = signal<'skill' | 'ascension' | 'dimensions' | 'quantum' | 'artifacts' | 'forge' | 'collapse' | 'achievements' | 'options'>('skill');
  
  // Check if universe has collapsed
  hasCollapsed = computed(() => this.quantumService.hasCollapsed());
  
  // Check if at least 4 out of 5 dimensions are maxed
  canAccessCollapse = computed(() => {
    const dimensions = this.dimensionService.dimensions();
    const dimensionArray = Array.from(dimensions.values());
    
    const maxedDimensions = dimensionArray.filter(dim => 
      dim.nodes.every(node => node.level >= node.maxLevel)
    );
    
    return maxedDimensions.length >= 4;
  });

  constructor() {
    // Set initial active tab based on collapse state
    if (this.quantumService.hasCollapsed()) {
      this.activeTab.set('quantum');
    }
    
    // Load tutorial state
    this.tutorialService.loadSaveData();
    
    // Show game start tutorial if this is first time
    if (!this.tutorialService.hasShown('game_start')) {
      setTimeout(() => this.tutorialService.showPopup('game_start'), 500);
    }
    
    // Monitor for tutorial triggers
    this.monitorTutorialTriggers();
  }

  private monitorTutorialTriggers(): void {
    // Check every second for tutorial triggers
    setInterval(() => {
      // First warp tutorial
      if (!this.tutorialService.hasShown('first_warp') && 
          this.skillTreeService.allTimeAscensions() > 0) {
        this.tutorialService.showPopup('first_warp');
      }
      
      // Stellar Nexus unlocked
      if (!this.tutorialService.hasShown('stellar_nexus') && 
          this.ascensionService.totalPoints() > 0) {
        this.tutorialService.showPopup('stellar_nexus');
      }
      
      // First transcend (dimensional echoes unlocked)
      if (!this.tutorialService.hasShown('first_transcend') && 
          this.dimensionService.totalEchoFragments() > 0) {
        this.tutorialService.showPopup('first_transcend');
      }
      
      // Dimensional Echoes tab becomes available
      if (!this.tutorialService.hasShown('dimensional_echoes') && 
          this.ascensionService.isTreeComplete()) {
        this.tutorialService.showPopup('dimensional_echoes');
      }
      
      // Cosmic Collapse available
      if (!this.tutorialService.hasShown('cosmic_collapse') && 
          this.canAccessCollapse()) {
        this.tutorialService.showPopup('cosmic_collapse');
      }
      
      // Artifacts unlocked
      if (!this.tutorialService.hasShown('artifacts_unlocked') && 
          this.artifactService.systemUnlocked()) {
        this.tutorialService.showPopup('artifacts_unlocked');
        this.activeTab.set('artifacts'); // Auto-switch to artifacts tab
      }
    }, 1000);
  }
}
