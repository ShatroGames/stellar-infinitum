import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { SkillTreeService } from '../../services/skill-tree.service';
import { AscensionService } from '../../services/ascension.service';
import { AchievementService } from '../../services/achievement.service';
import { DimensionService } from '../../services/dimension.service';
import { QuantumService } from '../../services/quantum.service';
import { ArtifactService } from '../../services/artifact.service';
import { ProbabilityForgeService } from '../../services/probability-forge.service';
import { TutorialService } from '../../services/tutorial.service';
import { EternalProgress } from '../../services/eternal-progress';
@Component({
  selector: 'app-options',
  imports: [CommonModule, FormsModule],
  templateUrl: './options.component.html',
  styleUrl: './options.component.css'
})
export class OptionsComponent {
  private gameService = inject(GameService);
  private skillTreeService = inject(SkillTreeService);
  private ascensionService = inject(AscensionService);
  private achievementService = inject(AchievementService);
  private dimensionService = inject(DimensionService);
  private quantumService = inject(QuantumService);
  private artifactService = inject(ArtifactService);
  private probabilityForgeService = inject(ProbabilityForgeService);
  private tutorialService = inject(TutorialService);
  private eternalProgress = inject(EternalProgress);
  showImportDialog = false;
  importText = '';
  exportMessage = '';
  importMessage = '';
  totalVictories = this.eternalProgress.totalVictories;
  hasEverWon = this.eternalProgress.hasEverWon;
  exportSave(): void {
    try {
      this.gameService.saveGameState();
      this.skillTreeService.saveSkills();
      this.skillTreeService.savePrestige();
      this.ascensionService.saveState();
      this.dimensionService.saveState();
      const saveData = {
        gameState: localStorage.getItem('treefinite_save'),
        skills: localStorage.getItem('treefinite_skills'),
        prestige: localStorage.getItem('treefinite_prestige'),
        ascension: localStorage.getItem('ascensionTree'),
        achievements: localStorage.getItem('treefinite_achievements'),
        dimensions: localStorage.getItem('stellarInfinitum_dimensions'),
        quantum: localStorage.getItem('stellarInfinitum_quantum'),
        tutorials: localStorage.getItem('stellarInfinitum_tutorials')
      };
      const jsonString = JSON.stringify(saveData);
      const encoded = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      navigator.clipboard.writeText(encoded).then(() => {
        this.exportMessage = '[✓] Save data copied to clipboard!';
        setTimeout(() => this.exportMessage = '', 3000);
      }).catch((err) => {
        console.error('Clipboard error:', err);
        this.exportMessage = '[✗] Failed to copy to clipboard';
        setTimeout(() => this.exportMessage = '', 3000);
      });
    } catch (error) {
      console.error('Export error:', error);
      this.exportMessage = '[✗] Error exporting save data: ' + (error as Error).message;
      setTimeout(() => this.exportMessage = '', 5000);
    }
  }
  openImportDialog(): void {
    this.showImportDialog = true;
    this.importText = '';
    this.importMessage = '';
  }
  closeImportDialog(): void {
    this.showImportDialog = false;
    this.importText = '';
    this.importMessage = '';
  }
  importSave(): void {
    try {
      if (!this.importText.trim()) {
        this.importMessage = '[✗] Please paste save data';
        return;
      }
      const decoded = atob(this.importText.trim());
      const decodedString = decodeURIComponent(decoded.split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const saveData = JSON.parse(decodedString);
      if (!saveData || typeof saveData !== 'object') {
        throw new Error('Invalid save data format');
      }
      if (saveData.gameState) {
        localStorage.setItem('treefinite_save', saveData.gameState);
      }
      if (saveData.skills) {
        localStorage.setItem('treefinite_skills', saveData.skills);
      }
      if (saveData.prestige) {
        localStorage.setItem('treefinite_prestige', saveData.prestige);
      }
      if (saveData.ascension) {
        localStorage.setItem('ascensionTree', saveData.ascension);
      }
      if (saveData.achievements) {
        localStorage.setItem('treefinite_achievements', saveData.achievements);
      }
      if (saveData.dimensions) {
        localStorage.setItem('stellarInfinitum_dimensions', saveData.dimensions);
      }
      if (saveData.quantum) {
        localStorage.setItem('stellarInfinitum_quantum', saveData.quantum);
      }
      if (saveData.tutorials) {
        localStorage.setItem('stellarInfinitum_tutorials', saveData.tutorials);
      }
      this.importMessage = '[✓] Save imported successfully! Reloading...';
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Import error:', error);
      this.importMessage = '[✗] Invalid save data format: ' + (error as Error).message;
      console.error('Import error:', error);
    }
  }
  saveGame(): void {
    this.gameService.saveGameState();
    this.skillTreeService.saveSkills();
    this.skillTreeService.savePrestige();
    this.ascensionService.saveState();
    this.exportMessage = '[✓] Game saved successfully!';
    setTimeout(() => this.exportMessage = '', 3000);
  }
  resetGame(): void {
    if (confirm('Are you sure you want to COMPLETELY reset the game? This will erase ALL progress including warps and ascension points!')) {
      if (confirm('This action cannot be undone! Are you absolutely sure?')) {
        this.gameService.resetGame();
        this.skillTreeService.resetAll();
        this.ascensionService.reset();
        this.achievementService.reset();
        this.dimensionService.reset();
        this.quantumService.reset();
        this.artifactService.reset();
        this.probabilityForgeService.reset();
        this.tutorialService.reset();
        window.location.reload();
      }
    }
  }
  fullReset(): void {
    const hasWon = this.quantumService.hasWon();
    const totalVictories = this.totalVictories();
    let message = 'FULL RESET: This will erase EVERYTHING including achievements and tutorials.\n';
    if (totalVictories > 0) {
      message += `\nYou have ${totalVictories} victory reset(s). This count will be preserved for future features.\n`;
    }
    message += '\nAre you absolutely sure?';
    if (confirm(message)) {
      if (confirm('FINAL WARNING: This cannot be undone! Continue with full reset?')) {
        this.eternalProgress.recordReset();
        this.gameService.resetGame();
        this.skillTreeService.resetAll();
        this.ascensionService.reset();
        this.achievementService.reset();
        this.dimensionService.reset();
        this.quantumService.reset();
        this.artifactService.reset();
        this.probabilityForgeService.reset();
        this.tutorialService.reset();
        window.location.reload();
      }
    }
  }
  skipToPostCollapse(): void {
    if (confirm('Skip to Post-Collapse state? This will reset all progress except achievements.')) {
      this.gameService.resetGame();
      this.skillTreeService.resetAll();
      this.ascensionService.reset();
      this.dimensionService.reset();
      this.artifactService.reset();
      this.quantumService.initializeQuantumState();
      this.achievementService.unlockAchievement('cosmic_collapse');
      this.tutorialService.dismissPopup('cosmic_collapse');
      this.gameService.saveGameState();
      this.skillTreeService.saveSkills();
      this.skillTreeService.savePrestige();
      this.ascensionService.saveState();
      this.dimensionService.saveState();
      window.location.reload();
    }
  }
}