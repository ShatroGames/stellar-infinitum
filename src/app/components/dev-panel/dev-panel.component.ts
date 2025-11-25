import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { SkillTreeService } from '../../services/skill-tree.service';
import { AscensionService } from '../../services/ascension.service';
import { DimensionService } from '../../services/dimension.service';
import { Decimal } from '../../utils/numbers';
@Component({
  selector: 'app-dev-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dev-panel.component.html',
  styleUrl: './dev-panel.component.css'
})
export class DevPanelComponent {
  private gameService = inject(GameService);
  private skillTreeService = inject(SkillTreeService);
  private ascensionService = inject(AscensionService);
  private dimensionService = inject(DimensionService);
  isOpen = signal(false);
  isMinimized = signal(false);
  togglePanel() {
    this.isOpen.update(v => !v);
  }
  toggleMinimize() {
    this.isMinimized.update(v => !v);
  }
  addEnergy(amount: string) {
    const value = new Decimal(amount);
    this.gameService.addResource('knowledge', value);
  }
  maxCurrentTier() {
    const skills = Array.from(this.skillTreeService.getSkills()().values());
    skills.forEach(skill => {
      if (skill.unlocked) {
        while (skill.level < skill.maxLevel) {
          if (this.skillTreeService.canUpgrade(skill.id)) {
            this.skillTreeService.upgradeSkill(skill.id);
          } else {
            break;
          }
        }
      }
    });
  }
  unlockAllCurrentTier() {
    const skills = Array.from(this.skillTreeService.getSkills()().values());
    skills.forEach(skill => {
      if (skill.prerequisites.length === 0) {
        while (skill.level < skill.maxLevel) {
          if (this.skillTreeService.canUpgrade(skill.id)) {
            this.skillTreeService.upgradeSkill(skill.id);
          } else {
            break;
          }
        }
      }
    });
    this.maxCurrentTier();
  }
  ascendToTier(tier: number) {
    const currentTier = this.skillTreeService.currentTier();
    for (let t = currentTier; t < tier; t++) {
      this.maxCurrentTier();
      this.addEnergy('1e100'); // Add massive amount
      if (this.skillTreeService.canAscend()) {
        this.skillTreeService.ascend(this.ascensionService);
      }
    }
  }
  grantStellarCores(amount: number) {
    for (let i = 0; i < amount; i++) {
      this.ascensionService.grantAscensionPoint();
    }
  }
  unlockAllAscensionNodes() {
    const nodes = Array.from(this.ascensionService.nodes().values());
    const totalCost = nodes.reduce((sum, node) => sum + (node.purchased ? 0 : node.cost), 0);
    this.grantStellarCores(totalCost + 10); // Extra buffer
    for (let pass = 0; pass < 10; pass++) {
      let purchased = false;
      nodes.forEach(node => {
        if (!node.purchased && this.ascensionService.canPurchase(node.id)) {
          this.ascensionService.purchaseNode(node.id);
          purchased = true;
        }
      });
      if (!purchased) break; // No more nodes to purchase
    }
  }
  grantEchoFragments(amount: number) {
    this.dimensionService.grantEchoFragments(amount);
  }
  unlockAllDimensions() {
    const dimensions = Array.from(this.dimensionService.dimensions().values());
    dimensions.forEach(dimension => {
      if (!dimension.unlocked) {
        this.grantEchoFragments(dimension.unlockCost);
        this.dimensionService.unlockDimension(dimension.id);
      }
    });
  }
  maxAllDimensions() {
    const dimensions = Array.from(this.dimensionService.dimensions().values());
    dimensions.forEach(dimension => {
      if (dimension.unlocked) {
        dimension.nodes.forEach(node => {
          if (node.unlocked) {
            while (node.level < node.maxLevel) {
              const cost = this.dimensionService.getNodeCost(dimension.id, node.id);
              if (!isFinite(cost) || cost > 10000) break; // Safety check
              this.grantEchoFragments(cost);
              if (this.dimensionService.canUpgradeNode(dimension.id, node.id)) {
                this.dimensionService.upgradeNode(dimension.id, node.id);
              } else {
                break;
              }
            }
          }
        });
      }
    });
  }
  jumpToStellarNexus() {
    this.ascendToTier(5);
    this.maxCurrentTier();
    this.addEnergy('1e14'); // 100T energy
    if (this.skillTreeService.canAscend()) {
      this.skillTreeService.ascend(this.ascensionService);
    }
  }
  jumpToDimensions() {
    this.jumpToStellarNexus();
    this.grantStellarCores(100);
    this.unlockAllAscensionNodes();
    this.addEnergy('1e15'); // 1Q energy for multiple EF
    if (this.skillTreeService.canAscend()) {
      this.skillTreeService.ascend(this.ascensionService);
    }
    this.grantEchoFragments(100);
  }
  jumpToMidDimensions() {
    this.jumpToDimensions();
    this.grantEchoFragments(50);
    this.dimensionService.unlockDimension('void');
    this.dimensionService.unlockDimension('crystal');
    this.grantEchoFragments(300);
  }
  jumpToLateDimensions() {
    this.jumpToMidDimensions();
    this.unlockAllDimensions();
    this.grantEchoFragments(1000);
  }
  resetGame() {
    if (confirm('Are you sure you want to reset all game progress?')) {
      localStorage.clear();
      location.reload();
    }
  }
  resetToTier1() {
    if (confirm('Reset to Tier 1 (keeps Ascension/Dimension progress)?')) {
      location.reload();
    }
  }
}