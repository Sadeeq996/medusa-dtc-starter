import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

// Translation
import { TranslateModule } from '@ngx-translate/core';

/**
 * Reset Password Component (Placeholder)
 * TODO: Implement reset password functionality in future task
 */
@Component({
  selector: 'app-reset-password',
  imports: [CommonModule, RouterModule, CardModule, ButtonModule, TranslateModule],
  templateUrl: './reset-password.html'
})
export class ResetPasswordComponent {}
