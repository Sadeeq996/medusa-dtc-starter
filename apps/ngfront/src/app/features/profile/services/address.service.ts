import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { ADDRESS_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import {
  Address,
  AddAddressRequest,
  AddAddressResponse,
  AddressListResponse,
  DeleteAddressResponse,
  AddressOperationResult
} from '../models/address.model';

/**
 * Address Service
 * Handles address-related API operations
 * Following the same pattern as CartService and WishlistService
 * 
 * ⚠️ IMPORTANT: No UPDATE endpoint exists in the API
 * To edit an address, delete the old one and add a new one
 */
@Injectable({
  providedIn: 'root'
})
export class AddressService {
  private readonly api = inject(ApiService);

  /**
   * Get all addresses for current user
   * API: GET /api/v1/addresses
   * @returns Observable of addresses array
   */
  getAddresses(): Observable<Address[]> {
    return this.api.get<AddressListResponse>(ADDRESS_ENDPOINTS.GET_ADDRESSES).pipe(
      map(response => response.data),
      catchError(error => {
        console.error('Failed to load addresses:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Add new address
   * API: POST /api/v1/addresses
   * ⚠️ CRITICAL: Response.data is ARRAY [newAddress], not single object
   * @param request - Address data
   * @returns Observable of operation result
   * 
   * Note: No getAddressById needed - components work with full address list from getAddresses()
   */
  addAddress(request: AddAddressRequest): Observable<AddressOperationResult> {
    return this.api.post<AddAddressResponse>(ADDRESS_ENDPOINTS.ADD_ADDRESS, request).pipe(
      map(response => {
        // ⚠️ API returns array, extract first element
        const newAddress = response.data[0];
        
        return {
          success: true,
          message: response.message || 'Address added successfully',
          address: newAddress
        };
      }),
      catchError(error => {
        console.error('Failed to add address:', error);
        return throwError(() => ({
          success: false,
          message: error?.message || 'Failed to add address. Please try again.'
        }));
      })
    );
  }

  /**
   * Delete address by ID
   * API: DELETE /api/v1/addresses/{addressId}
   * @param addressId - Address ID to delete
   * @returns Observable of operation result
   */
  deleteAddress(addressId: string): Observable<AddressOperationResult> {
    const endpoint = ADDRESS_ENDPOINTS.REMOVE_ADDRESS(addressId);
    return this.api.delete<DeleteAddressResponse>(endpoint).pipe(
      map(response => ({
        success: true,
        message: response.message || 'Address deleted successfully'
      })),
      catchError(error => {
        console.error(`Failed to delete address ${addressId}:`, error);
        return throwError(() => ({
          success: false,
          message: error?.message || 'Failed to delete address. Please try again.'
        }));
      })
    );
  }

}

