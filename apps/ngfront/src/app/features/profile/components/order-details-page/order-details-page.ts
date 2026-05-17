import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { DividerModule } from 'primeng/divider';
import { BreadcrumbModule } from 'primeng/breadcrumb';
import { MenuItem } from 'primeng/api';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Services
import { OrdersService } from '../../services/orders.service';
import { AuthService } from '../../../auth/services/auth';

// Models
import { Order, OrderSummary } from '../../models/order.model';

/**
 * Order Details Page Component
 * Displays detailed information about a specific order
 * Following the same pattern as ProductDetailsComponent
 */
@Component({
  selector: 'app-order-details-page',
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
    DividerModule,
    BreadcrumbModule
  ],
  templateUrl: './order-details-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OrderDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);

  // Component state
  readonly order = signal<Order | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string>('');

  // Computed properties
  readonly orderSummary = computed(() => {
    const currentOrder = this.order();
    return currentOrder ? this.ordersService.calculateOrderSummary(currentOrder) : null;
  });

  readonly breadcrumbItems = computed<MenuItem[]>(() => [
    { label: 'Profile', routerLink: '/profile/orders' },
    { label: 'My Orders', routerLink: '/profile/orders' },
    { label: `Order #${this.orderSummary()?.orderNumber || '...'}` }
  ]);

  readonly hasOrder = computed(() => !!this.order());

  ngOnInit(): void {
    const orderId = this.route.snapshot.params['id'];
    if (orderId) {
      this.loadOrderDetails(orderId);
    } else {
      this.error.set('Order ID not provided');
    }
  }

  /**
   * Load order details from API
   * ⚠️ Note: User ID is ALWAYS extracted from JWT token (not from stored user data)
   */
  private loadOrderDetails(orderId: string): void {
    const userId = this.authService.getCurrentUserId();
    
    if (!userId) {
      this.error.set('User ID not found. Please log in again.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.ordersService.getOrderById(userId, orderId).subscribe({
      next: (order) => {
        if (order) {
          this.order.set(order);
        } else {
          this.error.set('Order not found');
        }
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to load order details. Please try again.');
        this.loading.set(false);
        console.error('Order details load error:', error);
      }
    });
  }

  /**
   * Navigate back to orders list
   */
  backToOrders(): void {
    this.router.navigate(['/profile/orders']);
  }

  /**
   * Navigate to product details
   */
  viewProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }

  /**
   * Retry loading order
   */
  retry(): void {
    const orderId = this.route.snapshot.params['id'];
    if (orderId) {
      this.loadOrderDetails(orderId);
    }
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
   * Format date for display
   */
  formatDate(dateString: string): string {
    return this.ordersService.formatOrderDate(dateString);
  }
}

