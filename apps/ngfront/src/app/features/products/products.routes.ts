import { Routes } from '@angular/router';

/**
 * Products Feature Routes - Pure Products Domain
 * Handles only product-related routes
 * Categories and Brands have their own routing
 */
export const productsRoutes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'list',
    loadComponent: () => import('./components/product-list/product-list').then(m => m.ProductListComponent),
    title: 'Products - Sellpadi',
    data: {
      description: 'Browse all products on Sellpadi',
      keywords: 'products, shopping, e-commerce, Sellpadi'
    }
  },
  {
    path: 'search',
    loadComponent: () => import('./components/product-search/product-search').then(m => m.ProductSearchComponent),
    title: 'Search Products - Sellpadi',
    data: {
      description: 'Search for products on Sellpadi',
      keywords: 'search, find products, product search, Sellpadi'
    }
  },
  {
    path: ':id',
    loadComponent: () => import('./components/product-details/product-details').then(m => m.ProductDetailsComponent),
    title: 'Product Details - Sellpadi',
    data: {
      description: 'View product details and specifications',
      keywords: 'product details, specifications, buy product, Sellpadi'
    }
  }
];
