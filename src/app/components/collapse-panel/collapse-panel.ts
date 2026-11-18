import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DimensionService } from '../../services/dimension.service';
import { QuantumService } from '../../services/quantum.service';
import { SkillTreeService } from '../../services/skill-tree.service';
import { AscensionService } from '../../services/ascension.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-collapse-panel',
  imports: [CommonModule],
  templateUrl: './collapse-panel.html',
  styleUrl: './collapse-panel.css'
})
export class CollapsePanel {
  private dimensionService = inject(DimensionService);
  private quantumService = inject(QuantumService);
  private skillTreeService = inject(SkillTreeService);
  private ascensionService = inject(AscensionService);
  private gameService = inject(GameService);

  protected showConfirmation = false;
  protected showCollapseAnimation = false;

  // Check if all dimensions are maxed
  dimensionsMaxed = computed(() => {
    const dimensions = this.dimensionService.dimensions();
    return Array.from(dimensions.values()).every(dim => 
      dim.nodes.every(node => node.level >= node.maxLevel)
    );
  });

  canCollapse = computed(() => this.dimensionsMaxed());

  initiateCollapse(): void {
    if (!this.canCollapse()) return;
    this.showConfirmation = true;
  }

  confirmCollapse(): void {
    this.showConfirmation = false;
    this.showCollapseAnimation = true;
    
    // Wait for animation to complete before actually collapsing
    setTimeout(() => {
      // Initialize quantum system (this will mark hasCollapsed = true)
      this.quantumService.initializeQuantumState();
      
      // Reset dimension service
      this.dimensionService.reset();
      
      // Hide animation after collapse is complete
      setTimeout(() => {
        this.showCollapseAnimation = false;
      }, 500);
    }, 4000); // Animation duration
  }

  cancelCollapse(): void {
    this.showConfirmation = false;
  }
}

