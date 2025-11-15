import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class UpdateBookingDto {
  @ApiPropertyOptional({
    description: 'Booking status',
    enum: BookingStatus,
    example: 'CONFIRMED',
  })
  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @ApiPropertyOptional({
    description: 'Reschedule to a new date and time (ISO 8601)',
    example: '2025-11-20T15:30:00.000Z',
  })
  @IsDateString()
  @IsOptional()
  scheduledAt?: string;

  @ApiPropertyOptional({
    description: 'Change assigned professional (or set to null for any)',
    example: 'clg2a5d9i0004gtkb',
    nullable: true,
  })
  @IsString()
  @IsOptional()
  professionalId?: string | null;
}
