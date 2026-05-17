import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default route - Home feature
  {
    path: '',
    loadChildren: () => import('./features/home/home.routes').then(m => m.homeRoutes)
  },
  // Authentication routes
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.routes').then(m => m.authRoutes)
  },
  // Products feature routes - Pure Products Domain
  {
    path: 'products',
    loadChildren: () => import('./features/products/products.routes').then(m => m.productsRoutes)
  },
  // Categories feature routes - Pure Categories Domain
  {
    path: 'categories',
    loadChildren: () => import('./features/categories/categories.routes').then(m => m.categoriesRoutes)
  },
  // Brands feature routes - Pure Brands Domain
  {
    path: 'brands',
    loadChildren: () => import('./features/brands/brands.routes').then(m => m.brandsRoutes)
  },
  // Wishlist feature routes - User Wishlist
  {
    path: 'wishlist',
    loadChildren: () => import('./features/wishlist/wishlist.routes').then(m => m.wishlistRoutes)
  },
  // Cart feature routes - Shopping Cart
  {
    path: 'cart',
    loadChildren: () => import('./features/cart/cart.routes').then(m => m.cartRoutes)
  },
  // Profile feature routes - User Profile, Orders, Addresses, Settings
  {
    path: 'profile',
    loadChildren: () => import('./features/profile/profile.routes').then(m => m.PROFILE_ROUTES)
  },
  // ⚠️ TEMPORARY: Handle backend's hardcoded Stripe return URLs
  // Backend redirects to these URLs after Stripe payment
  {
    path: 'allorders',
    redirectTo: '/cart/success',  // Redirect to our Angular success page
    pathMatch: 'full'
  },
  // Redirect any unknown routes to home
  {
    path: '**',
    redirectTo: ''
  }
];
