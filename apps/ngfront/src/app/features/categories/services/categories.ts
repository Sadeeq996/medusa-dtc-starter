import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { CATEGORY_ENDPOINTS, SUBCATEGORY_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import { CollectionResponse, SingleItemResponse } from '../../../core/models/api-response.model';
import { 
  Category, 
  SubCategory,
  CategoryQueryParams,
  SubCategoryQueryParams,
  CategoryDetails
} from '../models/category.model';

/**
 * Categories Service - Pure Categories Domain
 * Handles ONLY category-related API operations
 * Based on Route E-commerce API endpoints and real testing
 * Following the exact same pattern as ProductsService
 */
@Injectable({
  providedIn: 'root'
})
export class CategoriesService {
  private readonly api = inject(ApiService);

  /**
   * Get all categories with pagination
   * API: GET /api/v1/categories
   */
  getCategories(params?: CategoryQueryParams): Observable<CollectionResponse<Category>> {
    return this.api.getCollection<Category>(CATEGORY_ENDPOINTS.GET_ALL, params);
  }

  /**
   * Get category by ID
   * API: GET /api/v1/categories/{id}
   */
  getCategoryById(id: string): Observable<Category> {
    return this.api.getItem<Category>(CATEGORY_ENDPOINTS.GET_BY_ID(id))
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get category details with additional computed properties
   */
  getCategoryDetails(id: string): Observable<CategoryDetails> {
    return this.getCategoryById(id)
      .pipe(
        map(category => this.enrichCategoryDetails(category))
      );
  }

  /**
   * Get all subcategories
   * API: GET /api/v1/subcategories
   */
  getSubcategories(params?: SubCategoryQueryParams): Observable<CollectionResponse<SubCategory>> {
    return this.api.getCollection<SubCategory>(SUBCATEGORY_ENDPOINTS.GET_ALL, params);
  }

  /**
   * Get subcategories for a specific category
   * API: GET /api/v1/categories/{id}/subcategories
   */
  getCategorySubcategories(categoryId: string): Observable<SubCategory[]> {
    return this.api.getCollection<SubCategory>(CATEGORY_ENDPOINTS.GET_SUBCATEGORIES(categoryId))
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get subcategory by ID
   * API: GET /api/v1/subcategories/{id}
   */
  getSubcategoryById(id: string): Observable<SubCategory> {
    return this.api.getItem<SubCategory>(SUBCATEGORY_ENDPOINTS.GET_BY_ID(id))
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get featured categories (first N categories for homepage)
   */
  getFeaturedCategories(limit: number = 8): Observable<Category[]> {
    const params: CategoryQueryParams = {
      limit
    };
    return this.getCategories(params)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Search categories by keyword
   * API: GET /api/v1/categories?keyword={searchTerm}
   */
  searchCategories(keyword: string, params?: CategoryQueryParams): Observable<CollectionResponse<Category>> {
    const searchParams: CategoryQueryParams = {
      ...params,
      keyword: keyword.trim()
    };
    return this.getCategories(searchParams);
  }

  // ===== CATEGORY-SPECIFIC UTILITY METHODS =====

  /**
   * Enrich category with computed properties
   */
  private enrichCategoryDetails(category: Category): CategoryDetails {
    const enriched: CategoryDetails = {
      ...category
    };
    return enriched;
  }

  /**
   * Generate category URL slug
   */
  generateCategoryUrl(category: Category): string {
    return `/categories/${category.slug}`;
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: Category): string {
    return category.name;
  }

  /**
   * Format category for display
   */
  formatCategoryForDisplay(category: Category): { name: string; image: string; url: string } {
    return {
      name: category.name,
      image: category.image,
      url: this.generateCategoryUrl(category)
    };
  }
}
