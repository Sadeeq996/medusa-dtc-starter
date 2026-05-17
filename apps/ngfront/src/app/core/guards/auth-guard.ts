import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage';

/**
 * Auth Guard
 * Protects routes that require authentication
 * Redirects unauthenticated users to login page with returnUrl
 */
export const authGuard: CanActivateFn = (route, state) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  // If user is NOT authenticated, redirect to login with returnUrl
  if (!storage.isAuthenticated()) {
    return router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }

  // Allow authenticated users to access protected routes
  return true;
};
