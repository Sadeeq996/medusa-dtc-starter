import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { TableModule } from 'primeng/table';
import { BadgeModule } from 'primeng/badge';
import { DividerModule } from 'primeng/divider';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Services
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../../auth/services/auth';

// Models
import { Order, OrderSummary } from '../../models/order.model';

/**
 * Orders Page Component
 * Displays list of all user orders with filtering
 * Following the same pattern as ProductListComponent and WishlistPage
 */
@Component({
  selector: 'app-orders-page',
  imports: [
    CommonModule,
    RouterModule,
    // Translation
    TranslateModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    TagModule,
    MessageModule,
    SkeletonModule,
    TableModule,
    BadgeModule,
    DividerModule
  ],
  templateUrl: './orders-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrdersPage implements OnInit {
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);

  // Component state
  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  readonly filterType = signal<'all' | 'cash' | 'card' | 'pending' | 'delivered'>('all');

  // Computed properties
  readonly filteredOrders = computed(() => {
    const allOrders = this.orders();
    const filter = this.filterType();

    switch (filter) {
      case 'cash':
        return allOrders.filter(order => order.paymentMethodType === 'cash');
      case 'card':
        return allOrders.filter(order => order.paymentMethodType === 'card');
      case 'pending':
        return allOrders.filter(order => !order.isDelivered);
      case 'delivered':
        return allOrders.filter(order => order.isDelivered);
      default:
        return allOrders;
    }
  });

  readonly orderSummaries = computed(() => 
    this.filteredOrders().map(order => this.ordersService.calculateOrderSummary(order))
  );

  readonly isEmpty = computed(() => this.orders().length === 0);
  readonly showEmptyState = computed(() => this.isEmpty() && !this.loading());
  readonly showLoadingState = computed(() => this.loading() && this.isEmpty());
  readonly hasOrders = computed(() => this.orders().length > 0);

  // Statistics
  readonly totalOrders = computed(() => this.orders().length);
  readonly totalSpent = computed(() => this.ordersService.getTotalSpent(this.orders()));
  readonly totalItems = computed(() => this.ordersService.getTotalItemsCount(this.orders()));

  ngOnInit(): void {
    this.loadOrders();
  }

  /**
   * Load orders from API
   * ⚠️ Note: User ID is ALWAYS extracted from JWT token (not from stored user data)
   * The API response doesn't include user._id, so we decode the JWT token payload
   */
  loadOrders(): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.error.set('User ID not found. Please log in again.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.ordersService.getUserOrders(userId).subscribe({
      next: (orders) => {
        // Sort by creation date (newest first)
        const sortedOrders = orders.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.orders.set(sortedOrders);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to load orders. Please try again.');
        this.loading.set(false);
        console.error('Orders load error:', error);
      }
    });
  }

  /**
   * Filter orders by type
   */
  filterOrders(type: 'all' | 'cash' | 'card' | 'pending' | 'delivered'): void {
    this.filterType.set(type);
  }

  /**
   * View order details
   */
  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/profile/orders', orderId]);
  }

  /**
   * Continue shopping
   */
  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  /**
   * Retry loading orders
   */
  retry(): void {
    this.loadOrders();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error.set('');
  }

  /**
   * Get status severity for PrimeNG Tag
   */
  getStatusSeverity(summary: OrderSummary): 'success' | 'info' | 'warn' | 'secondary' {
    return this.ordersService.getOrderStatusSeverity(summary.status);
  }

  /**
   * Get payment method severity
   */
  getPaymentMethodSeverity(paymentMethod: 'cash' | 'card'): 'success' | 'info' {
    return this.ordersService.getPaymentMethodSeverity(paymentMethod);
  }

  /**
   * Format price for display
   */
  formatPrice(price: number): string {
    return this.ordersService.formatPrice(price);
  }

  /**
   * Track by function for orders
   */
  trackByOrderId(index: number, order: Order): string {
    return order._id;
  }
}

