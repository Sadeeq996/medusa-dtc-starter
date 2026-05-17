// Wishlist Models - Based on Real API Integration
// Created: 2025-09-30 - Following Cart pattern
// All interfaces verified against real API testing

import { Product } from '../../products/models/product.model';

/**
 * Wishlist API Response Format
 * Based on real API testing (2025-09-30)
 * 
 * GET /wishlist returns array of full Product objects
 * POST /wishlist returns array of product IDs (strings)
 * DELETE /wishlist/{productId} returns array of remaining product IDs
 */
export interface WishlistApiResponse {
  status: string;                     // "success"
  message?: string;                   // Present in some responses
  count: number;                      // Number of items in wishlist
  data: string[] | Product[];         // Product IDs (POST/DELETE) or full Products (GET)
}

/**
 * Wishlist State Interface - Complete wishlist state for SignalStore
 * Simpler than CartState (no quantity, price, cartId)
 */
export interface WishlistState {
  items: Product[];                   // Wishlist items (full Product objects)
  isLoading: boolean;                 // Loading state for page-level operations
  loadingProductIds: string[];        // Product IDs currently being added/removed (per-product loading)
  error: string | null;               // Error message if any
  lastUpdated: number;                // Timestamp of last update
  isAuthenticated: boolean;           // User authentication status
}

/**
 * Add to Wishlist Request
 * API: POST /wishlist
 * Body: { "productId": "..." }
 */
export interface AddToWishlistRequest {
  productId: string;                  // Product ID to add
}

/**
 * Remove from Wishlist Request
 * API: DELETE /wishlist/{productId}
 */
export interface RemoveFromWishlistRequest {
  productId: string;                  // Product ID to remove
}

/**
 * Wishlist Summary for display components
 */
export interface WishlistSummary {
  totalItems: number;                 // Total item count
  isEmpty: boolean;                   // Whether wishlist is empty
  itemsCount: string;                 // Formatted items count display
}

/**
 * Wishlist Persistence Data - For localStorage (guest users)
 */
export interface WishlistPersistenceData {
  productIds: string[];               // Product IDs in wishlist (simpler than cart)
  lastUpdated: number;                // When saved
  userId: string | null;              // User ID if authenticated (null for guest)
}

/**
 * Wishlist Operation Result - Return type for wishlist operations
 */
export interface WishlistOperationResult {
  success: boolean;                   // Whether operation succeeded
  message?: string;                   // Success/error message
  items?: Product[];                  // Updated wishlist items
  productIds?: string[];              // Updated product IDs
}

