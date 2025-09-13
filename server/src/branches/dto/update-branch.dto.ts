import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateBranchDto } from './create-branch.dto';

export class UpdateBranchDto extends PartialType(CreateBranchDto) {
  @ApiProperty({
    description: 'Name of the branch location',
    example: 'Unidade 1 - Centro',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
    minLength: 2,
    maxLength: 2,
    required: false,
  })
  countryCode?: string;

  @ApiProperty({
    description: 'Street address',
    example: '456 Main Street',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  street?: string;

  @ApiProperty({
    description: 'Unit/Apartment/Suite number',
    example: 'Suite 5C',
    maxLength: 20,
    required: false,
  })
  unit?: string;

  @ApiProperty({
    description: 'District/Neighborhood area',
    example: 'Downtown',
    maxLength: 50,
    required: false,
  })
  district?: string;

  @ApiProperty({
    description: 'City name',
    example: 'Los Angeles',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  city?: string;

  @ApiProperty({
    description: 'State/Province/Region',
    example: 'CA',
    minLength: 2,
    maxLength: 50,
    required: false,
  })
  stateProvince?: string;

  @ApiProperty({
    description: 'Postal/ZIP code',
    example: '90210',
    minLength: 3,
    maxLength: 15,
    required: false,
  })
  postalCode?: string;

  @ApiProperty({
    description: 'Contact phone number for the branch',
    example: '(11) 88888-8888',
    minLength: 10,
    maxLength: 20,
    required: false,
  })
  phone?: string;
}
