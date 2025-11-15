import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ResourceDisplayComponent } from './components/resource-display/resource-display.component';
import { SkillTreeComponent } from './components/skill-tree/skill-tree.component';
import { PrestigePanelComponent } from './components/prestige-panel/prestige-panel.component';
import { AscensionTreeComponent } from './components/ascension-tree/ascension-tree.component';
import { OptionsComponent } from './components/options/options.component';
import { GameService } from './services/game.service';
import { SkillTreeService } from './services/skill-tree.service';
import { AscensionService } from './services/ascension.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ResourceDisplayComponent, SkillTreeComponent, PrestigePanelComponent, AscensionTreeComponent, OptionsComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('Stellar Infinitum');
  private gameService = inject(GameService);
  private skillTreeService = inject(SkillTreeService);
  protected ascensionService = inject(AscensionService);
  public currentYear = new Date().getFullYear();
  
  activeTab = signal<'skill' | 'ascension' | 'options'>('skill');
}
