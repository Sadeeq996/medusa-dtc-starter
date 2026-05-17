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

import { CartService } from '../services/cart.service';
import { AuthService } from '../../auth/services/auth';
import { 
  CartState, 
  CartItem, 
  CartSummary
} from '../models/cart.model';
import { Product } from '../../products/models/product.model';
import { 
  mapProductToCartProductObject, 
  updateItemTotalPrice 
} from '../../../shared/utils/cart.utils';

/**
 * Initial Cart State
 * ✅ totalItems and totalPrice removed - now computed from items[]
 * ✅ ADDED: cartId initialization
 * ✅ ADDED: loadingProductIds for per-product loading state (using array for immutability)
 */
const initialCartState: CartState = {
  items: [],
  cartId: null,
  isLoading: false,
  loadingProductIds: [],
  isSyncing: false,
  error: null,
  lastUpdated: Date.now(),
  isAuthenticated: false
};

/**
 * CartStore - NgRx SignalStore Implementation
 * 
 * ✅ Pattern Reference: https://ngrx.io/guide/signals/signal-store
 * ✅ Uses withState, withComputed, withMethods as per official docs
 * ✅ rxMethod for reactive operations with observables
 * ✅ Async methods for promise-based API calls
 * ✅ Protected state by default (no external patchState allowed)
 * 
 * Authentication Flow:
 * - Guest users: Cart stored in localStorage (handled by CartStore)
 * - Authenticated users: Cart stored on server (handled by CartService API)
 * - Login: Syncs local cart to server
 * - Logout: Clears cart and loads guest cart from localStorage
 */
