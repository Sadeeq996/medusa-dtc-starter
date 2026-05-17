// API Response Models - Based on Real API Testing
// Updated: 2025-01-27 with actual response formats

/**
 * Collection Response Format (Products, Categories, Brands)
 * Based on real API response: GET /api/v1/categories, /api/v1/products
 */
export interface CollectionResponse<T> {
  results: number;                    // Total items count
  metadata: PaginationMetadata;       // Pagination info
  data: T[];                         // Array of items
}

/**
 * Pagination Metadata Structure
 * Note: API uses 'metadata' not 'paginationResult'
 */
export interface PaginationMetadata {
  currentPage: number;
  numberOfPages: number;
  limit: number;
  nextPage?: number;                  // Only present if next page exists
  prevPage?: number;                  // Only present if previous page exists
}

/**
 * Single Item Response Format (Product Details, Category Details)
 * Based on real API response: GET /api/v1/products/{id}
 */
export interface SingleItemResponse<T> {
  data: T;                           // Single item
}

/**
 * Authentication Response Format
 * Based on real API response: POST /api/v1/auth/signup, /api/v1/auth/signin
 */
export interface AuthResponse {
  message: string;                    // "success"
  user: {
    name: string;
    email: string;
    role: string;                     // "user" or "admin"
  };
  token: string;                      // JWT token
}

/**
 * Error Response Format
 * Based on real API response: Invalid endpoints return this format
 */
export interface ApiError {
  statusMsg: string;                  // "fail"
  message: string;                    // Error description
}

/**
 * Generic API Options for HTTP requests
 */
export interface ApiRequestOptions {
  headers?: { [key: string]: string };
  params?: { [key: string]: string | number | boolean };
  requiresAuth?: boolean;             // Whether request requires authentication
}

/**
 * Query Parameters for Collection Endpoints
 */
export interface CollectionQueryParams {
  limit?: number;                     // Number of items per page
  page?: number;                      // Page number (1-based)
  sort?: string;                      // Sort field (e.g., "-price", "createdAt")
  keyword?: string;                   // Search keyword
  fields?: string;                    // Field selection (comma-separated)
}


