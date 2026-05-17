import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { BRAND_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import { CollectionResponse, SingleItemResponse } from '../../../core/models/api-response.model';
import { Brand, BrandQueryParams } from '../models/brand.model';

/**
 * Brands Service - Pure Brands Domain
 * Handles ONLY brand-related API operations
 * Based on Route E-commerce API endpoints and real testing
 * Following the exact same pattern as CategoriesService
 */
@Injectable({
  providedIn: 'root'
})
export class BrandsService {
  private readonly api = inject(ApiService);

  /**
   * Get all brands with optional filtering and pagination
   * API: GET /api/v1/brands
   * @param params - Query parameters (limit, page, keyword, sort)
   * @returns Observable of paginated brands
   */
  getAllBrands(params?: BrandQueryParams): Observable<CollectionResponse<Brand>> {
    return this.api.getCollection<Brand>(
      BRAND_ENDPOINTS.GET_ALL,
      params
    );
  }

  /**
   * Get brand by ID
   * API: GET /api/v1/brands/{brandId}
   * @param id - Brand ID
   * @returns Observable of single brand
   */
  getBrandById(id: string): Observable<SingleItemResponse<Brand>> {
    const endpoint = BRAND_ENDPOINTS.GET_BY_ID(id);
    return this.api.getItem<Brand>(endpoint);
  }

  /**
   * Get brand by slug (requires fetching all and filtering)
   * Note: API doesn't have direct slug endpoint
   * @param slug - Brand slug
   * @returns Observable of single brand
   */
  getBrandBySlug(slug: string): Observable<Brand | null> {
    return this.getAllBrands({ limit: 100 }).pipe(
      map(response => {
        const brand = response.data.find(b => b.slug === slug);
        return brand || null;
      })
    );
  }

  /**
   * Search brands by keyword
   * API: GET /api/v1/brands?keyword={searchTerm}
   * @param keyword - Search term
   * @param limit - Maximum results (default: 20)
   * @returns Observable of matching brands
   */
  searchBrands(keyword: string, limit: number = 20): Observable<CollectionResponse<Brand>> {
    return this.getAllBrands({ keyword, limit });
  }
}
