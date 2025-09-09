import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsObject,
} from 'class-validator';

export class CreateCountryDto {
  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code (must be unique)',
    example: 'BR',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  code: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Brazil',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Address format configuration for the country',
    example: {
      fields: [
        'street',
        'unit',
        'district',
        'city',
        'stateProvince',
        'postalCode',
      ],
      required: ['street', 'city', 'stateProvince', 'postalCode'],
      validation: {
        postalCode: '^[0-9]{5}-?[0-9]{3}$',
        stateProvince: ['SP', 'RJ', 'MG'],
      },
      labels: {
        street: 'Logradouro',
        unit: 'Número/Apartamento',
        district: 'Bairro',
        city: 'Cidade',
        stateProvince: 'Estado',
        postalCode: 'CEP',
      },
    },
  })
  @IsObject()
  @IsNotEmpty()
  addressFormat: {
    fields: string[];
    required: string[];
    validation: Record<string, any>;
    labels: Record<string, string>;
  };
}
