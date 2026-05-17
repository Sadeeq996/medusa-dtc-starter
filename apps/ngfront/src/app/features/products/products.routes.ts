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
    title: 'Products - FreshCart',
    data: { 
      description: 'Browse all products on FreshCart',
      keywords: 'products, shopping, e-commerce, FreshCart' 
    }
  },
  {
    path: 'search',
    loadComponent: () => import('./components/product-search/product-search').then(m => m.ProductSearchComponent),
    title: 'Search Products - FreshCart',
    data: { 
      description: 'Search for products on FreshCart',
      keywords: 'search, find products, product search, FreshCart' 
    }
  },
  {
    path: ':id',
    loadComponent: () => import('./components/product-details/product-details').then(m => m.ProductDetailsComponent),
    title: 'Product Details - FreshCart',
    data: { 
      description: 'View product details and specifications',
      keywords: 'product details, specifications, buy product, FreshCart' 
    }
  }
];
