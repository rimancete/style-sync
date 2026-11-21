import { Customer, Prisma } from '@prisma/client';
import {
  BrandingPalette,
  BrandingTheme,
} from './dto/customer-branding.response.dto';
import { ThemeConfigDto, ThemePaletteDto } from './dto/theme-config.dto';

type ColorColumn = {
  [K in keyof Customer]: Customer[K] extends string ? K : never;
}[keyof Customer];

type ScaleColumns = {
  main: ColorColumn;
  light: ColorColumn;
  dark: ColorColumn;
  contrast: ColorColumn;
};

type PaletteColumns = {
  primary: ScaleColumns;
  secondary: ScaleColumns;
  background: ColorColumn;
  foreground: ColorColumn;
  surface: ColorColumn;
  border: ColorColumn;
  mutedForeground: ColorColumn;
};

type ThemeMode = keyof BrandingTheme;

type PaletteToken = Exclude<keyof PaletteColumns, 'primary' | 'secondary'>;

const PALETTE_TOKENS: readonly PaletteToken[] = [
  'background',
  'foreground',
  'surface',
  'border',
  'mutedForeground',
];

const SCALE_KEYS: readonly (keyof ScaleColumns)[] = [
  'main',
  'light',
  'dark',
  'contrast',
];

/** The single source of truth for which Customer column stores each theme token. */
export const THEME_COLUMNS: Record<ThemeMode, PaletteColumns> = {
  light: {
    primary: {
      main: 'primaryMain',
      light: 'primaryLight',
      dark: 'primaryDark',
      contrast: 'primaryContrast',
    },
    secondary: {
      main: 'secondaryMain',
      light: 'secondaryLight',
      dark: 'secondaryDark',
      contrast: 'secondaryContrast',
    },
    background: 'backgroundColor',
    foreground: 'foregroundColor',
    surface: 'surfaceColor',
    border: 'borderColor',
    mutedForeground: 'mutedForegroundColor',
  },
  dark: {
    primary: {
      main: 'darkPrimaryMain',
      light: 'darkPrimaryLight',
      dark: 'darkPrimaryDark',
      contrast: 'darkPrimaryContrast',
    },
    secondary: {
      main: 'darkSecondaryMain',
      light: 'darkSecondaryLight',
      dark: 'darkSecondaryDark',
      contrast: 'darkSecondaryContrast',
    },
    background: 'darkBackgroundColor',
    foreground: 'darkForegroundColor',
    surface: 'darkSurfaceColor',
    border: 'darkBorderColor',
    mutedForeground: 'darkMutedForegroundColor',
  },
};

type ThemeColorSource = Pick<Customer, ColorColumn>;

function readColor(customer: ThemeColorSource, column: ColorColumn): string {
  return customer[column];
}

function toPalette(
  customer: ThemeColorSource,
  columns: PaletteColumns,
  logo: Pick<BrandingPalette, 'logoUrl' | 'logoAlt'>,
): BrandingPalette {
  const scale = (scaleColumns: ScaleColumns) => ({
    main: readColor(customer, scaleColumns.main),
    light: readColor(customer, scaleColumns.light),
    dark: readColor(customer, scaleColumns.dark),
    contrast: readColor(customer, scaleColumns.contrast),
  });

  return {
    ...logo,
    primary: scale(columns.primary),
    secondary: scale(columns.secondary),
    background: readColor(customer, columns.background),
    foreground: readColor(customer, columns.foreground),
    surface: readColor(customer, columns.surface),
    border: readColor(customer, columns.border),
    mutedForeground: readColor(customer, columns.mutedForeground),
  };
}

/**
 * Builds the light and dark palettes of a customer's public branding.
 * Both palettes share the same logo.
 */
export function toBrandingTheme(
  customer: ThemeColorSource,
  logo: Pick<BrandingPalette, 'logoUrl' | 'logoAlt'>,
): BrandingTheme {
  return {
    light: toPalette(customer, THEME_COLUMNS.light, logo),
    dark: toPalette(customer, THEME_COLUMNS.dark, logo),
  };
}

function paletteUpdateData(
  palette: ThemePaletteDto,
  columns: PaletteColumns,
): Prisma.CustomerUpdateInput {
  const data: Partial<Record<ColorColumn, string>> = {};

  for (const scaleName of ['primary', 'secondary'] as const) {
    const scale = palette[scaleName];
    if (!scale) continue;
    for (const key of SCALE_KEYS) {
      const value = scale[key];
      if (value !== undefined) data[columns[scaleName][key]] = value;
    }
  }

  for (const token of PALETTE_TOKENS) {
    const value = palette[token];
    if (value !== undefined) data[columns[token]] = value;
  }

  return data;
}

/**
 * Converts a partial theme payload into Customer column updates.
 * Tokens that are not sent keep their stored value.
 */
export function toThemeUpdateData(
  theme: ThemeConfigDto | undefined,
): Prisma.CustomerUpdateInput {
  if (!theme) return {};

  return {
    ...(theme.light ? paletteUpdateData(theme.light, THEME_COLUMNS.light) : {}),
    ...(theme.dark ? paletteUpdateData(theme.dark, THEME_COLUMNS.dark) : {}),
  };
}
