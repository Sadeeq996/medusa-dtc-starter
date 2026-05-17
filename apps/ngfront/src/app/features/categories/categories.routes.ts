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
    title: 'Categories - FreshCart',
    data: { 
      description: 'Browse all categories on FreshCart',
      keywords: 'categories, shopping categories, product categories, FreshCart' 
    }
  },
  {
    path: ':slug',
    loadComponent: () => import('./components/category-details/category-details').then(m => m.CategoryDetailsComponent),
    title: 'Category Details - FreshCart',
    data: { 
      description: 'View category details and products',
      keywords: 'category details, products by category, FreshCart' 
    }
  }
];
