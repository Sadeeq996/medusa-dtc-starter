import { HttpInterceptorFn } from '@angular/common/http';

/**
 * Loading Interceptor
 * 
 * NOTE: This interceptor is intentionally minimal.
 * We use component-level loading states with skeleton UI instead of global loading spinners.
 * 
 * Benefits of skeleton approach:
 * - Better UX: Non-blocking, contextual loading feedback
 * - Performance: No global state management overhead
 * - Modern: Follows current best practices (Facebook, LinkedIn pattern)
 * 
 * Each component manages its own loading state:
 * - ProductListComponent: skeleton cards
 * - ProductDetailsComponent: skeleton layout
 * - ProductSearchComponent: skeleton grids
 * - FeaturedProducts: skeleton items
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
