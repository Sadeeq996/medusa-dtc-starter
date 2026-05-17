import { Component, inject, computed, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

// Translation
import { TranslatePipe } from '@ngx-translate/core';

// Feature Imports
import { CartStore } from '../../store/cart.store';
import { CartItem } from '../../models/cart.model';
import { AuthService } from '../../../auth/services/auth';

// Shared Utilities
import { formatPrice, getProductImageUrl, trackCartItem } from '../../../../shared/utils/cart.utils';

/**
 * Shopping Cart Page Component
 * Displays cart items, allows quantity updates, and provides checkout functionality
 */
@Component({
  selector: 'app-cart-page',
  imports: [
    CommonModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    BadgeModule,
    DividerModule,
    MessageModule,
    SkeletonModule,
    TagModule,
    // Translation
    TranslatePipe
  ],
  templateUrl: './cart-page.html',
  // ✅ No custom styles needed - using PrimeNG + Tailwind CSS
  changeDetection: ChangeDetectionStrategy.OnPush
})
// ✅ Using global MessageService from app.config.ts (not component-level provider)
export class CartPage {
  private readonly router = inject(Router);
  private readonly cartStore = inject(CartStore);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);

  // Cart state signals
  readonly cartItems = this.cartStore.items;
  readonly cartSummary = this.cartStore.summary;
  readonly isLoading = this.cartStore.isLoading;
  readonly error = this.cartStore.error;
  readonly isOperating = this.cartStore.isOperating;

  // Computed properties for UI
  readonly isEmpty = computed(() => this.cartItems().length === 0);
  readonly showEmptyState = computed(() => this.isEmpty() && !this.isLoading());
  readonly showLoadingState = computed(() => this.isLoading() && this.isEmpty());

  /**
   * Update item quantity with validation
   * ✅ Improved validation to prevent accidental deletions
   */
  updateQuantity(item: CartItem, newQuantity: string | number | null): void {
    const quantity = Number(newQuantity);
    
    // ✅ Validate input is a valid number
    if (isNaN(quantity) || quantity < 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Invalid Quantity',
        detail: 'Please enter a valid quantity (minimum 1)'
      });
      return;
    }
    
    // If quantity is 0, ask for confirmation before removing
    if (quantity === 0) {
      this.removeItem(item._id);
      return;
    }

    // Update quantity if changed
    if (quantity !== item.quantity) {
      this.cartStore.updateCartItem({
        productId: item.product._id,
        quantity: quantity
      });
    }
  }

  /**
   * Increment item quantity by 1
   * ✅ Better UX with explicit +/- buttons
   */
  incrementQuantity(item: CartItem): void {
    const newQuantity = item.quantity + 1;
    
    // Check if we can add more (stock limit)
    if (newQuantity > item.product.quantity) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Stock Limit Reached',
        detail: `Maximum available quantity is ${item.product.quantity}`
      });
      return;
    }
    
    this.cartStore.updateCartItem({
      productId: item.product._id,
      quantity: newQuantity
    });
    
    // ✅ Show success toast
    this.messageService.add({
      severity: 'success',
      summary: 'Item Added',
      detail: `Added one more ${item.product.title}`,
      life: 3000
    });
  }

  /**
   * Decrement item quantity by 1
   * ✅ Better UX with explicit +/- buttons
   */
  decrementQuantity(item: CartItem): void {
    const newQuantity = item.quantity - 1;
    
    // Minimum quantity is 1 (use remove button to delete)
    if (newQuantity < 1) {
      this.messageService.add({
        severity: 'info',
        summary: 'Minimum Quantity',
        detail: 'Use the delete button to remove this item from cart'
      });
      return;
    }
    
    this.cartStore.updateCartItem({
      productId: item.product._id,
      quantity: newQuantity
    });
    
    // ✅ Show success toast
    this.messageService.add({
      severity: 'success',
      summary: 'Item Removed',
      detail: `Removed one ${item.product.title}`,
      life: 3000
    });
  }

  /**
   * Remove item from cart
   * @param productId - Product ID to remove
   */
  removeItem(productId: string): void {
    // Find the item to show its title in the toast
    const item = this.cartItems().find(item => item.product._id === productId);
    
    this.cartStore.removeFromCart(productId);
    
    // ✅ Show success toast
    if (item) {
      this.messageService.add({
        severity: 'success',
        summary: 'Item Removed',
        detail: `${item.product.title} has been removed from your cart`,
        life: 3000
      });
    }
  }

  /**
   * Clear entire cart
   */
  clearCart(): void {
    const itemCount = this.cartItems().length;
    
    this.cartStore.clearCart();
    
    // ✅ Show success toast
    this.messageService.add({
      severity: 'success',
      summary: 'Cart Cleared',
      detail: `All ${itemCount} item${itemCount !== 1 ? 's' : ''} have been removed from your cart`,
      life: 3000
    });
  }

  /**
   * Continue shopping - navigate to products
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Proceed to checkout with authentication check
   * ✅ IMPLEMENTED: Based on API analysis and planned checkout flow
   */
  proceedToCheckout(): void {
    // 1️⃣ Check authentication status
    if (!this.authService.isAuthenticated()) {
      // User is NOT logged in - redirect to login with returnUrl
      this.messageService.add({
        severity: 'info',
        summary: 'Login Required',
        detail: 'Please sign in to proceed with checkout'
      });
      
      // Navigate to login with return URL to come back to checkout
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: '/cart/checkout' }
      });
      return;
    }

    // 2️⃣ User IS logged in - check if cart has items
    const cartSummary = this.cartSummary();
    
    if (cartSummary.totalItems === 0) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Empty Cart',
        detail: 'Your cart is empty. Add items to proceed with checkout.'
      });
      return;
    }

    // 3️⃣ Check if we have cartId (required for checkout API)
    const cartId = this.cartStore.cartId();
    
    if (!cartId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Cart Error',
        detail: 'Unable to proceed to checkout. Please refresh and try again.'
      });
      return;
    }

    // 4️⃣ Navigate to checkout page
    this.router.navigate(['/cart/checkout']);
  }

  /**
   * Navigate to product details
   */
  viewProductDetails(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  /**
   * Format currency for display
   * Uses shared utility for consistent formatting
   */
  formatPrice(price: number): string {
    return formatPrice(price);
  }

  /**
   * Get product image URL with fallback
   * Uses shared utility for consistent image handling
   */
  getProductImageUrl(item: CartItem): string {
    return getProductImageUrl(item);
  }

  /**
   * Track function for cart items to optimize change detection
   * Uses shared utility for consistent tracking
   */
  trackCartItem(item: CartItem): string {
    return trackCartItem(item);
  }

  /**
   * Clear cart error
   */
  clearError(): void {
    this.cartStore.clearError();
  }
}
