import { ApiProperty } from '@nestjs/swagger';

export class Tenant {
  @ApiProperty({
    description: 'Unique identifier for the tenant',
    example: 'clm1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the tenant/branch location',
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
    description: 'Timestamp when the tenant was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}
