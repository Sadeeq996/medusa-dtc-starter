import { Component, input, output, signal, computed, ChangeDetectionStrategy, OnInit, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Shared Validators
import { 
  isFieldInvalid,
  markAllFieldsAsTouched 
} from '../../../../shared/validators/form-validation.util';
import {
  egyptianPhoneNumberValidator,
  shippingAddressDetailsValidator,
  egyptianCityValidator,
  EGYPTIAN_CITIES
} from '../../../../shared/validators/checkout.validators';

// Types
import { ShippingAddress } from '../../services/checkout.service';

/**
 * Checkout Form Component
 * Handles shipping address form validation and submission
 * Focused single responsibility: Form management only
 */
@Component({
  selector: 'app-checkout-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // PrimeNG
    CardModule,
    InputTextModule,
    TextareaModule,
    SelectModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './checkout-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  // Inputs
  readonly initialData = input<Partial<ShippingAddress>>();
  readonly isProcessing = input<boolean>(false);

  // Outputs
  readonly formValidChange = output<boolean>();
  readonly formValueChange = output<ShippingAddress>();

  // Form setup
  checkoutForm!: FormGroup;

  // Form validation state
  readonly isFormValid = computed(() => this.checkoutForm?.valid ?? false);

  // ✅ Static: Egyptian cities for dropdown (computed once, shared across all instances)
  private static readonly EGYPTIAN_CITIES_OPTIONS = EGYPTIAN_CITIES.map((city: string) => ({
    label: city,
    value: city
  }));
  
  readonly egyptianCities = CheckoutFormComponent.EGYPTIAN_CITIES_OPTIONS;

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormSubscriptions();
  }

  /**
   * Initialize reactive form with validation
   */
  private initializeForm(): void {
    const initialData = this.initialData();
    
    this.checkoutForm = this.fb.group({
      name: [initialData?.name || '', [
        Validators.required,
        Validators.minLength(2)
      ]],
      details: [initialData?.details || '', [
        Validators.required,
        shippingAddressDetailsValidator()
      ]],
      phone: [initialData?.phone || '', [
        Validators.required,
        egyptianPhoneNumberValidator()
      ]],
      city: [initialData?.city || '', [
        Validators.required,
        egyptianCityValidator()
      ]]
    });
  }

  /**
   * Setup form subscriptions to emit changes
   * ✅ Using takeUntilDestroyed() for automatic cleanup
   */
  private setupFormSubscriptions(): void {
    // Emit validity changes
    this.checkoutForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.formValidChange.emit(this.checkoutForm.valid);
      });

    // Emit value changes
    this.checkoutForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(value => {
        if (this.checkoutForm.valid) {
          this.formValueChange.emit({
            name: value.name?.trim() || '',
            details: value.details?.trim() || '',
            phone: value.phone?.trim() || '',
            city: value.city || ''
          });
        }
      });
  }

  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return isFieldInvalid(field);
  }

  /**
   * Mark all fields as touched for validation display
   */
  markAllFieldsAsTouched(): void {
    markAllFieldsAsTouched(this.checkoutForm);
  }

  /**
   * Get current form value
   */
  getFormValue(): ShippingAddress | null {
    if (this.checkoutForm.valid) {
      const value = this.checkoutForm.value;
      return {
        name: value.name?.trim() || '',
        details: value.details?.trim() || '',
        phone: value.phone?.trim() || '',
        city: value.city || ''
      };
    }
    return null;
  }
}
