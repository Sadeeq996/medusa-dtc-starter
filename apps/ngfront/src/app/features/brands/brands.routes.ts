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
    title: 'Brands - FreshCart',
    data: { 
      description: 'Browse all brands on FreshCart',
      keywords: 'brands, shopping brands, product brands, FreshCart' 
    }
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/brand-details/brand-details').then(m => m.BrandDetailsComponent),
    title: 'Brand Details - FreshCart',
    data: { 
      description: 'View brand details and products',
      keywords: 'brand details, products by brand, FreshCart' 
    }
  }
];
