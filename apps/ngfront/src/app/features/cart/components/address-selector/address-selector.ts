import { Component, input, output, signal, computed, effect, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';
import { ButtonModule } from 'primeng/button';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageModule } from 'primeng/message';

// Translation
import { TranslateModule } from '@ngx-translate/core';

// Services
import { AddressService } from '../../../profile/services/address.service';
import { Address } from '../../../profile/models/address.model';

// Types
import { ShippingAddress } from '../../services/checkout.service';

/**
 * Address Selection Type
 */
export type AddressSelectionType = 'existing' | 'new';

/**
 * Address Selection Result
 */
export interface AddressSelectionResult {
  type: AddressSelectionType;
  addressId?: string;           // ID of selected existing address
  address?: Address;            // Full address object if existing
}

/**
 * Address Selector Component
 * Displays saved addresses and allows selection or adding new address
 * Following Amazon/Shopify pattern for checkout address selection
 */
@Component({
  selector: 'app-address-selector',
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    CardModule,
    RadioButtonModule,
    ButtonModule,
    SkeletonModule,
    MessageModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './address-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressSelectorComponent implements OnInit {
  private readonly addressService = inject(AddressService);

  // Inputs
  readonly isDisabled = input<boolean>(false);

  // Outputs
  readonly selectionChange = output<AddressSelectionResult>();
  readonly addressSelected = output<ShippingAddress>();  // Emits ShippingAddress format for checkout

  // Component state
  readonly addresses = signal<Address[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string>('');
  readonly selectedType = signal<AddressSelectionType>('existing');
  readonly selectedAddressId = signal<string | null>(null);

  // Computed properties
  readonly hasAddresses = computed(() => this.addresses().length > 0);
  readonly showAddresses = computed(() => this.hasAddresses() && !this.loading());
  readonly showEmptyState = computed(() => !this.hasAddresses() && !this.loading() && !this.error());
  readonly showNewAddressForm = computed(() => this.selectedType() === 'new');

  ngOnInit(): void {
    this.loadAddresses();
  }

  /**
   * Load user's saved addresses
   */
  private loadAddresses(): void {
    this.loading.set(true);
    this.error.set('');

    this.addressService.getAddresses().subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.loading.set(false);

        // Auto-select first address if available
        if (addresses.length > 0) {
          this.selectExistingAddress(addresses[0]);
        } else {
          // No addresses - automatically select "new address" option
          this.selectNewAddress();
        }
      },
      error: (error) => {
        console.error('Failed to load addresses:', error);
        this.error.set('Failed to load saved addresses');
        this.loading.set(false);
        
        // On error, fallback to new address form
        this.selectNewAddress();
      }
    });
  }

  /**
   * Select an existing address
   */
  selectExistingAddress(address: Address): void {
    if (this.isDisabled()) return;

    this.selectedType.set('existing');
    this.selectedAddressId.set(address._id);

    // Emit selection change
    this.selectionChange.emit({
      type: 'existing',
      addressId: address._id,
      address: address
    });

    // Emit ShippingAddress format (including name for reference)
    this.addressSelected.emit({
      name: address.name,
      details: address.details,
      phone: address.phone,
      city: address.city
    });
  }

  /**
   * Select "add new address" option
   */
  selectNewAddress(): void {
    if (this.isDisabled()) return;

    this.selectedType.set('new');
    this.selectedAddressId.set(null);

    // Emit selection change
    this.selectionChange.emit({
      type: 'new'
    });

    // Don't emit addressSelected - wait for form to provide data
  }

  /**
   * Check if specific address is selected
   */
  isAddressSelected(addressId: string): boolean {
    return this.selectedType() === 'existing' && this.selectedAddressId() === addressId;
  }

  /**
   * Check if "new address" is selected
   */
  isNewAddressSelected(): boolean {
    return this.selectedType() === 'new';
  }
}

