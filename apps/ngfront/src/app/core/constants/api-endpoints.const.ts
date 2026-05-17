// API Endpoints Constants
// Based on Medusa Store API documentation and backend routes

/**
 * Authentication Endpoints
 */
export const AUTH_ENDPOINTS = {
  SIGNUP: '/customers',
  SIGNIN: '/auth',
  FORGOT_PASSWORD: '/customers/password-reset',
  VERIFY_RESET_CODE: '/customers/password-reset/verify',
  RESET_PASSWORD: '/customers/password-reset',
  VERIFY_TOKEN: '/auth/verify'
} as const;

/**
 * User Management Endpoints
 */
export const USER_ENDPOINTS = {
  CHANGE_PASSWORD: '/customers/password',
  UPDATE_PROFILE: '/customers/me',
  GET_ALL_USERS: '/customers'
} as const;

/**
 * Product Catalog Endpoints
 */
export const PRODUCT_ENDPOINTS = {
  GET_ALL: '/products',
  GET_BY_ID: (id: string) => `/products/${id}`
} as const;

/**
 * Category Endpoints
 */
export const CATEGORY_ENDPOINTS = {
  GET_ALL: '/categories',
  GET_BY_ID: (id: string) => `/categories/${id}`,
  GET_SUBCATEGORIES: (id: string) => `/categories/${id}/subcategories`
} as const;

/**
 * Subcategory Endpoints
 */
export const SUBCATEGORY_ENDPOINTS = {
  GET_ALL: '/subcategories',
  GET_BY_ID: (id: string) => `/subcategories/${id}`
} as const;

/**
 * Brand Endpoints
 */
export const BRAND_ENDPOINTS = {
  GET_ALL: '/brands',
  GET_BY_ID: (id: string) => `/brands/${id}`
} as const;

/**
 * Vendor / Marketplace Endpoints
 */
export const VENDOR_ENDPOINTS = {
  GET_ALL: '/vendors',
  GET_BY_HANDLE: (handle: string) => `/vendors/${handle}`
} as const;

export const VENDOR_ADMIN_ENDPOINTS = {
  GET_PRODUCTS: '/vendors/products',
  CREATE_PRODUCT: '/vendors/products',
  GET_ORDERS: '/vendors/orders'
} as const;

/**
 * Shopping Cart Endpoints
 */
export const CART_ENDPOINTS = {
  CREATE_CART: '/carts',
  GET_CART: (cartId: string) => `/carts/${cartId}`,
  ADD_ITEM: (cartId: string) => `/carts/${cartId}/line-items`,
  UPDATE_ITEM: (cartId: string, itemId: string) => `/carts/${cartId}/line-items/${itemId}`,
  REMOVE_ITEM: (cartId: string, itemId: string) => `/carts/${cartId}/line-items/${itemId}`,
  CLEAR_CART: (cartId: string) => `/carts/${cartId}`
} as const;

/**
 * Wishlist Endpoints
 */
export const WISHLIST_ENDPOINTS = {
  ADD_ITEM: '/wishlist',
  GET_WISHLIST: '/wishlist',
  REMOVE_ITEM: (productId: string) => `/wishlist/${productId}`
} as const;

/**
 * Address Endpoints
 */
export const ADDRESS_ENDPOINTS = {
  ADD_ADDRESS: '/addresses',
  GET_ADDRESSES: '/addresses',
  GET_BY_ID: (id: string) => `/addresses/${id}`,
  REMOVE_ADDRESS: (id: string) => `/addresses/${id}`
} as const;

/**
 * Order Endpoints
 */
export const ORDER_ENDPOINTS = {
  COMPLETE_VENDOR_CART: (cartId: string) => `/carts/${cartId}/complete-vendor`,
  CREATE_CASH_ORDER: (cartId: string) => `/orders/${cartId}`,
  CREATE_STRIPE_SESSION: (cartId: string) => `/orders/checkout-session/${cartId}`,
  GET_ALL_ORDERS: '/orders',
  GET_USER_ORDERS: (userId: string) => `/orders/user/${userId}`
} as const;

/**
 * HTTP Methods
 */
export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  DELETE: 'DELETE'
} as const;

/**
 * Request Headers
 */
export const HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  APPLICATION_JSON: 'application/json',
  AUTHORIZATION: 'Authorization',
  TOKEN: 'token'                      // Legacy token header
} as const;

/**
 * Storage Keys
 */
export const STORAGE_KEYS = {
  JWT_TOKEN: 'jwt_token',
  USER_DATA: 'user_data',
  LANGUAGE: 'language',
  THEME: 'theme',
  CART_DATA: 'cart_data'             // For guest cart storage
} as const;

/**
 * API Configuration Constants
 */
export const API_CONFIG = {
  DEFAULT_TIMEOUT: 30000,             // 30 seconds
  COLLECTION_TIMEOUT: 15000,          // 15 seconds for collections
  RETRY_ATTEMPTS: 1,                  // Number of retry attempts
  DEFAULT_PAGE_SIZE: 20               // Default pagination size
} as const;
