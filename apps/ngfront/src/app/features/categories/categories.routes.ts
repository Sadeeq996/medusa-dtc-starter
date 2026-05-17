import { Routes } from '@angular/router';

/**
 * Categories Feature Routes - Pure Categories Domain
 * Handles only category-related routes
 * Following the exact same pattern as products.routes.ts
 */
export const categoriesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/category-list/category-list').then(m => m.CategoryListComponent),
    title: 'Categories - Sellpadi',
    data: {
      description: 'Browse all categories on Sellpadi',
      keywords: 'categories, shopping categories, product categories, Sellpadi'
    }
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/category-details/category-details').then(m => m.CategoryDetailsComponent),
    title: 'Category Details - Sellpadi',
    data: {
      description: 'View category details and products',
      keywords: 'category details, products by category, Sellpadi'
    }
  }
];
