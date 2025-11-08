import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateCustomerServiceDto } from './dto/create-customer-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServicesListResponseDto } from './dto/services-list-response.dto';
import { ServicePricingResponseDto } from './dto/service-pricing-response.dto';
import { ServiceEntity } from './entities/service.entity';
import { ServicePricingEntity } from './entities/service-pricing.entity';

@Injectable()
export class ServicesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Find all services (admin operation, cross-customer)
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 500)
   * @param isActive - Filter by active status (optional)
   */
  async findAll(
    page = 1,
    limit = 500,
    isActive?: boolean,
  ): Promise<ServicesListResponseDto> {
    const skip = (page - 1) * limit;

    const whereClause = isActive !== undefined ? { isActive } : {};

    const [services, total] = await Promise.all([
      this.db.service.findMany({
        where: whereClause,
        skip,
        take: limit,
        orderBy: [{ displayId: 'asc' }, { name: 'asc' }],
        include: {
          customer: {
            select: {
              name: true,
              currency: true,
            },
          },
        },
      }),
      this.db.service.count({ where: whereClause }),
    ]);

    return {
      services: ServiceEntity.fromPrismaList(services),
      total,
      page,
      limit,
    };
  }

  /**
   * Find all services for a specific customer
   * @param customerId - Customer ID to filter by
   * @param page - Page number (default: 1)
   * @param limit - Items per page (default: 500)
   * @param isActive - Filter by active status (default: true)
   * @param branchId - Optional branch ID to include pricing
   */
  async findByCustomer(
    customerId: string,
    page = 1,
    limit = 500,
    isActive = true,
    branchId?: string,
  ): Promise<ServicesListResponseDto> {
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.db.service.findMany({
        where: {
          customerId,
          isActive,
        },
        skip,
        take: limit,
        orderBy: [{ displayId: 'asc' }, { name: 'asc' }],
        include: {
          customer: {
            select: {
              name: true,
              currency: true,
            },
          },
          pricing: branchId
            ? {
                where: { branchId },
                include: {
                  branch: {
                    select: { name: true },
                  },
                },
              }
            : false,
        },
      }),
      this.db.service.count({
        where: {
          customerId,
          isActive,
        },
      }),
    ]);

    return {
      services: ServiceEntity.fromPrismaList(services, branchId),
      total,
      page,
      limit,
    };
  }

  /**
   * Find a single service by ID
   * @param id - Service ID
   * @param customerId - Optional customer ID for scoping
   */
  async findOne(id: string, customerId?: string): Promise<ServiceResponseDto> {
    const whereClause = customerId ? { id, customerId } : { id };

    const service = await this.db.service.findUnique({
      where: whereClause,
      include: {
        customer: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }

    return ServiceEntity.fromPrisma(service);
  }

  /**
   * Create a new service (admin operation with customerId)
   * @param createServiceDto - Service creation data
   */
  async create(
    createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    // Validate customer exists
    const customer = await this.db.customer.findUnique({
      where: { id: createServiceDto.customerId },
    });

    if (!customer) {
      throw new NotFoundException(
        `Customer with ID ${createServiceDto.customerId} not found`,
      );
    }

    // Validate unique service name per customer
    await this.validateUniqueServiceName(
      createServiceDto.name,
      createServiceDto.customerId,
    );

    const service = await this.db.service.create({
      data: {
        name: createServiceDto.name,
        description: createServiceDto.description,
        duration: createServiceDto.duration,
        isActive: createServiceDto.isActive ?? true,
        customerId: createServiceDto.customerId,
      },
      include: {
        customer: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    return ServiceEntity.fromPrisma(service);
  }

  /**
   * Create a new service for a specific customer (customer-scoped operation)
   * @param createCustomerServiceDto - Service creation data
   * @param customerId - Customer ID from URL context
   */
  async createForCustomer(
    createCustomerServiceDto: CreateCustomerServiceDto,
    customerId: string,
  ): Promise<ServiceResponseDto> {
    // Validate customer exists
    const customer = await this.db.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    // Validate unique service name per customer
    await this.validateUniqueServiceName(
      createCustomerServiceDto.name,
      customerId,
    );

    const service = await this.db.service.create({
      data: {
        name: createCustomerServiceDto.name,
        description: createCustomerServiceDto.description,
        duration: createCustomerServiceDto.duration,
        isActive: createCustomerServiceDto.isActive ?? true,
        customerId,
      },
      include: {
        customer: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    return ServiceEntity.fromPrisma(service);
  }

  /**
   * Update a service
   * @param id - Service ID
   * @param updateServiceDto - Service update data
   * @param customerId - Optional customer ID for scoping
   */
  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
    customerId?: string,
  ): Promise<ServiceResponseDto> {
    // Verify service exists and belongs to customer (if specified)
    await this.findOne(id, customerId);

    // Validate unique service name if name is being updated
    if (updateServiceDto.name && customerId) {
      await this.validateUniqueServiceName(
        updateServiceDto.name,
        customerId,
        id,
      );
    }

    const whereClause = customerId ? { id, customerId } : { id };

    const service = await this.db.service.update({
      where: whereClause,
      data: {
        ...updateServiceDto,
        updatedAt: new Date(), // Manually set updatedAt on update
      },
      include: {
        customer: {
          select: {
            name: true,
            currency: true,
          },
        },
      },
    });

    return ServiceEntity.fromPrisma(service);
  }

  /**
   * Delete a service (permanent deactivation via DELETE endpoint)
   * Cannot be undone without database access
   * Blocked if service has ANY bookings (past or future)
   *
   * Note: For temporary deactivation, use update() with isActive: false
   *
   * @param id - Service ID
   * @param customerId - Optional customer ID for scoping
   */
  async remove(id: string, customerId?: string): Promise<void> {
    // Verify service exists
    await this.findOne(id, customerId);

    // Check for bookings - CANNOT DELETE if ANY bookings exist
    const bookingsCount = await this.db.booking.count({
      where: { serviceId: id },
    });

    if (bookingsCount > 0) {
      throw new ConflictException(
        'Cannot delete service with existing bookings. ' +
          'Use PATCH endpoint to set isActive: false to hide service from new bookings while preserving history.',
      );
    }

    const whereClause = customerId ? { id, customerId } : { id };

    // Permanently deactivate by setting isActive to false
    await this.db.service.update({
      where: whereClause,
      data: {
        isActive: false,
        updatedAt: new Date(), // Manually set updatedAt
      },
    });
  }

  /**
   * Set or update pricing for a service at a specific branch
   * @param serviceId - Service ID
   * @param createPricingDto - Pricing data
   * @param customerId - Customer ID from context for validation
   */
  async setPricing(
    serviceId: string,
    createPricingDto: CreateServicePricingDto,
    customerId?: string,
  ): Promise<ServicePricingResponseDto> {
    // Validate service exists and belongs to customer
    const service = await this.findOne(serviceId, customerId);

    // Validate branch exists and belongs to same customer
    const branch = await this.db.branch.findUnique({
      where: { id: createPricingDto.branchId, deletedAt: null },
    });

    if (!branch) {
      throw new NotFoundException(
        `Branch with ID ${createPricingDto.branchId} not found`,
      );
    }

    if (branch.customerId !== service.customerId) {
      throw new BadRequestException(
        'Branch does not belong to the same customer as the service',
      );
    }

    // Upsert pricing (create or update)
    const pricing = await this.db.servicePricing.upsert({
      where: {
        serviceId_branchId: {
          serviceId,
          branchId: createPricingDto.branchId,
        },
      },
      create: {
        serviceId,
        branchId: createPricingDto.branchId,
        price: createPricingDto.price,
        // updatedAt will be null on creation
      },
      update: {
        price: createPricingDto.price,
        updatedAt: new Date(), // Manually set updatedAt on update
      },
      include: {
        service: {
          include: {
            customer: true,
          },
        },
        branch: true,
      },
    });

    return ServicePricingEntity.fromPrisma(pricing);
  }

  /**
   * Get pricing for a service at a specific branch
   * @param serviceId - Service ID
   * @param branchId - Branch ID
   * @param customerId - Customer ID for validation
   */
  async getPricing(
    serviceId: string,
    branchId: string,
    customerId?: string,
  ): Promise<ServicePricingResponseDto> {
    // Validate service belongs to customer
    await this.validateServiceBelongsToCustomer(serviceId, customerId);

    const pricing = await this.db.servicePricing.findUnique({
      where: {
        serviceId_branchId: {
          serviceId,
          branchId,
        },
      },
      include: {
        service: {
          include: {
            customer: true,
          },
        },
        branch: true,
      },
    });

    if (!pricing) {
      throw new NotFoundException(
        `Pricing not found for service ${serviceId} at branch ${branchId}`,
      );
    }

    return ServicePricingEntity.fromPrisma(pricing);
  }

  /**
   * List all pricing for a service
   * @param serviceId - Service ID
   * @param customerId - Customer ID for validation
   */
  async listPricingForService(
    serviceId: string,
    customerId?: string,
  ): Promise<ServicePricingResponseDto[]> {
    // Validate service belongs to customer
    await this.validateServiceBelongsToCustomer(serviceId, customerId);

    const pricingList = await this.db.servicePricing.findMany({
      where: { serviceId },
      include: {
        service: {
          include: {
            customer: true,
          },
        },
        branch: true,
      },
      orderBy: {
        branch: {
          name: 'asc',
        },
      },
    });

    return ServicePricingEntity.fromPrismaList(pricingList);
  }

  /**
   * Remove pricing for a service at a specific branch
   * @param serviceId - Service ID
   * @param branchId - Branch ID
   * @param customerId - Customer ID for validation
   */
  async removePricing(
    serviceId: string,
    branchId: string,
    customerId?: string,
  ): Promise<void> {
    // Validate service belongs to customer
    await this.validateServiceBelongsToCustomer(serviceId, customerId);

    const pricing = await this.db.servicePricing.findUnique({
      where: {
        serviceId_branchId: {
          serviceId,
          branchId,
        },
      },
    });

    if (!pricing) {
      throw new NotFoundException(
        `Pricing not found for service ${serviceId} at branch ${branchId}`,
      );
    }

    await this.db.servicePricing.delete({
      where: {
        serviceId_branchId: {
          serviceId,
          branchId,
        },
      },
    });
  }

  /**
   * Get all services with pricing for a specific branch
   * @param branchId - Branch ID
   * @param customerId - Customer ID for validation
   */
  async getServicesWithPricingForBranch(
    branchId: string,
    customerId?: string,
  ): Promise<{
    branch: { id: string; displayId: number; name: string };
    services: ServiceResponseDto[];
    total: number;
  }> {
    // Validate branch exists and belongs to customer
    const branch = await this.db.branch.findUnique({
      where: { id: branchId, deletedAt: null },
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    if (customerId && branch.customerId !== customerId) {
      throw new BadRequestException(
        'Branch does not belong to the specified customer',
      );
    }

    // Get all active services with pricing for this branch
    const services = await this.db.service.findMany({
      where: {
        customerId: branch.customerId,
        isActive: true,
        pricing: {
          some: {
            branchId,
          },
        },
      },
      orderBy: [{ displayId: 'asc' }, { name: 'asc' }],
      include: {
        customer: {
          select: {
            name: true,
            currency: true,
          },
        },
        pricing: {
          where: { branchId },
          include: {
            branch: {
              select: { name: true },
            },
          },
        },
      },
    });

    return {
      branch: {
        id: branch.id,
        displayId: branch.displayId,
        name: branch.name,
      },
      services: ServiceEntity.fromPrismaList(services, branchId),
      total: services.length,
    };
  }

  /**
   * HELPER: Validate that a service name is unique per customer (among active services only)
   * @param name - Service name
   * @param customerId - Customer ID
   * @param excludeId - Optional service ID to exclude (for updates)
   */
  private async validateUniqueServiceName(
    name: string,
    customerId: string,
    excludeId?: string,
  ): Promise<void> {
    const existingService = await this.db.service.findFirst({
      where: {
        name,
        customerId,
        isActive: true, // Only check active services - inactive services don't block name reuse
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    if (existingService) {
      throw new ConflictException(
        `An active service with name "${name}" already exists for this customer`,
      );
    }
  }

  /**
   * HELPER: Validate that a service belongs to a customer
   * @param serviceId - Service ID
   * @param customerId - Customer ID (optional, skips check if not provided)
   */
  private async validateServiceBelongsToCustomer(
    serviceId: string,
    customerId?: string,
  ): Promise<void> {
    if (!customerId) return; // Skip validation if no customer ID provided

    const service = await this.db.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException(`Service with ID ${serviceId} not found`);
    }

    if (service.customerId !== customerId) {
      throw new BadRequestException(
        'Service does not belong to the specified customer',
      );
    }
  }
}
