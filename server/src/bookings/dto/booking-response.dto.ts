import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class BookingResponseDto {
  @ApiProperty({
    description: 'Booking ID (CUID)',
    example: 'clg2a5d9i0001gtkb',
  })
  id: string;

  @ApiProperty({
    description: 'Display ID (user-friendly)',
    example: 42,
  })
  displayId: number;

  @ApiProperty({
    description: 'User ID',
    example: 'clg2a5d9i0005gtkb',
  })
  userId: string;

  @ApiProperty({
    description: 'User name',
    example: 'John Doe',
  })
  userName: string;

  @ApiProperty({
    description: 'Customer ID',
    example: 'clg2a5d9i0006gtkb',
  })
  customerId: string;

  @ApiProperty({
    description: 'Branch ID',
    example: 'clg2a5d9i0002gtkb',
  })
  branchId: string;

  @ApiProperty({
    description: 'Branch name',
    example: 'Downtown Location',
  })
  branchName: string;

  @ApiProperty({
    description: 'Service ID',
    example: 'clg2a5d9i0003gtkb',
  })
  serviceId: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
  })
  serviceName: string;

  @ApiPropertyOptional({
    description: 'Professional ID (null if "any available")',
    example: 'clg2a5d9i0004gtkb',
    nullable: true,
  })
  professionalId: string | null;

  @ApiPropertyOptional({
    description: 'Professional name (null if not assigned)',
    example: 'Mike Johnson',
    nullable: true,
  })
  professionalName: string | null;

  @ApiProperty({
    description: 'Scheduled date and time',
    example: '2025-11-20T10:30:00.000Z',
  })
  scheduledAt: Date;

  @ApiProperty({
    description: 'Booking status',
    enum: BookingStatus,
    example: 'CONFIRMED',
  })
  status: BookingStatus;

  @ApiProperty({
    description: 'Total price (formatted as string)',
    example: '25.00',
  })
  totalPrice: string;

  @ApiProperty({
    description: 'Currency code',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp (null if never updated)',
    example: '2025-11-15T10:00:00.000Z',
    nullable: true,
  })
  updatedAt: Date | null;
}
