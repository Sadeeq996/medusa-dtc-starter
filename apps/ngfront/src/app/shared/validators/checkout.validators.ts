import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Checkout-specific validators for FreshCart
 * Contains validators specifically for checkout forms and cart operations
 */

/**
 * Egyptian cities list for validation
 */
export const EGYPTIAN_CITIES = [
  'Cairo', 'Alexandria', 'Giza', 'Luxor', 'Aswan', 'Port Said', 'Suez',
  'Mansoura', 'Tanta', 'Zagazig', 'Ismailia', 'Fayyum', 'Beni Suef',
  'Minya', 'Assiut', 'Sohag', 'Qena', 'Hurghada', 'Sharm El Sheikh', 'Marsa Alam'
];

/**
 * Shipping address configuration
 */
export const SHIPPING_ADDRESS_CONFIG = {
  MIN_LENGTH: 10,
  MAX_LENGTH: 500,
  PHONE_PATTERN: /^01[0125][0-9]{8}$/
} as const;

/**
 * Validator for Egyptian cities
 */
export function egyptianCityValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const isValid = EGYPTIAN_CITIES.includes(control.value);
    return isValid ? null : { invalidCity: { value: control.value } };
  };
}

/**
 * Comprehensive shipping address validator
 */
export function shippingAddressDetailsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const trimmed = control.value.trim();
    const errors: ValidationErrors = {};
    
    if (trimmed.length < SHIPPING_ADDRESS_CONFIG.MIN_LENGTH) {
      errors['minAddressLength'] = {
        actualLength: trimmed.length,
        requiredLength: SHIPPING_ADDRESS_CONFIG.MIN_LENGTH
      };
    }
    
    if (trimmed.length > SHIPPING_ADDRESS_CONFIG.MAX_LENGTH) {
      errors['maxAddressLength'] = {
        actualLength: trimmed.length,
        maxLength: SHIPPING_ADDRESS_CONFIG.MAX_LENGTH
      };
    }
    
    // Check for meaningful content (not just spaces or repeated characters)
    if (trimmed && !/^(?!(.)\1{9,}).*$/.test(trimmed)) {
      errors['meaninglessAddress'] = { value: trimmed };
    }
    
    return Object.keys(errors).length > 0 ? errors : null;
  };
}

/**
 * Egyptian phone number validator
 */
export function egyptianPhoneNumberValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    
    const cleaned = control.value.toString().replace(/\s/g, '');
    const isValid = SHIPPING_ADDRESS_CONFIG.PHONE_PATTERN.test(cleaned);
    
    return isValid ? null : { 
      invalidEgyptianPhone: { 
        value: control.value,
        pattern: SHIPPING_ADDRESS_CONFIG.PHONE_PATTERN.toString()
      } 
    };
  };
}

/**
 * Checkout form validation error messages
 */
export const CHECKOUT_ERROR_MESSAGES = {
  'required': 'This field is required',
  'minAddressLength': 'Address must be at least 10 characters long',
  'maxAddressLength': 'Address cannot exceed 500 characters',
  'meaninglessAddress': 'Please provide a meaningful address',
  'invalidEgyptianPhone': 'Please enter a valid Egyptian phone number (11 digits starting with 01)',
  'invalidCity': 'Please select a valid Egyptian city'
} as const;

/**
 * Get checkout-specific validation error message
 */
export function getCheckoutValidationError(control: AbstractControl): string | null {
  if (!control.errors || !control.touched) return null;
  
  // Return the first error message found
  for (const errorKey in control.errors) {
    if (errorKey in CHECKOUT_ERROR_MESSAGES) {
      return CHECKOUT_ERROR_MESSAGES[errorKey as keyof typeof CHECKOUT_ERROR_MESSAGES];
    }
  }
  
  return 'Invalid input';
}

/**
 * Validate complete shipping address object
 */
export interface ShippingAddressValidation {
  valid: boolean;
  errors: {
    details?: string[];
    phone?: string[];
    city?: string[];
  };
}

/**
 * Comprehensive shipping address validation
 */
export function validateShippingAddress(address: {
  details?: string;
  phone?: string;
  city?: string;
}): ShippingAddressValidation {
  const errors: ShippingAddressValidation['errors'] = {};
  
  // Validate details
  if (!address.details?.trim()) {
    errors.details = ['Address details are required'];
  } else {
    const detailsErrors: string[] = [];
    const trimmed = address.details.trim();
    
    if (trimmed.length < SHIPPING_ADDRESS_CONFIG.MIN_LENGTH) {
      detailsErrors.push(`Address must be at least ${SHIPPING_ADDRESS_CONFIG.MIN_LENGTH} characters`);
    }
    
    if (trimmed.length > SHIPPING_ADDRESS_CONFIG.MAX_LENGTH) {
      detailsErrors.push(`Address cannot exceed ${SHIPPING_ADDRESS_CONFIG.MAX_LENGTH} characters`);
    }
    
    if (detailsErrors.length > 0) {
      errors.details = detailsErrors;
    }
  }
  
  // Validate phone
  if (!address.phone?.trim()) {
    errors.phone = ['Phone number is required'];
  } else if (!SHIPPING_ADDRESS_CONFIG.PHONE_PATTERN.test(address.phone.trim())) {
    errors.phone = ['Please enter a valid Egyptian phone number (11 digits starting with 01)'];
  }
  
  // Validate city
  if (!address.city?.trim()) {
    errors.city = ['City is required'];
  } else if (!EGYPTIAN_CITIES.includes(address.city)) {
    errors.city = ['Please select a valid Egyptian city'];
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}
