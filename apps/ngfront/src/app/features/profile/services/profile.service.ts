import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api';
import { StorageService } from '../../../core/services/storage';
import { USER_ENDPOINTS } from '../../../core/constants/api-endpoints.const';
import {
  UpdateProfileRequest,
  UpdateProfileResponse,
  ChangePasswordRequest,
  ChangePasswordResponse
} from '../models/profile.model';
import { User } from '../../../core/models/user.model';

/**
 * Profile Service
 * Handles user profile management operations
 * Following the same pattern as AuthService
 */
@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly api = inject(ApiService);
  private readonly storage = inject(StorageService);

  /**
   * Update user profile
   * API: PUT /api/v1/users/updateMe
   * @param profileData - Updated profile data
   * @returns Observable of updated user
   */
  updateProfile(profileData: UpdateProfileRequest): Observable<User> {
    return this.api.put<UpdateProfileResponse>(USER_ENDPOINTS.UPDATE_PROFILE, profileData).pipe(
      tap(response => {
        // Update stored user data
        this.storage.setUserData(response.user);
      }),
      // Extract user from response
      map(response => response.user),
      catchError(error => {
        console.error('Failed to update profile:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Change user password
   * API: PUT /api/v1/users/changeMyPassword
   * ⚠️ CRITICAL: Returns new token - must update stored token
   * @param passwordData - Current and new password
   * @returns Observable of success with new token
   */
  changePassword(passwordData: ChangePasswordRequest): Observable<{ success: boolean; message: string }> {
    return this.api.put<ChangePasswordResponse>(USER_ENDPOINTS.CHANGE_PASSWORD, passwordData).pipe(
      tap(response => {
        // ⚠️ Update stored token with new token from response
        this.storage.setToken(response.token);
      }),
      // Return success result
      map(response => ({
        success: true,
        message: response.message || 'Password changed successfully'
      })),
      catchError(error => {
        console.error('Failed to change password:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get current user data from storage
   * @returns User data or null
   */
  getCurrentUser(): User | null {
    return this.storage.getUserData();
  }
}

