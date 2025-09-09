import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Tenant } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CountriesService } from '../countries/countries.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  TenantResponseDto,
  TenantsListResponseDto,
} from './dto/tenant-response.dto';

@Injectable()
export class TenantsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly countriesService: CountriesService,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<TenantResponseDto> {
    // Check if tenant with same name already exists (excluding soft-deleted)
    const existing = await this.db.tenant.findFirst({
      where: { name: createTenantDto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Tenant with this name already exists');
    }

    // Validate address format against country rules
    await this.countriesService.validateAddressFormat(
      createTenantDto.countryCode,
      createTenantDto,
    );

    // Get country to establish relationship
    const country = await this.countriesService.findByCode(
      createTenantDto.countryCode,
    );

    // Generate formatted address
    const formattedAddress = this.formatAddress(createTenantDto);

    const tenant = await this.db.tenant.create({
      data: {
        name: createTenantDto.name,
        countryCode: createTenantDto.countryCode,
        street: createTenantDto.street,
        unit: createTenantDto.unit || null,
        district: createTenantDto.district || null,
        city: createTenantDto.city,
        stateProvince: createTenantDto.stateProvince,
        postalCode: createTenantDto.postalCode,
        formattedAddress,
        phone: createTenantDto.phone,
        countryId: country.id,
      },
      include: {
        country: true,
      },
    });

    return this.mapToResponseDto(tenant);
  }

  async findAll(): Promise<TenantsListResponseDto> {
    const tenants = await this.db.tenant.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: { country: true },
    });

    return {
      tenants: tenants.map(tenant => this.mapToResponseDto(tenant)),
      total: tenants.length,
    };
  }

  async findOne(id: string): Promise<TenantResponseDto> {
    const tenant = await this.db.tenant.findUnique({
      where: { id, deletedAt: null },
      include: { country: true },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return this.mapToResponseDto(tenant);
  }

  async update(
    id: string,
    updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    // Check if tenant exists and is not soft-deleted
    const existingTenant = await this.db.tenant.findUnique({
      where: { id, deletedAt: null },
      include: { country: true },
    });

    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Check if name is being updated and if it conflicts with another tenant
    if (updateTenantDto.name && updateTenantDto.name !== existingTenant.name) {
      const nameConflict = await this.db.tenant.findFirst({
        where: {
          name: updateTenantDto.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (nameConflict) {
        throw new ConflictException('Tenant with this name already exists');
      }
    }

    // Prepare update data
    const updateData: Partial<Tenant> = { ...updateTenantDto };

    // If any address field is being updated, regenerate formatted address
    const addressFields: (keyof UpdateTenantDto)[] = [
      'countryCode',
      'street',
      'unit',
      'district',
      'city',
      'stateProvince',
      'postalCode',
    ];
    const hasAddressUpdate = addressFields.some(
      field => updateTenantDto[field] !== undefined,
    );

    if (hasAddressUpdate) {
      // Merge existing data with updates for formatting and validation
      const mergedData = {
        countryCode: updateTenantDto.countryCode || existingTenant.countryCode,
        street: updateTenantDto.street || existingTenant.street,
        unit:
          updateTenantDto.unit !== undefined
            ? updateTenantDto.unit
            : existingTenant.unit,
        district:
          updateTenantDto.district !== undefined
            ? updateTenantDto.district
            : existingTenant.district,
        city: updateTenantDto.city || existingTenant.city,
        stateProvince:
          updateTenantDto.stateProvince || existingTenant.stateProvince,
        postalCode: updateTenantDto.postalCode || existingTenant.postalCode,
      };

      // Validate address format if country is being changed or address is being updated
      await this.countriesService.validateAddressFormat(
        mergedData.countryCode,
        mergedData,
      );

      updateData.formattedAddress = this.formatAddress(mergedData);

      // Update country relationship if country code changed
      if (
        updateTenantDto.countryCode &&
        updateTenantDto.countryCode !== existingTenant.countryCode
      ) {
        const country = await this.countriesService.findByCode(
          updateTenantDto.countryCode,
        );
        updateData.countryId = country.id;
      }
    }

    const updatedTenant = await this.db.tenant.update({
      where: { id },
      data: updateData,
    });

    return this.mapToResponseDto(updatedTenant);
  }

  async remove(id: string): Promise<void> {
    // Check if tenant exists and is not soft-deleted
    const existingTenant = await this.db.tenant.findUnique({
      where: { id, deletedAt: null },
      include: {
        professionals: {
          where: { isActive: true },
        },
        bookings: true,
        servicePricing: true,
      },
    });

    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    // Check if tenant has associated data that would prevent deletion
    if (existingTenant.professionals.length > 0) {
      throw new ConflictException(
        'Cannot delete tenant with associated professionals',
      );
    }

    if (existingTenant.bookings.length > 0) {
      throw new ConflictException(
        'Cannot delete tenant with existing bookings',
      );
    }

    if (existingTenant.servicePricing.length > 0) {
      throw new ConflictException(
        'Cannot delete tenant with service pricing configurations',
      );
    }

    // Soft delete the tenant
    await this.db.tenant.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToResponseDto(tenant: Tenant): TenantResponseDto {
    return {
      id: tenant.id,
      name: tenant.name,
      countryCode: tenant.countryCode,
      street: tenant.street,
      unit: tenant.unit,
      district: tenant.district,
      city: tenant.city,
      stateProvince: tenant.stateProvince,
      postalCode: tenant.postalCode,
      formattedAddress: tenant.formattedAddress,
      phone: tenant.phone,
      createdAt: tenant.createdAt,
      deletedAt: tenant.deletedAt,
    };
  }

  private formatAddress(addressData: {
    countryCode: string;
    street: string;
    unit?: string | null;
    district?: string | null;
    city: string;
    stateProvince: string;
    postalCode: string;
  }): string {
    const parts = [];

    // Street with unit
    let streetPart = addressData.street;
    if (addressData.unit) {
      streetPart += `, ${addressData.unit}`;
    }
    parts.push(streetPart);

    // District (if present)
    if (addressData.district) {
      parts.push(addressData.district);
    }

    // City, State PostalCode
    parts.push(
      `${addressData.city}, ${addressData.stateProvince} ${addressData.postalCode}`,
    );

    // Country
    parts.push(addressData.countryCode);

    return parts.join(', ');
  }
}
