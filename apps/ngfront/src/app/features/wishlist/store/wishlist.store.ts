import { computed, inject } from '@angular/core';
import { 
  patchState, 
  signalStore, 
  withComputed, 
  withHooks,
  withMethods, 
  withState 
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';
import { pipe, switchMap, tap, of } from 'rxjs';
import { MessageService } from 'primeng/api';

import { WishlistService } from '../services/wishlist';
import { AuthService } from '../../auth/services/auth';
import { ProductsService } from '../../products/services/products';
import { 
  WishlistState, 
  WishlistSummary
} from '../models/wishlist.model';
import { Product } from '../../products/models/product.model';

/**
 * Initial Wishlist State
 * Simpler than CartState (no quantity, price, cartId)
 */
const initialWishlistState: WishlistState = {
  items: [],
  isLoading: false,
  loadingProductIds: [],
  error: null,
  lastUpdated: Date.now(),
  isAuthenticated: false
};

/**
 * WishlistStore - NgRx SignalStore Implementation
 * 
 * ✅ Pattern Reference: https://ngrx.io/guide/signals/signal-store
 * ✅ Uses withState, withComputed, withMethods as per official docs
 * ✅ rxMethod for reactive operations with observables
 * ✅ Protected state by default (no external patchState allowed)
 * 
 * Authentication Flow:
 * - Guest users: Wishlist stored in localStorage (product IDs only)
 * - Authenticated users: Wishlist stored on server (full Product objects)
 * - Login: Syncs local wishlist to server
 * - Logout: Clears wishlist and loads guest wishlist from localStorage
 * 
 * Key Differences from CartStore:
 * - No quantity management (binary: in/out)
 * - No price tracking
 * - No cartId
 * - Simpler operations (just add/remove/toggle)
 */
export const WishlistStore = signalStore(
  { providedIn: 'root', protectedState: true },
  
  // 1️⃣ State Management - Simple and clean
  withState(initialWishlistState),
  
  // 2️⃣ Computed Properties - Following documentation patterns  
  withComputed((state) => ({
    // ✅ COMPUTED: Total items calculated from items array
    totalItems: computed(() => state.items().length),
    
    // Wishlist summary for components
    summary: computed((): WishlistSummary => {
      const items = state.items();
      const totalItems = items.length;
      
      return {
        totalItems,
        isEmpty: totalItems === 0,
        itemsCount: totalItems === 1 ? '1 item' : `${totalItems} items`
      };
    }),
    
    // Check if specific product is in wishlist
    isProductInWishlist: computed(() => (productId: string): boolean => {
      return state.items().some(item => item._id === productId);
    }),
    
    // Check if specific product is currently loading (being added/removed)
    // ✅ Uses array.includes() - O(n) but negligible for typical use cases
    isProductLoading: computed(() => (productId: string): boolean => {
      return state.loadingProductIds().includes(productId);
    }),
    
    // Wishlist badge display (for header)
    badgeCount: computed(() => {
      const count = state.items().length;
      return count > 99 ? '99+' : count.toString();
    }),
    
    // Check if wishlist has any errors
    hasError: computed(() => state.error() !== null),
    
    // Check if any operations are in progress
    isOperating: computed(() => state.isLoading())
  })),
  
  // 3️⃣ Lifecycle Hooks - Official NgRx SignalStore Pattern
  withHooks((store) => {
    const wishlistService = inject(WishlistService);
    const authService = inject(AuthService);
    const productsService = inject(ProductsService);
    
    return {
      onInit() {
        // 👇 Official NgRx initialization pattern - runs when store is created
        const isAuthenticated = authService.isAuthenticated();
        patchState(store, { isAuthenticated });
        
        if (isAuthenticated) {
          // Check if there are unsynchronized items in localStorage
          const localProductIds = wishlistService.loadWishlistFromStorage();
          
          if (localProductIds.length > 0) {
            // User is authenticated but has local items (race condition scenario)
            // This happens when:
            // 1. User logged in and sync started
            // 2. User refreshed before sync completed
            // 3. localStorage still has product IDs that weren't synced
            
            patchState(store, { isLoading: true, error: null });
            
            // Sync local items first, then load complete wishlist
            wishlistService.syncWishlistWithServer(localProductIds).subscribe({
              next: (result) => {
                if (result?.success) {
                  // Sync succeeded - clear localStorage and load from server
                  wishlistService.clearWishlistFromStorage();
                  
                  wishlistService.getWishlist().subscribe({
                    next: (items) => {
                      patchState(store, {
                        items,
                        lastUpdated: Date.now(),
                        isLoading: false,
                        error: null
                      });
                    },
                    error: (error) => {
                      patchState(store, {
                        error: error.message || 'Failed to load wishlist after sync',
                        isLoading: false
                      });
                    }
                  });
                } else {
                  // Sync failed - fetch products for local IDs and show error
                  productsService.getProducts().subscribe({
                    next: (response) => {
                      const guestItems = response.data.filter(product => 
                        localProductIds.includes(product._id)
                      );
                      
                      patchState(store, {
                        items: guestItems,
                        error: result?.message || 'Failed to sync wishlist',
                        isLoading: false
                      });
                    },
                    error: (error) => {
                      patchState(store, {
                        error: error.message || 'Failed to load local wishlist',
                        isLoading: false
                      });
                    }
                  });
                }
              },
              error: (error) => {
                // Sync failed - fetch products for local IDs
                productsService.getProducts().subscribe({
                  next: (response) => {
                    const guestItems = response.data.filter(product => 
                      localProductIds.includes(product._id)
                    );
                    
                    patchState(store, {
                      items: guestItems,
                      error: error.message || 'Failed to sync wishlist with server',
                      isLoading: false
                    });
                  },
                  error: (loadError) => {
                    patchState(store, {
                      error: loadError.message || 'Failed to load wishlist',
                      isLoading: false
                    });
                  }
                });
              }
            });
          } else {
            // No local items - just load from API
            patchState(store, { isLoading: true, error: null });
            wishlistService.getWishlist().subscribe({
              next: (items) => {
                patchState(store, {
                  items,
                  lastUpdated: Date.now(),
                  isLoading: false,
                  error: null
                });
              },
              error: (error) => {
                patchState(store, {
                  error: error.message || 'Failed to load wishlist',
                  isLoading: false
                });
              }
            });
          }
        } else {
          // Load from localStorage for guest users (product IDs only)
          const productIds = wishlistService.loadWishlistFromStorage();
          
          if (productIds.length > 0) {
            // Fetch full Product objects for guest wishlist
            patchState(store, { isLoading: true });
            
            // Get all products and filter by IDs
            productsService.getProducts().subscribe({
              next: (response) => {
                const guestItems = response.data.filter(product => 
                  productIds.includes(product._id)
                );
                
                patchState(store, {
                  items: guestItems,
                  lastUpdated: Date.now(),
                  isLoading: false
                });
              },
              error: (error) => {
                console.error('Failed to load guest wishlist products:', error);
                patchState(store, { isLoading: false });
              }
            });
          }
        }
      }
    };
  }),
  
  // 4️⃣ Methods - Following exact documentation patterns
  withMethods((store, 
    wishlistService = inject(WishlistService), 
    authService = inject(AuthService), 
    messageService = inject(MessageService)) => ({
    
    /**
     * Load wishlist from API - Reactive method following documentation pattern
     */
    loadWishlistFromApi: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => wishlistService.getWishlist().pipe(
          tapResponse({
            next: (items) => {
              patchState(store, {
                items,
                lastUpdated: Date.now(),
                isLoading: false,
                error: null
              });
            },
            error: (error: Error) => {
              patchState(store, {
                error: error.message || 'Failed to load wishlist',
                isLoading: false
              });
            }
          })
        ))
      )
    ),
    
    /**
     * Add product to wishlist - Reactive method using rxMethod
     * Following NgRx best practices with tapResponse
     * ✅ Uses per-product loading state for better UX
     * ✅ Uses immutable array operations (NgRx best practice)
     */
    addToWishlist: rxMethod<Product>(
      pipe(
        tap((product) => {
          // Add product to loading array (immutable spread)
          const currentLoadingIds = store.loadingProductIds();
          if (!currentLoadingIds.includes(product._id)) {
            patchState(store, { 
              loadingProductIds: [...currentLoadingIds, product._id],
              error: null 
            });
          }
        }),
        switchMap((product) => {
          const isAuthenticated = store.isAuthenticated();
          
          if (isAuthenticated) {
            // Authenticated user: use API with proper Observable pattern
            return wishlistService.addToWishlist({ productId: product._id }).pipe(
              tapResponse({
                next: (result) => {
                  if (result?.success && result.items) {
                    patchState(store, { 
                      items: result.items,
                      lastUpdated: Date.now()
                    });
                    
                    // ✅ Show success toast notification
                    messageService.add({
                      severity: 'success',
                      summary: 'Added to Wishlist',
                      detail: `${product.title} has been added to your wishlist`,
                      life: 3000
                    });
                  } else {
                    patchState(store, {
                      error: result?.message || 'Failed to add product to wishlist'
                    });
                    
                    // Show error toast
                    messageService.add({
                      severity: 'error',
                      summary: 'Error',
                      detail: result?.message || 'Failed to add product to wishlist',
                      life: 3000
                    });
                  }
                },
                error: (error) => {
                  patchState(store, {
                    error: error instanceof Error ? error.message : 'Failed to add product to wishlist'
                  });
                  
                  // Show error toast
                  messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error instanceof Error ? error.message : 'Failed to add product to wishlist',
                    life: 3000
                  });
                },
                finalize: () => {
                  // Remove product from loading array (immutable filter)
                  patchState(store, { 
                    loadingProductIds: store.loadingProductIds().filter(id => id !== product._id)
                  });
                }
              })
            );
          } else {
            // Guest user: handle locally with reactive pattern
            return of(product).pipe(
              tap((product) => {
                const currentItems = store.items();
                
                // Check if already in wishlist
                if (currentItems.some(item => item._id === product._id)) {
                  // Already in wishlist, show message
                  messageService.add({
                    severity: 'info',
                    summary: 'Already in Wishlist',
                    detail: `${product.title} is already in your wishlist`,
                    life: 3000
                  });
                  return;
                }
                
                // Add to wishlist
                const updatedItems = [...currentItems, product];
                const productIds = updatedItems.map(item => item._id);
              
                patchState(store, {
                  items: updatedItems,
                  lastUpdated: Date.now(),
                  error: null
                });
                
                // Save to localStorage (product IDs only)
                wishlistService.saveWishlistToStorage(productIds);
                
                // ✅ Show success toast notification for guest user
                messageService.add({
                  severity: 'success',
                  summary: 'Added to Wishlist',
                  detail: `${product.title} has been added to your wishlist`,
                  life: 3000
                });
              }),
              tapResponse({
                next: () => {}, // Success handled in tap above
                error: (error) => {
                  patchState(store, {
                    error: error instanceof Error ? error.message : 'Failed to add product to wishlist'
                  });
                  
                  // Show error toast
                  messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error instanceof Error ? error.message : 'Failed to add product to wishlist',
                    life: 3000
                  });
                },
                finalize: () => {
                  // Remove product from loading array (immutable filter)
                  patchState(store, { 
                    loadingProductIds: store.loadingProductIds().filter(id => id !== product._id)
                  });
                }
              })
            );
          }
        })
      )
    ),
    
    /**
     * Remove product from wishlist - Reactive method using rxMethod
     * @param productId - Product ID to remove
     */
    removeFromWishlist: rxMethod<string>(
      pipe(
        tap((productId) => {
          // Add product to loading array
          const currentLoadingIds = store.loadingProductIds();
          if (!currentLoadingIds.includes(productId)) {
            patchState(store, { 
              loadingProductIds: [...currentLoadingIds, productId],
              error: null 
            });
          }
        }),
        switchMap((productId) => {
          const isAuthenticated = store.isAuthenticated();
          
          if (isAuthenticated) {
            // Authenticated user: use API
            return wishlistService.removeFromWishlist({ productId }).pipe(
              tapResponse({
                next: (result) => {
                  if (result?.success && result.items) {
                    patchState(store, { 
                      items: result.items,
                      lastUpdated: Date.now()
                    });
                    
                    messageService.add({
                      severity: 'success',
                      summary: 'Removed from Wishlist',
                      detail: 'Product has been removed from your wishlist',
                      life: 3000
                    });
                  } else {
                    patchState(store, {
                      error: result?.message || 'Failed to remove product from wishlist'
                    });
                  }
                },
                error: (error) => {
                  patchState(store, {
                    error: error instanceof Error ? error.message : 'Failed to remove product from wishlist'
                  });
                },
                finalize: () => {
                  patchState(store, { 
                    loadingProductIds: store.loadingProductIds().filter(id => id !== productId)
                  });
                }
              })
            );
          } else {
            // Guest user: handle locally
            return of(productId).pipe(
              tap((productId) => {
                const currentItems = store.items();
                const updatedItems = currentItems.filter(item => item._id !== productId);
                const productIds = updatedItems.map(item => item._id);
                
                patchState(store, {
                  items: updatedItems,
                  lastUpdated: Date.now(),
                  error: null
                });
                
                // Save to localStorage
                wishlistService.saveWishlistToStorage(productIds);
                
                messageService.add({
                  severity: 'success',
                  summary: 'Removed from Wishlist',
                  detail: 'Product has been removed from your wishlist',
                  life: 3000
                });
              }),
              tapResponse({
                next: () => {}, // Success handled in tap above
                error: (error) => {
                  patchState(store, {
                    error: error instanceof Error ? error.message : 'Failed to remove product from wishlist'
                  });
                },
                finalize: () => {
                  patchState(store, { 
                    loadingProductIds: store.loadingProductIds().filter(id => id !== productId)
                  });
                }
              })
            );
          }
        })
      )
    ),
    
    /**
     * Toggle product in wishlist (add if not present, remove if present)
     * Simple method that delegates to add/remove rxMethods
     * ✅ PATTERN: Simple method calling rxMethods (not rxMethod calling rxMethod)
     */
    toggleWishlist(product: Product): void {
      const isInWishlist = store.isProductInWishlist()(product._id);
      
      if (isInWishlist) {
        // Remove from wishlist
        this.removeFromWishlist(product._id);
      } else {
        // Add to wishlist
        this.addToWishlist(product);
      }
    },
    
    /**
     * Handle authentication state changes - Simple method
     */
    onAuthenticationChange(isAuthenticated: boolean): void {
      const wasAuthenticated = store.isAuthenticated();
      
      patchState(store, { isAuthenticated });
      
      if (!wasAuthenticated && isAuthenticated) {
        // User just logged in - sync local wishlist with server
        this.syncWishlistWithServer();
      } else if (wasAuthenticated && !isAuthenticated) {
        // User just logged out - clear wishlist and load from localStorage
        patchState(store, {
          items: [],
          error: null,
          lastUpdated: Date.now()
        });
        
        // Load guest wishlist from localStorage (product IDs)
        const productIds = wishlistService.loadWishlistFromStorage();
        
        // Note: We don't fetch products here, will be loaded on next page visit
        // Just update the state to reflect guest mode
        patchState(store, {
          lastUpdated: Date.now()
        });
      }
    },
    
    /**
     * Sync wishlist with server - Reactive method
     */
    syncWishlistWithServer: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          const localProductIds = wishlistService.loadWishlistFromStorage();
          return wishlistService.syncWishlistWithServer(localProductIds);
        }),
        switchMap((result) => {
          if (!result?.success) {
            // Sync failed - update error state
            patchState(store, {
              error: result?.message || 'Failed to sync wishlist',
              isLoading: false
            });
            return of(null);
          }
          
          // Sync succeeded - clear local storage and reload wishlist
          wishlistService.clearWishlistFromStorage();
          return wishlistService.getWishlist();
        }),
        tapResponse({
          next: (items) => {
            if (items) {
              patchState(store, {
                items,
                lastUpdated: Date.now(),
                isLoading: false,
                error: null
              });
            }
          },
          error: (error: Error) => {
            patchState(store, {
              error: error.message || 'Failed to sync wishlist with server',
              isLoading: false
            });
          }
        })
      )
    ),
    
    /**
     * Clear any error messages - Simple method
     */
    clearError(): void {
      patchState(store, { error: null });
    }
  }))
);

