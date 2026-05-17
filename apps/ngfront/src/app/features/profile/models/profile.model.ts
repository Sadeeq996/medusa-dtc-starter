// Profile Models - User Profile Management
// Following the same pattern as user.model.ts in core/models
// Updated: 2025-09-30

import { User } from '../../../core/models/user.model';

/**
 * Profile Update Request
 * PUT /api/v1/users/updateMe
 */
export interface UpdateProfileRequest {
  name: string;                         // Full name
  email: string;                        // Email address
  phone: string;                        // Phone number
}

/**
 * Profile Update Response
 * Response from updating profile
 */
export interface UpdateProfileResponse {
  message: string;                      // Success message
  user: User;                           // Updated user data
}

/**
 * Change Password Request  
 * PUT /api/v1/users/changeMyPassword
 */
export interface ChangePasswordRequest {
  currentPassword: string;              // Current password
  password: string;                     // New password
  rePassword: string;                   // Confirm new password
}

/**
 * Change Password Response
 * ⚠️ Returns new token - must update stored token
 */
export interface ChangePasswordResponse {
  message: string;                      // Success message
  token: string;                        // New JWT token
}

