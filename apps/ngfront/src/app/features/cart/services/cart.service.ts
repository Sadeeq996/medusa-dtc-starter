import { Injectable, inject } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { StorageService } from '../../../core/services/storage';
import { AuthService } from '../../auth/services/auth';
import { extractErrorMessage } from '../../../shared/utils/error.utils';
import { 
  CartApiResponse,
  CartProductObject,
  CartItem, 
  AddToCartRequest, 
  UpdateCartItemRequest, 
  RemoveFromCartRequest,
  CartPersistenceData,
  CartOperationResult
} from '../models/cart.model';

/**
 * Cart Service - API operations and persistence
 * Handles cart operations with the backend API and localStorage
 * Updated: 2025-09-30 - Fixed endpoints to match real API behavior
 */
@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly authService = inject(AuthService);

  // Cart API endpoints
  private readonly CART_ENDPOINTS = {
    GET_CART: '/cart',
    ADD_TO_CART: '/cart',
    UPDATE_CART_ITEM: '/cart',      // PUT /cart/{productId}
    REMOVE_CART_ITEM: '/cart',      // DELETE /cart/{productId}
    CLEAR_CART: '/cart'
  };

  // LocalStorage key for cart persistence
  private readonly CART_STORAGE_KEY = 'freshcart_cart';
  
  // Cart expiration configuration
  private readonly CART_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Get user's cart from API
   * API: GET /cart
   * ✅ Returns full cart with populated product objects
   */
  getCart(): Observable<{ items: CartItem[]; cartId: string | null }> {
    if (!this.authService.isAuthenticated()) {
      return of({ items: [], cartId: null });
    }

    return this.api.get<CartApiResponse>(this.CART_ENDPOINTS.GET_CART)
      .pipe(
        map(response => ({
          items: this.transformApiCartToItems(response),
          cartId: response.data._id
        })),
        catchError(error => {
          console.error('Get cart error:', error);
          return of({ items: [], cartId: null });
        })
      );
  }

  /**
   * Add product to cart
   * API: POST /cart
   * Body: { "productId": "..." }
   * 
   * ⚠️ IMPORTANT: 
   * - POST /cart returns product as STRING ID only
   * - POST always adds quantity = 1 (no quantity parameter supported)
   * - Solution: Chain POST → GET to get full cart with populated products
   */
  addToCart(request: AddToCartRequest): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    // Chain: POST /cart → GET /cart to get full product objects
    return this.api.post<CartApiResponse>(this.CART_ENDPOINTS.ADD_TO_CART, {
      productId: request.productId
    }).pipe(
      switchMap(postResponse => {
        // POST succeeded - now GET the full cart with populated products
        return this.getCart().pipe(
          map(({ items, cartId }) => ({
            success: true,
            message: 'Product added to cart successfully',
            cartId,
            cart: {
              items,
              cartId,
              isLoading: false,
              loadingProductIds: [],
              isSyncing: false,
              error: null,
              lastUpdated: Date.now(),
              isAuthenticated: true
            }
          }))
        );
      }),
      catchError(error => {
        console.error('Add to cart error:', error);
        return of({
          success: false,
          message: extractErrorMessage(error)
        });
      })
    );
  }

  /**
   * Update cart item quantity
   * API: PUT /cart/{productId}
   * Body: { "count": "2" }
   * 
   * ✅ FIXED: Uses productId (NOT cart item ID) and count as string
   */
  updateCartItem(request: UpdateCartItemRequest): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    return this.api.put<CartApiResponse>(
      `${this.CART_ENDPOINTS.UPDATE_CART_ITEM}/${request.productId}`,
      { count: request.count }
    ).pipe(
      map(response => ({
        success: true,
        message: 'Cart updated successfully',
        cartId: response.data._id,
        cart: {
          items: this.transformApiCartToItems(response),
          cartId: response.data._id,
          isLoading: false,
          loadingProductIds: [],
          isSyncing: false,
          error: null,
          lastUpdated: Date.now(),
          isAuthenticated: true
        }
      })),
      catchError(error => {
        console.error('Update cart item error:', error);
        return of({
          success: false,
          message: extractErrorMessage(error)
        });
      })
    );
  }

  /**
   * Remove item from cart
   * API: DELETE /cart/{productId}
   * 
   * ✅ FIXED: Uses productId (NOT cart item ID)
   */
  removeFromCart(request: RemoveFromCartRequest): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    return this.api.delete<CartApiResponse>(
      `${this.CART_ENDPOINTS.REMOVE_CART_ITEM}/${request.productId}`
    ).pipe(
      map(response => ({
        success: true,
        message: 'Item removed from cart successfully',
        cartId: response.data._id,
        cart: {
          items: this.transformApiCartToItems(response),
          cartId: response.data._id,
          isLoading: false,
          loadingProductIds: [],
          isSyncing: false,
          error: null,
          lastUpdated: Date.now(),
          isAuthenticated: true
        }
      })),
      catchError(error => {
        console.error('Remove from cart error:', error);
        return of({
          success: false,
          message: extractErrorMessage(error)
        });
      })
    );
  }

  /**
   * Clear entire cart
   * API: DELETE /cart
   */
  clearCart(): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    return this.api.delete<{ message: string }>(this.CART_ENDPOINTS.CLEAR_CART)
      .pipe(
        map(response => ({
          success: true,
          message: 'Cart cleared successfully',
          cartId: null,
          cart: {
            items: [],
            cartId: null,
            isLoading: false,
            loadingProductIds: [],
            isSyncing: false,
            error: null,
            lastUpdated: Date.now(),
            isAuthenticated: true
          }
        })),
        catchError(error => {
          console.error('Clear cart error:', error);
          return of({
            success: false,
            message: extractErrorMessage(error)
          });
        })
      );
  }

  /**
   * Sync local cart with server (when user logs in)
   * ✅ OPTIMIZED: All POSTs in parallel, then single GET
   * 
   * Before: N items = N*(POST+GET) = 2N API calls
   * After: N items = N*POST + 1*GET = N+1 API calls (50% reduction)
   */
  syncCartWithServer(localItems: CartItem[]): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated() || localItems.length === 0) {
      return of({ success: true, message: 'No items to sync' });
    }

    // Create array of POST operations (no GET chains, just POSTs)
    const postOperations = localItems.map(item =>
      this.api.post<CartApiResponse>(this.CART_ENDPOINTS.ADD_TO_CART, {
        productId: item.product._id
      }).pipe(
        catchError(error => {
          console.error(`Failed to sync item ${item.product._id}:`, error);
          return of(null); // Continue with other items even if one fails
        })
      )
    );
    
    // Execute all POSTs in parallel, then ONE final GET
    return forkJoin(postOperations).pipe(
      switchMap(results => {
        const successCount = results.filter(r => r !== null).length;
        const failCount = results.length - successCount;
        
        if (successCount === 0) {
          return of({
            success: false,
            message: 'Failed to sync all items'
          });
        }
        
        // Get final cart state with full product data
        return this.getCart().pipe(
          map(({ items, cartId }) => ({
            success: failCount === 0,
            message: failCount === 0 
              ? `Successfully synced ${successCount} items` 
              : `Synced ${successCount} items, ${failCount} failed`,
            cartId,
            cart: {
              items,
              cartId,
              isLoading: false,
              loadingProductIds: [],
              isSyncing: false,
              error: null,
              lastUpdated: Date.now(),
              isAuthenticated: true
            }
          }))
        );
      }),
      catchError(error => {
        console.error('Cart sync error:', error);
        return of({ 
          success: false, 
          message: 'Failed to sync cart with server' 
        });
      })
    );
  }

  // ===== PERSISTENCE METHODS =====

  /**
   * Save cart to localStorage (for guest users or temporary persistence)
   */
  saveCartToStorage(items: CartItem[]): void {
    try {
      const cartData: CartPersistenceData = {
        items,
        lastUpdated: Date.now(),
        userId: this.authService.getCurrentUserId()
      };
      
      this.storage.setItem(this.CART_STORAGE_KEY, JSON.stringify(cartData));
    } catch (error) {
      console.error('Failed to save cart to storage:', error);
    }
  }

  /**
   * Load cart from localStorage
   */
  loadCartFromStorage(): CartItem[] {
    try {
      const cartDataStr = this.storage.getItem(this.CART_STORAGE_KEY);
      if (!cartDataStr || typeof cartDataStr !== 'string') return [];

      try {
        const cartData: CartPersistenceData = JSON.parse(cartDataStr);
        if (!cartData || typeof cartData !== 'object') return [];
        
        // Check if cart belongs to current user (if authenticated)
        const currentUserId = this.authService.getCurrentUserId();
        if (currentUserId && cartData.userId && cartData.userId !== currentUserId) {
          this.clearCartFromStorage();
          return [];
        }

        // Check if cart is not too old (24 hours)
        if (Date.now() - cartData.lastUpdated > this.CART_MAX_AGE_MS) {
          this.clearCartFromStorage();
          return [];
        }

        return cartData.items || [];
      } catch (parseError) {
        console.error('Error parsing cart data:', parseError);
        this.clearCartFromStorage();
        return [];
      }
    } catch (error) {
      console.error('Failed to load cart from storage:', error);
      return [];
    }
  }

  /**
   * Clear cart from localStorage
   */
  clearCartFromStorage(): void {
    try {
      this.storage.removeItem(this.CART_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear cart from storage:', error);
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Transform API cart response to internal CartItem[]
   * 
   * ✅ Direct transformation - assumes API returns correct format
   * - product is always CartProductObject (we only process GET/PUT/DELETE responses)
   * - price is at cart item level, not in product object
   * - quantity in product is STOCK quantity, not cart quantity
   */
  private transformApiCartToItems(response: CartApiResponse): CartItem[] {
    return response.data.products.map((apiItem) => ({
      _id: apiItem._id,
      product: apiItem.product,             // CartProductObject from API
      quantity: apiItem.count,              // Cart quantity (renamed from 'count')
      unitPrice: apiItem.price,             // Price from cart item level
      totalPrice: apiItem.price * apiItem.count,
      addedAt: response.data.createdAt,
      updatedAt: response.data.updatedAt
    }));
  }
}