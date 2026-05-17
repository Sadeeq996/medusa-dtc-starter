import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Form Validation Utilities for FreshCart
 * Centralized validation logic following Angular best practices
 * 
 * NOTE: Checkout-specific validators (phone, address, city) are in checkout.validators.ts
 */

/**
 * Validation patterns
 */
export const VALIDATION_PATTERNS = {
  // Egyptian phone number: 11 digits starting with 01
  EGYPTIAN_PHONE: /^01[0125][0-9]{8}$/,
  // Strong password: min 8 chars, uppercase, lowercase, number, special char
  STRONG_PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/,
  // Email pattern (basic)
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
} as const;

/**
 * Validation error messages
 */
export const VALIDATION_MESSAGES = {
  required: 'This field is required',
  minlength: (min: number) => `Minimum ${min} characters required`,
  maxlength: (max: number) => `Maximum ${max} characters allowed`,
  pattern: 'Invalid format',
  email: 'Please enter a valid email address',
  egyptianPhone: 'Please enter a valid Egyptian phone number (11 digits starting with 01)',
  strongPassword: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  passwordMismatch: 'Passwords do not match'
} as const;

/**
 * Password match validator for form groups
 * Validates that password and rePassword fields match
 */
export function passwordMatchValidator(passwordField: string = 'password', confirmField: string = 'rePassword'): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const password = control.get(passwordField);
    const confirmPassword = control.get(confirmField);
    
    if (!password || !confirmPassword) {
      return null;
    }
    
    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    // Clear the error if passwords match
    if (confirmPassword.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    
    return null;
  };
}

/**
 * Egyptian phone number validator
 */
export function egyptianPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const cleaned = control.value.toString().replace(/\s/g, '');
    const isValid = VALIDATION_PATTERNS.EGYPTIAN_PHONE.test(cleaned);
    
    return isValid ? null : { egyptianPhone: true };
  };
}

/**
 * Strong password validator
 */
export function strongPasswordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const isValid = VALIDATION_PATTERNS.STRONG_PASSWORD.test(control.value);
    
    return isValid ? null : { strongPassword: true };
  };
}

/**
 * Get validation error message for a form control
 * For checkout-specific errors, use getCheckoutValidationError from checkout.validators.ts
 */
export function getValidationError(control: AbstractControl): string | null {
  if (!control.errors || !control.touched) return null;
  
  const errors = control.errors;
  
  if (errors['required']) return VALIDATION_MESSAGES.required;
  if (errors['email']) return VALIDATION_MESSAGES.email;
  if (errors['egyptianPhone']) return VALIDATION_MESSAGES.egyptianPhone;
  if (errors['strongPassword']) return VALIDATION_MESSAGES.strongPassword;
  if (errors['passwordMismatch']) return VALIDATION_MESSAGES.passwordMismatch;
  if (errors['minlength']) return VALIDATION_MESSAGES.minlength(errors['minlength'].requiredLength);
  if (errors['maxlength']) return VALIDATION_MESSAGES.maxlength(errors['maxlength'].requiredLength);
  if (errors['pattern']) return VALIDATION_MESSAGES.pattern;
  
  // Return first error message if no specific match
  return 'Invalid input';
}

/**
 * Check if form control is invalid and touched/dirty
 */
export function isFieldInvalid(control: AbstractControl | null): boolean {
  return !!(control && control.invalid && (control.dirty || control.touched));
}

/**
 * Mark all form controls as touched for validation display
 */
export function markAllFieldsAsTouched(form: any): void {
  Object.keys(form.controls).forEach(key => {
    const control = form.get(key);
    if (control) {
      control.markAsTouched();
      // Handle nested form groups
      if (control.controls) {
        markAllFieldsAsTouched(control);
      }
    }
  });
}
