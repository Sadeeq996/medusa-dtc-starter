import { Injectable } from '@angular/core';
import { STORAGE_KEYS } from '../constants/api-endpoints.const';
import { User } from '../models/user.model';
import { getUserIdFromToken } from '../../shared/utils/jwt.utils';

/**
 * Storage Service
 * Handles localStorage and sessionStorage operations for FreshCart
 * Based on real API testing and authentication requirements
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /**
   * Generic method to set item in localStorage
   */
  setItem(key: string, value: any): void {
    try {
      const serializedValue = JSON.stringify(value);
      localStorage.setItem(key, serializedValue);
    } catch (error) {
      console.error('Error storing item in localStorage:', error);
    }
  }

  /**
   * Generic method to get item from localStorage
   */
  getItem<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error retrieving item from localStorage:', error);
      return null;
    }
  }

  /**
   * Generic method to remove item from localStorage
   */
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  }

  /**
   * Clear all items from localStorage
   */
  clearAll(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  }

  // ===== JWT Token Management =====

  /**
   * Store JWT token
   * Based on real API testing: tokens are long-lived (~90 days)
   */
  setToken(token: string): void {
    this.setItem(STORAGE_KEYS.JWT_TOKEN, token);
  }

  /**
   * Retrieve JWT token
   */
  getToken(): string | null {
    return this.getItem<string>(STORAGE_KEYS.JWT_TOKEN);
  }

  /**
   * Remove JWT token (logout)
   */
  removeToken(): void {
    this.removeItem(STORAGE_KEYS.JWT_TOKEN);
  }

  /**
   * Check if user has valid token
   */
  hasToken(): boolean {
    return !!this.getToken();
  }

  // ===== User Data Management =====

  /**
   * Store user data
   * Based on real API response: { name, email, role }
   */
  setUserData(user: User): void {
    this.setItem(STORAGE_KEYS.USER_DATA, user);
  }

  /**
   * Retrieve user data
   */
  getUserData(): User | null {
    return this.getItem<User>(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Remove user data (logout)
   */
  removeUserData(): void {
    this.removeItem(STORAGE_KEYS.USER_DATA);
  }

  // ===== Application Preferences =====

  /**
   * Store language preference
   */
  setLanguage(language: string): void {
    this.setItem(STORAGE_KEYS.LANGUAGE, language);
  }

  /**
   * Get language preference
   */
  getLanguage(): string | null {
    return this.getItem<string>(STORAGE_KEYS.LANGUAGE);
  }

  /**
   * Store theme preference
   */
  setTheme(theme: string): void {
    this.setItem(STORAGE_KEYS.THEME, theme);
  }

  /**
   * Get theme preference
   */
  getTheme(): string | null {
    return this.getItem<string>(STORAGE_KEYS.THEME);
  }

  // ===== Guest Cart Management =====

  /**
   * Store cart data for guest users
   * Synced with server cart upon login
   */
  setCartData<T = unknown>(cartData: T): void {
    this.setItem(STORAGE_KEYS.CART_DATA, cartData);
  }

  /**
   * Get cart data for guest users
   */
  getCartData<T = unknown>(): T | null {
    return this.getItem<T>(STORAGE_KEYS.CART_DATA);
  }

  /**
   * Remove cart data (after login sync or manual clear)
   */
  removeCartData(): void {
    this.removeItem(STORAGE_KEYS.CART_DATA);
  }

  // ===== Session Management =====

  /**
   * Complete logout - remove all user-related data
   */
  logout(): void {
    this.removeToken();
    this.removeUserData();
    this.removeCartData();
    // Keep language and theme preferences
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.hasToken() && !!this.getUserData();
  }

  /**
   * Get current user ID by decoding the JWT token
   * ⚠️ IMPORTANT: User ID is NOT in the API response user data
   * It MUST be extracted from the JWT token payload
   */
  getCurrentUserId(): string | null {
    const token = this.getToken();
    
    if (!token) {
      return null;
    }
    
    // Always decode JWT token to extract user ID
    return getUserIdFromToken(token);
  }

  /**
   * Get current user name from stored user data
   */
  getCurrentUserName(): string | null {
    const userData = this.getUserData();
    return userData?.name || null;
  }

  /**
   * Get current user role from stored user data
   */
  getCurrentUserRole(): string | null {
    const userData = this.getUserData();
    return userData?.role || null;
  }
}
