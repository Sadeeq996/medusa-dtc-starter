import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// PrimeNG Components
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputGroupModule } from 'primeng/inputgroup';
import { InputGroupAddonModule } from 'primeng/inputgroupaddon';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { DividerModule } from 'primeng/divider';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-footer',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    ButtonModule,
    InputTextModule,
    InputGroupModule,
    InputGroupAddonModule,
    MessageModule,
    CardModule,
    DividerModule
  ],
  providers: [MessageService],
  templateUrl: './footer.html',
  styleUrl: './footer.scss'
})
export class Footer {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);

  newsletterForm: FormGroup;

  // Social Media Links
  socialLinks = [
    { icon: 'pi pi-instagram', url: 'https://instagram.com/freshcart', label: 'Instagram' },
    { icon: 'pi pi-facebook', url: 'https://facebook.com/freshcart', label: 'Facebook' },
    { icon: 'pi pi-twitter', url: 'https://twitter.com/freshcart', label: 'Twitter' },
    { icon: 'pi pi-linkedin', url: 'https://linkedin.com/company/freshcart', label: 'LinkedIn' },
    { icon: 'pi pi-youtube', url: 'https://youtube.com/freshcart', label: 'YouTube' }
  ];

  // Payment Partners with PrimeNG Icons
  paymentPartners = [
    { name: 'Amazon Pay', icon: 'pi pi-amazon', color: '#FF9900' },
    { name: 'PayPal', icon: 'pi pi-paypal', color: '#0070BA' },
    { name: 'Credit Cards', icon: 'pi pi-credit-card', color: '#6B7280' },
    { name: 'Secure Payments', icon: 'pi pi-shield', color: '#059669' }
  ];

  constructor() {
    this.newsletterForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Handle newsletter subscription
   */
  onSubscribe(): void {
    if (this.newsletterForm.valid) {
      const email = this.newsletterForm.get('email')?.value;
      
      // TODO: Implement actual newsletter subscription logic
      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Successfully subscribed to newsletter!'
      });
      
      this.newsletterForm.reset();
    } else {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Please enter a valid email address'
      });
    }
  }

  /**
   * Check if email field is invalid and touched
   */
  isEmailInvalid(): boolean {
    const emailControl = this.newsletterForm.get('email');
    return !!(emailControl?.invalid && emailControl?.touched);
  }

  /**
   * Open social media link
   */
  openSocialLink(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  /**
   * Open app store links
   */
  openAppStore(): void {
    window.open('https://apps.apple.com/app/freshcart', '_blank', 'noopener,noreferrer');
  }

  openGooglePlay(): void {
    window.open('https://play.google.com/store/apps/details?id=com.freshcart', '_blank', 'noopener,noreferrer');
  }
}
