// Brand Models - Based on Real Route E-commerce API Response
// Following the same pattern as category.model.ts
// Updated: 2025-09-29

/**
 * Brand Interface - Matches API Response Structure
 * Based on real API response: GET /api/v1/brands/{id}
 */
export interface Brand {
  _id: string;                          // Brand ID
  name: string;                         // Brand name
  slug: string;                         // URL slug
  image: string;                        // Brand logo/image URL
  createdAt: string;                    // Creation timestamp
  updatedAt: string;                    // Last update timestamp
}

/**
 * Brand Query Parameters
 * Based on real API: GET /api/v1/brands
 */
export interface BrandQueryParams {
  limit?: number;                       // Number of items per page (default: 40)
  page?: number;                        // Page number (1-based)
  keyword?: string;                     // Search by brand name
  sort?: string;                        // Sort field (e.g., "name", "-createdAt")
}


/**
 * Brand Reference Interface
 * Used when brand is nested in product objects
 */
export interface BrandReference {
  _id: string;                          // Brand ID
  name: string;                         // Brand name
  slug: string;                         // URL slug
  image: string;                        // Brand image URL
}
