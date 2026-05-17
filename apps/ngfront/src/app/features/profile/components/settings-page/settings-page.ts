import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

// Shared Utilities
import { isFieldInvalid, markAllFieldsAsTouched } from '../../../../shared/validators/form-validation.util';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { DividerModule } from 'primeng/divider';
import { TagModule } from 'primeng/tag';
import { MessageService } from 'primeng/api';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Services
import { ProfileService } from '../../services/profile.service';
import { AuthService } from '../../../auth/services/auth';

// Models
import { User } from '../../../../core/models/user.model';
import { UpdateProfileRequest, ChangePasswordRequest } from '../../models/profile.model';

/**
 * Settings Page Component
 * Manages user profile updates and password changes
 * Following the same pattern as RegisterComponent and LoginComponent
 */
@Component({
  selector: 'app-settings-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Translation
    TranslateModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    DividerModule,
    TagModule
  ],
  templateUrl: './settings-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SettingsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly profileService = inject(ProfileService);
  private readonly authService = inject(AuthService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Component state
  readonly currentUser = signal<User | null>(null);
  readonly isUpdatingProfile = signal(false);
  readonly isChangingPassword = signal(false);
  readonly profileError = signal<string>('');
  readonly passwordError = signal<string>('');

  // Forms
  readonly profileForm: FormGroup;
  readonly passwordForm: FormGroup;

  // Computed properties
  readonly hasProfileChanges = computed(() => {
    const user = this.currentUser();
    if (!user) return false;
    
    const formValue = this.profileForm.value;
    return (
      formValue.name !== user.name ||
      formValue.email !== user.email ||
      formValue.phone !== user.phone
    );
  });

  constructor() {
    this.profileForm = this.createProfileForm();
    this.passwordForm = this.createPasswordForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  /**
   * Create profile update form
   */
  private createProfileForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern('^01[0125][0-9]{8}$')]]
    });
  }

  /**
   * Create password change form
   */
  private createPasswordForm(): FormGroup {
    return this.fb.group({
      currentPassword: ['', [Validators.required]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?]).{8,}$')
      ]],
      rePassword: ['', [Validators.required]]
    });
  }

  /**
   * Load current user data
   */
  private loadCurrentUser(): void {
    const user = this.profileService.getCurrentUser();
    
    if (user) {
      this.currentUser.set(user);
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      });
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User data not found. Please log in again.'
      });
      this.router.navigate(['/auth/login']);
    }
  }

  /**
   * Update user profile
   */
  onSubmitProfileUpdate(): void {
    if (this.profileForm.invalid) {
      markAllFieldsAsTouched(this.profileForm);
      return;
    }

    const profileData: UpdateProfileRequest = {
      name: this.profileForm.value.name.trim(),
      email: this.profileForm.value.email.trim().toLowerCase(),
      phone: this.profileForm.value.phone.trim()
    };

    this.isUpdatingProfile.set(true);
    this.profileError.set('');

    this.profileService.updateProfile(profileData).subscribe({
      next: (updatedUser) => {
        this.isUpdatingProfile.set(false);
        this.currentUser.set(updatedUser);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Profile updated successfully'
        });
      },
      error: (error) => {
        this.isUpdatingProfile.set(false);
        this.profileError.set(error?.message || 'Failed to update profile. Please try again.');
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Failed to update profile'
        });
        console.error('Profile update error:', error);
      }
    });
  }

  /**
   * Change password
   */
  onSubmitPasswordChange(): void {
    if (this.passwordForm.invalid) {
      markAllFieldsAsTouched(this.passwordForm);
      return;
    }

    // Check if passwords match
    if (this.passwordForm.value.password !== this.passwordForm.value.rePassword) {
      this.passwordError.set('Passwords do not match');
      return;
    }

    const passwordData: ChangePasswordRequest = {
      currentPassword: this.passwordForm.value.currentPassword,
      password: this.passwordForm.value.password,
      rePassword: this.passwordForm.value.rePassword
    };

    this.isChangingPassword.set(true);
    this.passwordError.set('');

    this.profileService.changePassword(passwordData).subscribe({
      next: (result) => {
        this.isChangingPassword.set(false);
        
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Password changed successfully'
        });
        
        // Reset password form
        this.passwordForm.reset();
      },
      error: (error) => {
        this.isChangingPassword.set(false);
        this.passwordError.set(error?.message || 'Failed to change password. Please try again.');
        
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Failed to change password'
        });
        console.error('Password change error:', error);
      }
    });
  }

  /**
   * Reset profile form to original values
   */
  resetProfileForm(): void {
    const user = this.currentUser();
    if (user) {
      this.profileForm.patchValue({
        name: user.name,
        email: user.email,
        phone: user.phone || ''
      });
    }
    this.profileError.set('');
  }

  /**
   * Reset password form
   */
  resetPasswordForm(): void {
    this.passwordForm.reset();
    this.passwordError.set('');
  }

  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    return isFieldInvalid(form.get(fieldName));
  }

  /**
   * Clear error messages
   */
  clearProfileError(): void {
    this.profileError.set('');
  }

  clearPasswordError(): void {
    this.passwordError.set('');
  }
}

