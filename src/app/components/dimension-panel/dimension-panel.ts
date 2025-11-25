import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DimensionService } from '../../services/dimension.service';
import { DimensionTreeComponent } from '../dimension-tree/dimension-tree';
import { Dimension } from '../../models/dimension.model';
@Component({
  selector: 'app-dimension-panel',
  imports: [CommonModule, DimensionTreeComponent],
  templateUrl: './dimension-panel.html',
  styleUrl: './dimension-panel.css'
})
export class DimensionPanelComponent {
  private dimensionService = inject(DimensionService);
  echoFragments = this.dimensionService.echoFragments;
  totalEchoFragments = this.dimensionService.totalEchoFragments;
  unlockedDimensions = signal<Dimension[]>([]);
  lockedDimensions = signal<Dimension[]>([]);
  selectedDimension = signal<Dimension | null>(null);
  protected readonly Array = Array;
  ngOnInit() {
    this.updateDimensions();
  }
  ngDoCheck() {
    this.updateDimensions();
  }
  private updateDimensions() {
    const unlocked = this.dimensionService.getUnlockedDimensions();
    const locked = this.dimensionService.getLockedDimensions();
    this.unlockedDimensions.set(unlocked);
    this.lockedDimensions.set(locked);
    const activeDims = unlocked.filter(dim => !this.isDimensionMaxed(dim));
    const currentSelected = this.selectedDimension();
    if (!currentSelected || this.isDimensionMaxed(currentSelected)) {
      if (activeDims.length > 0) {
        this.selectedDimension.set(activeDims[0]);
      } else if (unlocked.length > 0) {
        this.selectedDimension.set(unlocked[0]);
      }
    }
  }
  canUnlockDimension(dimensionId: string): boolean {
    return this.dimensionService.canUnlockDimension(dimensionId);
  }
  unlockDimension(dimensionId: string): void {
    if (this.dimensionService.unlockDimension(dimensionId)) {
      this.updateDimensions();
      const unlocked = this.unlockedDimensions();
      const newDim = unlocked.find(d => d.id === dimensionId);
      if (newDim) {
        this.selectedDimension.set(newDim);
      }
    }
  }
  selectDimension(dimension: Dimension): void {
    this.selectedDimension.set(dimension);
  }
  isDimensionMaxed(dimension: Dimension): boolean {
    return dimension.nodes.every(node => node.level >= node.maxLevel);
  }
  getActiveDimensions(): Dimension[] {
    return this.unlockedDimensions().filter(dim => !this.isDimensionMaxed(dim));
  }
  getMaxedDimensions(): Dimension[] {
    return this.unlockedDimensions().filter(dim => this.isDimensionMaxed(dim));
  }
}