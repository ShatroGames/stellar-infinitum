import { Injectable, signal, computed, inject } from '@angular/core';
import { QuantumNode, QuantumState, Synergy, QuantumTreeType, CollapseRequirements } from '../models/quantum.model';
import { QUANTUM_NODES, QUANTUM_SYNERGIES } from '../models/quantum-trees.config';
import { ArtifactService } from './artifact.service';
import { EternalProgress } from './eternal-progress';
@Injectable({
  providedIn: 'root'
})
export class QuantumService {
  private artifactService = inject(ArtifactService);
  private eternalProgress = inject(EternalProgress);
  private state = signal<QuantumState>({
    quanta: 0,
    totalQuantaGenerated: 0,
    quantaPerSecond: 0,
    nodes: new Map(),
    milestonesReached: [],
    collapseTime: 0,
    hasCollapsed: false
  });
  private victoryState = signal<{hasWon: boolean, victoryDismissed: boolean}>({
    hasWon: false,
    victoryDismissed: false
  });
  private readonly VICTORY_THRESHOLD = 1e170; // 1e170 Quanta
  quanta = computed(() => this.state().quanta);
  totalQuantaGenerated = computed(() => this.state().totalQuantaGenerated);
  quantaPerSecond = computed(() => this.state().quantaPerSecond);
  hasCollapsed = computed(() => this.state().hasCollapsed);
  hasWon = computed(() => this.victoryState().hasWon && !this.victoryState().victoryDismissed);
  private readonly MILESTONES = [100000, 1000000, 10000000];
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
  private nodeDefinitions = new Map<string, QuantumNode>();
  constructor() {
    QUANTUM_NODES.forEach(node => {
      this.nodeDefinitions.set(node.id, { ...node });
    });
    this.loadState();
  }
  initializeQuantumState(): void {
    const initialNodes = new Map<string, { level: number; unlocked: boolean }>();
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
  calculateProduction(): void {
    let baseProduction = 1; // Start at 1 Quanta/sec
    let productionBonus = 0;
    let multiplier = 1;
    const currentState = this.state();
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
    const activeSynergies = this.getActiveSynergies();
    activeSynergies.forEach(synergy => {
      if (synergy.effect.type === 'production') {
        productionBonus += synergy.effect.value;
      } else if (synergy.effect.type === 'multiplier') {
        multiplier += synergy.effect.value;
      }
    });
    const artifactBonuses = this.artifactService.calculateArtifactBonuses(currentState.quanta);
    productionBonus *= (1 + artifactBonuses.flatProductionBonus / 100);
    multiplier *= artifactBonuses.productionMultiplier;
    const totalProduction = (baseProduction + productionBonus) * multiplier;
    this.state.update(s => ({
      ...s,
      quantaPerSecond: totalProduction
    }));
  }
  addQuanta(deltaTime: number, multiplier: number = 1): void {
    if (!this.state().hasCollapsed) return;
    const amount = this.state().quantaPerSecond * deltaTime * multiplier;
    this.state.update(s => ({
      ...s,
      quanta: s.quanta + amount,
      totalQuantaGenerated: s.totalQuantaGenerated + amount
    }));
    this.checkMilestones();
    this.artifactService.checkUnlock(this.state().totalQuantaGenerated);
    this.checkVictory();
  }
  private checkVictory(): void {
    if (this.victoryState().hasWon) return; // Already won
    if (this.state().totalQuantaGenerated >= this.VICTORY_THRESHOLD) {
      this.victoryState.update(v => ({
        ...v,
        hasWon: true
      }));
      this.eternalProgress.recordVictory();
      this.saveState();
    }
  }
  dismissVictory(): void {
    this.victoryState.update(v => ({
      ...v,
      victoryDismissed: true
    }));
    this.saveState();
  }
  spendQuanta(amount: number): boolean {
    if (this.state().quanta < amount) return false;
    this.state.update(s => ({
      ...s,
      quanta: s.quanta - amount
    }));
    this.saveState();
    return true;
  }
  getNodeCost(nodeId: string): number {
    const nodeDef = this.nodeDefinitions.get(nodeId);
    const nodeState = this.state().nodes.get(nodeId);
    if (!nodeDef || !nodeState) return 0;
    return Math.floor(nodeDef.baseCost * Math.pow(nodeDef.costMultiplier, nodeState.level));
  }
  canUpgradeNode(nodeId: string): boolean {
    const nodeDef = this.nodeDefinitions.get(nodeId);
    const nodeState = this.state().nodes.get(nodeId);
    if (!nodeDef || !nodeState || !nodeState.unlocked) return false;
    if (nodeState.level >= nodeDef.maxLevel) return false;
    const cost = this.getNodeCost(nodeId);
    return this.state().quanta >= cost;
  }
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
    this.unlockDependentNodes(nodeId);
    this.calculateProduction();
    this.saveState();
    return true;
  }
  private unlockDependentNodes(unlockedNodeId: string): void {
    QUANTUM_NODES.forEach(node => {
      if (!node.requiredNodes) return;
      if (node.requiredNodes.includes(unlockedNodeId)) {
        const allRequirementsMet = node.requiredNodes.every(reqId => {
          const reqState = this.state().nodes.get(reqId);
          return reqState && reqState.level > 0;
        });
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
  private recheckAllNodeUnlocks(): void {
    this.state.update(s => {
      const newNodes = new Map(s.nodes);
      let changed = false;
      QUANTUM_NODES.forEach(node => {
        const nodeState = newNodes.get(node.id);
        if (!nodeState || nodeState.unlocked) return; // Skip already unlocked
        const allRequirementsMet = !node.requiredNodes || node.requiredNodes.every(reqId => {
          const reqState = newNodes.get(reqId);
          return reqState && reqState.level > 0;
        });
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
  private checkMilestones(): void {
    const total = this.state().totalQuantaGenerated;
    const reached = this.state().milestonesReached;
    this.MILESTONES.forEach(milestone => {
      if (total >= milestone && !reached.includes(milestone)) {
        this.state.update(s => ({
          ...s,
          milestonesReached: [...s.milestonesReached, milestone]
        }));
        this.unlockMilestoneNodes(milestone);
      }
    });
  }
  private unlockMilestoneNodes(milestone: number): void {
    QUANTUM_NODES.forEach(node => {
      if (node.requiredQuantaGenerated === milestone) {
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
  getActiveSynergies(): Synergy[] {
    const currentState = this.state();
    return QUANTUM_SYNERGIES.filter(synergy => {
      return synergy.requiredNodes.every(nodeId => {
        const nodeState = currentState.nodes.get(nodeId);
        return nodeState && nodeState.level > 0;
      });
    });
  }
  getNodesForTree(tree: QuantumTreeType): QuantumNode[] {
    return QUANTUM_NODES.filter(node => node.tree === tree);
  }
  getNodeState(nodeId: string): { level: number; unlocked: boolean } | undefined {
    return this.state().nodes.get(nodeId);
  }
  getNodeDefinition(nodeId: string): QuantumNode | undefined {
    return this.nodeDefinitions.get(nodeId);
  }
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
  private saveState(): void {
    const state = this.state();
    const victory = this.victoryState();
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
      hasCollapsed: state.hasCollapsed,
      hasWon: victory.hasWon,
      victoryDismissed: victory.victoryDismissed
    };
    localStorage.setItem('stellarInfinitum_quantum', JSON.stringify(saveData));
  }
  private loadState(): void {
    const saved = localStorage.getItem('stellarInfinitum_quantum');
    if (!saved) return;
    try {
      const data = JSON.parse(saved);
      const nodeMap = new Map<string, { level: number; unlocked: boolean }>();
      QUANTUM_NODES.forEach(configNode => {
        const savedNode = data.nodes?.find((n: any) => n.id === configNode.id);
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
      if (data.hasWon !== undefined) {
        this.victoryState.set({
          hasWon: data.hasWon || false,
          victoryDismissed: data.victoryDismissed || false
        });
      }
      if (this.state().hasCollapsed) {
        this.recheckAllNodeUnlocks();
        this.checkMilestones();
        this.calculateProduction();
      }
    } catch (e) {
      console.error('Failed to load quantum state:', e);
    }
  }
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