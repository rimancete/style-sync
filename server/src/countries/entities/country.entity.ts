import { ApiProperty } from '@nestjs/swagger';

export class Country {
  @ApiProperty({
    description: 'Unique identifier for the country',
    example: 'clm1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'BR',
  })
  code: string;

  @ApiProperty({
    description: 'Country name',
    example: 'Brazil',
  })
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
        stateProvince: [
          'SP',
          'RJ',
          'MG',
          'RS',
          'PR',
          'SC',
          'GO',
          'MS',
          'MT',
          'ES',
          'RJ',
          'BA',
          'SE',
          'AL',
          'PE',
          'PB',
          'RN',
          'CE',
          'PI',
          'MA',
          'PA',
          'AP',
          'AM',
          'RO',
          'AC',
          'TO',
          'DF',
        ],
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
  addressFormat: any;

  @ApiProperty({
    description: 'Timestamp when the country was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}
