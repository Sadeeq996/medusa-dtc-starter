import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { ORDER_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import { Order, OrderQueryParams, OrderSummary, OrderStatus } from '../models/order.model';

/**
 * Orders Service
 * Handles order-related API operations
 * Following the same pattern as ProductsService and CartService
 */
@Injectable({
  providedIn: 'root'
})
export class OrdersService {
  private readonly api = inject(ApiService);

  /**
   * Get all orders for current user
   * API: GET /api/v1/orders/user/{userId}
   * @param userId - User ID
   * @param params - Query parameters (optional)
   * @returns Observable of orders array
   */
  getUserOrders(userId: string, params?: OrderQueryParams): Observable<Order[]> {
    const endpoint = ORDER_ENDPOINTS.GET_USER_ORDERS(userId);
    return this.api.get<Order[]>(endpoint, params);
  }

  /**
   * Get single order by ID
   * Note: API doesn't have a dedicated endpoint, so we filter from all orders
   * @param userId - User ID
   * @param orderId - Order ID to find
   * @returns Observable of single order or null
   */
  getOrderById(userId: string, orderId: string): Observable<Order | null> {
    return this.getUserOrders(userId).pipe(
      map(orders => orders.find(order => order._id === orderId) || null)
    );
  }

  /**
   * Calculate order summary
   * Utility method to generate summary from order
   * 
   * Note: Filtering is done in components using computed signals for better performance
   * Components filter in-memory after fetching all orders once
   */
  calculateOrderSummary(order: Order): OrderSummary {
    const totalItems = order.cartItems.reduce((sum, item) => sum + item.count, 0);
    
    return {
      orderId: order._id,
      orderNumber: order.id,
      totalItems,
      totalPrice: order.totalOrderPrice,
      status: this.getOrderStatus(order),
      paymentMethod: order.paymentMethodType === 'cash' ? 'Cash on Delivery' : 'Credit/Debit Card',
      orderDate: this.formatOrderDate(order.createdAt)
    };
  }

  /**
   * Determine order status based on order properties
   * Following e-commerce best practices
   */
  getOrderStatus(order: Order): OrderStatus {
    if (order.isDelivered) {
      return 'delivered';
    }
    
    if (order.isPaid) {
      return 'processing'; // Paid orders are being processed
    }
    
    if (order.paymentMethodType === 'cash' && !order.isPaid) {
      return 'pending'; // Cash orders awaiting delivery
    }
    
    return 'pending';
  }

  /**
   * Get status display color for UI
   * Following PrimeNG severity conventions
   */
  getOrderStatusSeverity(status: OrderStatus): 'success' | 'info' | 'warn' | 'secondary' {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'processing':
      case 'shipped':
        return 'info';
      case 'pending':
        return 'warn';
      case 'cancelled':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  /**
   * Get payment method display color
   */
  getPaymentMethodSeverity(paymentMethod: 'cash' | 'card'): 'success' | 'info' {
    return paymentMethod === 'cash' ? 'success' : 'info';
  }

  /**
   * Format order date for display
   * @param dateString - ISO date string
   * @returns Formatted date string
   */
  formatOrderDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Format price with currency
   * Following the same pattern as cart.utils.ts
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(price);
  }

  /**
   * Calculate total items count across all orders
   */
  getTotalItemsCount(orders: Order[]): number {
    return orders.reduce((total, order) => {
      return total + order.cartItems.reduce((sum, item) => sum + item.count, 0);
    }, 0);
  }

  /**
   * Calculate total spent across all orders
   */
  getTotalSpent(orders: Order[]): number {
    return orders.reduce((total, order) => total + order.totalOrderPrice, 0);
  }
}

