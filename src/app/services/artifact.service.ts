import { Injectable, signal, computed } from '@angular/core';
import { Artifact, ArtifactState, ArtifactEffectType, ArtifactBranch } from '../models/artifact.model';
import { ARTIFACTS } from '../models/artifact-tree.config';

@Injectable({
  providedIn: 'root'
})
export class ArtifactService {
  private readonly UNLOCK_THRESHOLD = 50_000_000;
  
  private state = signal<ArtifactState>({
    unlockedArtifacts: new Set<string>(),
    artifactUnlockTime: new Map<string, number>(),
    systemUnlocked: false
  });

  private sessionStartTime = Date.now();
  private persistentBonusMultiplier = 1; // Accumulated from Perpetual Motion

  // Public signals
  systemUnlocked = computed(() => this.state().systemUnlocked);
  unlockedArtifacts = computed(() => this.state().unlockedArtifacts);

  constructor() {
    this.loadState();
  }

  // Check if system should be unlocked based on total Quanta
  checkUnlock(totalQuantaGenerated: number): boolean {
    if (!this.state().systemUnlocked && totalQuantaGenerated >= this.UNLOCK_THRESHOLD) {
      this.state.update(s => ({ ...s, systemUnlocked: true }));
      this.saveState();
      return true; // Return true to trigger notification
    }
    return false;
  }

  // Check if artifact can be unlocked
  canUnlockArtifact(artifactId: string, currentQuanta: number, totalQuantaGenerated: number): boolean {
    const artifact = ARTIFACTS.find((a: Artifact) => a.id === artifactId);
    if (!artifact) return false;

    // Already unlocked
    if (this.state().unlockedArtifacts.has(artifactId)) return false;

    // Check Quanta cost
    if (currentQuanta < artifact.cost) return false;

    // Check total Quanta milestone
    if (artifact.requiredTotalQuanta && totalQuantaGenerated < artifact.requiredTotalQuanta) {
      return false;
    }

    // Check prerequisites
    const prereqsMet = artifact.prerequisites.every((prereqId: string) => 
      this.state().unlockedArtifacts.has(prereqId)
    );

    return prereqsMet;
  }

  // Unlock an artifact
  unlockArtifact(artifactId: string): boolean {
    const artifact = ARTIFACTS.find((a: Artifact) => a.id === artifactId);
    if (!artifact) return false;

    this.state.update(s => {
      const newUnlocked = new Set(s.unlockedArtifacts);
      newUnlocked.add(artifactId);
      
      const newUnlockTime = new Map(s.artifactUnlockTime);
      newUnlockTime.set(artifactId, Date.now());

      return {
        ...s,
        unlockedArtifacts: newUnlocked,
        artifactUnlockTime: newUnlockTime
      };
    });

    this.saveState();
    return true;
  }

  // Get artifact by ID
  getArtifact(artifactId: string): Artifact | undefined {
    return ARTIFACTS.find((a: Artifact) => a.id === artifactId);
  }

  // Get all artifacts
  getAllArtifacts(): Artifact[] {
    return ARTIFACTS;
  }

  // Check if artifact is unlocked
  isArtifactUnlocked(artifactId: string): boolean {
    return this.state().unlockedArtifacts.has(artifactId);
  }

  // Calculate all artifact bonuses and return multipliers
  calculateArtifactBonuses(currentQuanta: number): {
    flatProductionBonus: number;
    productionMultiplier: number;
    idleBonus: number;
  } {
    if (!this.state().systemUnlocked) {
      return { flatProductionBonus: 0, productionMultiplier: 1, idleBonus: 0 };
    }

    let flatProductionBonus = 0;
    let productionMultiplier = 1;
    let idleBonus = 0;
    let effectivenessMultiplier = 1;

    const currentTime = Date.now();
    const sessionDurationMinutes = (currentTime - this.sessionStartTime) / 60000;

    // Get only the highest tier artifact from each branch
    const highestTierArtifacts = this.getHighestTierArtifacts();

    // First pass: collect effectiveness bonus from highest tier artifacts only
    highestTierArtifacts.forEach(artifact => {
      artifact.effects.forEach(effect => {
        if (effect.type === ArtifactEffectType.EFFECTIVENESS_BONUS) {
          effectivenessMultiplier += effect.value / 100;
        }
      });
    });

    // Second pass: apply all other bonuses with effectiveness (highest tier only)
    highestTierArtifacts.forEach(artifact => {
      artifact.effects.forEach(effect => {
        let effectValue = effect.value;

        // Apply effectiveness multiplier to enhance bonuses
        if (effect.type !== ArtifactEffectType.EFFECTIVENESS_BONUS) {
          effectValue *= effectivenessMultiplier;
        }

        switch (effect.type) {
          case ArtifactEffectType.FLAT_PRODUCTION:
            flatProductionBonus += effectValue;
            break;

          case ArtifactEffectType.MULTIPLIER:
            productionMultiplier *= effectValue;
            break;

          case ArtifactEffectType.RESONANCE:
            // Resonance: +X% per artifact from OTHER branches (not counting resonance artifacts)
            const otherBranchArtifacts = Array.from(this.state().unlockedArtifacts)
              .map(id => this.getArtifact(id))
              .filter(a => a && a.branch !== ArtifactBranch.RESONANCE)
              .length;
            
            const resonanceBonus = otherBranchArtifacts * effectValue;
            productionMultiplier *= (1 + resonanceBonus / 100);
            break;

          case ArtifactEffectType.IDLE_BONUS:
            idleBonus += effectValue;
            break;

          case ArtifactEffectType.SCALING_BONUS:
            // +X% per quantum node level (applied as flat bonus here)
            const scalingBonus = effectValue;
            productionMultiplier *= (1 + scalingBonus / 100);
            break;

          case ArtifactEffectType.STORED_QUANTA_BONUS:
            // +X% per 10M Quanta held
            const storedBonus = Math.floor(currentQuanta / 10_000_000) * effectValue;
            productionMultiplier *= (1 + storedBonus / 100);
            break;

          case ArtifactEffectType.PERSISTENT_BONUS:
            // +X% per minute of active play (max 500%)
            const minutes = Math.min(sessionDurationMinutes, 50); // Cap at 50 minutes for 500% max
            const persistentBonus = minutes * effectValue;
            productionMultiplier *= (1 + persistentBonus / 100);
            break;

          case ArtifactEffectType.COMPOUND_BONUS:
            // +X% compound per minute (no cap)
            const compoundBonus = sessionDurationMinutes * effectValue;
            productionMultiplier *= (1 + compoundBonus / 100);
            break;
        }
      });
    });

    return { flatProductionBonus, productionMultiplier, idleBonus };
  }

