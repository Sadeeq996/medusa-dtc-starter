import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';

export const cartRoutes: Routes = [
  // Cart main page - Show cart items
  {
    path: '',
    loadComponent: () => import('./components/cart-page/cart-page').then(c => c.CartPage),
    title: 'Shopping Cart - FreshCart'
  },
  // Cart checkout page - Requires authentication
  {
    path: 'checkout',
    loadComponent: () => import('./components/checkout-page/checkout-page').then(c => c.CheckoutPage),
    canActivate: [authGuard], // Require authentication for checkout
    title: 'Checkout - FreshCart'
  },
  // Checkout success page - Order confirmation
  {
    path: 'success',
    loadComponent: () => import('./components/checkout-success/checkout-success').then(c => c.CheckoutSuccessPage),
    canActivate: [authGuard], // Require authentication to view success page
    title: 'Order Confirmed - FreshCart'
  },
  // ⚠️ TEMPORARY: Handle Stripe redirect to /cart/success/allorders
  {
    path: 'success/allorders',
    redirectTo: 'success',
    pathMatch: 'full'
  },
  // Checkout failure page - Payment failed
  {
    path: 'failure',
    loadComponent: () => import('./components/checkout-failure/checkout-failure').then(c => c.CheckoutFailurePage),
    canActivate: [authGuard], // Require authentication to view failure page
    title: 'Payment Failed - FreshCart'
  }
];
