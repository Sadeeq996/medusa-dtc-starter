import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth-guard';

/**
 * Profile Routes
 * User profile management routes with authentication protection
 */
export const PROFILE_ROUTES: Routes = [
  // Profile Dashboard - Main landing page
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/profile-dashboard/profile-dashboard').then((m) => m.ProfileDashboardPage),
    title: 'My Profile - FreshCart',
    data: {
      description: 'View your profile, orders, and account information',
      keywords: 'profile, account, dashboard, FreshCart'
    }
  },
  // Orders - Order history and details
  {
    path: 'orders',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/orders-page/orders-page').then((m) => m.OrdersPage),
    title: 'My Orders - FreshCart',
    data: {
      description: 'View your order history and track shipments',
      keywords: 'orders, order history, tracking, FreshCart'
    }
  },
  {
    path: 'orders/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/order-details-page/order-details-page').then(
        (m) => m.OrderDetailsPage
      ),
    title: 'Order Details - FreshCart',
    data: {
      description: 'View detailed information about your order',
      keywords: 'order details, order tracking, FreshCart'
    }
  },
  // Addresses - Address management
  {
    path: 'addresses',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/addresses-page/addresses-page').then(
        (m) => m.AddressesPage
      ),
    title: 'My Addresses - FreshCart',
    data: {
      description: 'Manage your shipping and billing addresses',
      keywords: 'addresses, shipping address, billing address, FreshCart'
    }
  },
  // Settings - Account settings and profile editing
  {
    path: 'settings',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./components/settings-page/settings-page').then((m) => m.SettingsPage),
    title: 'Account Settings - FreshCart',
    data: {
      description: 'Update your account information and password',
      keywords: 'settings, account settings, profile edit, FreshCart'
    }
  }
];

