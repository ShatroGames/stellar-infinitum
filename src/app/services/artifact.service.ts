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
  systemUnlocked = computed(() => this.state().systemUnlocked);
  unlockedArtifacts = computed(() => this.state().unlockedArtifacts);
  constructor() {
    this.loadState();
  }
  checkUnlock(totalQuantaGenerated: number): boolean {
    if (!this.state().systemUnlocked && totalQuantaGenerated >= this.UNLOCK_THRESHOLD) {
      this.state.update(s => ({ ...s, systemUnlocked: true }));
      this.saveState();
      return true; // Return true to trigger notification
    }
    return false;
  }
  canUnlockArtifact(artifactId: string, currentQuanta: number, totalQuantaGenerated: number): boolean {
    const artifact = ARTIFACTS.find((a: Artifact) => a.id === artifactId);
    if (!artifact) return false;
    if (this.state().unlockedArtifacts.has(artifactId)) return false;
    if (currentQuanta < artifact.cost) return false;
    if (artifact.requiredTotalQuanta && totalQuantaGenerated < artifact.requiredTotalQuanta) {
      return false;
    }
    const prereqsMet = artifact.prerequisites.every((prereqId: string) => 
      this.state().unlockedArtifacts.has(prereqId)
    );
    return prereqsMet;
  }
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
  getArtifact(artifactId: string): Artifact | undefined {
    return ARTIFACTS.find((a: Artifact) => a.id === artifactId);
  }
  getAllArtifacts(): Artifact[] {
    return ARTIFACTS;
  }
  isArtifactUnlocked(artifactId: string): boolean {
    return this.state().unlockedArtifacts.has(artifactId);
  }
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
    const highestTierArtifacts = this.getHighestTierArtifacts();
    highestTierArtifacts.forEach(artifact => {
      artifact.effects.forEach(effect => {
        if (effect.type === ArtifactEffectType.EFFECTIVENESS_BONUS) {
          effectivenessMultiplier += effect.value / 100;
        }
      });
    });
    highestTierArtifacts.forEach(artifact => {
      artifact.effects.forEach(effect => {
        let effectValue = effect.value;
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
            const scalingBonus = effectValue;
            productionMultiplier *= (1 + scalingBonus / 100);
            break;
          case ArtifactEffectType.STORED_QUANTA_BONUS:
            const storedBonus = Math.floor(currentQuanta / 10_000_000) * effectValue;
            productionMultiplier *= (1 + storedBonus / 100);
            break;
          case ArtifactEffectType.PERSISTENT_BONUS:
            const minutes = Math.min(sessionDurationMinutes, 50); // Cap at 50 minutes for 500% max
            const persistentBonus = minutes * effectValue;
            productionMultiplier *= (1 + persistentBonus / 100);
            break;
          case ArtifactEffectType.COMPOUND_BONUS:
            const compoundBonus = sessionDurationMinutes * effectValue;
            productionMultiplier *= (1 + compoundBonus / 100);
            break;
        }
      });
    });
    return { flatProductionBonus, productionMultiplier, idleBonus };
  }
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
  hasAllBranchesTier10(): boolean {
    const highestTiers = this.getHighestTierArtifacts();
    if (highestTiers.length < 3) return false;
    return highestTiers.every(artifact => artifact.tier >= 10);
  }
  updatePersistentBonus(currentMultiplier: number): void {
    if (this.state().unlockedArtifacts.has('eff_4')) {
      this.persistentBonusMultiplier = Math.max(this.persistentBonusMultiplier, currentMultiplier);
    }
  }
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
  getSaveData(): any {
    const state = this.state();
    return {
      unlockedArtifacts: Array.from(state.unlockedArtifacts),
      artifactUnlockTime: Array.from(state.artifactUnlockTime.entries()),
      systemUnlocked: state.systemUnlocked,
      persistentBonusMultiplier: this.persistentBonusMultiplier
    };
  }
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