import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

// Translation
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../services/auth';
import { RegisterRequest } from '../../../../core/models/user.model';
import { 
  passwordMatchValidator, 
  egyptianPhoneValidator, 
  strongPasswordValidator 
} from '../../../../shared/validators/form-validation.util';

/**
 * Register Component
 * User registration form with validation
 * Based on FreshCart BRD requirements and API specifications
 */
@Component({
  selector: 'app-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG Components
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    MessageModule,
    ProgressSpinnerModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './register.html'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Reactive state
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  // Form setup
  readonly registerForm: FormGroup;

  // Computed properties
  readonly formValid = computed(() => this.registerForm?.valid ?? false);

  constructor() {
    this.registerForm = this.createForm();
  }

  /**
   * Create reactive form with validation using shared validators
   */
  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50)
      ]],
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      phone: ['', [
        Validators.required,
        egyptianPhoneValidator()
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        strongPasswordValidator()
      ]],
      rePassword: ['', [
        Validators.required
      ]]
    }, { 
      validators: passwordMatchValidator()
    });
  }

  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const registerData: RegisterRequest = {
      name: this.registerForm.value.name.trim(),
      email: this.registerForm.value.email.trim().toLowerCase(),
      phone: this.registerForm.value.phone.trim(),
      password: this.registerForm.value.password,
      rePassword: this.registerForm.value.rePassword
    };

    this.authService.register(registerData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Account created successfully! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          this.authService.handleAuthRedirect(returnUrl);
        }, 1500);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.message || 'Registration failed. Please try again.'
        );
        console.error('Registration error:', error);
      }
    });
  }

  /**
   * Mark all form fields as touched for validation display
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      this.registerForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Navigate to login page
   */
  navigateToLogin(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const queryParams = returnUrl ? { returnUrl } : {};
    this.router.navigate(['/auth/login'], { queryParams });
  }
}
