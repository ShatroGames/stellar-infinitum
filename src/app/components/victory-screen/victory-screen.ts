import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantumService } from '../../services/quantum.service';
import { formatNumber } from '../../utils/numbers';
@Component({
  selector: 'app-victory-screen',
  imports: [CommonModule],
  templateUrl: './victory-screen.html',
  styleUrl: './victory-screen.css',
})
export class VictoryScreen {
  quantumService = inject(QuantumService);
  formatNumber = formatNumber;
  hasWon = this.quantumService.hasWon;
  totalQuanta = this.quantumService.totalQuantaGenerated;
  currentYear = new Date().getFullYear();
  closeVictory(): void {
    this.quantumService.dismissVictory();
  }
}