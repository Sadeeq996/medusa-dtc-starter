import { Component, input, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { DividerModule } from 'primeng/divider';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Types
import { CartItem, CartSummary } from '../../models/cart.model';

// Shared Utilities
import { formatPrice, getProductImageUrl, trackCartItem } from '../../../../shared/utils/cart.utils';

/**
 * Order Summary Component
 * Displays cart items and order totals
 * Focused single responsibility: Order display only
 */
@Component({
  selector: 'app-order-summary',
  imports: [
    CommonModule,
    RouterModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    DividerModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './order-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderSummaryComponent {
  // Inputs
  readonly cartItems = input<CartItem[]>([]);
  readonly cartSummary = input<CartSummary>({ totalItems: 0, totalPrice: 0, isEmpty: true, itemsCount: '0 items' });
  readonly isProcessing = input<boolean>(false);

  /**
   * Track function for cart items to optimize change detection
   * Uses shared utility for consistent tracking
   */
  trackCartItem(item: CartItem): string {
    return trackCartItem(item);
  }

  /**
   * Get product image URL with fallback
   * Uses shared utility for consistent image handling
   */
  getProductImageUrl(item: CartItem): string {
    return getProductImageUrl(item);
  }

  /**
   * Format price for display
   * Uses shared utility for consistent formatting
   */
  formatPrice(price: number): string {
    return formatPrice(price);
  }
}
