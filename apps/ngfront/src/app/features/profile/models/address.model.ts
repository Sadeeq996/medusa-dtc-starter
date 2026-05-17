// Address Models - Based on Route E-commerce API Response
// Following the same pattern as cart.model.ts and wishlist.model.ts
// Updated: 2025-09-30 based on profile-api-documentation.md

import { CollectionResponse, SingleItemResponse } from '../../../core/models/api-response.model';

/**
 * Address Interface - Matches API Response Structure
 * Based on real API response: GET /api/v1/addresses
 */
export interface Address {
  _id: string;                          // Address ID
  name: string;                         // Address label (Home, Work, etc.) - REQUIRED
  details: string;                      // Full address details
  phone: string;                        // Contact phone number
  city: string;                         // City name
  createdAt?: string;                   // Creation timestamp (optional in some responses)
  updatedAt?: string;                   // Last update timestamp (optional in some responses)
}

/**
 * Add Address Request
 * POST /api/v1/addresses
 */
export interface AddAddressRequest {
  name: string;                         // Address label (required)
  details: string;                      // Full address
  phone: string;                        // Phone number
  city: string;                         // City name
}

/**
 * Address API Response for GET /api/v1/addresses
 * Returns array of addresses
 */
export interface AddressListResponse extends CollectionResponse<Address> {
  status: string;                       // "success"
  results: number;                      // Number of addresses
  data: Address[];                      // Array of addresses
}

/**
 * Address API Response for POST /api/v1/addresses
 * ⚠️ CRITICAL: POST returns ARRAY, not single object
 */
export interface AddAddressResponse {
  status: string;                       // "success"  
  message: string;                      // Success message
  data: Address[];                      // ⚠️ Returns ARRAY with single address: [newAddress]
}

/**
 * Address API Response for GET /api/v1/addresses/{id}
 * Returns single address object
 */
export interface SingleAddressResponse extends SingleItemResponse<Address> {
  status: string;                       // "success"
  data: Address;                        // Single address object
}

/**
 * Address API Response for DELETE /api/v1/addresses/{id}
 * Returns empty array
 */
export interface DeleteAddressResponse {
  status: string;                       // "success"
  message: string;                      // Success message
  data: never[];                        // Empty array []
}

/**
 * Address Operation Result
 * Standardized result for address operations
 */
export interface AddressOperationResult {
  success: boolean;                     // Whether operation succeeded
  message?: string;                     // Success/error message
  address?: Address;                    // Created/updated address
  addresses?: Address[];                // All addresses (for list operations)
}