export const CartStore = signalStore(
  { providedIn: 'root', protectedState: true },
  
  // 1️⃣ State Management - Simple and clean
  withState(initialCartState),
  
  // 2️⃣ Computed Properties - Following documentation patterns  
  withComputed((state) => ({
    // ✅ COMPUTED: Total items and price calculated from items array
    totalItems: computed(() => state.items().reduce((sum, item) => sum + item.quantity, 0)),
    totalPrice: computed(() => state.items().reduce((sum, item) => sum + item.totalPrice, 0)),
    
    // Cart summary for components
    summary: computed((): CartSummary => {
      const items = state.items();
      const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
      const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
      
      return {
        totalItems,
        totalPrice,
        isEmpty: totalItems === 0,
        itemsCount: '' // Deprecated - use totalItems with translation in template
      };
    }),
    
    // Check if specific product is in cart
    isProductInCart: computed(() => (productId: string): boolean => {
      return state.items().some(item => item.product._id === productId);
    }),
    
    // Get quantity of specific product in cart
    getProductQuantity: computed(() => (productId: string): number => {
      const item = state.items().find(item => item.product._id === productId);
      return item?.quantity || 0;
    }),
    
    // Check if specific product is currently loading (being added/updated)
    // ✅ Uses array.includes() - O(n) but negligible for typical use cases
    isProductLoading: computed(() => (productId: string): boolean => {
      return state.loadingProductIds().includes(productId);
    }),
    
    // Cart badge display (for header)
    badgeCount: computed(() => {
      const count = state.items().reduce((sum, item) => sum + item.quantity, 0);
      return count > 99 ? '99+' : count.toString();
    }),
    
    // Check if cart has any errors
    hasError: computed(() => state.error() !== null),
    
    // Check if any operations are in progress
    isOperating: computed(() => state.isLoading() || state.isSyncing()),
    
    // Formatted total price
    formattedTotalPrice: computed(() => {
      const price = state.items().reduce((sum, item) => sum + item.totalPrice, 0);
      return new Intl.NumberFormat('en-EG', {
        style: 'currency',
        currency: 'EGP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    })
  })),
  
  // 3️⃣ Lifecycle Hooks - Official NgRx SignalStore Pattern
  withHooks((store) => {
    const cartService = inject(CartService);
    const authService = inject(AuthService);
    
    return {
      onInit() {
        // 👇 Official NgRx initialization pattern - runs when store is created
        const isAuthenticated = authService.isAuthenticated();
        patchState(store, { isAuthenticated });
        
        if (isAuthenticated) {
          // Check if there are unsynchronized items in localStorage
          const localItems = cartService.loadCartFromStorage();
          
          if (localItems.length > 0) {
            // User is authenticated but has local items (race condition scenario)
            // This happens when:
            // 1. User logged in and sync started
            // 2. User refreshed before sync completed
            // 3. localStorage still has items that weren't synced
            
            patchState(store, { isSyncing: true, error: null });
            
            // Sync local items first, then load complete cart
            cartService.syncCartWithServer(localItems).subscribe({
              next: (result) => {
                if (result?.success) {
                  // Sync succeeded - clear localStorage and load from server
                  cartService.clearCartFromStorage();
                  
                  cartService.getCart().subscribe({
                    next: ({ items, cartId }) => {
                      patchState(store, {
                        items,
                        cartId,
                        lastUpdated: Date.now(),
                        isSyncing: false,
                        error: null
                      });
                    },
                    error: (error) => {
                      patchState(store, {
                        error: error.message || 'Failed to load cart after sync',
                        isSyncing: false
                      });
                    }
                  });
                } else {
                  // Sync failed - keep local items and show error
                  patchState(store, {
                    items: localItems,
                    error: result?.message || 'Failed to sync cart',
                    isSyncing: false
                  });
                }
              },
              error: (error) => {
                // Sync failed - keep local items
                patchState(store, {
                  items: localItems,
                  error: error.message || 'Failed to sync cart with server',
                  isSyncing: false
                });
              }
            });
          } else {
            // No local items - just load from API
            patchState(store, { isLoading: true, error: null });
            cartService.getCart().subscribe({
              next: ({ items, cartId }) => {
                patchState(store, {
                  items,
                  cartId,
                  lastUpdated: Date.now(),
                  isLoading: false,
                  error: null
                });
              },
              error: (error) => {
                patchState(store, {
                  error: error.message || 'Failed to load cart',
                  isLoading: false
                });
              }
            });
          }
        } else {
          // Load from localStorage for guest users
          const items = cartService.loadCartFromStorage();
          patchState(store, {
            items,
            lastUpdated: Date.now(),
            error: null
          });
        }
      }
    };
  }),
  
  // 4️⃣ Methods - Following exact documentation patterns
  withMethods((store, cartService = inject(CartService), authService = inject(AuthService), messageService = inject(MessageService)) => ({
    
    
    /**
     * Load cart from API - Reactive method following documentation pattern
     */
    loadCartFromApi: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => cartService.getCart().pipe(
          tapResponse({
            next: ({ items, cartId }) => {
              patchState(store, {
                items,
                cartId,
                lastUpdated: Date.now(),
                isLoading: false,
                error: null
              });
            },
            error: (error: Error) => {
              patchState(store, {
                error: error.message || 'Failed to load cart',
                isLoading: false
              });
            }
          })
        ))
      )
    ),
    
    /**
     * Add product to cart - Reactive method using rxMethod
     * Following NgRx best practices with tapResponse
     * ✅ Uses per-product loading state for better UX
     * ✅ Uses immutable array operations (NgRx best practice)
     */
    addToCart: rxMethod<{ product: Product; quantity?: number }>(
      pipe(
        tap(({ product }) => {
          // Add product to loading array (immutable spread)
          const currentLoadingIds = store.loadingProductIds();
          if (!currentLoadingIds.includes(product._id)) {
            patchState(store, { 
              loadingProductIds: [...currentLoadingIds, product._id],
              error: null 
            });
          }
        }),
        switchMap(({ product, quantity = 1 }) => {
          const isAuthenticated = store.isAuthenticated();
          
          if (isAuthenticated) {
            // Authenticated user: use API with proper Observable pattern
            // Note: API always adds quantity = 1, doesn't accept quantity parameter
            return cartService.addToCart({ productId: product._id }).pipe(
              tapResponse({
                next: (result) => {
                  if (result?.success && result.cart) {
                    patchState(store, { ...result.cart });
                    
                    // ✅ Show success toast notification
                    messageService.add({
                      severity: 'success',
                      summary: 'Added to Cart',
                      detail: `${product.title} has been added to your cart`,
                      life: 3000
                    });
                  } else {
                    patchState(store, {
                      error: result?.message || 'Failed to add product to cart'
                    });
                    
                    // Show error toast
                    messageService.add({
                      severity: 'error',
                      summary: 'Error',
                      detail: result?.message || 'Failed to add product to cart',
                      life: 3000
                    });
                  }
                },
                error: (error) => {
                  patchState(store, {
                    error: error instanceof Error ? error.message : 'Failed to add product to cart'
                  });
                  
                  // Show error toast
                  messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error instanceof Error ? error.message : 'Failed to add product to cart',
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
            return of({ product, quantity }).pipe(
              tap(({ product, quantity }) => {
                const currentItems = store.items();
                const existingItemIndex = currentItems.findIndex(item => 
                  item.product._id === product._id
                );
                
                let updatedItems: CartItem[];
                
                if (existingItemIndex >= 0) {
                  // Update existing item
                  updatedItems = currentItems.map((item, index) => 
                    index === existingItemIndex 
                      ? updateItemTotalPrice({ ...item, quantity: item.quantity + quantity })
                      : item
                  );
                } else {
                  // Add new item - create CartItem from Product for guest user
                  const now = new Date().toISOString();
                  const currentPrice = product.priceAfterDiscount || product.price;
                  const newItem: CartItem = {
                    _id: `local_${product._id}_${Date.now()}`,
                    product: mapProductToCartProductObject(product),
                    quantity,
                    unitPrice: currentPrice,
                    totalPrice: currentPrice * quantity,
                    addedAt: now,
                    updatedAt: now
                  };
                  updatedItems = [...currentItems, newItem];
                }
              
              patchState(store, {
                items: updatedItems,
                lastUpdated: Date.now(),
                error: null
              });
                
                // Save to localStorage
                cartService.saveCartToStorage(updatedItems);
                
                // ✅ Show success toast notification for guest user
                messageService.add({
                  severity: 'success',
                  summary: 'Added to Cart',
                  detail: `${product.title} has been added to your cart`,
                  life: 3000
                });
              }),
              tapResponse({
                next: () => {}, // Success handled in tap above
                error: (error) => {
                  patchState(store, {
                    error: error instanceof Error ? error.message : 'Failed to add product to cart'
                  });
                  
                  // Show error toast
                  messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: error instanceof Error ? error.message : 'Failed to add product to cart',
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
     * Update cart item quantity - Reactive method using rxMethod
     * @param productId - Product ID (works for both authenticated and guest users)
     * @param quantity - New quantity
     */
    updateCartItem: rxMethod<{ productId: string; quantity: number }>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(({ productId, quantity }) => {
          const isAuthenticated = store.isAuthenticated();
          
          if (isAuthenticated) {
            // Authenticated user: use API with productId and count as string
            return cartService.updateCartItem({ 
              productId, 
              count: quantity.toString() 
            }).pipe(
              tapResponse({
                next: (result) => {
                  if (result?.success && result.cart) {
                    patchState(store, { ...result.cart });
                  } else {
                    patchState(store, {
                      error: result?.message || 'Failed to update cart item'
                    });
                  }
                },
                error: (error) => patchState(store, {
                  error: error instanceof Error ? error.message : 'Failed to update cart item'
                }),
                finalize: () => patchState(store, { isLoading: false })
              })
            );
          } else {
            // Guest user: handle locally with reactive pattern
            return of({ productId, quantity }).pipe(
              tap(({ productId, quantity }) => {
                const currentItems = store.items();
                let updatedItems: CartItem[];
                
                if (quantity <= 0) {
                  // Remove item if quantity is 0 or less
                  updatedItems = currentItems.filter(item => item.product._id !== productId);
                } else {
                  // Update quantity - find by productId
                  updatedItems = currentItems.map(item => 
                    item.product._id === productId
                      ? updateItemTotalPrice({ ...item, quantity })
                      : item
                  );
                }
                
                patchState(store, {
                  items: updatedItems,
                  lastUpdated: Date.now(),
                  error: null
                });
                
                cartService.saveCartToStorage(updatedItems);
              }),
              tapResponse({
                next: () => {}, // Success handled in tap above
                error: (error) => patchState(store, {
                  error: error instanceof Error ? error.message : 'Failed to update cart item'
                }),
                finalize: () => patchState(store, { isLoading: false })
              })
            );
          }
        })
      )
    ),
    
    /**
     * Remove item from cart - Reactive method using rxMethod
     * @param productId - Product ID to remove (works for both authenticated and guest users)
     */
    removeFromCart: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap((productId) => {
          const isAuthenticated = store.isAuthenticated();
          
          if (isAuthenticated) {
            // Authenticated user: use API with productId
            return cartService.removeFromCart({ productId }).pipe(
              tapResponse({
                next: (result) => {
                  if (result?.success && result.cart) {
                    patchState(store, { ...result.cart });
                  } else {
                    patchState(store, {
                      error: result?.message || 'Failed to remove item from cart'
                    });
                  }
                },
                error: (error) => patchState(store, {
                  error: error instanceof Error ? error.message : 'Failed to remove item from cart'
                }),
                finalize: () => patchState(store, { isLoading: false })
              })
            );
          } else {
            // Guest user: handle locally with reactive pattern
            return of(productId).pipe(
              tap((productId) => {
                const currentItems = store.items();
                const updatedItems = currentItems.filter(item => item.product._id !== productId);
                
                patchState(store, {
                  items: updatedItems,
                  lastUpdated: Date.now(),
                  error: null
                });
                
                cartService.saveCartToStorage(updatedItems);
              }),
              tapResponse({
                next: () => {}, // Success handled in tap above
                error: (error) => patchState(store, {
                  error: error instanceof Error ? error.message : 'Failed to remove item from cart'
                }),
                finalize: () => patchState(store, { isLoading: false })
              })
            );
          }
        })
      )
    ),
    
    /**
     * Clear entire cart - Reactive method using rxMethod
     */
    clearCart: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true, error: null })),
        switchMap(() => {
          const isAuthenticated = store.isAuthenticated();
          
          if (isAuthenticated) {
            // Authenticated user: use API with proper Observable pattern
            return cartService.clearCart().pipe(
              tapResponse({
                next: (result) => {
                  if (result?.success && result.cart) {
                    patchState(store, { ...result.cart });
                  } else {
                    patchState(store, {
                      error: result?.message || 'Failed to clear cart'
                    });
                  }
                },
                error: (error) => patchState(store, {
                  error: error instanceof Error ? error.message : 'Failed to clear cart'
                }),
                finalize: () => patchState(store, { isLoading: false })
              })
            );
          } else {
            // Guest user: handle locally with reactive pattern
            return of(null).pipe(
              tap(() => {
                patchState(store, {
                  items: [],
                  cartId: null,
                  lastUpdated: Date.now(),
                  error: null
                });
                
                cartService.clearCartFromStorage();
              }),
              tapResponse({
                next: () => {}, // Success handled in tap above
                error: (error) => patchState(store, {
                  error: error instanceof Error ? error.message : 'Failed to clear cart'
                }),
                finalize: () => patchState(store, { isLoading: false })
              })
            );
          }
        })
      )
    ),
    
    /**
     * Handle authentication state changes - Simple method
     */
    onAuthenticationChange(isAuthenticated: boolean): void {
      const wasAuthenticated = store.isAuthenticated();
      
      patchState(store, { isAuthenticated });
      
      if (!wasAuthenticated && isAuthenticated) {
        // User just logged in - sync local cart with server
        this.syncCartWithServer();
      } else if (wasAuthenticated && !isAuthenticated) {
        // User just logged out - clear cart and load from localStorage
        patchState(store, {
          items: [],
          cartId: null,
          error: null,
          lastUpdated: Date.now()
        });
        
        // Load guest cart from localStorage
        const items = cartService.loadCartFromStorage();
        
        patchState(store, {
          items,
          cartId: null,  // Guest carts don't have server cartId
          lastUpdated: Date.now()
        });
      }
    },
    
    /**
     * Sync cart with server - Reactive method
     * ✅ OPTIMIZED: Flattened observable chain for better readability
     */
    syncCartWithServer: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isSyncing: true, error: null })),
        switchMap(() => {
          const localItems = store.items();
          return cartService.syncCartWithServer(localItems);
        }),
        switchMap((result) => {
          if (!result?.success) {
            // Sync failed - update error state
            patchState(store, {
              error: result?.message || 'Failed to sync cart',
              isSyncing: false
            });
            return of(null);
          }
          
          // Sync succeeded - clear local storage and reload cart
          cartService.clearCartFromStorage();
          return cartService.getCart();
        }),
        tapResponse({
          next: (cartData) => {
            if (cartData) {
              const { items, cartId } = cartData;
              patchState(store, {
                items,
                cartId,
                lastUpdated: Date.now(),
                isSyncing: false,
                error: null
              });
            }
          },
          error: (error: Error) => {
            patchState(store, {
              error: error.message || 'Failed to sync cart with server',
              isSyncing: false
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