import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * Natural & Organic Theme Preset
 * 
 * Best for: Organic/Natural products e-commerce
 * Primary: Emerald (natural, growth, fresh)
 * Surface: Stone (warm, natural)
 * Feel: Organic, trustworthy, eco-friendly
 * 
 * Note: This is similar to the default Aura preset but with
 * warmer stone surfaces instead of gray tones.
 * 
 * To use this preset, update app.config.ts:
 * import { NaturalPreset } from './theme/natural-preset';
 * 
 * providePrimeNG({
 *   theme: {
 *     preset: NaturalPreset
 *   }
 * })
 */
export const NaturalPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{emerald.50}',
      100: '{emerald.100}',
      200: '{emerald.200}',
      300: '{emerald.300}',
      400: '{emerald.400}',
      500: '{emerald.500}',
      600: '{emerald.600}',
      700: '{emerald.700}',
      800: '{emerald.800}',
      900: '{emerald.900}',
      950: '{emerald.950}'
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '{stone.50}',
          100: '{stone.100}',
          200: '{stone.200}',
          300: '{stone.300}',
          400: '{stone.400}',
          500: '{stone.500}',
          600: '{stone.600}',
          700: '{stone.700}',
          800: '{stone.800}',
          900: '{stone.900}',
          950: '{stone.950}'
        }
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{stone.50}',
          100: '{stone.100}',
          200: '{stone.200}',
          300: '{stone.300}',
          400: '{stone.400}',
          500: '{stone.500}',
          600: '{stone.600}',
          700: '{stone.700}',
          800: '{stone.800}',
          900: '{stone.900}',
          950: '{stone.950}'
        }
      }
    }
  }
});

