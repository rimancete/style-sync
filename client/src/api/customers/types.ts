/** Mirrors the backend `CustomerBrandingResponseDto` (`GET /api/customers/branding/:slug`). */
export type BrandingColorScale = {
  main: string;
  light: string;
  dark: string;
  contrast: string;
};

export type BrandingPalette = {
  logoUrl: string | null;
  logoAlt: string;
  primary: BrandingColorScale;
  secondary: BrandingColorScale;
  background: string;
  foreground: string;
  surface: string;
  border: string;
  mutedForeground: string;
};

export type BrandingTheme = {
  light: BrandingPalette;
  dark: BrandingPalette;
};

export type CustomerBranding = {
  id: string;
  displayId: number;
  name: string;
  urlSlug: string;
  branding: {
    favicon32x32: string | null;
    favicon16x16: string | null;
    appleTouch: string | null;
    documentTitle: string;
    theme: BrandingTheme;
  };
  isActive: boolean;
};
