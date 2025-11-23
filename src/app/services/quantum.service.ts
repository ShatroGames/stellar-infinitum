import { Injectable, signal, computed, inject } from '@angular/core';
import { QuantumNode, QuantumState, Synergy, QuantumTreeType, CollapseRequirements } from '../models/quantum.model';
import { QUANTUM_NODES, QUANTUM_SYNERGIES } from '../models/quantum-trees.config';
import { ArtifactService } from './artifact.service';

@Injectable({
  providedIn: 'root'
})
export class QuantumService {
  private artifactService = inject(ArtifactService);

  // State
  private state = signal<QuantumState>({
    quanta: 0,
    totalQuantaGenerated: 0,
    quantaPerSecond: 0,
    nodes: new Map(),
    milestonesReached: [],
    collapseTime: 0,
    hasCollapsed: false
  });

  // Computed signals
  quanta = computed(() => this.state().quanta);
  totalQuantaGenerated = computed(() => this.state().totalQuantaGenerated);
  quantaPerSecond = computed(() => this.state().quantaPerSecond);
  hasCollapsed = computed(() => this.state().hasCollapsed);

  // Milestone constants
  private readonly MILESTONES = [100000, 1000000, 10000000];

  // Get next milestone info
  nextMilestone = computed(() => {
    const total = this.totalQuantaGenerated();
    const reached = this.state().milestonesReached;
    
    const nextMilestone = this.MILESTONES.find(m => !reached.includes(m));
    
    if (!nextMilestone) {
      return null; // All milestones reached
    }
    
    return {
      value: nextMilestone,
      current: total,
      percentage: Math.min((total / nextMilestone) * 100, 100)
    };
  });

  // Node access
  private nodeDefinitions = new Map<string, QuantumNode>();

  constructor() {
    // Initialize node definitions
    QUANTUM_NODES.forEach(node => {
      this.nodeDefinitions.set(node.id, { ...node });
    });

    this.loadState();
  }

  // Initialize a new quantum state after collapse
  initializeQuantumState(): void {
    const initialNodes = new Map<string, { level: number; unlocked: boolean }>();
    
    // All tier 1 nodes (no requirements) start unlocked
    QUANTUM_NODES.forEach(node => {
      const isStartNode = !node.requiredNodes || node.requiredNodes.length === 0;
      initialNodes.set(node.id, { level: 0, unlocked: isStartNode });
    });

    this.state.set({
      quanta: 0,
      totalQuantaGenerated: 0,
      quantaPerSecond: 1,
      nodes: initialNodes,
      milestonesReached: [],
      collapseTime: Date.now(),
      hasCollapsed: true
    });

    this.saveState();
  }

  // Calculate production based on nodes and synergies
  calculateProduction(): void {
    let baseProduction = 1; // Start at 1 Quanta/sec
    let productionBonus = 0;
    let multiplier = 1;

    const currentState = this.state();

    // Calculate from nodes
    currentState.nodes.forEach((nodeState, nodeId) => {
      if (nodeState.level > 0) {
        const nodeDef = this.nodeDefinitions.get(nodeId);
        if (!nodeDef) return;

        if (nodeDef.productionBonus) {
          productionBonus += nodeDef.productionBonus * nodeState.level;
        }
        if (nodeDef.multiplierBonus) {
          multiplier += nodeDef.multiplierBonus * nodeState.level;
        }
      }
    });

    // Calculate from active synergies
    const activeSynergies = this.getActiveSynergies();
    activeSynergies.forEach(synergy => {
      if (synergy.effect.type === 'production') {
        productionBonus += synergy.effect.value;
      } else if (synergy.effect.type === 'multiplier') {
        multiplier += synergy.effect.value;
      }
    });

    // Apply artifact bonuses
    const artifactBonuses = this.artifactService.calculateArtifactBonuses(currentState.quanta);
    
    // Add flat production bonus from artifacts (as percentage)
    productionBonus *= (1 + artifactBonuses.flatProductionBonus / 100);
    
    // Apply artifact multiplier
    multiplier *= artifactBonuses.productionMultiplier;

    const totalProduction = (baseProduction + productionBonus) * multiplier;

    this.state.update(s => ({
      ...s,
      quantaPerSecond: totalProduction
    }));
  }

  // Add Quanta over time
  addQuanta(deltaTime: number): void {
    if (!this.state().hasCollapsed) return;

    const amount = this.state().quantaPerSecond * deltaTime;
    
    this.state.update(s => ({
      ...s,
      quanta: s.quanta + amount,
      totalQuantaGenerated: s.totalQuantaGenerated + amount
    }));

    this.checkMilestones();
    
    // Check if artifacts should be unlocked
    this.artifactService.checkUnlock(this.state().totalQuantaGenerated);
  }