  // Get the highest tier unlocked artifact from each branch
  private getHighestTierArtifacts(): Artifact[] {
    const branchHighest = new Map<string, Artifact>();

    this.state().unlockedArtifacts.forEach(artifactId => {
      const artifact = this.getArtifact(artifactId);
      if (!artifact) return;

      const branchKey = artifact.branch;
      const current = branchHighest.get(branchKey);

      if (!current || artifact.tier > current.tier) {
        branchHighest.set(branchKey, artifact);
      }
    });

    return Array.from(branchHighest.values());
  }
  
  // Check if all three branches have reached tier 10
  hasAllBranchesTier10(): boolean {
    const highestTiers = this.getHighestTierArtifacts();
    
    // Need all 3 branches (production, multiplier, resonance)
    if (highestTiers.length < 3) return false;
    
    // Check if all branches are at tier 10
    return highestTiers.every(artifact => artifact.tier >= 10);
  }

  // Update persistent bonus (called before session ends)
  updatePersistentBonus(currentMultiplier: number): void {
    // Check if Perpetual Motion is unlocked
    if (this.state().unlockedArtifacts.has('eff_4')) {
      this.persistentBonusMultiplier = Math.max(this.persistentBonusMultiplier, currentMultiplier);
    }
  }

  // Save state
  private saveState(): void {
    const state = this.state();
    const saveData = {
      unlockedArtifacts: Array.from(state.unlockedArtifacts),
      artifactUnlockTime: Array.from(state.artifactUnlockTime.entries()),
      systemUnlocked: state.systemUnlocked,
      persistentBonusMultiplier: this.persistentBonusMultiplier
    };
    localStorage.setItem('stellarInfinitum_artifacts', JSON.stringify(saveData));
  }

  // Load state
  private loadState(): void {
    const saved = localStorage.getItem('stellarInfinitum_artifacts');
    if (!saved) return;

    try {
      const data = JSON.parse(saved);
      this.state.set({
        unlockedArtifacts: new Set(data.unlockedArtifacts || []),
        artifactUnlockTime: new Map(data.artifactUnlockTime || []),
        systemUnlocked: data.systemUnlocked || false
      });
      this.persistentBonusMultiplier = data.persistentBonusMultiplier || 1;
    } catch (e) {
      console.error('Failed to load artifact state:', e);
    }
  }

  // Get save data for export
  getSaveData(): any {
    const state = this.state();
    return {
      unlockedArtifacts: Array.from(state.unlockedArtifacts),
      artifactUnlockTime: Array.from(state.artifactUnlockTime.entries()),
      systemUnlocked: state.systemUnlocked,
      persistentBonusMultiplier: this.persistentBonusMultiplier
    };
  }

  // Load from imported save
  loadSaveData(data: any): void {
    if (!data) return;

    this.state.set({
      unlockedArtifacts: new Set(data.unlockedArtifacts || []),
      artifactUnlockTime: new Map(data.artifactUnlockTime || []),
      systemUnlocked: data.systemUnlocked || false
    });
    this.persistentBonusMultiplier = data.persistentBonusMultiplier || 1;
    this.saveState();
  }

  // Reset artifact system
  reset(): void {
    this.state.set({
      unlockedArtifacts: new Set<string>(),
      artifactUnlockTime: new Map<string, number>(),
      systemUnlocked: false
    });
    this.sessionStartTime = Date.now();
    this.persistentBonusMultiplier = 1;
    this.saveState();
  }
}
