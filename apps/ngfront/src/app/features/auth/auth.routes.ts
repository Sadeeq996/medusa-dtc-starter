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
    title: 'Login - Sellpadi',
    data: {
      description: 'Sign in to your Medusa account',
      keywords: 'login, sign in, authentication, Sellpadi'
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register').then(m => m.RegisterComponent),
    canActivate: [guestGuard],
    title: 'Register - Sellpadi',
    data: {
      description: 'Create a new Sellpadi account',
      keywords: 'register, sign up, create account, Sellpadi'
    }
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./components/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent),
    canActivate: [guestGuard],
    title: 'Forgot Password - Sellpadi',
    data: {
      description: 'Reset your Sellpadi password',
      keywords: 'forgot password, reset password, Sellpadi'
    }
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./components/reset-password/reset-password').then(m => m.ResetPasswordComponent),
    canActivate: [guestGuard],
    title: 'Reset Password - Sellpadi',
    data: {
      description: 'Set a new password for your Sellpadi account',
      keywords: 'reset password, new password, Sellpadi'
    }
  }
];
