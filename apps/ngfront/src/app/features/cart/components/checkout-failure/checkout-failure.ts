import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

// Translation
import { TranslateModule } from '@ngx-translate/core';

/**
 * Checkout Failure Page
 * Displays payment failure message and options to retry
 */
@Component({
  selector: 'app-checkout-failure',
  imports: [
    CommonModule,
    RouterModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    MessageModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './checkout-failure.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutFailurePage {
  private readonly route = inject(ActivatedRoute);

  // Component state
  readonly errorReason = signal<string | null>(null);

  constructor() {
    // Extract error details in constructor to use takeUntilDestroyed()
    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        if (params['error']) {
          this.errorReason.set(decodeURIComponent(params['error']));
        }
        
        if (params['message']) {
          this.errorReason.set(decodeURIComponent(params['message']));
        }
      });
  }
}
