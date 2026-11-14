import { describe, expect, it } from 'vitest';

import type { BrandingPalette, BrandingTheme } from '~/api/customers/types';

import { brandingThemeToCss, hexToHslTriplet, paletteToCssVars } from './brandingToCssVars';

const ELITE_LIGHT: BrandingPalette = {
  logoUrl: null,
  logoAlt: 'Elite Beauty Salon',
  primary: { main: '#B92777', light: '#D94C98', dark: '#8E1B5A', contrast: '#FFFFFF' },
  secondary: { main: '#D6FDFF', light: '#EEFEFF', dark: '#9EEFF3', contrast: '#8E1B5A' },
  background: '#FFF7FA',
  foreground: '#2B0A1C',
  surface: '#FFFFFF',
  border: '#F3D3E1',
  mutedForeground: '#7A4A60',
};

const ELITE_DARK: BrandingPalette = {
  ...ELITE_LIGHT,
  primary: { main: '#F472B6', light: '#F9A8D4', dark: '#DB2777', contrast: '#2B0A1C' },
  secondary: { main: '#164E63', light: '#1E6A80', dark: '#0E3A4A', contrast: '#D6FDFF' },
  background: '#1A0811',
  foreground: '#FCE7F3',
  surface: '#26101B',
  border: '#3D1A2C',
  mutedForeground: '#D4A5BC',
};

describe('hexToHslTriplet', () => {
  it('converts six-digit hex to an HSL triplet', () => {
    expect(hexToHslTriplet('#0E7490')).toBe('192.9 82.3% 31%');
  });

  it('converts grays without hue or saturation', () => {
    expect(hexToHslTriplet('#FFFFFF')).toBe('0 0% 100%');
    expect(hexToHslTriplet('#000000')).toBe('0 0% 0%');
  });

  it('expands three-digit hex', () => {
    expect(hexToHslTriplet('#F00')).toBe(hexToHslTriplet('#FF0000'));
  });

  it('ignores the alpha channel of eight-digit hex', () => {
    expect(hexToHslTriplet('#B9277780')).toBe(hexToHslTriplet('#B92777'));
  });

  it('rejects values that are not hex colors', () => {
    expect(() => hexToHslTriplet('red')).toThrow('Invalid hex color: "red"');
    expect(() => hexToHslTriplet('#12345')).toThrow();
  });
});

describe('paletteToCssVars', () => {
  it('maps every token to its shadcn variable', () => {
    const vars = paletteToCssVars(ELITE_LIGHT, 'light');

    expect(vars['--background']).toBe(hexToHslTriplet('#FFF7FA'));
    expect(vars['--foreground']).toBe(hexToHslTriplet('#2B0A1C'));
    expect(vars['--card']).toBe(hexToHslTriplet('#FFFFFF'));
    expect(vars['--border']).toBe(hexToHslTriplet('#F3D3E1'));
    expect(vars['--muted-foreground']).toBe(hexToHslTriplet('#7A4A60'));
    expect(vars['--primary']).toBe(hexToHslTriplet('#B92777'));
    expect(vars['--primary-foreground']).toBe(hexToHslTriplet('#FFFFFF'));
    expect(vars['--secondary']).toBe(hexToHslTriplet('#D6FDFF'));
    expect(vars['--secondary-foreground']).toBe(hexToHslTriplet('#8E1B5A'));
    expect(vars['--ring']).toBe(hexToHslTriplet('#B92777'));
  });

  it('uses the dark shade for hover in light mode', () => {
    expect(paletteToCssVars(ELITE_LIGHT, 'light')['--primary-hover']).toBe(
      hexToHslTriplet('#8E1B5A')
    );
  });

  it('uses the light shade for hover in dark mode', () => {
    expect(paletteToCssVars(ELITE_DARK, 'dark')['--primary-hover']).toBe(
      hexToHslTriplet('#F9A8D4')
    );
  });
});

describe('brandingThemeToCss', () => {
  it('writes the light palette on :root and the dark one on :root.dark', () => {
    const theme: BrandingTheme = { light: ELITE_LIGHT, dark: ELITE_DARK };
    const [lightRule, darkRule] = brandingThemeToCss(theme).split('\n');

    expect(lightRule).toMatch(/^:root \{/);
    expect(lightRule).toContain(`--primary: ${hexToHslTriplet('#B92777')};`);
    expect(darkRule).toMatch(/^:root\.dark \{/);
    expect(darkRule).toContain(`--primary: ${hexToHslTriplet('#F472B6')};`);
  });
});
