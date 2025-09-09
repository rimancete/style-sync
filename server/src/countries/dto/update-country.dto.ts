import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateCountryDto } from './create-country.dto';

export class UpdateCountryDto extends PartialType(CreateCountryDto) {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'US',
    minLength: 2,
    maxLength: 2,
    required: false,
  })
  code?: string;

  @ApiProperty({
    description: 'Country name',
    example: 'United States',
    minLength: 2,
    maxLength: 100,
    required: false,
  })
  name?: string;

  @ApiProperty({
    description: 'Address format configuration for the country',
    example: {
      fields: ['street', 'unit', 'city', 'stateProvince', 'postalCode'],
      required: ['street', 'city', 'stateProvince', 'postalCode'],
      validation: {
        postalCode: '^\\d{5}(-\\d{4})?$',
        stateProvince: ['AL', 'AK', 'AZ'],
      },
      labels: {
        street: 'Street Address',
        unit: 'Apt/Suite',
        city: 'City',
        stateProvince: 'State',
        postalCode: 'ZIP Code',
      },
    },
    required: false,
  })
  addressFormat?: {
    fields: string[];
    required: string[];
    validation: Record<string, any>;
    labels: Record<string, string>;
  };
}
