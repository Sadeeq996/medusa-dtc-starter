import { Injectable, inject } from '@angular/core';
import { Observable, BehaviorSubject, tap, catchError } from 'rxjs';
import { Router } from '@angular/router';

import { ApiService } from '../../../core/services/api';
import { StorageService } from '../../../core/services/storage';
import { AUTH_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import {
  LoginCredentials,
  RegisterRequest,
  User,
  PasswordResetRequest,
  ResetCodeVerification,
  PasswordReset,
  ChangePasswordRequest,
  UpdateProfileRequest
} from '../../../core/models/user.model';
import { AuthResponse } from '../../../core/models/api-response.model';

/**
 * Authentication Service
 * Handles user authentication, registration, and session management
 * Based on real API testing with Route E-commerce backend
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);
  private readonly router = inject(Router);

  // Authentication state management
  private readonly _currentUser = new BehaviorSubject<User | null>(null);
  public readonly currentUser$ = this._currentUser.asObservable();

  private readonly _isAuthenticated = new BehaviorSubject<boolean>(false);
  public readonly isAuthenticated$ = this._isAuthenticated.asObservable();

  constructor() {
    this.initializeAuthState();
  }

  /**
   * Initialize authentication state from storage
   */
  private initializeAuthState(): void {
    const userData = this.storage.getUserData();
    const isAuth = this.storage.isAuthenticated();
    
    if (userData && isAuth) {
      this._currentUser.next(userData);
      this._isAuthenticated.next(true);
    }
  }

  // ===== REGISTRATION =====

  /**
   * Register new user
   * API: POST /auth/signup
   */
  register(registerData: RegisterRequest): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(AUTH_ENDPOINTS.SIGNUP, registerData, { requiresAuth: false })
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Registration failed:', error);
          throw error;
        })
      );
  }

  // ===== LOGIN =====

  /**
   * Login user
   * API: POST /auth/signin
   */
  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.api.post<AuthResponse>(AUTH_ENDPOINTS.SIGNIN, credentials, { requiresAuth: false })
      .pipe(
        tap(response => this.handleAuthSuccess(response)),
        catchError(error => {
          console.error('Login failed:', error);
          throw error;
        })
      );
  }

  // ===== LOGOUT =====

  /**
   * Logout user
   * Clears local storage and resets state
   */
  logout(): void {
    this.storage.logout();
    this._currentUser.next(null);
    this._isAuthenticated.next(false);
    
    // Redirect to home page
    this.router.navigate(['/']);
  }

  // ===== PASSWORD RECOVERY =====

  /**
   * Send password reset email
   * API: POST /auth/forgotPasswords
   */
  forgotPassword(email: PasswordResetRequest): Observable<any> {
    return this.api.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, email, { requiresAuth: false });
  }

  /**
   * Verify reset code
   * API: POST /auth/verifyResetCode
   */
  verifyResetCode(resetCode: ResetCodeVerification): Observable<any> {
    return this.api.post(AUTH_ENDPOINTS.VERIFY_RESET_CODE, resetCode, { requiresAuth: false });
  }

  /**
   * Reset password
   * API: PUT /auth/resetPassword
   */
  resetPassword(passwordData: PasswordReset): Observable<AuthResponse> {
    return this.api.put<AuthResponse>(AUTH_ENDPOINTS.RESET_PASSWORD, passwordData, { requiresAuth: false })
      .pipe(
        tap(response => this.handleAuthSuccess(response))
      );
  }

  // ===== PROFILE MANAGEMENT =====

  /**
   * Change user password
   * API: PUT /users/changeMyPassword
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<AuthResponse> {
    return this.api.put<AuthResponse>('/users/changeMyPassword', passwordData)
      .pipe(
        tap(response => {
          // Update token after password change
          this.storage.setToken(response.token);
        })
      );
  }

  /**
   * Update user profile
   * API: PUT /users/updateMe
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<{ message: string; user: User }> {
    return this.api.put<{ message: string; user: User }>('/users/updateMe', profileData)
      .pipe(
        tap(response => {
          // Update stored user data
          this.storage.setUserData(response.user);
          this._currentUser.next(response.user);
        })
      );
  }

  /**
   * Verify token validity
   * API: GET /auth/verifyToken
   */
  verifyToken(): Observable<{ message: string; user: User }> {
    return this.api.get<{ message: string; user: User }>(AUTH_ENDPOINTS.VERIFY_TOKEN);
  }

  // ===== UTILITY METHODS =====

  /**
   * Handle successful authentication response
   */
  private handleAuthSuccess(response: AuthResponse): void {
    // Store token and user data
    this.storage.setToken(response.token);
    
    // Create user object with available data from response
    const userData: User = {
      name: response.user.name,
      email: response.user.email,
      role: response.user.role as 'user' | 'admin'
      // Note: _id and phone are not provided in auth response
      // They will be available when fetching full user profile
    };
    
    this.storage.setUserData(userData);

    // Update reactive state
    this._currentUser.next(userData);
    this._isAuthenticated.next(true);
  }

  /**
   * Check if user is authenticated (synchronous)
   */
  isAuthenticated(): boolean {
    return this.storage.isAuthenticated();
  }

  /**
   * Get current user data (synchronous)
   */
  getCurrentUser(): User | null {
    return this.storage.getUserData();
  }

  /**
   * Get current user ID
   */
  getCurrentUserId(): string | null {
    return this.storage.getCurrentUserId();
  }

  /**
   * Get current user name
   */
  getCurrentUserName(): string | null {
    return this.storage.getCurrentUserName();
  }

  /**
   * Get current user role
   */
  getCurrentUserRole(): string | null {
    return this.storage.getCurrentUserRole();
  }

  /**
   * Navigate to login page with return URL
   */
  navigateToLogin(returnUrl?: string): void {
    const queryParams = returnUrl ? { returnUrl } : {};
    this.router.navigate(['/auth/login'], { queryParams });
  }

  /**
   * Navigate to register page
   */
  navigateToRegister(): void {
    this.router.navigate(['/auth/register']);
  }

  /**
   * Handle authentication redirects after login/register
   */
  handleAuthRedirect(returnUrl?: string): void {
    if (returnUrl && returnUrl !== '/') {
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/']);
    }
  }
}
