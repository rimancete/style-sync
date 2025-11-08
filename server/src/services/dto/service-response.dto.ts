import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for service response
 * Represents a single service in API responses
 */
export class ServiceResponseDto {
  @ApiProperty({
    description: 'Service unique identifier (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  id: string;

  @ApiProperty({
    description: 'Service display ID (auto-increment)',
    example: 42,
  })
  displayId: number;

  @ApiProperty({
    description: 'Service name',
    example: 'Haircut',
  })
  name: string;

  @ApiPropertyOptional({
    description: 'Service description',
    example: "Classic men's haircut with styling",
    nullable: true,
  })
  description: string | null;

  @ApiProperty({
    description: 'Service duration in minutes',
    example: 30,
  })
  duration: number;

  @ApiProperty({
    description: 'Whether the service is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Customer ID this service belongs to',
    example: 'clg2a5d9i0002gtkb',
  })
  customerId: string;

  @ApiPropertyOptional({
    description: 'Customer name (included when available)',
    example: 'Acme Barbershop',
  })
  customerName?: string;

  @ApiProperty({
    description: 'Service creation timestamp',
    example: '2025-10-25T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Service last update timestamp (null if never updated)',
    example: '2025-10-25T10:00:00.000Z',
    nullable: true,
  })
  updatedAt: Date | null;

  @ApiPropertyOptional({
    description:
      'Service pricing for specific branch (when branchId query param provided)',
    example: {
      branchId: 'branch_123',
      branchName: 'Downtown',
      price: '25.00',
      currency: 'USD',
    },
    nullable: true,
  })
  pricing?: {
    branchId: string;
    branchName: string;
    price: string;
    currency: string;
  } | null;
}
