import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerBookingDto {
  @ApiProperty({
    description: 'Branch ID where the service will be provided',
    example: 'clg2a5d9i0002gtkb',
  })
  @IsString()
  @IsNotEmpty()
  branchId: string;

  @ApiProperty({
    description: 'Service ID to be booked',
    example: 'clg2a5d9i0003gtkb',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiPropertyOptional({
    description:
      'Professional ID (optional, null means "any available professional")',
    example: 'clg2a5d9i0004gtkb',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  professionalId?: string | null;

  @ApiProperty({
    description: 'Scheduled date and time for the appointment (ISO 8601)',
    example: '2025-11-20T10:30:00.000Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;
}
