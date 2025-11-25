import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RecaptchaModule } from 'ng-recaptcha';

@Component({
    selector: 'app-recaptcha-wrapper',
    standalone: true,
    imports: [CommonModule, RecaptchaModule],
    template: `
    <div class="recaptcha-container">
      <re-captcha 
        [siteKey]="siteKey"
        (resolved)="onResolved($event)"
        [size]="size">
      </re-captcha>
      <p class="recaptcha-info" *ngIf="showInfo">
        <span class="info-icon">ℹ️</span>
        Por favor, complete el captcha para continuar
      </p>
    </div>
  `,
    styles: [`
    .recaptcha-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      margin: 20px 0;
    }
    .recaptcha-info {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }
    .info-icon {
      font-size: 16px;
    }
  `]
})
export class RecaptchaWrapperComponent {
    @Input() siteKey: string = '';
    @Input() size: 'normal' | 'compact' = 'normal';
    @Input() showInfo: boolean = true;
    @Output() captchaResolved = new EventEmitter<string | null>();

    onResolved(captchaResponse: string | null): void {
        this.captchaResolved.emit(captchaResponse);
    }
}

