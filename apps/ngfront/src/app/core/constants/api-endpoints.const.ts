// API Endpoints Constants
// Based on Route E-commerce API Documentation and Postman Collection

/**
 * Authentication Endpoints
 */
export const AUTH_ENDPOINTS = {
  SIGNUP: '/auth/signup',
  SIGNIN: '/auth/signin',
  FORGOT_PASSWORD: '/auth/forgotPasswords',
  VERIFY_RESET_CODE: '/auth/verifyResetCode',
  RESET_PASSWORD: '/auth/resetPassword',
  VERIFY_TOKEN: '/auth/verifyToken'
} as const;

/**
 * User Management Endpoints
 */
export const USER_ENDPOINTS = {
  CHANGE_PASSWORD: '/users/changeMyPassword',
  UPDATE_PROFILE: '/users/updateMe',
  GET_ALL_USERS: '/users'
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
 * Shopping Cart Endpoints
 */
export const CART_ENDPOINTS = {
  ADD_ITEM: '/cart',
  GET_CART: '/cart',
  UPDATE_ITEM: (productId: string) => `/cart/${productId}`,
  REMOVE_ITEM: (productId: string) => `/cart/${productId}`,
  CLEAR_CART: '/cart'
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
  TOKEN: 'token'                      // Custom token header (NOT Authorization Bearer)
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
