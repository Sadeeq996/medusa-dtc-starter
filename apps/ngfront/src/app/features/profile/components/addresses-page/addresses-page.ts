import { Component, inject, signal, computed, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

// Shared Utilities
import { isFieldInvalid, markAllFieldsAsTouched } from '../../../../shared/validators/form-validation.util';

// PrimeNG Components
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';
import { SkeletonModule } from 'primeng/skeleton';
import { DrawerModule } from 'primeng/drawer';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Services
import { AddressService } from '../../services/address.service';

// Models
import { Address, AddAddressRequest } from '../../models/address.model';

// Validators
import {
  egyptianCityValidator,
  egyptianPhoneNumberValidator,
  shippingAddressDetailsValidator,
  EGYPTIAN_CITIES
} from '../../../../shared/validators/checkout.validators';

/**
 * Addresses Page Component
 * Manages user addresses with add/delete functionality
 * Following the same pattern as WishlistPage and OrdersPage
 * 
 * ⚠️ Note: No EDIT functionality (API limitation)
 * To "edit" an address, user must delete and add new one
 */
@Component({
  selector: 'app-addresses-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    // Translation
    TranslateModule,
    // PrimeNG
    CardModule,
    ButtonModule,
    MessageModule,
    SkeletonModule,
    DrawerModule,
    InputTextModule,
    TextareaModule,
    SelectModule
  ],
  templateUrl: './addresses-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressesPage implements OnInit {
  private readonly addressService = inject(AddressService);
  private readonly messageService = inject(MessageService);
  private readonly fb = inject(FormBuilder);

  // Component state
  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  readonly isProcessing = signal(false);
  readonly showAddDrawer = signal(false);

  // Form
  readonly addressForm: FormGroup;

  // Computed properties
  readonly isEmpty = computed(() => this.addresses().length === 0);
  readonly showEmptyState = computed(() => this.isEmpty() && !this.loading());
  readonly showLoadingState = computed(() => this.loading() && this.isEmpty());
  readonly hasAddresses = computed(() => this.addresses().length > 0);

  // Egyptian cities for dropdown
  readonly egyptianCities = EGYPTIAN_CITIES.map(city => ({
    label: city,
    value: city
  }));

  constructor() {
    this.addressForm = this.createAddressForm();
  }

  ngOnInit(): void {
    this.loadAddresses();
  }

  /**
   * Create reactive form for address
   */
  private createAddressForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      details: ['', [Validators.required, shippingAddressDetailsValidator()]],
      phone: ['', [Validators.required, egyptianPhoneNumberValidator()]],
      city: ['', [Validators.required, egyptianCityValidator()]]
    });
  }

  /**
   * Load addresses from API
   */
  loadAddresses(): void {
    this.loading.set(true);
    this.error.set('');

    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.loading.set(false);
      },
      error: (error) => {
        this.error.set(error?.message || 'Failed to load addresses. Please try again.');
        this.loading.set(false);
        console.error('Addresses load error:', error);
      }
    });
  }

  /**
   * Open add address drawer
   */
  openAddDrawer(): void {
    this.addressForm.reset();
    this.showAddDrawer.set(true);
  }

  /**
   * Close add address drawer
   */
  closeAddDrawer(): void {
    this.showAddDrawer.set(false);
    this.addressForm.reset();
  }

  /**
   * Submit new address
   */
  onSubmitAddress(): void {
    if (this.addressForm.invalid) {
      markAllFieldsAsTouched(this.addressForm);
      return;
    }

    const addressData: AddAddressRequest = {
      name: this.addressForm.value.name.trim(),
      details: this.addressForm.value.details.trim(),
      phone: this.addressForm.value.phone.trim(),
      city: this.addressForm.value.city
    };

    this.isProcessing.set(true);

    this.addressService.addAddress(addressData).subscribe({
      next: (result) => {
        this.isProcessing.set(false);
        
        if (result.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: result.message || 'Address added successfully'
          });
          
          this.closeAddDrawer();
          this.loadAddresses(); // Reload addresses
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: result.message || 'Failed to add address'
          });
        }
      },
      error: (error) => {
        this.isProcessing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Failed to add address. Please try again.'
        });
        console.error('Add address error:', error);
      }
    });
  }

  /**
   * Delete address
   */
  deleteAddress(addressId: string): void {
    // In a real app, you'd use a confirmation dialog here
    this.isProcessing.set(true);

    this.addressService.deleteAddress(addressId).subscribe({
      next: (result) => {
        this.isProcessing.set(false);
        
        if (result.success) {
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: result.message || 'Address deleted successfully'
          });
          
          this.loadAddresses(); // Reload addresses
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: result.message || 'Failed to delete address'
          });
        }
      },
      error: (error) => {
        this.isProcessing.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error?.message || 'Failed to delete address. Please try again.'
        });
        console.error('Delete address error:', error);
      }
    });
  }

  /**
   * Check if field is invalid and touched
   */
  isFieldInvalid(fieldName: string): boolean {
    return isFieldInvalid(this.addressForm.get(fieldName));
  }

  /**
   * Retry loading addresses
   */
  retry(): void {
    this.loadAddresses();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this.error.set('');
  }

  /**
   * Track by function for addresses
   */
  trackByAddressId(index: number, address: Address): string {
    return address._id;
  }
}

