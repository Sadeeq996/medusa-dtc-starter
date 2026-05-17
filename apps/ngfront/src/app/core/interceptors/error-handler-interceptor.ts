import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Error Handler Interceptor
 * 
 * NOTE: This interceptor is intentionally minimal.
 * Error handling is done at the ApiService level and in individual components.
 * 
 * ApiService handles:
 * - HTTP error parsing and standardization
 * - Network/timeout error messages
 * - API error format parsing ({ statusMsg: "fail", message: "..." })
 * 
 * Components handle:
 * - User-friendly error displays
 * - Retry mechanisms
 * - Context-specific error actions
 * 
 * This approach provides better control and user experience than global error handling.
 */
export const errorHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
