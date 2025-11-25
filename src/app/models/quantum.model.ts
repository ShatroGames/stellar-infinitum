export enum QuantumTreeType {
  MATTER = 'Matter',
  ENERGY = 'Energy',
  TIME = 'Time'
}
export enum QuantumNodeType {
  PRODUCTION = 'production',      // Increases base Quanta generation
  MULTIPLIER = 'multiplier',      // Multiplies total production
  SPECIAL = 'special',            // Unique effects
  SYNERGY = 'synergy'             // Unlocks cross-tree bonuses
}
export interface QuantumNode {
  id: string;
  tree: QuantumTreeType;
  type: QuantumNodeType;
  name: string;
  description: string;
  icon: string;
  level: number;
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  productionBonus?: number;       // Flat bonus to Quanta/sec
  multiplierBonus?: number;       // Percentage multiplier (1.0 = +100%)
  requiredNodes?: string[];       // Must have these nodes unlocked
  requiredQuantaGenerated?: number; // Total Quanta milestone
  position: { x: number; y: number };
}
export interface Synergy {
  id: string;
  name: string;
  description: string;
  requiredNodes: string[];        // All these nodes must be level > 0
  effect: {
    type: 'multiplier' | 'production' | 'special';
    value: number;
    description: string;
  };
  icon: string;
}
export interface QuantumState {
  quanta: number;
  totalQuantaGenerated: number;
  quantaPerSecond: number;
  nodes: Map<string, { level: number; unlocked: boolean }>;
  milestonesReached: number[];    // Track which milestone tiers unlocked
  collapseTime: number;           // When the collapse happened
  hasCollapsed: boolean;
}
export interface CollapseRequirements {
  allDimensionsMaxed: boolean;
  ready: boolean;
}