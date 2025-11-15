import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../services/game.service';
import { Decimal, formatNumber } from '../../utils/numbers';

@Component({
  selector: 'app-resource-display',
  imports: [CommonModule],
  templateUrl: './resource-display.component.html',
  styleUrl: './resource-display.component.css'
})
export class ResourceDisplayComponent {
  private gameService = inject(GameService);
  
  resources = computed(() => {
    return Array.from(this.gameService.getResources()().values());
  });

  formatNumber(value: Decimal | number): string {
    return formatNumber(value);
  }
}
