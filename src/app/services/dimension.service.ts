import { Injectable, signal, computed, inject, Injector, forwardRef } from '@angular/core';
import { Dimension, DimensionNode, DimensionState, DIMENSIONS } from '../models/dimension.model';
import { SaveManagerService } from './save-manager.service';
import type { SkillTreeService } from './skill-tree.service';
import { dimensionEffects } from '../economy/economy';

@Injectable({
  providedIn: 'root'
})
export class DimensionService {
  private saveManager = inject(SaveManagerService);
  private injector = inject(Injector);
  private skillTreeService?: SkillTreeService;
  
  private state = signal<DimensionState>({
    echoFragments: 0,
    totalEchoFragments: 0,
    dimensions: new Map()
  });

  // Public signals
  echoFragments = computed(() => this.state().echoFragments);
  totalEchoFragments = computed(() => this.state().totalEchoFragments);
  dimensions = computed(() => this.state().dimensions);
  
  // Check if any dimension is unlocked (unlocks auto-transcend)
  hasAnyDimensionUnlocked = computed(() => {
    for (const dimension of this.state().dimensions.values()) {
      if (dimension.unlocked) return true;
    }
    return false;
  });

  // Achievement reward factor for all dimensional bonuses (set by AchievementService,
  // which cannot be injected here without a circular dependency)
  readonly dimensionBonusFactor = signal(1);

  setDimensionBonusFactor(factor: number): void {
    this.dimensionBonusFactor.set(factor);
  }

  // Computed bonuses (formulas live in economy/economy.ts)
  effects = computed(() => dimensionEffects(this.state().dimensions.values(), this.dimensionBonusFactor()));
  totalProductionBonus = computed(() => this.effects().productionBonus);
  totalMultiplierPower = computed(() => this.effects().multiplierPower);
  totalSkillCapIncrease = computed(() => this.effects().skillCapIncrease);
  totalStellarCoreBonus = computed(() => this.effects().stellarCoreBonus);
  crossDimensionBonus = computed(() => this.effects().crossDimensionBonus);
  prismAllAspectsBonus = computed(() => this.effects().prismAllAspects);

  constructor() {
    this.initializeDimensions();
    this.loadState();
  }

  private initializeDimensions(): void {
    const dimensionMap = new Map<string, Dimension>();
    DIMENSIONS.forEach(dim => {
      dimensionMap.set(dim.id, { 
        ...dim,
        nodes: dim.nodes.map(node => ({ ...node }))
      });
    });
    
    this.state.update(state => ({
      ...state,
      dimensions: dimensionMap
    }));
  }

  /**
   * Unlock every node whose prerequisites are all maxed. Unlock flags are not
   * persisted, so this must run after loading as well as after upgrades.
   */
  private applyNodeUnlocks(nodes: DimensionNode[]): DimensionNode[] {
    return nodes.map(node => {
      if (node.unlocked || node.prerequisites.length === 0) return node;
      const prereqsMet = node.prerequisites.every(prereqId => {
        const prereq = nodes.find(n => n.id === prereqId);
        return prereq && prereq.level >= prereq.maxLevel;
      });
      return prereqsMet ? { ...node, unlocked: true } : node;
    });
  }

  canUnlockDimension(dimensionId: string): boolean {
    const dimension = this.state().dimensions.get(dimensionId);
    if (!dimension || dimension.unlocked) return false;
    
    return this.state().echoFragments >= dimension.unlockCost;
  }

  unlockDimension(dimensionId: string): boolean {
    if (!this.canUnlockDimension(dimensionId)) return false;
    
    const dimension = this.state().dimensions.get(dimensionId);
    if (!dimension) return false;
    
    this.state.update(state => {
      const updatedDimensions = new Map(state.dimensions);
      const updatedDimension = { 
        ...dimension, 
        unlocked: true,
        nodes: dimension.nodes.map(node => 
          node.id === dimension.nodes[0].id ? { ...node, unlocked: true } : node
        )
      };
      updatedDimensions.set(dimensionId, updatedDimension);
      
      return {
        ...state,
        echoFragments: state.echoFragments - dimension.unlockCost,
        dimensions: updatedDimensions
      };
    });
    
    this.saveState();
    return true;
  }

  canUpgradeNode(dimensionId: string, nodeId: string): boolean {
    const dimension = this.state().dimensions.get(dimensionId);
    if (!dimension || !dimension.unlocked) return false;
    
    const node = dimension.nodes.find(n => n.id === nodeId);
    if (!node || !node.unlocked || node.level >= node.maxLevel) return false;
    
    const cost = this.getNodeCost(dimensionId, nodeId);
    if (this.state().echoFragments < cost) return false;
    
    // Check prerequisites
    if (node.prerequisites.length > 0) {
      return node.prerequisites.every(prereqId => {
        const prereq = dimension.nodes.find(n => n.id === prereqId);
        return prereq && prereq.level >= prereq.maxLevel;
      });
    }
    
    return true;
  }

