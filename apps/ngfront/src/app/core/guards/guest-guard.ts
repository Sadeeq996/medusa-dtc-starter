import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { StorageService } from '../services/storage';

/**
 * Guest Guard
 * Prevents authenticated users from accessing auth pages (login, register)
 * Redirects authenticated users to home page
 */
export const guestGuard: CanActivateFn = (route, state) => {
  const storage = inject(StorageService);
  const router = inject(Router);

  // If user is authenticated, redirect to home
  if (storage.isAuthenticated()) {
    return router.createUrlTree(['/']);
  }

  // Allow guest users to access auth pages
  return true;
};
