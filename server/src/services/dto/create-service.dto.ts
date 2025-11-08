import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

/**
 * DTO for creating a service (Admin operation)
 * Includes customerId for admin-level service creation
 */
export class CreateServiceDto {
  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: "Classic men's haircut with styling",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 30,
    minimum: 5,
    maximum: 480,
  })
  @IsInt()
  @Min(5, { message: 'Duration must be at least 5 minutes' })
  @Max(480, { message: 'Duration cannot exceed 480 minutes (8 hours)' })
  duration: number;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    description: 'Customer ID this service belongs to',
    example: 'clg2a5d9i0002gtkb',
  })
  @IsString()
  @IsNotEmpty()
  customerId: string;
}
