import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SkillTreeService } from '../../services/skill-tree.service';
import { SkillNodeComponent } from '../skill-node/skill-node.component';
@Component({
  selector: 'app-skill-tree',
  imports: [CommonModule, SkillNodeComponent],
  templateUrl: './skill-tree.component.html',
  styleUrl: './skill-tree.component.css'
})
export class SkillTreeComponent {
  private skillTreeService = inject(SkillTreeService);
  skills = computed(() => {
    return Array.from(this.skillTreeService.getSkills()().values());
  });
  skillRows = computed(() => {
    const skills = this.skills();
    const rowMap = new Map<number, typeof skills>();
    skills.forEach(skill => {
      const y = skill.position.y;
      if (!rowMap.has(y)) {
        rowMap.set(y, []);
      }
      rowMap.get(y)!.push(skill);
    });
    rowMap.forEach(row => {
      row.sort((a, b) => a.position.x - b.position.x);
    });
    return Array.from(rowMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(entry => entry[1]);
  });
}