import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsObject } from 'class-validator';

export class UpdateCustomerBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoAlt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsObject()
  theme?: {
    light?: {
      primary?: {
        main?: string;
        light?: string;
        dark?: string;
        contrast?: string;
      };
      secondary?: {
        main?: string;
        light?: string;
        dark?: string;
        contrast?: string;
      };
      background?: string;
    };
  };
}
