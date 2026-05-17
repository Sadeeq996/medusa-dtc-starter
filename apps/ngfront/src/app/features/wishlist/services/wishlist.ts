import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { StorageService } from '../../../core/services/storage';
import { AuthService } from '../../auth/services/auth';
import { WISHLIST_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import { extractErrorMessage } from '../../../shared/utils/error.utils';
import { 
  WishlistApiResponse,
  AddToWishlistRequest, 
  RemoveFromWishlistRequest,
  WishlistPersistenceData,
  WishlistOperationResult
} from '../models/wishlist.model';
import { Product } from '../../products/models/product.model';

/**
 * Wishlist Service - API operations and persistence
 * Handles wishlist operations with the backend API and localStorage
 * Created: 2025-09-30 - Following Cart service pattern
 * 
 * Key Differences from Cart:
 * - No quantity management (binary: in/out)
 * - No price tracking
 * - Simpler state (just product IDs + full products)
 */
@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly authService = inject(AuthService);

  // LocalStorage key for wishlist persistence
  private readonly WISHLIST_STORAGE_KEY = 'freshcart_wishlist';
  
  // Wishlist expiration configuration
  private readonly WISHLIST_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (longer than cart)

  /**
   * Get user's wishlist from API
   * API: GET /wishlist
   * ✅ Returns full array of Product objects
   */
  getWishlist(): Observable<Product[]> {
    if (!this.authService.isAuthenticated()) {
      return of([]);
    }

    return this.api.get<WishlistApiResponse>(WISHLIST_ENDPOINTS.GET_WISHLIST)
      .pipe(
        map(response => {
          // GET returns full Product objects in data array
          if (Array.isArray(response.data) && response.data.length > 0) {
            // Check if data contains Product objects (not strings)
            if (typeof response.data[0] === 'object') {
              return response.data as Product[];
            }
          }
          return [];
        }),
        catchError(error => {
          console.error('Get wishlist error:', error);
          return of([]);
        })
      );
  }

  /**
   * Add product to wishlist
   * API: POST /wishlist
   * Body: { "productId": "..." }
   * 
   * ⚠️ IMPORTANT: 
   * - POST /wishlist returns array of product IDs (strings) only
   * - Solution: Chain POST → GET to get full Product objects
   */
  addToWishlist(request: AddToWishlistRequest): Observable<WishlistOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    // Chain: POST /wishlist → GET /wishlist to get full product objects
    return this.api.post<WishlistApiResponse>(WISHLIST_ENDPOINTS.ADD_ITEM, {
      productId: request.productId
    }).pipe(
      switchMap(postResponse => {
        // POST succeeded - now GET the full wishlist with Product objects
        return this.getWishlist().pipe(
          map((items) => ({
            success: true,
            message: 'Product added to wishlist successfully',
            items
          }))
        );
      }),
      catchError(error => {
        console.error('Add to wishlist error:', error);
        return of({
          success: false,
          message: extractErrorMessage(error)
        });
      })
    );
  }

  /**
   * Remove product from wishlist
   * API: DELETE /wishlist/{productId}
   * 
   * ⚠️ IMPORTANT:
   * - DELETE returns array of remaining product IDs (strings)
   * - Solution: Chain DELETE → GET to get full Product objects
   */
  removeFromWishlist(request: RemoveFromWishlistRequest): Observable<WishlistOperationResult> {
    if (!this.authService.isAuthenticated()) {
      return of({ success: false, message: 'Authentication required' });
    }

    return this.api.delete<WishlistApiResponse>(
      WISHLIST_ENDPOINTS.REMOVE_ITEM(request.productId)
    ).pipe(
      switchMap(deleteResponse => {
        // DELETE succeeded - now GET the updated wishlist
        return this.getWishlist().pipe(
          map((items) => ({
            success: true,
            message: 'Product removed from wishlist successfully',
            items
          }))
        );
      }),
      catchError(error => {
        console.error('Remove from wishlist error:', error);
        return of({
          success: false,
          message: extractErrorMessage(error)
        });
      })
    );
  }

  /**
   * Sync local wishlist with server (when user logs in)
   * Similar to cart sync but simpler (just product IDs)
   */
  syncWishlistWithServer(localProductIds: string[]): Observable<WishlistOperationResult> {
    if (!this.authService.isAuthenticated() || localProductIds.length === 0) {
      return of({ success: true, message: 'No items to sync' });
    }

    // Add all local products to server wishlist sequentially
    const addOperations = localProductIds.map(productId =>
      this.api.post<WishlistApiResponse>(WISHLIST_ENDPOINTS.ADD_ITEM, { productId }).pipe(
        catchError(error => {
          console.error(`Failed to sync wishlist item ${productId}:`, error);
          return of(null); // Continue with other items even if one fails
        })
      )
    );
    
    // Execute all POST operations, then GET final wishlist
    return this.executeSequentially(addOperations).pipe(
      switchMap(() => this.getWishlist()),
      map(items => ({
        success: true,
        message: `Successfully synced ${localProductIds.length} items`,
        items
      })),
      catchError(error => {
        console.error('Wishlist sync error:', error);
        return of({ 
          success: false, 
          message: 'Failed to sync wishlist with server' 
        });
      })
    );
  }

  // ===== PERSISTENCE METHODS =====

  /**
   * Save wishlist to localStorage (for guest users)
   * Stores only product IDs (simpler than cart)
   */
  saveWishlistToStorage(productIds: string[]): void {
    try {
      const wishlistData: WishlistPersistenceData = {
        productIds,
        lastUpdated: Date.now(),
        userId: this.authService.getCurrentUserId()
      };
      
      this.storage.setItem(this.WISHLIST_STORAGE_KEY, JSON.stringify(wishlistData));
    } catch (error) {
      console.error('Failed to save wishlist to storage:', error);
    }
  }

  /**
   * Load wishlist from localStorage
   * Returns array of product IDs
   */
  loadWishlistFromStorage(): string[] {
    try {
      const wishlistDataStr = this.storage.getItem(this.WISHLIST_STORAGE_KEY);
      if (!wishlistDataStr || typeof wishlistDataStr !== 'string') return [];

      try {
        const wishlistData: WishlistPersistenceData = JSON.parse(wishlistDataStr);
        if (!wishlistData || typeof wishlistData !== 'object') return [];
        
        // Check if wishlist belongs to current user (if authenticated)
        const currentUserId = this.authService.getCurrentUserId();
        if (currentUserId && wishlistData.userId && wishlistData.userId !== currentUserId) {
          this.clearWishlistFromStorage();
          return [];
        }

        // Check if wishlist is not too old (30 days)
        if (Date.now() - wishlistData.lastUpdated > this.WISHLIST_MAX_AGE_MS) {
          this.clearWishlistFromStorage();
          return [];
        }

        return wishlistData.productIds || [];
      } catch (parseError) {
        console.error('Error parsing wishlist data:', parseError);
        this.clearWishlistFromStorage();
        return [];
      }
    } catch (error) {
      console.error('Failed to load wishlist from storage:', error);
      return [];
    }
  }

  /**
   * Clear wishlist from localStorage
   */
  clearWishlistFromStorage(): void {
    try {
      this.storage.removeItem(this.WISHLIST_STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear wishlist from storage:', error);
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Execute observables sequentially (for sync operation)
   */
  private executeSequentially(operations: Observable<any>[]): Observable<any> {
    return operations.reduce(
      (prev, current) => prev.pipe(switchMap(() => current)),
      of(null)
    );
  }
}
