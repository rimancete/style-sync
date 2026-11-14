import type { BrandingPalette, BrandingTheme } from '~/api/customers/types';

export type ThemeMode = 'light' | 'dark';

export type CssVars = Record<`--${string}`, string>;

const HEX_PATTERN = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const HEX_RADIX = 16;
const RGB_MAX = 255;
const HUE_DEGREES = 60;
const FULL_TURN = 360;
const PERCENT = 100;
const DECIMALS = 10;

/**
 * Converts `#RGB`, `#RRGGBB` or `#RRGGBBAA` into the space-separated HSL
 * triplet shadcn expects (`"192 82% 31%"`). The alpha channel is dropped:
 * Tailwind opacity modifiers (`bg-primary/90`) append their own alpha to
 * `hsl(var(--x))`, and a second one would make the color invalid.
 */
export function hexToHslTriplet(hex: string): string {
  if (!HEX_PATTERN.test(hex)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }

  const digits = expandShortHex(hex.slice(1)).slice(0, 6);
  const [red, green, blue] = [0, 2, 4].map(
    (offset) => parseInt(digits.slice(offset, offset + 2), HEX_RADIX) / RGB_MAX
  );

  const max = Math.max(red, green, blue);
  const min = Math.min(red, green, blue);
  const delta = max - min;
  const lightness = (max + min) / 2;

  if (delta === 0) {
    return `0 0% ${round(lightness * PERCENT)}%`;
  }

  const saturation = delta / (1 - Math.abs(2 * lightness - 1));
  const hue = computeHue({ red, green, blue, max, delta });

  return `${round(hue)} ${round(saturation * PERCENT)}% ${round(lightness * PERCENT)}%`;
}

/**
 * The single mapping from branding tokens to shadcn CSS variables.
 * Hover keeps WCAG AA per mode: the darker shade on light backgrounds and the
 * lighter shade on dark ones. `muted` and `accent` reuse the border tint
 * because some dark secondaries are saturated enough to shout as a surface.
 */
export function paletteToCssVars(palette: BrandingPalette, mode: ThemeMode): CssVars {
  const hoverShade = mode === 'light' ? 'dark' : 'light';
  const hsl = hexToHslTriplet;

  return {
    '--background': hsl(palette.background),
    '--foreground': hsl(palette.foreground),
    '--card': hsl(palette.surface),
    '--card-foreground': hsl(palette.foreground),
    '--popover': hsl(palette.surface),
    '--popover-foreground': hsl(palette.foreground),
    '--border': hsl(palette.border),
    '--input': hsl(palette.border),
    '--muted': hsl(palette.border),
    '--muted-foreground': hsl(palette.mutedForeground),
    '--primary': hsl(palette.primary.main),
    '--primary-foreground': hsl(palette.primary.contrast),
    '--primary-hover': hsl(palette.primary[hoverShade]),
    '--secondary': hsl(palette.secondary.main),
    '--secondary-foreground': hsl(palette.secondary.contrast),
    '--secondary-hover': hsl(palette.secondary[hoverShade]),
    '--accent': hsl(palette.border),
    '--accent-foreground': hsl(palette.foreground),
    '--ring': hsl(palette.primary.main),
  };
}

/** Builds the stylesheet body that overrides the system theme with a salon theme. */
export function brandingThemeToCss(theme: BrandingTheme): string {
  return [
    `:root {${declarations(paletteToCssVars(theme.light, 'light'))}}`,
    `:root.dark {${declarations(paletteToCssVars(theme.dark, 'dark'))}}`,
  ].join('\n');
}

function declarations(vars: CssVars): string {
  return Object.entries(vars)
    .map(([name, value]) => ` ${name}: ${value};`)
    .join('');
}

function expandShortHex(digits: string): string {
  return digits.length === 3
    ? digits
        .split('')
        .map((digit) => digit + digit)
        .join('')
    : digits;
}

type HueInput = {
  red: number;
  green: number;
  blue: number;
  max: number;
  delta: number;
};

function computeHue({ red, green, blue, max, delta }: HueInput): number {
  let sector: number;

  if (max === red) {
    sector = ((green - blue) / delta) % 6;
  } else if (max === green) {
    sector = (blue - red) / delta + 2;
  } else {
    sector = (red - green) / delta + 4;
  }

  const hue = sector * HUE_DEGREES;
  return hue < 0 ? hue + FULL_TURN : hue;
}

function round(value: number): number {
  return Math.round(value * DECIMALS) / DECIMALS;
}
