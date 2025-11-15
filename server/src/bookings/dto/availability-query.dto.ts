import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AvailabilityQueryDto {
  @ApiProperty({
    description: 'Branch ID',
    example: 'clg2a5d9i0002gtkb',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    description: 'Service ID',
    example: 'clg2a5d9i0003gtkb',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2025-11-20',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'Date must be in YYYY-MM-DD format',
  })
  date: string;

  @ApiPropertyOptional({
    description:
      'Professional ID (optional, if omitted shows aggregated availability)',
    example: 'clg2a5d9i0004gtkb',
  })
  @IsString()
  @IsOptional()
  professionalId?: string;
}
