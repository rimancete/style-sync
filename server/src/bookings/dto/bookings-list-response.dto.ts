import { ApiProperty } from '@nestjs/swagger';
import { BookingResponseDto } from './booking-response.dto';

export class BookingsListResponseDto {
  @ApiProperty({
    description: 'List of bookings',
    type: [BookingResponseDto],
  })
  bookings: BookingResponseDto[];

  @ApiProperty({
    description: 'Total number of bookings',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 500,
  })
  limit: number;
}
