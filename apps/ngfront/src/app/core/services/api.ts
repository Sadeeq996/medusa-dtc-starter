import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import { StorageService } from './storage';
import { 
  CollectionResponse, 
  SingleItemResponse, 
  ApiError, 
  ApiRequestOptions,
  CollectionQueryParams
} from '../models/api-response.model';
import { HEADERS, API_CONFIG } from '../constants/api-endpoints.const';

/**
 * API Service
 * Centralized HTTP client for FreshCart API
 * Based on real API testing with Route E-commerce backend
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly storage = inject(StorageService);
  private readonly baseUrl = environment.apiUrl;

  // Request timeout constants (from shared config)
  private readonly DEFAULT_TIMEOUT = API_CONFIG.DEFAULT_TIMEOUT;
  private readonly COLLECTION_TIMEOUT = API_CONFIG.COLLECTION_TIMEOUT;

  /**
   * GET request for collections (products, categories, brands)
   * Returns paginated results with metadata
   */
  getCollection<T>(endpoint: string, params?: CollectionQueryParams, options?: ApiRequestOptions): Observable<CollectionResponse<T>> {
    const httpOptions = this.buildHttpOptions(options, params);
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.get<CollectionResponse<T>>(url, httpOptions)
      .pipe(
        timeout(this.COLLECTION_TIMEOUT),
        retry(1),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * GET request for single items (product details, category details)
   */
  getItem<T>(endpoint: string, options?: ApiRequestOptions): Observable<SingleItemResponse<T>> {
    const httpOptions = this.buildHttpOptions(options);
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.get<SingleItemResponse<T>>(url, httpOptions)
      .pipe(
        retry(1),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: any, options?: ApiRequestOptions): Observable<T> {
    const httpOptions = this.buildHttpOptions(options, params);
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.get<T>(url, httpOptions)
      .pipe(
        retry(1),
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * POST request
   */
  post<T>(endpoint: string, data: any, options?: ApiRequestOptions): Observable<T> {
    const httpOptions = this.buildHttpOptions(options);
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.post<T>(url, data, httpOptions)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * PUT request
   */
  put<T>(endpoint: string, data: any, options?: ApiRequestOptions): Observable<T> {
    const httpOptions = this.buildHttpOptions(options);
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.put<T>(url, data, httpOptions)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * DELETE request
   */
  delete<T>(endpoint: string, options?: ApiRequestOptions): Observable<T> {
    const httpOptions = this.buildHttpOptions(options);
    const url = `${this.baseUrl}${endpoint}`;
    
    return this.http.delete<T>(url, httpOptions)
      .pipe(
        catchError(this.handleError.bind(this))
      );
  }

  /**
   * Build HTTP options with headers, params, and authentication
   * Based on real API testing: uses custom 'token' header
   */
  private buildHttpOptions(options?: ApiRequestOptions, queryParams?: any): { headers: HttpHeaders; params?: HttpParams } {
    let headers = new HttpHeaders({
      [HEADERS.CONTENT_TYPE]: HEADERS.APPLICATION_JSON
    });

    // Add custom headers
    if (options?.headers) {
      Object.keys(options.headers).forEach(key => {
        headers = headers.set(key, options.headers![key]);
      });
    }

    // Authentication is now handled automatically by authHeaderInterceptor
    // This ensures all API requests get proper authentication headers

    let params = new HttpParams();

    // Add query parameters from options
    if (options?.params) {
      Object.keys(options.params).forEach(key => {
        const value = options.params![key];
        if (value !== null && value !== undefined) {
          params = params.set(key, value.toString());
        }
      });
    }

    // Add query parameters from method parameter
    if (queryParams) {
      Object.keys(queryParams).forEach(key => {
        const value = queryParams[key];
        if (value !== null && value !== undefined) {
          // Handle array values (e.g., category[in])
          if (Array.isArray(value)) {
            value.forEach((item: any) => {
              params = params.append(key, item.toString());
            });
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return {
      headers,
      ...(params.keys().length > 0 && { params })
    };
  }

  /**
   * Error handler based on real API error responses
   * API returns: { statusMsg: "fail", message: "error description" }
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    let statusCode = error.status;
    
    // Handle different error scenarios
    if (error.error) {
      // API Error Response Format: { statusMsg: "fail", message: "..." }
      if (error.error.statusMsg === 'fail' && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.error.message) {
        errorMessage = error.error.message;
      } else if (typeof error.error === 'string') {
        errorMessage = error.error;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Handle network and timeout errors
    if (error.status === 0) {
      errorMessage = 'Network error. Please check your internet connection.';
    } else if (error.status === 401) {
      errorMessage = 'Authentication required. Please log in.';
      // Could trigger logout here
    } else if (error.status === 403) {
      errorMessage = 'Access denied. Insufficient permissions.';
    } else if (error.status >= 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    // Log error for debugging (only in development)
    if (!environment.production) {
      console.group('🚨 API Error Details');
      console.error('Status Code:', statusCode);
      console.error('Error Object:', error);
      console.error('Parsed Message:', errorMessage);
      console.groupEnd();
    }

    // Create standardized error object
    const apiError: ApiError = {
      statusMsg: 'fail',
      message: errorMessage
    };

    return throwError(() => apiError);
  }

  // Authentication methods removed - now handled by AuthService and authHeaderInterceptor
  // This keeps the API service focused on HTTP operations only

  /**
   * Build query parameters for collection endpoints
   */
  buildCollectionParams(params: CollectionQueryParams): any {
    const queryParams: any = {};
    
    if (params.limit) queryParams.limit = params.limit;
    if (params.page) queryParams.page = params.page;
    if (params.sort) queryParams.sort = params.sort;
    if (params.keyword) queryParams.keyword = params.keyword;
    if (params.fields) queryParams.fields = params.fields;
    
    return queryParams;
  }

  /**
   * Build URL with parameters
   */
  buildUrl(endpoint: string, params?: { [key: string]: string | number }): string {
    let url = `${this.baseUrl}${endpoint}`;
    
    if (params) {
      Object.keys(params).forEach(key => {
        url = url.replace(`{${key}}`, params[key].toString());
      });
    }
    
    return url;
  }
}
