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
import { CheckboxModule } from 'primeng/checkbox';

// Translation
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../services/auth';
import { LoginCredentials } from '../../../../core/models/user.model';

/**
 * Login Component
 * User login form with validation
 * Based on FreshCart BRD requirements and API specifications
 */
@Component({
  selector: 'app-login',
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
    CheckboxModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './login.html'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Reactive state
  readonly isLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  // Form setup
  readonly loginForm: FormGroup;

  // Computed properties
  readonly formValid = computed(() => this.loginForm?.valid ?? false);

  constructor() {
    this.loginForm = this.createForm();
  }

  /**
   * Create reactive form with validation
   */
  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [
        Validators.required,
        Validators.email
      ]],
      password: ['', [
        Validators.required
      ]],
      rememberMe: [false]
    });
  }

  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const credentials: LoginCredentials = {
      email: this.loginForm.value.email.trim().toLowerCase(),
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.successMessage.set('Login successful! Redirecting...');
        
        // Redirect after short delay
        setTimeout(() => {
          const returnUrl = this.route.snapshot.queryParams['returnUrl'];
          this.authService.handleAuthRedirect(returnUrl);
        }, 1000);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          error?.message || 'Login failed. Please try again.'
        );
        console.error('Login error:', error);
      }
    });
  }

  /**
   * Mark all form fields as touched for validation display
   */
  private markAllFieldsAsTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      this.loginForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Navigate to register page
   */
  navigateToRegister(): void {
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    const queryParams = returnUrl ? { returnUrl } : {};
    this.router.navigate(['/auth/register'], { queryParams });
  }

  /**
   * Navigate to forgot password page
   */
  navigateToForgotPassword(): void {
    this.router.navigate(['/auth/forgot-password']);
  }
}
