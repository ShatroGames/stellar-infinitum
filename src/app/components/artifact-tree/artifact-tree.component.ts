import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArtifactService } from '../../services/artifact.service';
import { QuantumService } from '../../services/quantum.service';
import { Artifact, ArtifactBranch } from '../../models/artifact.model';
import { formatNumber } from '../../utils/numbers';
import { ARTIFACTS } from '../../models/artifact-tree.config';
@Component({
  selector: 'app-artifact-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './artifact-tree.component.html',
  styleUrls: ['./artifact-tree.component.css']
})
export class ArtifactTreeComponent {
  artifactService = inject(ArtifactService);
  quantumService = inject(QuantumService);
  artifacts = ARTIFACTS;
  ArtifactBranch = ArtifactBranch;
  currentQuanta = computed(() => this.quantumService.quanta());
  totalQuantaGenerated = computed(() => this.quantumService.totalQuantaGenerated());
  unlockedArtifacts = computed(() => this.artifactService.unlockedArtifacts());
  formatNumber = formatNumber;
  getArtifactsByBranch(branch: ArtifactBranch): Artifact[] {
    const branchArtifacts = this.artifacts.filter((a: Artifact) => a.branch === branch);
    const unlockedTiers = branchArtifacts
      .filter((a: Artifact) => this.isUnlocked(a.id))
      .map((a: Artifact) => a.tier);
    const highestUnlockedTier = unlockedTiers.length > 0 ? Math.max(...unlockedTiers) : 0;
    return branchArtifacts.filter((a: Artifact) => 
      !this.isUnlocked(a.id) || a.tier === highestUnlockedTier
    );
  }
  canUnlock(artifact: Artifact): boolean {
    return this.artifactService.canUnlockArtifact(
      artifact.id,
      this.currentQuanta(),
      this.totalQuantaGenerated()
    );
  }
  isUnlocked(artifactId: string): boolean {
    return this.artifactService.isArtifactUnlocked(artifactId);
  }
  unlockArtifact(artifact: Artifact): void {
    if (!this.canUnlock(artifact)) return;
    if (!this.quantumService.spendQuanta(artifact.cost)) return;
    this.artifactService.unlockArtifact(artifact.id);
    this.quantumService.calculateProduction();
  }
  getArtifactStatus(artifact: Artifact): string {
    if (this.isUnlocked(artifact.id)) return 'unlocked';
    if (this.canUnlock(artifact)) return 'available';
    const prereqsMet = artifact.prerequisites.every(id => this.isUnlocked(id));
    if (!prereqsMet) return 'locked';
    if (artifact.requiredTotalQuanta && this.totalQuantaGenerated() < artifact.requiredTotalQuanta) {
      return 'milestone-locked';
    }
    return 'cost-locked';
  }
  getStatusMessage(artifact: Artifact): string {
    const status = this.getArtifactStatus(artifact);
    switch (status) {
      case 'unlocked':
        return 'Unlocked';
      case 'available':
        return 'Available';
      case 'locked':
        return 'Prerequisites not met';
      case 'milestone-locked':
        return `Requires ${formatNumber(artifact.requiredTotalQuanta || 0)} total Quanta`;
      case 'cost-locked':
        return `Need ${formatNumber(artifact.cost - this.currentQuanta())} more Quanta`;
      default:
        return '';
    }
  }
}