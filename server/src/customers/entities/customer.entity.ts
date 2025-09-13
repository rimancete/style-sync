import { ApiProperty } from '@nestjs/swagger';

export class Customer {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  urlSlug: string;

  // Branding Configuration
  @ApiProperty()
  documentTitle: string;

  @ApiProperty({ nullable: true })
  logoUrl?: string;

  @ApiProperty()
  logoAlt: string;

  // Favicons
  @ApiProperty({ nullable: true })
  favicon32x32?: string;

  @ApiProperty({ nullable: true })
  favicon16x16?: string;

  @ApiProperty({ nullable: true })
  appleTouch?: string;

  // Theme Colors (Light theme)
  @ApiProperty()
  primaryMain: string;

  @ApiProperty()
  primaryLight: string;

  @ApiProperty()
  primaryDark: string;

  @ApiProperty()
  primaryContrast: string;

  @ApiProperty()
  secondaryMain: string;

  @ApiProperty()
  secondaryLight: string;

  @ApiProperty()
  secondaryDark: string;

  @ApiProperty()
  secondaryContrast: string;

  @ApiProperty()
  backgroundColor: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
