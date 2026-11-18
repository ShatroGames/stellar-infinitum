import { Injectable, signal, computed, inject } from '@angular/core';
import Decimal from 'break_eternity.js';
import { AscensionNode, AscensionState, ASCENSION_TREE_NODES } from '../models/ascension-tree.model';
import { coreGlobalMultiplier, nexusEffects } from '../economy/economy';
import { SaveManagerService } from './save-manager.service';

@Injectable({
  providedIn: 'root'
})
export class AscensionService {
  private saveManager = inject(SaveManagerService);
  private state = signal<AscensionState>({
    points: 0,
    totalPoints: 0,
    nodes: new Map()
  });

  // Public signals
  points = computed(() => this.state().points);
  totalPoints = computed(() => this.state().totalPoints);
  nodes = computed(() => this.state().nodes);

  // Computed effects (formulas live in economy/economy.ts)
  private purchasedIds = computed(() => {
    const ids = new Set<string>();
    this.state().nodes.forEach(node => { if (node.purchased) ids.add(node.id); });
    return ids;
  });
  effects = computed(() => nexusEffects(this.purchasedIds()));

  hasAutoBuy = computed(() => this.effects().autoBuy);
  hasAutoWarp = computed(() => this.effects().autoWarp);
  bulkBuyAmount = computed(() => this.effects().bulkBuy);
  costReduction = computed(() => this.effects().costReduction);
  productionBoost = computed(() => this.effects().productionBoost);
  multiplierBoost = computed(() => this.effects().multiplierBoost);
  startingEnergy = computed(() => new Decimal(this.effects().startingEnergy));
  
  // Check if all ascension tree nodes are purchased (unlocks dimensions)
  isTreeComplete = computed(() => {
    const totalNodes = ASCENSION_TREE_NODES.length;
    let purchasedCount = 0;
    this.state().nodes.forEach(node => {
      if (node.purchased) purchasedCount++;
    });
    return purchasedCount === totalNodes;
  });

  warpSpeedReduction = computed(() => this.effects().warpSpeedReduction);
  skillEfficiencyBonus = computed(() => this.effects().skillEfficiency);
  skillCapIncrease = computed(() => this.effects().skillCapIncrease);
  stellarCoreMult = computed(() => this.effects().stellarCoreMult);
  warpMomentumBonus = computed(() => this.effects().warpMomentum);
  hasUnlockAll = computed(() => this.effects().unlockAll);

  // Production multiplier from total Stellar Cores earned
  globalMultiplier = computed(() => coreGlobalMultiplier(this.totalPoints()));

  constructor() {
    this.initializeNodes();
    this.loadState();
  }

  private initializeNodes(): void {
    const nodeMap = new Map<string, AscensionNode>();
    ASCENSION_TREE_NODES.forEach(node => {
      nodeMap.set(node.id, { ...node });
    });
    
    this.state.update(state => ({
      ...state,
      nodes: nodeMap
    }));
  }

  private hasNode(nodeId: string): boolean {
    const node = this.state().nodes.get(nodeId);
    return node?.purchased ?? false;
  }

  canPurchase(nodeId: string): boolean {
    const node = this.state().nodes.get(nodeId);
    if (!node || node.purchased) return false;

    // Check if we have enough points
    if (this.state().points < node.cost) return false;

    // Check prerequisites
    if (node.requires) {
      return node.requires.every(reqId => this.hasNode(reqId));
    }

    return true;
  }

  purchaseNode(nodeId: string): boolean {
    if (!this.canPurchase(nodeId)) return false;

    const node = this.state().nodes.get(nodeId);
    if (!node) return false;

    this.state.update(state => {
      const updatedNodes = new Map(state.nodes);
      const updatedNode = { ...node, purchased: true };
      updatedNodes.set(nodeId, updatedNode);

      return {
        ...state,
        points: state.points - node.cost,
        nodes: updatedNodes
      };
    });

    this.saveState();
    return true;
  }

  grantAscensionPoint(amount = 1): void {
    if (amount <= 0) return;
    this.state.update(state => ({
      ...state,
      points: state.points + amount,
      totalPoints: state.totalPoints + amount
    }));
    this.saveState();
  }

  getPurchasedNodes(): AscensionNode[] {
    return Array.from(this.state().nodes.values()).filter(node => node.purchased);
  }

  getAvailableNodes(): AscensionNode[] {
    return Array.from(this.state().nodes.values()).filter(node => 
      !node.purchased && this.canPurchase(node.id)
    );
  }

  getLockedNodes(): AscensionNode[] {
    return Array.from(this.state().nodes.values()).filter(node => 
      !node.purchased && !this.canPurchase(node.id)
    );
  }

  saveState(): void {
    const state = this.state();
    const saveData = {
      points: state.points,
      totalPoints: state.totalPoints,
      purchasedNodes: Array.from(state.nodes.values())
        .filter(node => node.purchased)
        .map(node => node.id)
    };

    this.saveManager.scheduleSave('ascension', () => {
      localStorage.setItem('ascensionTree', JSON.stringify(saveData));
    });
  }

  loadState(): void {
    const saved = localStorage.getItem('ascensionTree');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      
      this.state.update(state => {
        const updatedNodes = new Map(state.nodes);
        
        // Mark purchased nodes
        data.purchasedNodes.forEach((nodeId: string) => {
          const node = updatedNodes.get(nodeId);
          if (node) {
            updatedNodes.set(nodeId, { ...node, purchased: true });
          }
        });

        return {
          ...state,
          points: data.points,
          totalPoints: data.totalPoints,
          nodes: updatedNodes
        };
      });
    } catch (e) {
      console.error('Failed to load ascension tree state:', e);
    }
  }

  reset(): void {
    this.initializeNodes();
    this.state.update(state => ({
      ...state,
      points: 0,
      totalPoints: 0
    }));
    localStorage.removeItem('ascensionTree');
  }
}
