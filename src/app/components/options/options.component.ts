import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { SkillTreeService } from '../../services/skill-tree.service';
import { AscensionService } from '../../services/ascension.service';

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

  showImportDialog = false;
  importText = '';
  exportMessage = '';
  importMessage = '';

  exportSave(): void {
    try {
      // First, save current game state to localStorage
      this.gameService.saveGameState();
      this.skillTreeService.saveSkills();
      this.skillTreeService.savePrestige();
      this.ascensionService.saveState();

      // Now gather all save data from localStorage (using correct keys)
      const saveData = {
        gameState: localStorage.getItem('treefinite_save'),
        skills: localStorage.getItem('treefinite_skills'),
        prestige: localStorage.getItem('treefinite_prestige'),
        ascension: localStorage.getItem('ascensionTree')
      };

      // Encode to base64
      const jsonString = JSON.stringify(saveData);
      const encoded = btoa(jsonString);

      // Copy to clipboard
      navigator.clipboard.writeText(encoded).then(() => {
        this.exportMessage = '✓ Save data copied to clipboard!';
        setTimeout(() => this.exportMessage = '', 3000);
      }).catch(() => {
        this.exportMessage = '✗ Failed to copy to clipboard';
        setTimeout(() => this.exportMessage = '', 3000);
      });
    } catch (error) {
      this.exportMessage = '✗ Error exporting save data';
      setTimeout(() => this.exportMessage = '', 3000);
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
        this.importMessage = '✗ Please paste save data';
        return;
      }

      // Decode from base64
      const decoded = atob(this.importText.trim());
      const saveData = JSON.parse(decoded);

      // Validate save data structure
      if (!saveData || typeof saveData !== 'object') {
        throw new Error('Invalid save data format');
      }

      // Import each piece of save data (using correct keys)
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

      this.importMessage = '✓ Save imported successfully! Reloading...';
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      this.importMessage = '✗ Invalid save data format';
      console.error('Import error:', error);
    }
  }

  saveGame(): void {
    this.gameService.saveGameState();
    this.skillTreeService.saveSkills();
    this.skillTreeService.savePrestige();
    this.ascensionService.saveState();
    
    this.exportMessage = '✓ Game saved successfully!';
    setTimeout(() => this.exportMessage = '', 3000);
  }

  resetGame(): void {
    if (confirm('Are you sure you want to COMPLETELY reset the game? This will erase ALL progress including warps and ascension points!')) {
      if (confirm('This action cannot be undone! Are you absolutely sure?')) {
        this.gameService.resetGame();
        this.skillTreeService.resetAll();
        this.ascensionService.reset();
        window.location.reload();
      }
    }
  }
}
