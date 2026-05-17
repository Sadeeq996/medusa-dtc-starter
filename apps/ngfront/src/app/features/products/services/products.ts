import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { PRODUCT_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import { CollectionResponse, SingleItemResponse } from '../../../core/models/api-response.model';
import { 
  Product, 
  ProductQueryParams, 
  ProductDetails
} from '../models/product.model';

/**
 * Products Service - Pure Products Domain
 * Handles ONLY product-related API operations
 * Based on Route E-commerce API endpoints and real testing
 * Categories and Brands are handled by their respective domain services
 */
@Injectable({
  providedIn: 'root'
})
export class ProductsService {
  private readonly api = inject(ApiService);

  /**
   * Get all products with filtering and pagination
   * API: GET /api/v1/products
   */
  getProducts(params?: ProductQueryParams): Observable<CollectionResponse<Product>> {
    return this.api.getCollection<Product>(PRODUCT_ENDPOINTS.GET_ALL, params);
  }

  /**
   * Get product by ID
   * API: GET /api/v1/products/{id}
   */
  getProductById(id: string): Observable<Product> {
    return this.api.getItem<Product>(PRODUCT_ENDPOINTS.GET_BY_ID(id))
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get product details with additional computed properties
   */
  getProductDetails(id: string): Observable<ProductDetails> {
    return this.getProductById(id)
      .pipe(
        map(product => this.enrichProductDetails(product))
      );
  }

  /**
   * Search products by keyword
   * API: GET /api/v1/products?keyword={searchTerm}
   */
  searchProducts(keyword: string, params?: ProductQueryParams): Observable<CollectionResponse<Product>> {
    const searchParams: ProductQueryParams = {
      ...params,
      keyword: keyword.trim()
    };
    return this.getProducts(searchParams);
  }

  /**
   * Get products by category
   * API: GET /api/v1/products?category[in]={categoryId}
   */
  getProductsByCategory(categoryId: string, params?: ProductQueryParams): Observable<CollectionResponse<Product>> {
    const categoryParams: ProductQueryParams = {
      ...params,
      'category[in]': [categoryId]
    };
    return this.getProducts(categoryParams);
  }

  /**
   * Get products by multiple categories
   * API: GET /api/v1/products?category[in]={categoryIds}
   */
  getProductsByCategories(categoryIds: string[], params?: ProductQueryParams): Observable<CollectionResponse<Product>> {
    const categoryParams: ProductQueryParams = {
      ...params,
      'category[in]': categoryIds
    };
    return this.getProducts(categoryParams);
  }

  /**
   * Get products by brand
   * API: GET /api/v1/products?brand={brandId}
   */
  getProductsByBrand(brandId: string, params?: ProductQueryParams): Observable<CollectionResponse<Product>> {
    const brandParams: ProductQueryParams = {
      ...params,
      brand: brandId
    };
    return this.getProducts(brandParams);
  }

  /**
   * Get products by price range
   * API: GET /api/v1/products?price[gte]={min}&price[lte]={max}
   */
  getProductsByPriceRange(min: number, max: number, params?: ProductQueryParams): Observable<CollectionResponse<Product>> {
    const priceParams: ProductQueryParams = {
      ...params,
      'price[gte]': min,
      'price[lte]': max
    };
    return this.getProducts(priceParams);
  }

  /**
   * Get featured products (highest rated)
   * API: GET /api/v1/products?sort=-ratingsAverage&limit={limit}
   */
  getFeaturedProducts(limit: number = 8): Observable<Product[]> {
    const params: ProductQueryParams = {
      sort: '-ratingsAverage',
      limit
    };
    return this.getProducts(params)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get newest products
   * API: GET /api/v1/products?sort=-createdAt&limit={limit}
   */
  getNewestProducts(limit: number = 8): Observable<Product[]> {
    const params: ProductQueryParams = {
      sort: '-createdAt',
      limit
    };
    return this.getProducts(params)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get best selling products
   * API: GET /api/v1/products?sort=-sold&limit={limit}
   */
  getBestSellingProducts(limit: number = 8): Observable<Product[]> {
    const params: ProductQueryParams = {
      sort: '-sold',
      limit
    };
    return this.getProducts(params)
      .pipe(
        map(response => response.data)
      );
  }

  /**
   * Get related products (same category, different product)
   * Note: Uses category data embedded in product, not categories domain
   */
  getRelatedProducts(product: Product, limit: number = 4): Observable<Product[]> {
    // Category should always exist based on API specification
    const params: ProductQueryParams = {
      'category[in]': [product.category._id],
      limit: limit + 1 // Get one extra to filter out current product
    };
    return this.getProducts(params)
      .pipe(
        map(response => response.data.filter(p => p._id !== product._id).slice(0, limit))
      );
  }

  // ===== PRODUCT-SPECIFIC UTILITY METHODS =====

  /**
   * Enrich product with computed properties
   */
  private enrichProductDetails(product: Product): ProductDetails {
    const enriched: ProductDetails = {
      ...product,
      discountPercentage: this.calculateDiscountPercentage(product),
      isOnSale: this.isProductOnSale(product),
      isInStock: this.isProductInStock(product)
    };
    return enriched;
  }

  /**
   * Calculate discount percentage
   */
  calculateDiscountPercentage(product: Product): number {
    if (product.priceAfterDiscount && product.priceAfterDiscount < product.price) {
      return Math.round(((product.price - product.priceAfterDiscount) / product.price) * 100);
    }
    return 0;
  }

  /**
   * Check if product is on sale
   */
  isProductOnSale(product: Product): boolean {
    return !!product.priceAfterDiscount && product.priceAfterDiscount < product.price;
  }

  /**
   * Check if product is in stock
   */
  isProductInStock(product: Product): boolean {
    return product.quantity > 0;
  }

  /**
   * Get current price (discounted or regular)
   */
  getCurrentPrice(product: Product): number {
    return this.isProductOnSale(product) 
      ? product.priceAfterDiscount! 
      : product.price;
  }

  /**
   * Format price for display (EGP)
   * Delegates to shared utility for consistent formatting
   */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  /**
   * Generate product URL slug
   */
  generateProductUrl(product: Product): string {
    return `/products/${product.slug}`;
  }

  /**
   * Get product rating display
   */
  getProductRatingDisplay(product: Product): { rating: number; count: string } {
    return {
      rating: product.ratingsAverage,
      count: `(${product.ratingsQuantity})`
    };
  }
}
