import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AscensionService } from '../../services/ascension.service';
import { AscensionNode } from '../../models/ascension-tree.model';

@Component({
  selector: 'app-ascension-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ascension-tree.component.html',
  styleUrl: './ascension-tree.component.css'
})
export class AscensionTreeComponent {
  private ascensionService = inject(AscensionService);

  points = this.ascensionService.points;
  totalPoints = this.ascensionService.totalPoints;
  nodes = this.ascensionService.nodes;
  
  // Make Array available in template
  protected readonly Array = Array;

  purchasedNodes = computed(() => this.ascensionService.getPurchasedNodes());
  availableNodes = computed(() => this.ascensionService.getAvailableNodes());
  lockedNodes = computed(() => this.ascensionService.getLockedNodes());

  onPurchase(nodeId: string): void {
    this.ascensionService.purchaseNode(nodeId);
  }

  canPurchase(nodeId: string): boolean {
    return this.ascensionService.canPurchase(nodeId);
  }

  getNodeClass(node: AscensionNode): string {
    if (node.purchased) return 'node-purchased';
    if (this.canPurchase(node.id)) return 'node-available';
    return 'node-locked';
  }

  getEffectDescription(node: AscensionNode): string {
    const effect = node.effect;
    switch (effect.type) {
      case 'auto_buy':
        return 'Enables automatic purchases';
      case 'bulk_buy':
        return effect.value === 999 ? 'Buy MAX levels' : `Buy ${effect.value} levels at once`;
      case 'cost_reduction':
        return `${(effect.value * 100).toFixed(0)}% cheaper`;
      case 'production_boost':
        return `+${(effect.value * 100).toFixed(0)}% production`;
      case 'start_bonus':
        return `Start with ${effect.value.toLocaleString()} Energy`;
      case 'warp_speed':
        return `-${(effect.value * 100).toFixed(0)}% warp requirement`;
      case 'skill_cap':
        return `+${effect.value} max skill levels`;
      case 'multiplier_boost':
        return `+${(effect.value * 100).toFixed(0)}% stronger multipliers`;
      case 'offline_bonus':
        return `+${(effect.value * 100).toFixed(0)}% offline gains`;
      case 'prestige_keep':
        return `Keep ${(effect.value * 100).toFixed(0)}% Energy on warp`;
      default:
        return '';
    }
  }
}
