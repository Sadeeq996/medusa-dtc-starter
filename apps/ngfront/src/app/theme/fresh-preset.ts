import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Fresh & Trustworthy Theme Preset (RECOMMENDED)
 * 
 * Best for: Grocery/Fresh Products e-commerce
 * Primary: Teal (modern, fresh, trustworthy)
 * Surface: Zinc (clean, professional)
 * Feel: Modern, clean, and trustworthy
 * 
 * This preset uses Teal as the primary color which conveys freshness,
 * trust, and modernity - perfect for FreshCart's brand identity.
 * Zinc surfaces provide clean, professional backgrounds with excellent
 * contrast for accessibility in both light and dark modes.
 */
export const FreshPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{teal.50}',
      100: '{teal.100}',
      200: '{teal.200}',
      300: '{teal.300}',
      400: '{teal.400}',
      500: '{teal.500}',
      600: '{teal.600}',
      700: '{teal.700}',
      800: '{teal.800}',
      900: '{teal.900}',
      950: '{teal.950}'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{zinc.50}',
          100: '{zinc.100}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.400}',
          500: '{zinc.500}',
          600: '{zinc.600}',
          700: '{zinc.700}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}'
        }
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}'
        }
      }
    }
  }
});

