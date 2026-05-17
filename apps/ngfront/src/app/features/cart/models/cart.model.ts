// Cart Models - Based on Real API Integration
// Updated: 2025-09-30 - Matches actual Route E-commerce API responses
// All interfaces verified against real API testing

/**
 * Cart API Response Format
 * Based on real API testing (2025-09-30)
 * 
 * ✅ Implementation Strategy:
 * - POST /cart returns product as string ID → We immediately follow with GET /cart
 * - This interface represents GET/PUT/DELETE responses with full product objects
 * - We never directly consume POST responses, so product is always CartProductObject
 */
export interface CartLineItem {
  id: string;
  variant_id: string;
  quantity: number;
  unit_price: number;
  title?: string;
  thumbnail?: string;
  product?: {
    id?: string;
    title?: string;
    thumbnail?: string;
  };
}

export interface CartApiResponse {
  id: string;
  items: CartLineItem[];
  subtotal?: number;
  total?: number;
}

/**
 * Cart Product Object Structure
 * Simplified and compatible with Medusa store cart item payloads.
 */
export interface CartProductObject {
  _id: string;
  title?: string;
  imageCover?: string;
  quantity?: number;                   // Available stock quantity (NOT cart quantity)
  ratingsAverage?: number;
  subcategory?: Array<{
    _id?: string;
    name?: string;
    slug?: string;
    category?: string;
  }>;
  category?: {
    _id?: string;
    name?: string;
    slug?: string;
    image?: string;
  };
  brand?: {
    _id?: string;
    name?: string;
    slug?: string;
    image?: string;
  };
  id?: string;                         // Duplicate of _id or variant identifier
}

/**
 * Cart Item Interface - Individual product in cart (Frontend model)
 * This is our internal representation after transforming API response
 */
export interface CartItem {
  _id: string;                          // Cart item ID (from API)
  product: CartProductObject;           // Product details (subset from API)
  quantity: number;                     // Quantity in cart (API calls this 'count')
  unitPrice: number;                    // Price at time of adding (from cart item level)
  totalPrice: number;                   // unitPrice * quantity (computed)
  addedAt: string;                      // When item was added to cart
  updatedAt: string;                    // When quantity was last updated
}

/**
 * Cart State Interface - Complete cart state for SignalStore
 */
export interface CartState {
  items: CartItem[];                    // Cart items
  cartId: string | null;                // Cart ID from API (required for checkout)
  isLoading: boolean;                   // Loading state for operations (page-level operations)
  loadingProductIds: string[];          // ✅ Product IDs currently being added/updated (per-product loading)
  isSyncing: boolean;                   // Syncing local cart with server
  error: string | null;                 // Error message if any
  lastUpdated: number;                  // Timestamp of last update
  isAuthenticated: boolean;             // User authentication status
}

/**
 * Add to Cart Request
 * ✅ VERIFIED: API only accepts productId, always adds quantity = 1
 */
export interface AddToCartRequest {
  productId: string;                    // Product ID to add
  quantity?: number;                    // Quantity to add (default 1)
}

/**
 * Update Cart Item Request
 * ✅ VERIFIED: API uses productId (NOT cart item ID) and count as string
 * Real endpoint: PUT /cart/{productId}
 * Real body: { "count": "2" }
 */
export interface UpdateCartItemRequest {
  productId: string;                    // Product ID (NOT cart item ID!)
  count: string;                        // New quantity as STRING (API requirement)
}

/**
 * Remove from Cart Request
 * ✅ VERIFIED: API uses productId (NOT cart item ID)
 * Real endpoint: DELETE /cart/{productId}
 */
export interface RemoveFromCartRequest {
  productId: string;                    // Product ID to remove (NOT cart item ID!)
}

/**
 * Cart Summary for display components
 */
export interface CartSummary {
  totalItems: number;                   // Total item count
  totalPrice: number;                   // Total price
  isEmpty: boolean;                     // Whether cart is empty
  itemsCount: string;                   // Formatted items count display
}

/**
 * Cart Persistence Data - For localStorage (guest users)
 */
export interface CartPersistenceData {
  items: CartItem[];                    // Cart items
  lastUpdated: number;                  // When saved
  userId: string | null;                // User ID if authenticated (null for guest)
}

/**
 * Cart Operation Result - Return type for cart operations
 */
export interface CartOperationResult {
  success: boolean;                     // Whether operation succeeded
  message?: string;                     // Success/error message
  item?: CartItem;                      // Updated/added item
  cart?: CartState;                     // Updated cart state
  cartId?: string | null;               // Cart ID from API response
}