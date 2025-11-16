import { Component, computed, inject, input, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillNode } from '../../models/skill-node.model';
import { SkillTreeService } from '../../services/skill-tree.service';
import { formatNumber } from '../../utils/numbers';

@Component({
  selector: 'app-skill-node',
  imports: [CommonModule],
  templateUrl: './skill-node.component.html',
  styleUrl: './skill-node.component.css'
})
export class SkillNodeComponent {
  skill = input.required<SkillNode>();
  
  private skillTreeService = inject(SkillTreeService);

  // Memoize cost calculation to prevent redundant work
  upgradeCost = computed(() => {
    const skill = this.skill();
    return formatNumber(this.skillTreeService.getUpgradeCost(skill.id));
  });

  isMaxed = computed(() => {
    const skill = this.skill();
    return skill.level >= skill.maxLevel;
  });

  canUpgrade = computed(() => {
    const skill = this.skill();
    return this.skillTreeService.canUpgrade(skill.id);
  });

  // Get prerequisite nodes information - only recalculate when skill changes
  prerequisites = computed(() => {
    const skill = this.skill();
    if (skill.prerequisites.length === 0) return [];
    
    const allSkills = this.skillTreeService.getSkills()();
    return skill.prerequisites.map(prereqId => {
      const prereq = allSkills.get(prereqId);
      return prereq ? {
        name: prereq.name,
        maxed: prereq.level >= prereq.maxLevel
      } : null;
    }).filter(p => p !== null);
  });

  hasPrerequisites = computed(() => {
    return this.prerequisites().length > 0;
  });

  allPrerequisitesMet = computed(() => {
    return this.prerequisites().every(p => p!.maxed);
  });

  onUpgrade(): void {
    if (this.canUpgrade()) {
      this.skillTreeService.upgradeSkill(this.skill().id);
    }
  }
}
