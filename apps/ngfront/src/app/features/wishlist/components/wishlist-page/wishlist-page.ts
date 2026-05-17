import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Imports
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { CardModule } from 'primeng/card';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';

// Feature Imports
import { WishlistStore } from '../../store/wishlist.store';
import { Product } from '../../../products/models/product.model';
import { ProductCard } from '../../../../shared/components/product-card/product-card';

/**
 * Wishlist Page Component
 * Displays user's wishlist items using the reusable ProductCard component
 * Compact and DRY implementation - all product display logic handled by ProductCard
 */
@Component({
  selector: 'app-wishlist-page',
  imports: [
    CommonModule,
    TranslateModule,
    // PrimeNG
    ButtonModule,
    BadgeModule,
    CardModule,
    MessageModule,
    SkeletonModule,
    // Shared Components
    ProductCard
  ],
  templateUrl: './wishlist-page.html',
  styleUrl: './wishlist-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistPage {
  private readonly router = inject(Router);
  private readonly wishlistStore = inject(WishlistStore);

  // Wishlist state signals
  readonly wishlistItems = this.wishlistStore.items;
  readonly wishlistSummary = this.wishlistStore.summary;
  readonly isLoading = this.wishlistStore.isLoading;
  readonly error = this.wishlistStore.error;

  // Computed properties for UI states
  readonly isEmpty = computed(() => this.wishlistItems().length === 0);
  readonly showEmptyState = computed(() => this.isEmpty() && !this.isLoading());
  readonly showLoadingState = computed(() => this.isLoading() && this.isEmpty());

  /**
   * Navigate to products page
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Track function for ngFor optimization
   */
  trackByProductId(index: number, product: Product): string {
    return product._id;
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.wishlistStore.clearError();
  }
}
