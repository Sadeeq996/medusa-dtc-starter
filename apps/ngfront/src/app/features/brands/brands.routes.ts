import { Routes } from '@angular/router';

/**
 * Brands Feature Routes - Pure Brands Domain
 * Handles only brand-related routes
 * Following the exact same pattern as categories.routes.ts
 */
export const brandsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/brand-list/brand-list').then(m => m.BrandListComponent),
    title: 'Brands - Sellpadi',
    data: {
      description: 'Browse all brands on Sellpadi',
      keywords: 'brands, shopping brands, product brands, Sellpadi'
    }
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/brand-details/brand-details').then(m => m.BrandDetailsComponent),
    title: 'Brand Details - Sellpadi',
    data: {
      description: 'View brand details and products',
      keywords: 'brand details, products by brand, Sellpadi'
    }
  }
];
