import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { JsonValue } from '@prisma/client/runtime/library';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import {
  CountryResponseDto,
  CountriesListResponseDto,
} from './dto/country-response.dto';

interface AddressData {
  street?: string;
  unit?: string | null;
  district?: string | null;
  city?: string;
  stateProvince?: string;
  postalCode?: string;
  countryCode?: string;
}

@Injectable()
export class CountriesService {
  constructor(private readonly db: DatabaseService) {}

  async create(
    createCountryDto: CreateCountryDto,
  ): Promise<CountryResponseDto> {
    // Check if country code or name already exists
    const existingCode = await this.db.country.findUnique({
      where: { code: createCountryDto.code },
    });

    if (existingCode) {
      throw new ConflictException('Country with this code already exists');
    }

    const existingName = await this.db.country.findFirst({
      where: { name: createCountryDto.name },
    });

    if (existingName) {
      throw new ConflictException('Country with this name already exists');
    }

    const country = await this.db.country.create({
      data: {
        code: createCountryDto.code,
        name: createCountryDto.name,
        addressFormat: createCountryDto.addressFormat,
      },
    });

    return this.mapToResponseDto(country);
  }

  async findAll(): Promise<CountriesListResponseDto> {
    const countries = await this.db.country.findMany({
      orderBy: { name: 'asc' },
    });

    return {
      countries: countries.map(country => this.mapToResponseDto(country)),
      total: countries.length,
    };
  }

  async findOne(id: string): Promise<CountryResponseDto> {
    const country = await this.db.country.findUnique({
      where: { id },
    });

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    return this.mapToResponseDto(country);
  }

  async findByCode(code: string): Promise<CountryResponseDto> {
    const country = await this.db.country.findUnique({
      where: { code },
    });

    if (!country) {
      throw new NotFoundException(`Country with code ${code} not found`);
    }

    return this.mapToResponseDto(country);
  }

  async update(
    id: string,
    updateCountryDto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
    // Check if country exists
    const existingCountry = await this.db.country.findUnique({
      where: { id },
    });

    if (!existingCountry) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // Check if code is being updated and if it conflicts with another country
    if (
      updateCountryDto.code &&
      updateCountryDto.code !== existingCountry.code
    ) {
      const codeConflict = await this.db.country.findFirst({
        where: {
          code: updateCountryDto.code,
          id: { not: id },
        },
      });

      if (codeConflict) {
        throw new ConflictException('Country with this code already exists');
      }
    }

    // Check if name is being updated and if it conflicts with another country
    if (
      updateCountryDto.name &&
      updateCountryDto.name !== existingCountry.name
    ) {
      const nameConflict = await this.db.country.findFirst({
        where: {
          name: updateCountryDto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException('Country with this name already exists');
      }
    }

    const updatedCountry = await this.db.country.update({
      where: { id },
      data: updateCountryDto,
    });

    return this.mapToResponseDto(updatedCountry);
  }

  async remove(id: string): Promise<void> {
    // Check if country exists
    const existingCountry = await this.db.country.findUnique({
      where: { id },
      include: {
        tenants: true,
      },
    });

    if (!existingCountry) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    // Check if country has associated tenants
    if (existingCountry.tenants.length > 0) {
      throw new ConflictException(
        'Cannot delete country with associated tenants',
      );
    }

    await this.db.country.delete({
      where: { id },
    });
  }

  async validateAddressFormat(
    countryCode: string,
    addressData: AddressData,
  ): Promise<void> {
    const country = await this.findByCode(countryCode);

    // Cast addressFormat to proper type for validation
    const addressFormat = country.addressFormat as {
      fields: string[];
      required: string[];
      validation: Record<string, string | string[]>;
      labels: Record<string, string>;
    };

    // Check required fields
    const requiredFields = addressFormat.required;
    for (const field of requiredFields) {
      const fieldValue = (addressData as Record<string, unknown>)[
        field
      ] as string;
      if (!fieldValue || fieldValue.trim() === '') {
        throw new BadRequestException(`The ${field} field is required.`);
      }
    }

    // Validate field formats if validation rules exist
    const validation = addressFormat.validation;
    for (const [field, rule] of Object.entries(validation)) {
      const fieldValue = (addressData as Record<string, unknown>)[
        field
      ] as string;
      if (fieldValue) {
        if (typeof rule === 'string') {
          const regex = new RegExp(rule);
          if (!regex.test(fieldValue)) {
            if (field === 'postalCode') {
              const countryName = country.name;
              const postalLabel =
                countryName === 'United States' ? 'ZIP code' : 'postal code';
              throw new BadRequestException(
                `The ${postalLabel} format is invalid.`,
              );
            } else {
              throw new BadRequestException(`The ${field} format is invalid.`);
            }
          }
        } else if (Array.isArray(rule)) {
          if (!rule.includes(fieldValue)) {
            if (field === 'stateProvince') {
              const countryName = country.name;
              const stateLabel =
                countryName === 'United States' ? 'state' : 'state/province';
              throw new BadRequestException(`The ${stateLabel} is invalid.`);
            } else {
              throw new BadRequestException(`The ${field} value is invalid.`);
            }
          }
        }
      }
    }
  }

  private mapToResponseDto(country: {
    id: string;
    code: string;
    name: string;
    addressFormat: JsonValue;
    createdAt: Date;
  }): CountryResponseDto {
    return {
      id: country.id,
      code: country.code,
      name: country.name,
      addressFormat: country.addressFormat as {
        fields: string[];
        required: string[];
        validation: Record<string, string | string[]>;
        labels: Record<string, string>;
      },
      createdAt: country.createdAt,
    };
  }
}
