import { ApiProperty } from '@nestjs/swagger';

export class BranchResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the branch',
    example: 'clm1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Sequential display ID for user-friendly reference',
    example: 1,
  })
  displayId: number;

  @ApiProperty({
    description: 'Name of the branch location',
    example: 'Unidade 1',
  })
  name: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
  })
  countryCode: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
  })
  street: string;

  @ApiProperty({
    description: 'Unit/Apartment/Suite number',
    example: 'Apt 4B',
    nullable: true,
  })
  unit: string | null;

  @ApiProperty({
    description: 'District/Neighborhood area',
    example: 'Manhattan',
    nullable: true,
  })
  district: string | null;

  @ApiProperty({
    description: 'City name',
    example: 'New York',
  })
  city: string;

  @ApiProperty({
    description: 'State/Province/Region',
    example: 'NY',
  })
  stateProvince: string;

  @ApiProperty({
    description: 'Postal/ZIP code',
    example: '10001',
  })
  postalCode: string;

  @ApiProperty({
    description: 'Complete formatted address for display',
    example: '123 Main Street, Apt 4B, Manhattan, New York, NY 10001, US',
  })
  formattedAddress: string;

  @ApiProperty({
    description: 'Contact phone number for the branch',
    example: '(11) 99999-9999',
  })
  phone: string;

  @ApiProperty({
    description: 'Customer ID that owns this branch',
    example: 'clm1234567890abcdef',
  })
  customerId: string;

  @ApiProperty({
    description: 'Customer name that owns this branch',
    example: 'Acme Beauty Salon',
  })
  customerName: string;

  @ApiProperty({
    description: 'Timestamp when the branch was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the branch was soft-deleted (null if active)',
    example: null,
    nullable: true,
  })
  deletedAt: Date | null;
}

export class BranchesListResponseDto {
  @ApiProperty({
    description: 'List of branches',
    type: [BranchResponseDto],
  })
  branches: BranchResponseDto[];

  @ApiProperty({
    description: 'Total number of branches',
    example: 2,
  })
  total: number;

  @ApiProperty({
    description: 'Current page (for pagination)',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 500,
  })
  limit: number;
}
