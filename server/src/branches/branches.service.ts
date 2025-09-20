import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Branch } from '@prisma/client';
import { DatabaseService } from '../database/database.service';
import { CountriesService } from '../countries/countries.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import {
  BranchResponseDto,
  BranchesListResponseDto,
} from './dto/branch-response.dto';

@Injectable()
export class BranchesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly countriesService: CountriesService,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<BranchResponseDto> {
    // Check if branch with same name already exists (excluding soft-deleted)
    const existing = await this.db.branch.findFirst({
      where: { name: createBranchDto.name, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Branch with this name already exists');
    }

    // Validate address format against country rules
    await this.countriesService.validateAddressFormat(
      createBranchDto.countryCode,
      createBranchDto,
    );

    // Get country to establish relationship
    const country = await this.countriesService.findByCode(
      createBranchDto.countryCode,
    );

    // Generate formatted address
    const formattedAddress = this.formatAddress(createBranchDto);

    const branch = await this.db.branch.create({
      data: {
        name: createBranchDto.name,
        countryCode: createBranchDto.countryCode,
        street: createBranchDto.street,
        unit: createBranchDto.unit || null,
        district: createBranchDto.district || null,
        city: createBranchDto.city,
        stateProvince: createBranchDto.stateProvince,
        postalCode: createBranchDto.postalCode,
        formattedAddress,
        phone: createBranchDto.phone,
        countryId: country.id,
        customerId: createBranchDto.customerId,
      },
      include: {
        country: true,
        customer: true,
      },
    });

    return this.mapToResponseDto(branch);
  }

  async findAll(): Promise<BranchesListResponseDto> {
    const branches = await this.db.branch.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' },
      include: {
        country: true,
        customer: true,
      },
    });

