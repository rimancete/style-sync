import { ApiProperty } from '@nestjs/swagger';

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

export class CustomerBrandingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  displayId: number;

  @ApiProperty()
  name: string;

  @ApiProperty()
  urlSlug: string;

  @ApiProperty()
  branding: {
    favicon32x32: string | null;
    favicon16x16: string | null;
    appleTouch: string | null;
    documentTitle: string;
    theme: BrandingTheme;
  };

  @ApiProperty()
  isActive: boolean;
}
