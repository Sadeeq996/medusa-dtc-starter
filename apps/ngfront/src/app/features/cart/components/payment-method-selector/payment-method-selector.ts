import { Component, input, output, signal, computed, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG Imports
import { CardModule } from 'primeng/card';
import { RadioButtonModule } from 'primeng/radiobutton';

// Translation
import { TranslateModule } from '@ngx-translate/core';

/**
 * Payment Method Type
 */
export type PaymentMethod = 'cash' | 'card';

/**
 * Payment Method Selector Component
 * Handles payment method selection with clear UI feedback
 * Focused single responsibility: Payment method selection only
 */
@Component({
  selector: 'app-payment-method-selector',
  imports: [
    CommonModule,
    FormsModule,
    // PrimeNG
    CardModule,
    RadioButtonModule,
    // Translation
    TranslateModule
  ],
  templateUrl: './payment-method-selector.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PaymentMethodSelectorComponent {
  // Inputs
  readonly selectedPaymentMethod = input<PaymentMethod>('cash');
  readonly isDisabled = input<boolean>(false);

  // Outputs
  readonly paymentMethodChange = output<PaymentMethod>();

  // Internal state
  readonly paymentMethodSignal = signal<PaymentMethod>('cash');

  constructor() {
    // ✅ Sync internal signal when input changes
    effect(() => {
      this.paymentMethodSignal.set(this.selectedPaymentMethod());
    });
  }

  /**
   * Select payment method and emit change
   */
  selectPaymentMethod(method: PaymentMethod): void {
    if (this.isDisabled()) return;
    
    this.paymentMethodSignal.set(method);
    this.paymentMethodChange.emit(method);
  }
}