    return {
      branches: branches.map(branch => this.mapToResponseDto(branch)),
      total: branches.length,
    };
  }

  async findOne(id: string): Promise<BranchResponseDto> {
    const branch = await this.db.branch.findUnique({
      where: { id, deletedAt: null },
      include: {
        country: true,
        customer: true,
      },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return this.mapToResponseDto(branch);
  }

  async update(
    id: string,
    updateBranchDto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    // Check if branch exists and is not soft-deleted
    const existingBranch = await this.db.branch.findUnique({
      where: { id, deletedAt: null },
      include: { country: true },
    });

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    // Check if name is being updated and if it conflicts with another branch
    if (updateBranchDto.name && updateBranchDto.name !== existingBranch.name) {
      const nameConflict = await this.db.branch.findFirst({
        where: {
          name: updateBranchDto.name,
          id: { not: id },
          deletedAt: null,
        },
      });

      if (nameConflict) {
        throw new ConflictException('Branch with this name already exists');
      }
    }

    // Prepare update data
    const updateData: Partial<Branch> = { ...updateBranchDto };

    // If any address field is being updated, regenerate formatted address
    const addressFields: (keyof UpdateBranchDto)[] = [
      'countryCode',
      'street',
      'unit',
      'district',
      'city',
      'stateProvince',
      'postalCode',
    ];
    const hasAddressUpdate = addressFields.some(
      field => updateBranchDto[field] !== undefined,
    );

    if (hasAddressUpdate) {
      // Merge existing data with updates for formatting and validation
      const mergedData = {
        countryCode: updateBranchDto.countryCode || existingBranch.countryCode,
        street: updateBranchDto.street || existingBranch.street,
        unit:
          updateBranchDto.unit !== undefined
            ? updateBranchDto.unit
            : existingBranch.unit,
        district:
          updateBranchDto.district !== undefined
            ? updateBranchDto.district
            : existingBranch.district,
        city: updateBranchDto.city || existingBranch.city,
        stateProvince:
          updateBranchDto.stateProvince || existingBranch.stateProvince,
        postalCode: updateBranchDto.postalCode || existingBranch.postalCode,
      };

      // Validate address format if country is being changed or address is being updated
      await this.countriesService.validateAddressFormat(
        mergedData.countryCode,
        mergedData,
      );

      updateData.formattedAddress = this.formatAddress(mergedData);

      // Update country relationship if country code changed
      if (
        updateBranchDto.countryCode &&
        updateBranchDto.countryCode !== existingBranch.countryCode
      ) {
        const country = await this.countriesService.findByCode(
          updateBranchDto.countryCode,
        );
        updateData.countryId = country.id;
      }
    }

    const updatedBranch = await this.db.branch.update({
      where: { id },
      data: updateData,
      include: {
        country: true,
        customer: true,
      },
    });

    return this.mapToResponseDto(updatedBranch);
  }

  async remove(id: string): Promise<void> {
    // Check if branch exists and is not soft-deleted
    const existingBranch = await this.db.branch.findUnique({
      where: { id, deletedAt: null },
      include: {
        professionals: {
          where: { isActive: true },
        },
        bookings: true,
        servicePricing: true,
      },
    });

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    // Check if branch has associated data that would prevent deletion
    if (existingBranch.professionals.length > 0) {
      throw new ConflictException(
        'Cannot delete branch with associated professionals',
      );
    }

    if (existingBranch.bookings.length > 0) {
      throw new ConflictException(
        'Cannot delete branch with existing bookings',
      );
    }

    if (existingBranch.servicePricing.length > 0) {
      throw new ConflictException(
        'Cannot delete branch with service pricing configurations',
      );
    }

    // Soft delete the branch
    await this.db.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  private mapToResponseDto(
    branch: Branch & { customer?: { name: string } },
  ): BranchResponseDto {
    return {
      id: branch.id,
      name: branch.name,
      countryCode: branch.countryCode,
      street: branch.street,
      unit: branch.unit,
      district: branch.district,
      city: branch.city,
      stateProvince: branch.stateProvince,
      postalCode: branch.postalCode,
      formattedAddress: branch.formattedAddress,
      phone: branch.phone,
      customerId: branch.customerId,
      customerName: branch.customer?.name || '',
      createdAt: branch.createdAt,
      deletedAt: branch.deletedAt,
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

  /**
   * Customer-scoped branch operations
   */
  async findByCustomer(customerId: string): Promise<BranchesListResponseDto> {
    const branches = await this.db.branch.findMany({
      where: {
        customerId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'asc' },
      include: {
        country: true,
        customer: true,
      },
    });

    return {
      branches: branches.map(branch => this.mapToResponseDto(branch)),
      total: branches.length,
    };
  }

  async findOneByCustomer(
    id: string,
    customerId: string,
  ): Promise<BranchResponseDto> {
    const branch = await this.db.branch.findUnique({
      where: {
        id,
        customerId,
        deletedAt: null,
      },
      include: {
        country: true,
        customer: true,
      },
    });

    if (!branch) {
      throw new NotFoundException(
        `Branch with ID ${id} not found in customer context`,
      );
    }

    return this.mapToResponseDto(branch);
  }

  /**
   * Customer-scoped CRUD operations
   */
  async createByCustomer(
    createBranchDto: Omit<CreateBranchDto, 'customerId'>,
    customerId: string,
  ): Promise<BranchResponseDto> {
    // Check if branch with same name already exists for this customer (excluding soft-deleted)
    const existing = await this.db.branch.findFirst({
      where: {
        name: createBranchDto.name,
        customerId,
        deletedAt: null,
      },
    });

    if (existing) {
      throw new ConflictException(
        'Branch with this name already exists for this customer',
      );
    }

    // Create branch with customer context
    const fullCreateDto: CreateBranchDto = {
      ...createBranchDto,
      customerId,
    };

    return this.create(fullCreateDto);
  }

  async updateByCustomer(
    id: string,
    updateBranchDto: UpdateBranchDto,
    customerId: string,
  ): Promise<BranchResponseDto> {
    // Verify branch belongs to customer and is not soft-deleted
    const existingBranch = await this.db.branch.findFirst({
      where: { id, customerId, deletedAt: null },
    });

    if (!existingBranch) {
      throw new NotFoundException(
        `Branch with ID ${id} not found for this customer`,
      );
    }

    // Check for name conflicts within customer scope (excluding soft-deleted)
    if (updateBranchDto.name) {
      const nameConflict = await this.db.branch.findFirst({
        where: {
          name: updateBranchDto.name,
          customerId,
          deletedAt: null,
          NOT: { id },
        },
      });

      if (nameConflict) {
        throw new ConflictException(
          'Branch with this name already exists for this customer',
        );
      }
    }

    return this.update(id, updateBranchDto);
  }

  async removeByCustomer(id: string, customerId: string): Promise<void> {
    // Verify branch belongs to customer and is not already soft-deleted
    const existingBranch = await this.db.branch.findFirst({
      where: { id, customerId, deletedAt: null },
    });

    if (!existingBranch) {
      throw new NotFoundException(
        `Branch with ID ${id} not found for this customer`,
      );
    }

    // Use the existing remove method which implements soft-delete
    return this.remove(id);
  }
}
