import { ApiProperty } from '@nestjs/swagger';

export class CustomerBrandingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  urlSlug: string;

  @ApiProperty()
  branding: {
    favicon32x32?: string;
    favicon16x16?: string;
    appleTouch?: string;
    documentTitle: string;
    theme: {
      light: {
        logoUrl?: string;
        logoAlt: string;
        primary: {
          main: string;
          light: string;
          dark: string;
          contrast: string;
        };
        secondary: {
          main: string;
          light: string;
          dark: string;
          contrast: string;
        };
        background: string;
      };
    };
  };

  @ApiProperty()
  isActive: boolean;
}
