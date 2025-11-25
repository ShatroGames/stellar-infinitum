import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TutorialService } from '../../services/tutorial.service';
@Component({
  selector: 'app-tutorial-popup',
  imports: [CommonModule],
  templateUrl: './tutorial-popup.html',
  styleUrl: './tutorial-popup.css',
})
export class TutorialPopup {
  private tutorialService = inject(TutorialService);
  popup = computed(() => this.tutorialService.getCurrentPopup()());
  onDismiss(): void {
    const popup = this.popup();
    if (popup) {
      this.tutorialService.dismissPopup(popup.id);
    }
  }
}