  // Spend Quanta (for artifacts, etc.)
  spendQuanta(amount: number): boolean {
    if (this.state().quanta < amount) return false;

    this.state.update(s => ({
      ...s,
      quanta: s.quanta - amount
    }));

    this.saveState();
    return true;
  }

  // Get cost for next level of a node
  getNodeCost(nodeId: string): number {
    const nodeDef = this.nodeDefinitions.get(nodeId);
    const nodeState = this.state().nodes.get(nodeId);
    
    if (!nodeDef || !nodeState) return 0;

    return Math.floor(nodeDef.baseCost * Math.pow(nodeDef.costMultiplier, nodeState.level));
  }

  // Check if node can be upgraded
  canUpgradeNode(nodeId: string): boolean {
    const nodeDef = this.nodeDefinitions.get(nodeId);
    const nodeState = this.state().nodes.get(nodeId);
    
    if (!nodeDef || !nodeState || !nodeState.unlocked) return false;
    if (nodeState.level >= nodeDef.maxLevel) return false;

    const cost = this.getNodeCost(nodeId);
    return this.state().quanta >= cost;
  }

  // Upgrade a node
  upgradeNode(nodeId: string): boolean {
    if (!this.canUpgradeNode(nodeId)) return false;

    const cost = this.getNodeCost(nodeId);

    this.state.update(s => {
      const newNodes = new Map(s.nodes);
      const nodeState = newNodes.get(nodeId)!;
      newNodes.set(nodeId, { ...nodeState, level: nodeState.level + 1 });

      return {
        ...s,
        quanta: s.quanta - cost,
        nodes: newNodes
      };
    });

    // Check if new nodes should be unlocked
    this.unlockDependentNodes(nodeId);
    this.calculateProduction();
    this.saveState();

    return true;
  }

  // Unlock nodes that depend on this one
  private unlockDependentNodes(unlockedNodeId: string): void {
    QUANTUM_NODES.forEach(node => {
      if (!node.requiredNodes) return;
      
      if (node.requiredNodes.includes(unlockedNodeId)) {
        // Check if all requirements are met
        const allRequirementsMet = node.requiredNodes.every(reqId => {
          const reqState = this.state().nodes.get(reqId);
          return reqState && reqState.level > 0;
        });

        // Check quanta milestone if required
        const milestonesMet = !node.requiredQuantaGenerated || 
          this.state().totalQuantaGenerated >= node.requiredQuantaGenerated;

        if (allRequirementsMet && milestonesMet) {
          this.state.update(s => {
            const newNodes = new Map(s.nodes);
            const nodeState = newNodes.get(node.id);
            if (nodeState) {
              newNodes.set(node.id, { ...nodeState, unlocked: true });
            }
            return { ...s, nodes: newNodes };
          });
        }
      }
    });
  }

  // Re-check all nodes and unlock those whose prerequisites are met (used after loading)
  // Re-check all nodes and unlock those whose prerequisites are met (used after loading)
  private recheckAllNodeUnlocks(): void {
    this.state.update(s => {
      const newNodes = new Map(s.nodes);
      let changed = false;

      QUANTUM_NODES.forEach(node => {
        const nodeState = newNodes.get(node.id);
        if (!nodeState || nodeState.unlocked) return; // Skip already unlocked

        // Check if all required nodes are leveled
        const allRequirementsMet = !node.requiredNodes || node.requiredNodes.every(reqId => {
          const reqState = newNodes.get(reqId);
          return reqState && reqState.level > 0;
        });

        // Check quanta milestone if required
        const milestonesMet = !node.requiredQuantaGenerated || 
          s.totalQuantaGenerated >= node.requiredQuantaGenerated;
        
        if (allRequirementsMet && milestonesMet) {
          newNodes.set(node.id, { ...nodeState, unlocked: true });
          changed = true;
        }
      });

      return changed ? { ...s, nodes: newNodes } : s;
    });
  }

  // Check for milestone unlocks
  private checkMilestones(): void {
    const total = this.state().totalQuantaGenerated;
    const reached = this.state().milestonesReached;

    this.MILESTONES.forEach(milestone => {
      if (total >= milestone && !reached.includes(milestone)) {
        this.state.update(s => ({
          ...s,
          milestonesReached: [...s.milestonesReached, milestone]
        }));

        // Unlock milestone-gated nodes
        this.unlockMilestoneNodes(milestone);
      }
    });
  }

