// User Models - Based on Real API Testing
// Updated: 2025-01-27 with actual API response formats

/**
 * User Interface
 * Based on real authentication response structure
 * 
 * ⚠️ IMPORTANT: The _id field is NOT returned by the API in auth responses
 * User ID must be extracted from the JWT token payload, not from this object
 */
export interface User {
  _id?: string;                       // User ID - NOT in API response, decode JWT token instead!
  name: string;                       // Full name
  email: string;                      // Email address
  phone?: string;                     // Phone number (optional in some responses)
  role: 'user' | 'admin';            // User role
  createdAt?: string;                 // Creation timestamp
  updatedAt?: string;                 // Last update timestamp
}

/**
 * Login Credentials Interface
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration Request Interface
 * Based on real API testing: POST /api/v1/auth/signup
 */
export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  rePassword: string;                 // Password confirmation
  phone: string;
}

/**
 * Password Reset Request Interface
 */
export interface PasswordResetRequest {
  email: string;
}

/**
 * Reset Code Verification Interface
 */
export interface ResetCodeVerification {
  resetCode: string;                  // 6-digit code from email
}

/**
 * Password Reset Interface
 */
export interface PasswordReset {
  email: string;
  newPassword: string;
}

/**
 * Change Password Request Interface
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  password: string;
  rePassword: string;
}

/**
 * Update Profile Request Interface
 */
export interface UpdateProfileRequest {
  name: string;
  email: string;
  phone: string;
}
