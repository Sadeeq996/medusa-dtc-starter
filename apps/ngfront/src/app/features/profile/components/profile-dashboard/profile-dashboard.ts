import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { AvatarModule } from 'primeng/avatar';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';

// Translation
import { TranslateModule, TranslateService } from '@ngx-translate/core';

// Services
import { AuthService } from '../../../auth/services/auth';
import { OrdersService } from '../../services/orders.service';
import { AddressService } from '../../services/address.service';

// Models
import { User } from '../../../../core/models/user.model';
import { Order } from '../../models/order.model';
import { Address } from '../../models/address.model';

/**
 * Profile Dashboard Statistics
 */
interface DashboardStats {
  totalOrders: number;
  totalAddresses: number;
  totalSpent: number;
}

/**
 * Profile Dashboard Component
 * Main profile landing page showing user overview, stats, and recent activity
 * Following PrimeNG component standards and semantic design tokens
 */
@Component({
  selector: 'app-profile-dashboard',
  imports: [
    CommonModule,
    // Translation
    TranslateModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    AvatarModule,
    TagModule,
    SkeletonModule,
    MessageModule
  ],
  templateUrl: './profile-dashboard.html',
  styleUrl: './profile-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProfileDashboardPage implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly ordersService = inject(OrdersService);
  private readonly addressService = inject(AddressService);
  private readonly translateService = inject(TranslateService);

  // Component state
  readonly currentUser = signal<User | null>(null);
  readonly recentOrders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  
  // Dashboard stats
  readonly stats = signal<DashboardStats>({
    totalOrders: 0,
    totalAddresses: 0,
    totalSpent: 0
  });

  // Computed properties
  readonly hasOrders = computed(() => this.recentOrders().length > 0);

  ngOnInit(): void {
    this.loadDashboardData();
  }

  /**
   * Load all dashboard data
   */
  loadDashboardData(): void {
    this.loading.set(true);
    this.error.set('');

    // Load current user
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.error.set('Unable to load user information');
      this.loading.set(false);
      return;
    }
    this.currentUser.set(user);

    // Get user ID
    const userId = this.authService.getCurrentUserId();
    if (!userId) {
      this.error.set('User ID not found');
      this.loading.set(false);
      return;
    }

    // Load orders and addresses in parallel
    Promise.all([
      this.loadOrders(userId),
      this.loadAddresses()
    ])
      .then(() => {
        this.loading.set(false);
      })
      .catch((error) => {
        console.error('Dashboard load error:', error);
        this.error.set('Failed to load dashboard data');
        this.loading.set(false);
      });
  }

  /**
   * Load user orders
   */
  private loadOrders(userId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ordersService.getUserOrders(userId, { limit: 3, sort: '-createdAt' }).subscribe({
        next: (orders) => {
          this.recentOrders.set(orders);
          
          // Calculate stats from orders
          const totalOrders = orders.length;
          const totalSpent = this.ordersService.getTotalSpent(orders);
          
          this.stats.update(stats => ({
            ...stats,
            totalOrders,
            totalSpent
          }));
          
          resolve();
        },
        error: (error) => {
          console.error('Orders load error:', error);
          // Don't reject - allow dashboard to load without orders
          resolve();
        }
      });
    });
  }

  /**
   * Load user addresses
   */
  private loadAddresses(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.addressService.getAddresses().subscribe({
        next: (addresses) => {
          this.stats.update(stats => ({
            ...stats,
            totalAddresses: addresses.length
          }));
          
          resolve();
        },
        error: (error) => {
          console.error('Addresses load error:', error);
          // Don't reject - allow dashboard to load without addresses
          resolve();
        }
      });
    });
  }


  /**
   * Get order status label
   */
  getOrderStatusLabel(order: Order): string {
    const summary = this.ordersService.calculateOrderSummary(order);
    return summary.status.charAt(0).toUpperCase() + summary.status.slice(1);
  }

  /**
   * Get order status severity for tag
   */
  getOrderStatusSeverity(order: Order): 'success' | 'info' | 'warn' | 'secondary' {
    const summary = this.ordersService.calculateOrderSummary(order);
    return this.ordersService.getOrderStatusSeverity(summary.status);
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    return this.ordersService.formatOrderDate(dateString);
  }

  /**
   * Format price with currency
   */
  formatPrice(price: number): string {
    return this.ordersService.formatPrice(price);
  }

  /**
   * Navigation methods
   */
  navigateToSettings(): void {
    this.router.navigate(['/profile/settings']);
  }

  navigateToOrders(): void {
    this.router.navigate(['/profile/orders']);
  }

  navigateToAddresses(): void {
    this.router.navigate(['/profile/addresses']);
  }

  navigateToProducts(): void {
    this.router.navigate(['/products']);
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/profile/orders', orderId]);
  }
}

