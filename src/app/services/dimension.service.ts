import { Injectable, signal, computed, inject, Injector, forwardRef } from '@angular/core';
import { Dimension, DimensionNode, DimensionState, DIMENSIONS } from '../models/dimension.model';
import { SaveManagerService } from './save-manager.service';
import type { SkillTreeService } from './skill-tree.service';
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
  echoFragments = computed(() => this.state().echoFragments);
  totalEchoFragments = computed(() => this.state().totalEchoFragments);
  dimensions = computed(() => this.state().dimensions);
  hasAnyDimensionUnlocked = computed(() => {
    for (const dimension of this.state().dimensions.values()) {
      if (dimension.unlocked) return true;
    }
    return false;
  });
  totalProductionBonus = computed(() => {
    let bonus = 1;
    this.state().dimensions.forEach(dimension => {
      if (!dimension.unlocked) return;
      dimension.nodes.forEach(node => {
        if (node.level > 0 && node.effect.type === 'production_mult') {
          bonus *= Math.pow(1 + node.effect.value, node.level);
        }
      });
    });
    return bonus;
  });
  totalMultiplierPower = computed(() => {
    let power = 0;
    this.state().dimensions.forEach(dimension => {
      if (!dimension.unlocked) return;
      dimension.nodes.forEach(node => {
        if (node.level > 0 && node.effect.type === 'multiplier_power') {
          power += node.effect.value * node.level;
        }
      });
    });
    return power;
  });
  totalSkillCapIncrease = computed(() => {
    let cap = 0;
    this.state().dimensions.forEach(dimension => {
      if (!dimension.unlocked) return;
      dimension.nodes.forEach(node => {
        if (node.level > 0 && node.effect.type === 'skill_cap') {
          cap += node.effect.value * node.level;
        }
      });
    });
    return cap;
  });
  totalStellarCoreBonus = computed(() => {
    let bonus = 0;
    this.state().dimensions.forEach(dimension => {
      if (!dimension.unlocked) return;
      dimension.nodes.forEach(node => {
        if (node.level > 0 && node.effect.type === 'stellar_core_bonus') {
          bonus += node.effect.value * node.level;
        }
      });
    });
    return bonus;
  });
  crossDimensionBonus = computed(() => {
    let bonus = 1;
    this.state().dimensions.forEach(dimension => {
      if (!dimension.unlocked) return;
      dimension.nodes.forEach(node => {
        if (node.level > 0 && node.effect.type === 'cross_dimension') {
          const special = node.effect.special;
          const value = node.effect.value;
          switch (special) {
            case 'void_synergy': {
              const voidNodes = this.getNodesInDimension('void').filter(n => n.level > 0).length;
              bonus *= (1 + value * voidNodes);
              break;
            }
            case 'crystal_synergy': {
              const crystalNodes = this.getNodesInDimension('crystal').filter(n => n.level > 0).length;
              break;
            }
            case 'quantum_synergy': {
              const quantumNodes = this.getNodesInDimension('quantum').filter(n => n.level > 0).length;
              bonus *= (1 + value * quantumNodes);
              break;
            }
            case 'temporal_synergy': {
              const temporalNodes = this.getNodesInDimension('temporal').filter(n => n.level > 0).length;
              bonus *= (1 + value * temporalNodes);
              break;
            }
            case 'prism_synergy': {
              const allNodes = Array.from(this.state().dimensions.values())
                .filter(d => d.unlocked)
                .flatMap(d => d.nodes)
                .filter(n => n.level > 0).length;
              bonus *= (1 + value * allNodes);
              break;
            }
          }
        }
      });
    });
    return bonus;
  });
  prismAllAspectsBonus = computed(() => {
    const prism = this.state().dimensions.get('prism');
    if (!prism || !prism.unlocked) return 0;
    const rootNode = prism.nodes.find(n => n.id === 'prism_root');
    if (!rootNode || rootNode.level === 0) return 0;
    return rootNode.effect.value * rootNode.level;
  });
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
  private getNodesInDimension(dimensionId: string): DimensionNode[] {
    const dimension = this.state().dimensions.get(dimensionId);
    return dimension ? dimension.nodes : [];
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
      const finalNodes = updatedNodes.map(node => {
        if (!node.unlocked && node.prerequisites.length > 0) {
          const prereqsMet = node.prerequisites.every(prereqId => {
            const prereq = updatedNodes.find(n => n.id === prereqId);
            return prereq && prereq.level >= prereq.maxLevel;
          });
          if (prereqsMet) {
            return { ...node, unlocked: true };
          }
        }
        return node;
      });
      updatedDimensions.set(dimensionId, { ...dimension, nodes: finalNodes });
      return {
        ...state,
        echoFragments: state.echoFragments - cost,
        dimensions: updatedDimensions
      };
    });
    this.saveState();
    this.triggerProductionRecalculation();
    return true;
  }
  private triggerProductionRecalculation(): void {
    if (!this.skillTreeService) {
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
      DIMENSIONS.forEach(configDim => {
        const savedDim = data.dimensions?.find((d: any) => d.id === configDim.id);
        if (savedDim) {
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
            nodes: restoredNodes
          });
        } else {
          dimensionMap.set(configDim.id, { ...configDim });
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
    this.initializeDimensions();
    this.state.update(state => ({
      ...state,
      echoFragments: 0,
      totalEchoFragments: 0
    }));
    localStorage.removeItem('stellarInfinitum_dimensions');
    localStorage.removeItem('treefinite_dimensions'); // Also clear old key if it exists
  }
}