  getNodeCost(dimensionId: string, nodeId: string): number {
    const dimension = this.state().dimensions.get(dimensionId);
    if (!dimension) return Infinity;
    
    const node = dimension.nodes.find(n => n.id === nodeId);
    if (!node) return Infinity;
    
    return Math.floor(node.cost * Math.pow(node.costMultiplier, node.level));
  }

  upgradeNode(dimensionId: string, nodeId: string): boolean {
    if (!this.canUpgradeNode(dimensionId, nodeId)) return false;
    
    const dimension = this.state().dimensions.get(dimensionId);
    if (!dimension) return false;
    
    const cost = this.getNodeCost(dimensionId, nodeId);
    
    this.state.update(state => {
      const updatedDimensions = new Map(state.dimensions);
      const updatedNodes = dimension.nodes.map(node => {
        if (node.id === nodeId) {
          return { ...node, level: node.level + 1 };
        }
        return node;
      });
      
      // Check and unlock nodes that now meet prerequisites
      const finalNodes = this.applyNodeUnlocks(updatedNodes);
      
      updatedDimensions.set(dimensionId, { ...dimension, nodes: finalNodes });
      
      return {
        ...state,
        echoFragments: state.echoFragments - cost,
        dimensions: updatedDimensions
      };
    });
    
    this.saveState();
    
    // Trigger production recalculation after dimension upgrade
    this.triggerProductionRecalculation();
    
    return true;
  }

  private triggerProductionRecalculation(): void {
    // Lazy inject SkillTreeService to avoid circular dependency
    if (!this.skillTreeService) {
      // Import dynamically to break circular dependency
      import('./skill-tree.service').then(module => {
        this.skillTreeService = this.injector.get(module.SkillTreeService);
        this.skillTreeService?.recalculateProduction();
        this.skillTreeService?.updateSkillMaxLevels();
      });
    } else {
      this.skillTreeService.recalculateProduction();
      this.skillTreeService.updateSkillMaxLevels();
    }
  }

  grantEchoFragments(amount: number): void {
    this.state.update(state => ({
      ...state,
      echoFragments: state.echoFragments + amount,
      totalEchoFragments: state.totalEchoFragments + amount
    }));
    this.saveState();
  }

  saveState(): void {
    const dimensions = this.state().dimensions;
    // Only save dimension ID and node levels
    const minimalDimensions = Array.from(dimensions.entries()).map(([id, dim]) => ({
      id,
      unlocked: dim.unlocked,
      nodes: dim.nodes.map(node => ({ id: node.id, level: node.level }))
    }));
    
    this.saveManager.scheduleSave('dimensions', () => {
      localStorage.setItem('stellarInfinitum_dimensions', JSON.stringify({
        echoFragments: this.state().echoFragments,
        totalEchoFragments: this.state().totalEchoFragments,
        dimensions: minimalDimensions
      }));
    });
  }

  loadState(): void {
    const saved = localStorage.getItem('stellarInfinitum_dimensions');
    if (!saved) return;
    
    try {
      const data = JSON.parse(saved);
      const dimensionMap = new Map<string, Dimension>();
      
      // Restore dimensions from config with saved levels
      DIMENSIONS.forEach(configDim => {
        const savedDim = data.dimensions?.find((d: any) => d.id === configDim.id);
        
        if (savedDim) {
          // Restore node levels from save
          const restoredNodes = configDim.nodes.map(configNode => {
            const savedNode = savedDim.nodes?.find((n: any) => n.id === configNode.id);
            return {
              ...configNode,
              level: savedNode?.level ?? 0
            };
          });
          
          dimensionMap.set(configDim.id, {
            ...configDim,
            unlocked: savedDim.unlocked ?? false,
            nodes: this.applyNodeUnlocks(restoredNodes)
          });
        } else {
          // New dimension not in save
          dimensionMap.set(configDim.id, {
            ...configDim,
            nodes: configDim.nodes.map(node => ({ ...node }))
          });
        }
      });
      
      this.state.update(state => ({
        ...state,
        echoFragments: data.echoFragments || 0,
        totalEchoFragments: data.totalEchoFragments || 0,
        dimensions: dimensionMap
      }));
    } catch (e) {
      console.error('Failed to load dimension state:', e);
    }
  }

  getUnlockedDimensions(): Dimension[] {
    return Array.from(this.state().dimensions.values()).filter(d => d.unlocked);
  }

  getLockedDimensions(): Dimension[] {
    return Array.from(this.state().dimensions.values()).filter(d => !d.unlocked);
  }

  reset(): void {
    // Re-initialize dimensions to default state
    this.initializeDimensions();
    
    // Reset state
    this.state.update(state => ({
      ...state,
      echoFragments: 0,
      totalEchoFragments: 0
    }));
    
    // Clear saved data
    localStorage.removeItem('stellarInfinitum_dimensions');
    localStorage.removeItem('treefinite_dimensions'); // Also clear old key if it exists
  }
}
