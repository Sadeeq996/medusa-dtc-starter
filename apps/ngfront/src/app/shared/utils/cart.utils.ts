import { CartItem, CartProductObject } from '../../features/cart/models/cart.model';
import { Product } from '../../features/products/models/product.model';

/**
 * Cart Utility Functions
 * Updated: 2025-09-30 - Works with CartProductObject (not full Product)
 * 
 * ⚠️ IMPORTANT: CartProductObject from API doesn't include:
 * - price (use item.unitPrice instead)
 * - priceAfterDiscount (discount info not available in cart API)
 * - images array (use imageCover only)
 */

/**
 * Map full Product to CartProductObject
 * Used when adding products to cart for guest users (localStorage)
 * Extracts only the fields that Cart API returns
 */
export function mapProductToCartProductObject(product: Product): CartProductObject {
  return {
    _id: product._id,
    title: product.title,
    imageCover: product.imageCover,
    quantity: product.quantity,
    ratingsAverage: product.ratingsAverage,
    subcategory: product.subcategory,
    category: product.category,
    brand: product.brand,
    id: product.id || product._id
  };
}

/**
 * Format price with Egyptian Pound currency
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
}

/**
 * Get product image URL
 * ✅ UPDATED: CartProductObject only has imageCover (no images array)
 */
export function getProductImageUrl(item: CartItem): string {
  return item.product.imageCover || '/assets/images/product-placeholder.jpg';
}

/**
 * Track function for cart items (for ngFor optimization)
 */
export function trackCartItem(item: CartItem): string {
  return item._id;
}

/**
 * Format date to localized string
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj);
}

/**
 * Update cart item with recalculated total price
 * Helper for ensuring totalPrice is always in sync with quantity * unitPrice
 */
export function updateItemTotalPrice(item: CartItem): CartItem {
  return {
    ...item,
    totalPrice: item.quantity * item.unitPrice,
    updatedAt: new Date().toISOString()
  };
}