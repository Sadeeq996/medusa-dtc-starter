import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling, withViewTransitions } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { MessageService } from 'primeng/api';

// Theme configuration - Import from centralized location
import { THEME_PRESETS } from './core/services/theme';
import { THEME_PRESET_STORAGE_KEY, DEFAULT_THEME_PRESET } from './core/constants/theme.constants';

import { authHeaderInterceptor } from './core/interceptors/auth-header-interceptor';

import { routes } from './app.routes';

/**
 * Get initial theme preset from localStorage or return default
 * This ensures the user's saved theme preference is applied on app initialization
 * 
 * Uses THEME_PRESETS from ThemeService to avoid duplication
 */
function getInitialThemePreset() {
  try {
    const savedPreset = localStorage.getItem(THEME_PRESET_STORAGE_KEY);
    const presetValue = savedPreset ? JSON.parse(savedPreset) : DEFAULT_THEME_PRESET;
    
    // Find preset from centralized THEME_PRESETS array
    const preset = THEME_PRESETS.find(p => p.value === presetValue);
    const defaultPreset = THEME_PRESETS.find(p => p.value === DEFAULT_THEME_PRESET);
    
    return preset?.preset || defaultPreset?.preset || THEME_PRESETS[0].preset;
  } catch (error) {
    console.warn('Error loading saved theme preset, using default:', error);
    const defaultPreset = THEME_PRESETS.find(p => p.value === DEFAULT_THEME_PRESET);
    return defaultPreset?.preset || THEME_PRESETS[0].preset;
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      // ✅ Industry Standard: Automatic scroll restoration on navigation
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',    // Always scroll to top on route change
        anchorScrolling: 'enabled'            // Enable anchor fragment scrolling
      }),
      // ✅ Modern Angular: Smooth View Transitions API (Chrome 111+)
      withViewTransitions()
    ),
    provideHttpClient(withInterceptors([authHeaderInterceptor])),
    provideAnimationsAsync(), // Required by PrimeNG (deprecated in v20.2, but still needed until v23)
    MessageService, // ✅ Global MessageService for Toast notifications
    providePrimeNG({
      theme: {
        preset: getInitialThemePreset(), // ✅ Load saved theme preset or default to Vibrant
        options: {
          prefix: 'p', // CSS variables prefix
          darkModeSelector: '.p-dark', // ✅ Class-based dark mode for manual toggle
          cssLayer: {
            name: 'primeng',
            order: 'theme, base, primeng' // Proper CSS layer ordering for Tailwind integration
          }
        }
      },
      ripple: true, // Enable ripple effects for better UX (per documentation line 70)
      // i18n integration - will be synced with ngx-translate dynamically
      translation: {
        // Basic PrimeNG translations (will be enhanced with ngx-translate)
        accept: 'Yes',
        reject: 'No',
        choose: 'Choose',
        upload: 'Upload',
        cancel: 'Cancel',
        clear: 'Clear',
        completed: 'Completed',
        pending: 'Pending'
      }
    }),
    provideTranslateService({
      loader: provideTranslateHttpLoader({
        prefix: './i18n/',
        suffix: '.json'
      }),
      fallbackLang: 'en'
    })
  ]
};
