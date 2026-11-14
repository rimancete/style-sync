import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ThemeConfigDto } from './theme-config.dto';

/**
 * DTO for the JSON config field in multipart form data
 * Used for initial branding setup with files
 */
export class CreateCustomerBrandingConfigDto {
  @ApiProperty({
    required: false,
    description: 'Document title for the customer website',
  })
  @IsOptional()
  @IsString()
  documentTitle?: string;

  @ApiProperty({
    required: false,
    description: 'Alt text for the logo image',
  })
  @IsOptional()
  @IsString()
  logoAlt?: string;

  @ApiProperty({
    required: false,
    type: ThemeConfigDto,
    description: 'Light and dark palettes',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  theme?: ThemeConfigDto;
}

/**
 * DTO for file upload operations
 * This represents the multipart form data structure
 */
export class CreateCustomerBrandingDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Logo image file (PNG, JPG, JPEG, SVG, WebP - max 5MB)',
  })
  logo?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: '32x32 favicon file (ICO, PNG - max 1MB)',
  })
  favicon32x32?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: '16x16 favicon file (ICO, PNG - max 1MB)',
  })
  favicon16x16?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Apple touch icon file (PNG, JPG, JPEG - max 2MB)',
  })
  appleTouch?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    required: false,
    description: 'JSON string containing branding configuration',
    example:
      '{"documentTitle": "My Barbershop", "logoAlt": "My Logo", "theme": {"light": {"primary": {"main": "#272726FF"}}}}',
  })
  config?: string; // JSON string that will be parsed to CreateCustomerBrandingConfigDto
}

/**
 * DTO for file-only updates (no config changes)
 */
export class UpdateCustomerBrandingFilesDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Logo image file (PNG, JPG, JPEG, SVG, WebP - max 5MB)',
  })
  logo?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: '32x32 favicon file (ICO, PNG - max 1MB)',
  })
  favicon32x32?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: '16x16 favicon file (ICO, PNG - max 1MB)',
  })
  favicon16x16?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    required: false,
    description: 'Apple touch icon file (PNG, JPG, JPEG - max 2MB)',
  })
  appleTouch?: Express.Multer.File;
}
