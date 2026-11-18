import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Stage1Service } from '../../stages/stage1/stage1.service';
import { SkillNodeComponent } from '../skill-node/skill-node.component';

@Component({
  selector: 'app-skill-tree',
  imports: [CommonModule, SkillNodeComponent],
  templateUrl: './skill-tree.component.html',
  styleUrl: './skill-tree.component.css'
})
export class SkillTreeComponent {
  private stage1 = inject(Stage1Service);

  skills = this.stage1.skills;

  // Organize skills by their Y position (rows)
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

    // Sort each row by X position
    rowMap.forEach(row => {
      row.sort((a, b) => a.position.x - b.position.x);
    });

    // Convert to array and sort by Y
    return Array.from(rowMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(entry => entry[1]);
  });
}
