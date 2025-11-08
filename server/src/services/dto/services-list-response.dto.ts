import { ApiProperty } from '@nestjs/swagger';
import { ServiceResponseDto } from './service-response.dto';

/**
 * DTO for paginated service list response
 */
export class ServicesListResponseDto {
  @ApiProperty({
    description: 'Array of services',
    type: [ServiceResponseDto],
  })
  services: ServiceResponseDto[];

  @ApiProperty({
    description: 'Total number of services',
    example: 25,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 500,
  })
  limit: number;
}
