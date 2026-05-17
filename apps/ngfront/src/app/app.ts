import { Component, signal, inject } from '@angular/core';
import { I18nService } from './core/services/i18n';
import { ThemeService } from './core/services/theme';
import { MainLayout } from './core/layout/main-layout/main-layout';

@Component({
  selector: 'app-root',
  imports: [MainLayout],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('fresh-cart');
  protected readonly i18nService = inject(I18nService);
  protected readonly themeService = inject(ThemeService); // ✅ Initialize theme service
}
