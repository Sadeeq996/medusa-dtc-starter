import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { StorageService } from '../services/storage';
import { HEADERS } from '../constants/api-endpoints.const';

/**
 * Authentication Header Interceptor
 * Automatically adds authentication token to all API requests
 * Based on Route E-commerce API requirements (custom 'token' header)
 */
export const authHeaderInterceptor: HttpInterceptorFn = (req, next) => {
  const storage = inject(StorageService);

  // Skip authentication for auth endpoints (login, register, forgot-password)
  const authEndpoints = ['/auth/signin', '/auth/signup', '/auth/forgotPasswords', '/auth/verifyResetCode', '/auth/resetPassword'];
  const isAuthEndpoint = authEndpoints.some(endpoint => req.url.includes(endpoint));

  // Skip authentication if this is an auth endpoint
  if (isAuthEndpoint) {
    return next(req);
  }

  // Get token from storage
  const token = storage.getToken();
  
  // Add token header if user is authenticated
  if (token) {
    const authReq = req.clone({
      setHeaders: {
        [HEADERS.TOKEN]: token
      }
    });
    return next(authReq);
  }

  // Continue without token if not authenticated
  return next(req);
};
