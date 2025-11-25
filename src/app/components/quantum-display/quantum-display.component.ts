import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuantumService } from '../../services/quantum.service';
import { formatNumber } from '../../utils/numbers';
@Component({
  selector: 'app-quantum-display',
  imports: [CommonModule],
  templateUrl: './quantum-display.component.html',
  styleUrl: './quantum-display.component.css'
})
export class QuantumDisplayComponent {
  protected quantumService = inject(QuantumService);
  protected formatNumber = formatNumber;
}