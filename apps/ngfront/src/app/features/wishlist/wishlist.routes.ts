import { Routes } from '@angular/router';

export const wishlistRoutes: Routes = [
  // Wishlist main page - Show all wishlist items
  {
    path: '',
    loadComponent: () => import('./components/wishlist-page/wishlist-page').then(c => c.WishlistPage),
    title: 'Wishlist - FreshCart'
  }
];

