import { ApiProperty } from '@nestjs/swagger';

export class TimeSlotDto {
  @ApiProperty({
    description: 'Time in HH:mm format',
    example: '10:30',
  })
  time: string;

  @ApiProperty({
    description: 'Whether this slot is available',
    example: true,
  })
  available: boolean;

  @ApiProperty({
    description:
      'Professional ID if specific professional, or "any" for aggregated',
    example: 'clg2a5d9i0004gtkb',
    required: false,
  })
  professionalId?: string;

  @ApiProperty({
    description: 'IANA timezone identifier (e.g., America/Sao_Paulo)',
    example: 'America/Sao_Paulo',
  })
  timezone: string;

  @ApiProperty({
    description: 'UTC offset in format +HH:mm or -HH:mm',
    example: '-03:00',
  })
  utcOffset: string;

  @ApiProperty({
    description: 'Full ISO 8601 timestamp with timezone offset',
    example: '2025-12-25T10:30:00-03:00',
    required: false,
  })
  isoTimestamp?: string;
}

export class AvailabilityResponseDto {
  @ApiProperty({
    description: 'Date in YYYY-MM-DD format',
    example: '2025-11-20',
  })
  date: string;

  @ApiProperty({
    description: 'Branch information',
    example: {
      id: 'clg2a5d9i0002gtkb',
      name: 'Downtown Location',
    },
  })
  branch: {
    id: string;
    name: string;
  };

  @ApiProperty({
    description: 'Service information',
    example: {
      id: 'clg2a5d9i0003gtkb',
      name: 'Haircut',
      duration: 30,
    },
  })
  service: {
    id: string;
    name: string;
    duration: number;
  };

  @ApiProperty({
    description: 'Available time slots',
    type: [TimeSlotDto],
  })
  availableSlots: TimeSlotDto[];
}
