import { Injectable, signal, computed, inject } from '@angular/core';
import Decimal from 'break_eternity.js';
import { AscensionNode, AscensionState, ASCENSION_TREE_NODES } from '../models/ascension-tree.model';
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

  // Computed effects
  hasAutoBuy = computed(() => this.hasNode('auto_buy'));
  
  hasAutoWarp = computed(() => this.hasNode('auto_warp'));
  
  bulkBuyAmount = computed(() => {
    if (this.hasNode('bulk_buy_max')) return 999;
    if (this.hasNode('bulk_buy_10')) return 10;
    if (this.hasNode('bulk_buy_5')) return 5;
    return 1;
  });

  costReduction = computed(() => {
    if (this.hasNode('cost_reduce_25')) return 0.25;
    if (this.hasNode('cost_reduce_10')) return 0.10;
    return 0;
  });

  productionBoost = computed(() => {
    let boost = 0;
    if (this.hasNode('production_25')) boost += 0.25;
    if (this.hasNode('production_50')) boost += 0.50;
    if (this.hasNode('production_100')) boost += 1.0;
    if (this.hasNode('production_200')) boost += 1.5;
    if (this.hasNode('mega_boost')) boost += 3.0;
    return boost;
  });

  multiplierBoost = computed(() => {
    return this.hasNode('multiplier_boost') ? 0.05 : 0;
  });

  startingEnergy = computed(() => {
    return this.hasNode('start_energy') ? new Decimal(1000) : new Decimal(10);
  });
  
  // Check if all ascension tree nodes are purchased (unlocks dimensions)
  isTreeComplete = computed(() => {
    const totalNodes = ASCENSION_TREE_NODES.length;
    let purchasedCount = 0;
    this.state().nodes.forEach(node => {
      if (node.purchased) purchasedCount++;
    });
    return purchasedCount === totalNodes;
  });

  warpSpeedReduction = computed(() => {
    if (this.hasNode('warp_speed_2')) return 0.40;
    if (this.hasNode('warp_speed_1')) return 0.20;
    return 0;
  });

  skillEfficiencyBonus = computed(() => {
    return this.hasNode('skill_efficiency') ? 0.02 : 0;
  });

  skillCapIncrease = computed(() => {
    return this.hasNode('skill_cap_increase') ? 2 : 0;
  });

  stellarCoreMult = computed(() => {
    return this.hasNode('stellar_core_mult') ? 0.20 : 0;
  });

  warpMomentumBonus = computed(() => {
    return this.hasNode('warp_momentum') ? 0.15 : 0;
  });

  hasUnlockAll = computed(() => {
    return this.hasNode('unlock_all');
  });

  // Global multiplier based on total ascension points earned
  // Each point adds 0.1 (10%) to the multiplier
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
