import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { BadgeModule } from 'primeng/badge';

// Translation
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Feature Imports
import { CartStore } from '../../store/cart.store';

// Shared Utilities
import { formatDate } from '../../../../shared/utils/cart.utils';

/**
 * Checkout Success Page
 * Displays order confirmation and clears cart
 */
@Component({
  selector: 'app-checkout-success',
  imports: [
    CommonModule,
    RouterModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    MessageModule,
    DividerModule,
    BadgeModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './checkout-success.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutSuccessPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cartStore = inject(CartStore);
  private readonly translateService = inject(TranslateService);

  // Component state
  readonly orderId = signal<string | null>(null);
  readonly paymentMethod = signal<'cash' | 'card' | null>(null);

  constructor() {
    // Extract query params in constructor to use takeUntilDestroyed()
    this.route.queryParams
      .pipe(takeUntilDestroyed())
      .subscribe(params => {
        if (params['orderId']) {
          this.orderId.set(params['orderId']);
        }
        
        if (params['paymentMethod']) {
          this.paymentMethod.set(params['paymentMethod']);
        }
      });
  }

  ngOnInit(): void {
    this.clearCart();
  }

  /**
   * Clear cart after successful order
   */
  private clearCart(): void {
    // Clear cart in store - this will sync with localStorage/API
    this.cartStore.clearCart();
  }

  /**
   * Get payment method display label
   */
  getPaymentMethodLabel(): string {
    const method = this.paymentMethod();
    switch (method) {
      case 'cash':
        return this.translateService.instant('ORDER_SUCCESS.PAYMENT_CASH');
      case 'card':
        return this.translateService.instant('ORDER_SUCCESS.PAYMENT_CARD');
      default:
        return '';
    }
  }

  /**
   * Get current date formatted
   * Delegates to shared utility function
   */
  getCurrentDate(): string {
    return formatDate(new Date());
  }
}
