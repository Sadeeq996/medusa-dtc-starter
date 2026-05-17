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

  // Cart API endpoints aligned with Medusa store API semantics
  private readonly CART_ENDPOINTS = {
    CREATE_CART: '/carts',
    GET_CART: (cartId: string) => `/carts/${cartId}`,
    ADD_TO_CART: (cartId: string) => `/carts/${cartId}/line-items`,
    UPDATE_CART_ITEM: (cartId: string, itemId: string) => `/carts/${cartId}/line-items/${itemId}`,
    REMOVE_CART_ITEM: (cartId: string, itemId: string) => `/carts/${cartId}/line-items/${itemId}`,
    CLEAR_CART: (cartId: string) => `/carts/${cartId}`
  };

  // LocalStorage keys for cart persistence
  private readonly CART_STORAGE_KEY = 'sellpadi_cart';
  private readonly CART_ID_STORAGE_KEY = 'sellpadi_cart_id';

  // Cart expiration configuration
  private readonly CART_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

  private getStoredCartId(): string | null {
    return this.storage.getItem<string>(this.CART_ID_STORAGE_KEY);
  }

  private setStoredCartId(cartId: string): void {
    this.storage.setItem(this.CART_ID_STORAGE_KEY, cartId);
  }

  private removeStoredCartId(): void {
    this.storage.removeItem(this.CART_ID_STORAGE_KEY);
  }

  private createCart(): Observable<string> {
    return this.api.post<CartApiResponse>(this.CART_ENDPOINTS.CREATE_CART, {})
      .pipe(
        map(response => {
          if (!response?.id) {
            throw new Error('Failed to create cart');
          }
          this.setStoredCartId(response.id);
          return response.id;
        })
      );
  }

  private ensureCartId(): Observable<string> {
    const cartId = this.getStoredCartId();

    if (cartId) {
      return of(cartId);
    }

    return this.createCart();
  }

  /**
   * Get user's cart from API
   * API: GET /carts/{cartId}
   */
  getCart(): Observable<{ items: CartItem[]; cartId: string | null }> {
    if (!this.authService.isAuthenticated()) {
      return of({ items: [], cartId: null });
    }

    return this.ensureCartId().pipe(
      switchMap(cartId =>
        this.api.get<CartApiResponse>(this.CART_ENDPOINTS.GET_CART(cartId)).pipe(
          map(response => ({
            items: this.transformApiCartToItems(response),
            cartId: response.id
          }))
        )
      ),
      catchError(error => {
        console.error('Get cart error:', error);
        return of({ items: [], cartId: null });
      })
    );
  }

  /**
   * Add product to cart
   * API: POST /carts/{cartId}/line-items
   */
  addToCart(request: AddToCartRequest): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    return this.ensureCartId().pipe(
      switchMap(cartId =>
        this.api.post<CartApiResponse>(this.CART_ENDPOINTS.ADD_TO_CART(cartId), {
          variant_id: request.productId,
          quantity: request.quantity || 1
        }).pipe(
          switchMap(() => this.getCart()),
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
        )
      ),
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
   * API: POST /carts/{cartId}/line-items/{itemId}
   */
  updateCartItem(request: UpdateCartItemRequest): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    return this.getCart().pipe(
      switchMap(({ items, cartId }) => {
        if (!cartId) {
          return of({ success: false, message: 'Cart not found' });
        }

        const lineItem = items.find(item => item.product._id === request.productId);
        if (!lineItem) {
          return of({ success: false, message: 'Cart item not found' });
        }

        return this.api.post<CartApiResponse>(
          this.CART_ENDPOINTS.UPDATE_CART_ITEM(cartId, lineItem._id),
          { item_id: lineItem._id, quantity: Number(request.count) }
        ).pipe(
          switchMap(() => this.getCart()),
          map(({ items: updatedItems, cartId: updatedCartId }) => ({
            success: true,
            message: 'Cart updated successfully',
            cartId: updatedCartId,
            cart: {
              items: updatedItems,
              cartId: updatedCartId,
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
   * API: DELETE /carts/{cartId}/line-items/{itemId}
   */
  removeFromCart(request: RemoveFromCartRequest): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    return this.getCart().pipe(
      switchMap(({ items, cartId }) => {
        if (!cartId) {
          return of({ success: false, message: 'Cart not found' });
        }

        const lineItem = items.find(item => item.product._id === request.productId);
        if (!lineItem) {
          return of({ success: false, message: 'Cart item not found' });
        }

        return this.api.delete<CartApiResponse>(
          this.CART_ENDPOINTS.REMOVE_CART_ITEM(cartId, lineItem._id)
        ).pipe(
          switchMap(() => this.getCart()),
          map(({ items: updatedItems, cartId: updatedCartId }) => ({
            success: true,
            message: 'Item removed from cart successfully',
            cartId: updatedCartId,
            cart: {
              items: updatedItems,
              cartId: updatedCartId,
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
   * API: DELETE /carts/{cartId}
   */
  clearCart(): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    const cartId = this.getStoredCartId();
    if (!cartId) {
      return of({
        success: true, message: 'Cart is already empty', cartId: null, cart: {
          items: [],
          cartId: null,
          isLoading: false,
          loadingProductIds: [],
          isSyncing: false,
          error: null,
          lastUpdated: Date.now(),
          isAuthenticated: true
        }
      });
    }

    return this.api.delete<{ message: string }>(this.CART_ENDPOINTS.CLEAR_CART(cartId))
      .pipe(
        map(() => {
          this.removeStoredCartId();
          return {
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
          };
        }),
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
   */
  syncCartWithServer(localItems: CartItem[]): Observable<CartOperationResult> {
    if (!this.authService.isAuthenticated() || localItems.length === 0) {
      return of({ success: true, message: 'No items to sync' });
    }

    return this.ensureCartId().pipe(
      switchMap(cartId => {
        const postOperations = localItems.map(item =>
          this.api.post<CartApiResponse>(this.CART_ENDPOINTS.ADD_TO_CART(cartId), {
            variant_id: item.product._id,
            quantity: item.quantity
          }).pipe(
            catchError(error => {
              console.error(`Failed to sync item ${item.product._id}:`, error);
              return of(null);
            })
          )
        );

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
          })
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
    return response.items.map((item) => ({
      _id: item.id,
      product: {
        _id: item.variant_id,
        title: item.title || item.product?.title || 'Product',
        imageCover: item.thumbnail || item.product?.thumbnail || '/assets/images/product-placeholder.jpg',
        quantity: 0,
        ratingsAverage: 0,
        id: item.variant_id
      },
      quantity: item.quantity,
      unitPrice: item.unit_price,
      totalPrice: item.unit_price * item.quantity,
      addedAt: '',
      updatedAt: ''
    }));
  }
}