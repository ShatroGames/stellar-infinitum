import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillNode } from '../../models/skill-node.model';
import { Stage1Service } from '../../stages/stage1/stage1.service';
import { formatNumber } from '../../utils/numbers';

@Component({
  selector: 'app-skill-node',
  imports: [CommonModule],
  templateUrl: './skill-node.component.html',
  styleUrl: './skill-node.component.css'
})
export class SkillNodeComponent {
  skill = input.required<SkillNode>();

  private stage1 = inject(Stage1Service);

  upgradeCost = computed(() => formatNumber(this.stage1.getUpgradeCost(this.skill().id)));
  isMaxed = computed(() => this.skill().level >= this.skill().maxLevel);
  unlocked = computed(() => {
    this.skill();
    return this.stage1.isUnlocked(this.skill().id);
  });
  canUpgrade = computed(() => {
    this.stage1.currency();
    return this.stage1.canUpgrade(this.skill().id);
  });

  prerequisites = computed(() => this.skill().prerequisites
    .map(id => this.stage1.getSkill(id))
    .filter((p): p is SkillNode => !!p)
    .map(p => ({ name: p.name, maxed: p.level >= p.maxLevel })));

  hasPrerequisites = computed(() => this.prerequisites().length > 0);
  allPrerequisitesMet = computed(() => this.prerequisites().every(p => p.maxed));

  onUpgrade(): void {
    this.stage1.upgrade(this.skill().id);
  }
}
