/**
 * Error Handling Utilities
 * Shared error extraction and formatting functions to eliminate duplication
 */

/**
 * Extract user-friendly error message from API error response
 * Consolidates duplicated extractErrorMessage() from cart.service and checkout.service
 */
export function extractErrorMessage(error: any): string {
  // Handle different error response formats
  if (error?.error?.message) {
    return error.error.message;
  }
  
  if (error?.message) {
    return error.message;
  }
  
  if (typeof error?.error === 'string') {
    return error.error;
  }

  // Handle specific HTTP status codes
  if (error?.status === 400) {
    return 'Invalid request. Please check your information and try again.';
  }
  
  if (error?.status === 401) {
    return 'Authentication required. Please log in and try again.';
  }
  
  if (error?.status === 404) {
    return 'Resource not found. Please refresh the page and try again.';
  }
  
  if (error?.status >= 500) {
    return 'Server error. Please try again later.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return error?.status === 0 || error?.message?.includes('network');
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error?.status === 401 || error?.status === 403;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: any): boolean {
  return error?.status === 400 || error?.status === 422;
}

/**
 * Format error for logging
 */
export function formatErrorForLog(error: any): string {
  const timestamp = new Date().toISOString();
  const status = error?.status || 'N/A';
  const message = extractErrorMessage(error);
  const url = error?.url || 'N/A';
  
  return `[${timestamp}] Error ${status}: ${message} (URL: ${url})`;
}