  private unlockMilestoneNodes(milestone: number): void {
    QUANTUM_NODES.forEach(node => {
      if (node.requiredQuantaGenerated === milestone) {
        // Check if other requirements are met
        const requirementsMet = !node.requiredNodes || node.requiredNodes.every(reqId => {
          const reqState = this.state().nodes.get(reqId);
          return reqState && reqState.level > 0;
        });

        if (requirementsMet) {
          this.state.update(s => {
            const newNodes = new Map(s.nodes);
            const nodeState = newNodes.get(node.id);
            if (nodeState) {
              newNodes.set(node.id, { ...nodeState, unlocked: true });
            }
            return { ...s, nodes: newNodes };
          });
        }
      }
    });
  }

  // Get active synergies
  getActiveSynergies(): Synergy[] {
    const currentState = this.state();
    return QUANTUM_SYNERGIES.filter(synergy => {
      return synergy.requiredNodes.every(nodeId => {
        const nodeState = currentState.nodes.get(nodeId);
        return nodeState && nodeState.level > 0;
      });
    });
  }

  // Get nodes for a specific tree
  getNodesForTree(tree: QuantumTreeType): QuantumNode[] {
    return QUANTUM_NODES.filter(node => node.tree === tree);
  }

  // Get node state
  getNodeState(nodeId: string): { level: number; unlocked: boolean } | undefined {
    return this.state().nodes.get(nodeId);
  }

  // Get node definition
  getNodeDefinition(nodeId: string): QuantumNode | undefined {
    return this.nodeDefinitions.get(nodeId);
  }

  // Reset everything for new collapse (called by collapse trigger)
  reset(): void {
    this.state.set({
      quanta: 0,
      totalQuantaGenerated: 0,
      quantaPerSecond: 0,
      nodes: new Map(),
      milestonesReached: [],
      collapseTime: 0,
      hasCollapsed: false
    });
    this.saveState();
  }

  // Save state to localStorage
  private saveState(): void {
    const state = this.state();
    // Only save node IDs and levels (level 0 = locked)
    const minimalNodes = Array.from(state.nodes.entries())
      .filter(([_, node]) => node.level > 0) // Only save nodes with levels
      .map(([id, node]) => ({
        id,
        level: node.level
      }));
    
    const saveData = {
      quanta: state.quanta,
      totalQuantaGenerated: state.totalQuantaGenerated,
      nodes: minimalNodes,
      milestonesReached: state.milestonesReached,
      collapseTime: state.collapseTime,
      hasCollapsed: state.hasCollapsed
    };

    localStorage.setItem('stellarInfinitum_quantum', JSON.stringify(saveData));
  }

  // Load state from localStorage
  private loadState(): void {
    const saved = localStorage.getItem('stellarInfinitum_quantum');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      
      // Restore nodes - only store level and unlocked in state
      const nodeMap = new Map<string, { level: number; unlocked: boolean }>();
      
      // Initialize all nodes from config with saved levels
      QUANTUM_NODES.forEach(configNode => {
        const savedNode = data.nodes?.find((n: any) => n.id === configNode.id);
        // Start nodes (no requirements) are always unlocked
        const isStartNode = !configNode.requiredNodes || configNode.requiredNodes.length === 0;
        nodeMap.set(configNode.id, {
          level: savedNode?.level ?? 0,
          unlocked: savedNode?.level > 0 || isStartNode
        });
      });
      
      this.state.set({
        quanta: data.quanta || 0,
        totalQuantaGenerated: data.totalQuantaGenerated || 0,
        quantaPerSecond: 0, // Will be recalculated
        nodes: nodeMap,
        milestonesReached: data.milestonesReached || [],
        collapseTime: data.collapseTime || 0,
        hasCollapsed: data.hasCollapsed || false
      });

      if (this.state().hasCollapsed) {
        // Re-check all node unlocks based on current prerequisites
        this.recheckAllNodeUnlocks();
        // Check if any milestones should be unlocked based on total Quanta
        this.checkMilestones();
        this.calculateProduction();
      }
    } catch (e) {
      console.error('Failed to load quantum state:', e);
    }
  }

  // Get save data for export
  getSaveData(): any {
    const state = this.state();
    return {
      quanta: state.quanta,
      totalQuantaGenerated: state.totalQuantaGenerated,
      nodes: Array.from(state.nodes.entries()),
      milestonesReached: state.milestonesReached,
      collapseTime: state.collapseTime,
      hasCollapsed: state.hasCollapsed
    };
  }

  // Load from imported save
  loadSaveData(data: any): void {
    if (!data) return;

    this.state.set({
      quanta: data.quanta || 0,
      totalQuantaGenerated: data.totalQuantaGenerated || 0,
      quantaPerSecond: 0,
      nodes: new Map(data.nodes || []),
      milestonesReached: data.milestonesReached || [],
      collapseTime: data.collapseTime || 0,
      hasCollapsed: data.hasCollapsed || false
    });

    if (this.state().hasCollapsed) {
      this.calculateProduction();
    }
    
    this.saveState();
  }
}
