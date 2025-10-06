import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';
import { CreateProfessionalDto } from './create-professional.dto';

export class UpdateProfessionalDto extends PartialType(CreateProfessionalDto) {
  @ApiPropertyOptional({
    description: 'Name of the professional',
    example: 'João Silva',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Whether the professional is active',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Branch IDs this professional works at',
    example: ['branch-1', 'branch-2'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  branchIds?: string[];
}
