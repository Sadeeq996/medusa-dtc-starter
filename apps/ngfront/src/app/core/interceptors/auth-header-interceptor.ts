import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage';
import { HEADERS } from '../constants/api-endpoints.const';

/**
 * Authentication Header Interceptor
 * Automatically adds authentication token to all API requests
 * Uses standard Authorization Bearer tokens for Medusa store routes
 */
export const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);

  // Skip authentication for auth endpoints (login, register, forgot-password)
  const authEndpoints = ['/auth', '/customers', '/customers/password-reset', '/customers/password-reset/verify'];
  const isAuthEndpoint = authEndpoints.some(endpoint => req.url.includes(endpoint));

  // Skip authentication if this is an auth endpoint
  if (isAuthEndpoint) {
    return next(req);
  }

  // Get token from storage
  const token = storage.getToken();

  // Add Authorization header if user is authenticated
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        [HEADERS.AUTHORIZATION]: `Bearer ${token}`
      },
      withCredentials: true
    });
    return next(authReq);
  }

  // Continue without token if not authenticated
  return next(req);
};
