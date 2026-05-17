import { Injectable, signal, computed, effect, inject, DestroyRef } from '@angular/core';
import { usePreset } from '@primeuix/themes';
import { StorageService } from './storage';
import { THEME_PRESET_STORAGE_KEY, DEFAULT_THEME_PRESET } from '../constants/theme.constants';

// Import all available theme presets
import { FreshPreset } from '../../theme/fresh-preset';
import { PremiumPreset } from '../../theme/premium-preset';
import { VibrantPreset } from '../../theme/vibrant-preset';
import { NaturalPreset } from '../../theme/natural-preset';

/**
 * Theme Types
 */
export type ThemeMode = 'light' | 'dark';
export type ThemePreset = 'fresh' | 'premium' | 'vibrant' | 'natural';

/**
 * Theme Preset Configuration
 * Maps preset names to actual preset objects and metadata
 */
export interface ThemePresetConfig {
  name: string;
  value: ThemePreset;
  preset: any; // PrimeNG preset object
  primaryColor: string;
  description: string;
  icon: string;
}

/**
 * Available Theme Presets with Metadata
 * Production-ready themes for FreshCart
 */
export const THEME_PRESETS: ThemePresetConfig[] = [
  {
    name: 'Fresh & Trustworthy',
    value: 'fresh',
    preset: FreshPreset,
    primaryColor: 'Teal',
    description: 'Modern, clean, and trustworthy',
    icon: 'pi pi-shopping-cart'
  },
  {
    name: 'Modern Premium',
    value: 'premium',
    preset: PremiumPreset,
    primaryColor: 'Indigo',
    description: 'Professional and premium',
    icon: 'pi pi-star'
  },
  {
    name: 'Vibrant & Energetic',
    value: 'vibrant',
    preset: VibrantPreset,
    primaryColor: 'Orange',
    description: 'Energetic and bold',
    icon: 'pi pi-bolt'
  },
  {
    name: 'Natural & Organic',
    value: 'natural',
    preset: NaturalPreset,
    primaryColor: 'Emerald',
    description: 'Nature-inspired and calm',
    icon: 'pi pi-sun'
  }
];

/**
 * Enhanced Theme Service
 * Manages both dark/light mode AND theme preset switching
 * 
 * Features:
 * - Dark/Light mode toggle with system preference detection
 * - Dynamic theme preset switching using PrimeNG's usePreset utility
 * - Persistent storage of user preferences
 * - Signal-based reactive state management
 * 
 * Reference: https://primeng.org/theming
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storage = inject(StorageService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly DARK_MODE_CLASS = 'p-dark';

  // Current theme mode signal (light/dark)
  readonly currentTheme = signal<ThemeMode>('light');

  // Current theme preset signal
  readonly currentPreset = signal<ThemePreset>(DEFAULT_THEME_PRESET);

  // Computed helper for dark mode check
  readonly isDarkMode = computed(() => this.currentTheme() === 'dark');

  // Get current preset configuration with safe fallback
  readonly currentPresetConfig = computed(() => 
    THEME_PRESETS.find(p => p.value === this.currentPreset()) || 
    THEME_PRESETS.find(p => p.value === DEFAULT_THEME_PRESET) ||
    THEME_PRESETS[0] // Final fallback to first theme
  );

  constructor() {
    // Initialize theme preset from storage first
    this.initializePreset();
    
    // Initialize theme mode from storage or system preference
    this.initializeTheme();

    // Apply theme mode whenever it changes
    const effectRef = effect(() => {
      const theme = this.currentTheme();
      this.applyTheme(theme);
    });

    // Explicit cleanup following Angular best practices for service-level effects
    this.destroyRef.onDestroy(() => effectRef.destroy());
  }

  /**
   * Initialize theme preset from localStorage
   * Note: The preset is already applied in app.config.ts via getInitialThemePreset()
   * This method just syncs the signal state with the stored value
   */
  private initializePreset(): void {
    const savedPreset = this.storage.getItem<ThemePreset>(THEME_PRESET_STORAGE_KEY);
    
    if (savedPreset && this.isValidPreset(savedPreset)) {
      // Just update the signal - preset already applied in app.config.ts
      this.currentPreset.set(savedPreset);
    } else {
      // Default preset from shared constant
      this.currentPreset.set(DEFAULT_THEME_PRESET);
    }
  }

  /**
   * Initialize theme mode from localStorage or system preference
   */
  private initializeTheme(): void {
    // Try to get saved theme from storage
    const savedTheme = this.storage.getTheme() as ThemeMode | null;
    
    if (savedTheme) {
      this.currentTheme.set(savedTheme);
    } else {
      // Detect system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.currentTheme.set(prefersDark ? 'dark' : 'light');
    }
  }

  /**
   * Apply theme by adding/removing .p-dark class on documentElement
   * Following PrimeNG official documentation
   */
  private applyTheme(theme: ThemeMode): void {
    const element = document.documentElement;
    
    if (theme === 'dark') {
      element.classList.add(this.DARK_MODE_CLASS);
    } else {
      element.classList.remove(this.DARK_MODE_CLASS);
    }

    // Only write to storage if theme changed (optimization)
    const storedTheme = this.storage.getTheme() as ThemeMode | null;
    if (storedTheme !== theme) {
      this.storage.setTheme(theme);
    }
  }

  /**
   * Apply theme preset using PrimeNG's usePreset utility
   * This dynamically replaces the entire theme preset at runtime
   */
  private applyPreset(preset: ThemePreset): void {
    const presetConfig = THEME_PRESETS.find(p => p.value === preset);
    
    if (presetConfig) {
      // Use PrimeNG's usePreset utility to change theme dynamically
      usePreset(presetConfig.preset);
    }
  }

  /**
   * Validate if preset value is valid
   */
  private isValidPreset(preset: string): preset is ThemePreset {
    return THEME_PRESETS.some(p => p.value === preset);
  }

  /**
   * Toggle between light and dark themes
   */
  toggleTheme(): void {
    const newTheme: ThemeMode = this.currentTheme() === 'light' ? 'dark' : 'light';
    this.currentTheme.set(newTheme);
  }

  /**
   * Set specific theme mode
   */
  setTheme(theme: ThemeMode): void {
    this.currentTheme.set(theme);
  }

  /**
   * Set specific theme preset
   * Uses PrimeNG's usePreset utility for runtime theme switching
   */
  setPreset(preset: ThemePreset): void {
    this.currentPreset.set(preset);
    this.applyPreset(preset);
    this.storage.setItem(THEME_PRESET_STORAGE_KEY, preset);
  }

  /**
   * Get current theme mode
   */
  getTheme(): ThemeMode {
    return this.currentTheme();
  }

  /**
   * Get current theme preset
   */
  getPreset(): ThemePreset {
    return this.currentPreset();
  }
}
