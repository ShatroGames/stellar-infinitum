import { Injectable, signal, computed, inject } from '@angular/core';
import Decimal from 'break_eternity.js';
import { AscensionEffect, AscensionNode, AscensionState, ASCENSION_TREE_NODES } from '../models/ascension-tree.model';
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

  // Computed effects. All values come from ASCENSION_TREE_NODES so the config is the
  // single source of truth for both gameplay and the UI.
  hasAutoBuy = computed(() => this.hasEffect('auto_buy'));
  
  hasAutoWarp = computed(() => this.hasEffect('auto_warp'));
  
  bulkBuyAmount = computed(() => Math.max(1, this.maxEffect('bulk_buy')));

  costReduction = computed(() => this.maxEffect('cost_reduction'));

  productionBoost = computed(() => this.sumEffect('production_boost'));

  multiplierBoost = computed(() => this.sumEffect('multiplier_boost'));

  startingEnergy = computed(() => new Decimal(Math.max(10, this.maxEffect('start_bonus'))));
  
  // Check if all ascension tree nodes are purchased (unlocks dimensions)
  isTreeComplete = computed(() => {
    const totalNodes = ASCENSION_TREE_NODES.length;
    let purchasedCount = 0;
    this.state().nodes.forEach(node => {
      if (node.purchased) purchasedCount++;
    });
    return purchasedCount === totalNodes;
  });

  warpSpeedReduction = computed(() => this.maxEffect('warp_speed'));

  skillEfficiencyBonus = computed(() => this.sumEffect('skill_efficiency'));

  skillCapIncrease = computed(() => this.sumEffect('skill_cap'));

  stellarCoreMult = computed(() => this.sumEffect('stellar_core_mult'));

  warpMomentumBonus = computed(() => this.sumEffect('warp_momentum'));

  hasUnlockAll = computed(() => this.hasEffect('remove_prerequisites'));

  // Global multiplier based on total Stellar Cores earned: +100% per core
  globalMultiplier = computed(() => {
    return 1 + this.totalPoints();
  });

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

  private purchasedEffects(type: AscensionEffect['type']): number[] {
    const values: number[] = [];
    this.state().nodes.forEach(node => {
      if (node.purchased && node.effect.type === type) values.push(node.effect.value);
    });
    return values;
  }

  private hasEffect(type: AscensionEffect['type']): boolean {
    return this.purchasedEffects(type).length > 0;
  }

  /** For upgrades that replace each other (e.g. Cost Optimization I/II) */
  private maxEffect(type: AscensionEffect['type']): number {
    return Math.max(0, ...this.purchasedEffects(type));
  }

  /** For upgrades that stack (e.g. Power Enhancement I-IV) */
  private sumEffect(type: AscensionEffect['type']): number {
    return this.purchasedEffects(type).reduce((sum, v) => sum + v, 0);
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

  grantAscensionPoint(): void {
    this.state.update(state => ({
      ...state,
      points: state.points + 1,
      totalPoints: state.totalPoints + 1
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
