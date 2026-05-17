// Order Models - Based on Route E-commerce API Response
// Following the same pattern as cart.model.ts and wishlist.model.ts
// Updated: 2025-09-30 based on profile-api-documentation.md

/**
 * Order Interface - Matches API Response Structure
 * Based on real API response: GET /api/v1/orders/user/{userId}
 */
export interface Order {
  _id: string;                                    // Order ID
  user: OrderUser;                                // User details
  cartItems: OrderCartItem[];                     // Items in the order
  shippingAddress: OrderShippingAddress;          // Delivery address
  taxPrice: number;                               // Tax amount
  shippingPrice: number;                          // Shipping cost
  totalOrderPrice: number;                        // Total price
  paymentMethodType: 'cash' | 'card';            // Payment method
  isPaid: boolean;                                // Payment status
  isDelivered: boolean;                           // Delivery status
  paidAt?: string;                                // Payment date (optional, only for card payments)
  createdAt: string;                              // Order creation date
  updatedAt: string;                              // Last update date
  id: number;                                     // Numeric order ID
  __v: number;                                    // Version key
}

/**
 * Order User Details
 * Minimal user info included in order response
 */
export interface OrderUser {
  _id: string;                                    // User ID
  name: string;                                   // User full name
  email: string;                                  // User email
  phone: string;                                  // User phone
}

/**
 * Order Cart Item
 * Product details for items in the order
 */
export interface OrderCartItem {
  count: number;                                  // Quantity ordered
  _id: string;                                    // Cart item ID
  product: OrderProduct;                          // Product details
  price: number;                                  // Price at time of order
}

/**
 * Order Product Details
 * Subset of product information included in order
 */
export interface OrderProduct {
  subcategory: Array<{
    _id: string;
    name: string;
    slug: string;
    category: string;
  }>;
  ratingsQuantity: number;                        // Number of ratings
  _id: string;                                    // Product ID
  title: string;                                  // Product name
  imageCover: string;                             // Product image URL
  category: {
    _id: string;
    name: string;
    slug: string;
    image: string;
  };
  brand: {
    _id: string;
    name: string;
    slug: string;
    image: string;
  };
  ratingsAverage: number;                         // Average rating
  id: string;                                     // Alternative product ID
}

/**
 * Order Shipping Address
 * Delivery location details
 */
export interface OrderShippingAddress {
  details: string;                                // Full address details
  phone: string;                                  // Contact phone
  city: string;                                   // City name
}

/**
 * Order Query Parameters
 * For filtering and pagination
 */
export interface OrderQueryParams {
  limit?: number;                                 // Items per page
  page?: number;                                  // Page number
  sort?: string;                                  // Sort field
  paymentMethodType?: 'cash' | 'card';           // Filter by payment method
  isPaid?: boolean;                               // Filter by payment status
  isDelivered?: boolean;                          // Filter by delivery status
}

/**
 * Order Summary for display
 * Computed information about an order
 */
export interface OrderSummary {
  orderId: string;                                // Order ID
  orderNumber: number;                            // Numeric order number
  totalItems: number;                             // Total quantity of items
  totalPrice: number;                             // Total order price
  status: OrderStatus;                            // Current order status
  paymentMethod: 'Cash on Delivery' | 'Credit/Debit Card';
  orderDate: string;                              // Formatted order date
}

/**
 * Order Status enum
 * Derived status based on order properties
 */
export type OrderStatus = 
  | 'pending'           // Not paid, not delivered
  | 'paid'              // Paid, not delivered
  | 'processing'        // Paid, being prepared
  | 'shipped'           // On the way
  | 'delivered'         // Delivered
  | 'cancelled';        // Cancelled

