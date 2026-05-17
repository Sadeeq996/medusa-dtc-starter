import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNG } from 'primeng/config';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { StorageService } from './storage';

@Injectable({
  providedIn: 'root'
})
export class I18nService {
  private readonly translateService = inject(TranslateService);
  private readonly primeNGConfig = inject(PrimeNG);
  private readonly storageService = inject(StorageService);
  
  // ✅ Single source of truth for current language (reactive signal)
  readonly currentLanguage = signal<string>('en');
  
  // Supported languages for FreshCart
  readonly supportedLanguages = [
    { code: 'en', name: 'English', direction: 'ltr' },
    { code: 'ar', name: 'العربية', direction: 'rtl' }
  ] as const;

  constructor() {
    this.initializeTranslations();
  }

  /**
   * Initialize translations and set default language
   * Priority: 1) localStorage, 2) browser language, 3) default 'en'
   */
  private initializeTranslations(): void {
    // Set supported languages
    this.translateService.addLangs(this.supportedLanguages.map(lang => lang.code));
    
    // Set default language (fallback)
    this.translateService.setDefaultLang('en');
    
    // Determine initial language with priority order
    const savedLang = this.storageService.getLanguage(); // 1️⃣ Check localStorage first
    const browserLang = this.translateService.getBrowserLang(); // 2️⃣ Check browser language
    
    let initialLang = 'en'; // 3️⃣ Default fallback
    
    // Priority 1: Use saved language preference if valid
    if (savedLang && this.supportedLanguages.some(lang => lang.code === savedLang)) {
      initialLang = savedLang;
    }
    // Priority 2: Use browser language if supported and no saved preference
    else if (browserLang && this.supportedLanguages.some(lang => lang.code === browserLang)) {
      initialLang = browserLang;
    }
    
    // Apply the determined language
    this.setLanguage(initialLang);
  }

  /**
   * Set the active language and persist to localStorage
   */
  setLanguage(langCode: string): void {
    if (this.supportedLanguages.some(lang => lang.code === langCode)) {
      // ✅ Update reactive signal (single source of truth)
      this.currentLanguage.set(langCode);
      
      // Apply language to ngx-translate
      this.translateService.use(langCode);
      
      // 💾 Persist language preference to localStorage
      this.storageService.setLanguage(langCode);
      
      // Sync PrimeNG translations dynamically
      // ✅ Using take(1) to auto-unsubscribe after first emission (prevents memory leaks)
      this.translateService.get('PRIMENG')
        .pipe(take(1))
        .subscribe(translations => {
          if (translations && typeof translations === 'object') {
            this.primeNGConfig.setTranslation(translations);
          }
        });
      
      // Update document direction for RTL support
      const language = this.supportedLanguages.find(lang => lang.code === langCode);
      if (language) {
        document.documentElement.dir = language.direction;
        document.documentElement.lang = langCode;
      }
    }
  }

  /**
   * Toggle between English and Arabic
   */
  toggleLanguage(): void {
    const currentLang = this.currentLanguage();
    const newLang = currentLang === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  /**
   * Get translation for a key
   */
  translate(key: string, params?: any): Observable<string> {
    return this.translateService.get(key, params);
  }

  /**
   * Get instant translation for a key
   */
  instant(key: string, params?: any): string {
    return this.translateService.instant(key, params);
  }

  /**
   * Check if current language is RTL
   */
  isRTL(): boolean {
    const currentLang = this.currentLanguage();
    const language = this.supportedLanguages.find(lang => lang.code === currentLang);
    return language?.direction === 'rtl';
  }
}
