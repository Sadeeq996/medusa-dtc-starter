import { Routes } from '@angular/router';
import { guestGuard } from '../../core/guards/guest-guard';

/**
 * Authentication Routes
 * Handles all authentication-related routes
 * Protected by guestGuard to prevent authenticated users from accessing auth pages
 */
export const authRoutes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login').then(m => m.LoginComponent),
    canActivate: [guestGuard],
    title: 'Login - FreshCart',
    data: { 
      description: 'Sign in to your FreshCart account',
      keywords: 'login, sign in, authentication, FreshCart' 
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Register - FreshCart',
    data: { 
      description: 'Create a new FreshCart account',
      keywords: 'register, sign up, create account, FreshCart' 
    }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
    title: 'Forgot Password - FreshCart',
    data: { 
      description: 'Reset your FreshCart password',
      keywords: 'forgot password, reset password, FreshCart' 
    }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard],
    title: 'Reset Password - FreshCart',
    data: { 
      description: 'Set a new password for your FreshCart account',
      keywords: 'reset password, new password, FreshCart' 
    }
  }
];
