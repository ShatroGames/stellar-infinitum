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
import { SaveManagerService } from '../../services/save-manager.service';
import { IMPORT_ACHIEVEMENT_FLAG } from '../../services/achievement.service';

/** Export field name -> localStorage key, for every system that saves state */
const SAVE_KEYS: Record<string, string> = {
  gameState: 'treefinite_save',
  skills: 'treefinite_skills',
  prestige: 'treefinite_prestige',
  ascension: 'ascensionTree',
  achievements: 'treefinite_achievements',
  dimensions: 'stellarInfinitum_dimensions',
  quantum: 'stellarInfinitum_quantum',
  tutorials: 'stellarInfinitum_tutorials',
  artifacts: 'stellarInfinitum_artifacts',
  forge: 'probabilityForgeState',
  eternal: 'stellarInfinitum_eternal'
};

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
  private saveManager = inject(SaveManagerService);

  showImportDialog = false;
  importText = '';
  exportMessage = '';
  importMessage = '';
  
  // Expose eternal stats for template
  totalVictories = this.eternalProgress.totalVictories;
  hasEverWon = this.eternalProgress.hasEverWon;

  exportSave(): void {
    try {
      // First, save current game state to localStorage
      this.gameService.saveGameState();
      this.skillTreeService.saveSkills();
      this.skillTreeService.savePrestige();
      this.ascensionService.saveState();
      this.dimensionService.saveState();
      this.quantumService.saveState();
      this.probabilityForgeService.saveState();
      // Note: achievements, artifacts and tutorials save on every change

      // Write pending saves now so the export is current
      this.saveManager.flushAll();

      // Now gather all save data from localStorage
      const saveData: Record<string, string | null> = {};
      for (const [field, key] of Object.entries(SAVE_KEYS)) {
        saveData[field] = localStorage.getItem(key);
      }

      // Encode to base64 (handle Unicode properly)
      const jsonString = JSON.stringify(saveData);
      const encoded = btoa(encodeURIComponent(jsonString).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
      }));

      // Copy to clipboard
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

      // Decode from base64 (handle Unicode properly)
      const decoded = atob(this.importText.trim());
      const decodedString = decodeURIComponent(decoded.split('').map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      const saveData = JSON.parse(decodedString);

      // Validate save data structure
      if (!saveData || typeof saveData !== 'object') {
        throw new Error('Invalid save data format');
      }

      // Stop pending saves from overwriting the imported data on reload
      this.saveManager.suspend();

      // Import each piece of save data
      for (const [field, key] of Object.entries(SAVE_KEYS)) {
        if (saveData[field]) {
          localStorage.setItem(key, saveData[field]);
        }
      }
      localStorage.setItem(IMPORT_ACHIEVEMENT_FLAG, '1');

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
        this.saveManager.suspend();
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
        // Record the reset in eternal progress
        this.eternalProgress.recordReset();
        this.saveManager.suspend();
        
        // Reset all game systems
        this.gameService.resetGame();
        this.skillTreeService.resetAll();
        this.ascensionService.reset();
        this.achievementService.reset();
        this.dimensionService.reset();
        this.quantumService.reset();
        this.artifactService.reset();
        this.probabilityForgeService.reset();
        this.tutorialService.reset();
        
        // Reload to start fresh
        window.location.reload();
      }
    }
  }

  skipToPostCollapse(): void {
    if (confirm('Skip to Post-Collapse state? This will reset all progress except achievements.')) {
      // Reset all pre-quantum systems
      this.saveManager.suspend();
      this.gameService.resetGame();
      this.skillTreeService.resetAll();
      this.ascensionService.reset();
      this.dimensionService.reset();
      this.artifactService.reset();
      
      // Initialize quantum state (post-collapse)
      this.quantumService.initializeQuantumState();
      
      // Grant the collapse achievement
      this.achievementService.unlockAchievement('cosmic_collapse');
      
      // Mark collapse tutorial as shown by dismissing it
      this.tutorialService.dismissPopup('cosmic_collapse');
      
      // Save everything (quantum auto-saves)
      this.gameService.saveGameState();
      this.skillTreeService.saveSkills();
      this.skillTreeService.savePrestige();
      this.ascensionService.saveState();
      this.dimensionService.saveState();
      
      // Reload to apply changes
      window.location.reload();
    }
  }
}
