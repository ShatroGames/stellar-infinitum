import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DimensionService } from '../../services/dimension.service';
import { Dimension, DimensionNode } from '../../models/dimension.model';

@Component({
  selector: 'app-dimension-tree',
  imports: [CommonModule],
  templateUrl: './dimension-tree.html',
  styleUrl: './dimension-tree.css'
})
export class DimensionTreeComponent {
  private dimensionService = inject(DimensionService);
  
  // Input for which dimension to display
  dimension = input.required<Dimension>();
  
  echoFragments = this.dimensionService.echoFragments;
  
  // Get the live dimension state from the service
  dimensionState = computed(() => {
    const dimId = this.dimension().id;
    return this.dimensionService.dimensions().get(dimId);
  });
  
  // Make Array available in template
  protected readonly Array = Array;
  
  // Group nodes by row (y position) - use live state
  nodesByRow = computed(() => {
    const state = this.dimensionState();
    if (!state) return [];
    
    const rows = new Map<number, DimensionNode[]>();
    
    state.nodes.forEach(node => {
      const y = node.position.y;
      if (!rows.has(y)) {
        rows.set(y, []);
      }
      rows.get(y)!.push(node);
    });
    
    // Sort nodes within each row by x position
    rows.forEach(nodes => {
      nodes.sort((a, b) => a.position.x - b.position.x);
    });
    
    return Array.from(rows.entries()).sort((a, b) => a[0] - b[0]);
  });
  
  canUpgrade(nodeId: string): boolean {
    return this.dimensionService.canUpgradeNode(this.dimension().id, nodeId);
  }
  
  getNodeCost(nodeId: string): number {
    return this.dimensionService.getNodeCost(this.dimension().id, nodeId);
  }
  
  onUpgrade(nodeId: string): void {
    this.dimensionService.upgradeNode(this.dimension().id, nodeId);
  }
  
  getNodeClass(node: DimensionNode): string {
    if (node.level >= node.maxLevel) return 'node-maxed';
    if (node.unlocked && this.canUpgrade(node.id)) return 'node-available';
    if (node.unlocked) return 'node-unlocked';
    return 'node-locked';
  }
  
  getEffectDescription(node: DimensionNode): string {
    const effect = node.effect;
    return node.description;
  }
  
  getNodeLevel(node: DimensionNode): string {
    return `${node.level}/${node.maxLevel}`;
  }
}

