import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { ORDER_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import { extractErrorMessage } from '../../../shared/utils/error.utils';

/**
 * Shipping Address Interface
 * Based on API requirements from Postman collection
 */
export interface ShippingAddress {
  name?: string;                        // Address label (Home, Work, etc.) - Optional for checkout, required for profile
  details: string;                      // Address details
  phone: string;                        // Phone number
  city: string;                         // City name
}

/**
 * Cash Order Request
 * API: POST /orders/{cartId}
 */
export interface CashOrderRequest {
  cartId: string;                       // Cart ID from CartStore
  shippingAddress: ShippingAddress;     // Delivery address
}

/**
 * Cash Order Response
 * Based on real API response structure
 */
export interface CashOrderResponse {
  status: string;                       // "success"
  data: {
    _id: string;                        // Order ID
    user: string;                       // User ID
    cartItems: any[];                   // Order items
    totalOrderPrice: number;            // Total price
    paymentMethodType: string;          // "cash"
    isPaid: boolean;                    // false for cash orders
    isDelivered: boolean;               // false initially
    createdAt: string;                  // Order creation date
    updatedAt: string;                  // Last update
  };
}

/**
 * Stripe Session Request
 * API: POST /orders/checkout-session/{cartId}?url={returnUrl}
 */
export interface StripeSessionRequest {
  cartId: string;                       // Cart ID from CartStore
  shippingAddress: ShippingAddress;     // Delivery address
  returnUrl: string;                    // URL to return after payment
}

/**
 * Stripe Session Response
 * Based on real API response structure
 */
export interface StripeSessionResponse {
  status: string;                       // "success"
  session: {
    url: string;                        // Stripe checkout URL to redirect to
  };
}

/**
 * Order Operation Result
 */
export interface CheckoutOperationResult {
  success: boolean;                     // Whether operation succeeded
  message?: string;                     // Success/error message
  orderId?: string;                     // Order ID for cash orders
  stripeUrl?: string;                   // Stripe checkout URL for card payments
  order?: CashOrderResponse['data'];    // Full order data for cash orders
}

/**
 * Checkout Service
 * Handles cash on delivery and Stripe payment processing
 * Based on real API testing with Route E-commerce backend
 */
@Injectable({
  providedIn: 'root'
})
export class CheckoutService {
  private readonly api = inject(ApiService);

  /**
   * Create cash on delivery order
   * API: POST /api/v1/orders/{cartId}
   */
  createCashOrder(request: CashOrderRequest): Observable<CheckoutOperationResult> {
    const endpoint = ORDER_ENDPOINTS.CREATE_CASH_ORDER(request.cartId);
    
    return this.api.post<CashOrderResponse>(endpoint, {
      shippingAddress: request.shippingAddress
    }).pipe(
      map(response => ({
        success: true,
        message: 'Order placed successfully! You will pay cash on delivery.',
        orderId: response.data._id,
        order: response.data
      })),
      catchError(error => {
        console.error('Cash order creation error:', error);
        return of({
          success: false,
          message: extractErrorMessage(error)
        });
      })
    );
  }

  /**
   * Create Stripe checkout session
   * API: POST /api/v1/orders/checkout-session/{cartId}?url={returnUrl}
   * 
   * ⚠️ IMPORTANT: Backend currently uses hardcoded URLs:
   * - success_url: "http://localhost:3000/allorders" 
   * - cancel_url: "http://localhost:3000/cart"
   * 
   * Our returnUrl parameter may be ignored. Consider:
   * 1. Backend should use Angular app URLs: http://localhost:4200/cart/success
   * 2. Backend should respect the returnUrl parameter we send
   * 3. Or create matching routes in Angular app
   */
  createStripeSession(request: StripeSessionRequest): Observable<CheckoutOperationResult> {
    // Build URL with return parameter (may be ignored by backend)
    const baseEndpoint = ORDER_ENDPOINTS.CREATE_STRIPE_SESSION(request.cartId);
    const endpoint = `${baseEndpoint}?url=${encodeURIComponent(request.returnUrl)}`;
    
    return this.api.post<StripeSessionResponse>(endpoint, {
      shippingAddress: request.shippingAddress
    }).pipe(
      map(response => ({
        success: true,
        message: 'Redirecting to secure payment...',
        stripeUrl: response.session.url
      })),
      catchError(error => {
        console.error('Stripe session creation error:', error);
        return of({
          success: false,
          message: extractErrorMessage(error)
        });
      })
    );
  }

}
