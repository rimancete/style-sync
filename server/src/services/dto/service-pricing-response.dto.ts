import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for service pricing response
 */
export class ServicePricingResponseDto {
  @ApiProperty({
    description: 'Pricing unique identifier (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  id: string;

  @ApiProperty({
    description: 'Pricing display ID (auto-increment)',
    example: 5,
  })
  displayId: number;

  @ApiProperty({
    description: 'Service ID',
    example: 'clg2a5d9i0002gtkb',
  })
  serviceId: string;

  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
  })
  serviceName: string;

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
    description: 'Service price (decimal string)',
    example: '25.00',
  })
  price: string;

  @ApiProperty({
    description: 'Currency code (ISO 4217) from customer configuration',
    example: 'USD',
  })
  currency: string;

  @ApiProperty({
    description: 'Pricing creation timestamp',
    example: '2025-10-25T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Pricing last update timestamp (null if never updated)',
    example: '2025-10-25T12:00:00.000Z',
    nullable: true,
  })
  updatedAt: Date | null;
}
