import { Component } from '@angular/core';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TranslateModule } from '@ngx-translate/core';

/**
 * Global route loading spinner
 * Shows during lazy-loaded route transitions
 * Supports Arabic and English translations
 */
@Component({
  selector: 'app-loading-spinner',
  imports: [
    ProgressSpinnerModule,
    TranslateModule
  ],
  template: `
    <div class="flex flex-col items-center justify-center gap-4 min-h-[60vh] px-4">
      <p-progressSpinner 
        strokeWidth="8"
        fill="transparent"
        animationDuration=".5s"
        [style]="{ width: '50px', height: '50px' }"
        [ariaLabel]="'LOADING.ARIA_LABEL' | translate" />
      
      <div class="text-center">
        <p class="text-color text-base font-medium mb-1">
          {{ 'LOADING.TITLE' | translate }}
        </p>
        <p class="text-muted-color text-sm">
          {{ 'LOADING.MESSAGE' | translate }}
        </p>
      </div>
    </div>
  `,
  styles: `
    :host ::ng-deep .p-progressspinner-circle {
      stroke: var(--p-primary-color) !important;
    }
  `
})
export class LoadingSpinner {}
