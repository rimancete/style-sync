import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({
    description: 'Name of the tenant/branch location',
    example: 'Unidade 1',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Country code (ISO 3166-1 alpha-2)',
    example: 'US',
    minLength: 2,
    maxLength: 2,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(2)
  countryCode: string;

  @ApiProperty({
    description: 'Street address',
    example: '123 Main Street',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  street: string;

  @ApiProperty({
    description: 'Unit/Apartment/Suite number',
    example: 'Apt 4B',
    required: false,
    maxLength: 20,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  unit?: string;

  @ApiProperty({
    description: 'District/Neighborhood area',
    example: 'Manhattan',
    required: false,
    maxLength: 50,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  district?: string;

  @ApiProperty({
    description: 'City name',
    example: 'New York',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  city: string;

  @ApiProperty({
    description: 'State/Province/Region',
    example: 'NY',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  stateProvince: string;

  @ApiProperty({
    description: 'Postal/ZIP code',
    example: '10001',
    minLength: 3,
    maxLength: 15,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(15)
  postalCode: string;

  @ApiProperty({
    description: 'Contact phone number for the branch',
    example: '(11) 99999-9999',
    minLength: 10,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(20)
  phone: string;
}
