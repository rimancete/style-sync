import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  MinLength,
  MaxLength,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
} from 'class-validator';

/**
 * DTO for updating a service
 * All fields are optional (partial update)
 */
export class UpdateServiceDto {
  @ApiPropertyOptional({
    description: 'Service name',
    example: 'Premium Haircut',
    minLength: 2,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: "Premium men's haircut with styling consultation",
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Service duration in minutes',
    example: 45,
    minimum: 5,
    maximum: 480,
  })
  @IsOptional()
  @IsInt()
  @Min(5, { message: 'Duration must be at least 5 minutes' })
  @Max(480, { message: 'Duration cannot exceed 480 minutes (8 hours)' })
  duration?: number;

  @ApiPropertyOptional({
    description: 'Whether the service is active',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
