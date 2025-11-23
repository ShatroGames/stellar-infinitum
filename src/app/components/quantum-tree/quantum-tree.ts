import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantumService } from '../../services/quantum.service';
import { ArtifactService } from '../../services/artifact.service';
import { QuantumTreeType, QuantumNode, QuantumNodeType } from '../../models/quantum.model';
import { QUANTUM_SYNERGIES } from '../../models/quantum-trees.config';
import { formatNumber } from '../../utils/numbers';

@Component({
  selector: 'app-quantum-tree',
  imports: [CommonModule],
  templateUrl: './quantum-tree.html',
  styleUrl: './quantum-tree.css'
})
export class QuantumTree {
  protected quantumService = inject(QuantumService);
  protected artifactService = inject(ArtifactService);
  protected QuantumTreeType = QuantumTreeType;
  protected formatNumber = formatNumber;

  // Round to avoid floating point precision errors
  protected roundMultiplier(value: number): number {
    return Math.round(value * 100) / 100;
  }

  // Calculate progress to unlock artifacts
  protected getArtifactUnlockProgress(): number {
    const threshold = 50_000_000; // 50M Quanta
    const progress = (this.quantumService.totalQuantaGenerated() / threshold) * 100;
    return Math.min(Math.round(progress * 10) / 10, 100); // Round to 1 decimal, cap at 100%
  }

  // Get nodes for each tree
  matterNodes = computed(() => this.quantumService.getNodesForTree(QuantumTreeType.MATTER));
  energyNodes = computed(() => this.quantumService.getNodesForTree(QuantumTreeType.ENERGY));
  timeNodes = computed(() => this.quantumService.getNodesForTree(QuantumTreeType.TIME));

  // Get active synergies
  activeSynergies = computed(() => this.quantumService.getActiveSynergies());

  // Get all synergies that include a specific node
  getSynergiesForNode(nodeId: string) {
    return QUANTUM_SYNERGIES.filter(synergy => 
      synergy.requiredNodes.includes(nodeId)
    );
  }

  // Check if node is part of any synergy
  isNodeInAnySynergy(nodeId: string): boolean {
    return QUANTUM_SYNERGIES.some(synergy => 
      synergy.requiredNodes.includes(nodeId)
    );
  }

  // Check if node is part of an active synergy
  isNodeInActiveSynergy(nodeId: string): boolean {
    const activeSynergies = this.activeSynergies();
    return activeSynergies.some(synergy => 
      synergy.requiredNodes.includes(nodeId)
    );
  }

  // Get total stats
  totalStats = computed(() => {
    let totalProduction = 0;
    let totalMultiplier = 1;

    const nodes = [
      ...this.matterNodes(),
      ...this.energyNodes(),
      ...this.timeNodes()
    ];

    nodes.forEach(node => {
      const state = this.quantumService.getNodeState(node.id);
      if (state && state.level > 0) {
        if (node.productionBonus) {
          totalProduction += node.productionBonus * state.level;
        }
        if (node.multiplierBonus) {
          totalMultiplier += node.multiplierBonus * state.level;
        }
      }
    });

    return { totalProduction, totalMultiplier };
  });

  upgradeNode(nodeId: string): void {
    this.quantumService.upgradeNode(nodeId);
  }

  getNodeCost(nodeId: string): number {
    return this.quantumService.getNodeCost(nodeId);
  }

  canUpgrade(nodeId: string): boolean {
    return this.quantumService.canUpgradeNode(nodeId);
  }

  getNodeState(nodeId: string) {
    return this.quantumService.getNodeState(nodeId);
  }

  getNodeClasses(node: QuantumNode): string[] {
    const state = this.getNodeState(node.id);
    const classes = ['quantum-node'];
    
    classes.push(`type-${node.type}`);
    classes.push(`tree-${node.tree.toLowerCase()}`);
    
    if (!state?.unlocked) classes.push('locked');
    if (state?.level === node.maxLevel) classes.push('maxed');
    if (this.isNodeInAnySynergy(node.id)) classes.push('synergy-node');
    if (this.isNodeInActiveSynergy(node.id)) classes.push('synergy-active');
    
    return classes;
  }

  getTreeTitle(tree: QuantumTreeType): string {
    const nodeCount = this.quantumService.getNodesForTree(tree).filter(n => {
      const state = this.getNodeState(n.id);
      return state?.level && state.level > 0;
    }).length;
    
    const totalNodes = this.quantumService.getNodesForTree(tree).length;
    
    return `${tree} Tree (${nodeCount}/${totalNodes})`;
  }
}
