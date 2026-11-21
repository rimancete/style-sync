import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ThemeConfigDto } from './theme-config.dto';

export class UpdateCustomerBrandingDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  documentTitle?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  logoAlt?: string;

  @ApiProperty({ required: false, type: ThemeConfigDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ThemeConfigDto)
  theme?: ThemeConfigDto;
}
