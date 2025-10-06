import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsBoolean,
  IsOptional,
  IsArray,
} from 'class-validator';

export class CreateProfessionalDto {
  @ApiProperty({
    description: 'Name of the professional',
    example: 'João Silva',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description:
      'Professional document ID (e.g., CPF in Brazil, SSN in US, professional license number)',
    example: '123.456.789-00',
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  documentId?: string;

  @ApiPropertyOptional({
    description: 'Whether the professional is active',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    description: 'Customer ID this professional belongs to',
    example: 'customer-123',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;

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
