import { Component } from '@angular/core';
import { AsyncPipe, NgIf } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SpinnerService } from '../services/spinner.service';

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [NgIf, AsyncPipe, MatProgressSpinnerModule],
  template: `
    <div class="overlay" *ngIf="spinner.loading$ | async">
      <mat-progress-spinner mode="indeterminate" diameter="60"></mat-progress-spinner>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
  `]
})
export class SpinnerComponent {
  constructor(public spinner: SpinnerService) {}
}
