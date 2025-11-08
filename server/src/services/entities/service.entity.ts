import { Service, ServicePricing, Customer } from '@prisma/client';
import { ServiceResponseDto } from '../dto/service-response.dto';

/**
 * Service Entity
 * Transforms Prisma Service model to API response format
 */
export class ServiceEntity {
  /**
   * Transform Prisma Service to ServiceResponseDto
   * @param service - Prisma Service object (with optional relations)
   * @param branchIdFilter - Optional branch ID to filter pricing
   */
  static fromPrisma(
    service: Service & {
      customer?: Pick<Customer, 'name' | 'currency'>;
      pricing?: (ServicePricing & { branch?: { name: string } })[];
    },
    branchIdFilter?: string,
  ): ServiceResponseDto {
    const response: ServiceResponseDto = {
      id: service.id,
      displayId: service.displayId,
      name: service.name,
      description: service.description,
      duration: service.duration,
      isActive: service.isActive,
      customerId: service.customerId,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    };

    // Add customer name if included
    if (service.customer) {
      response.customerName = service.customer.name;
    }

    // Add pricing information if branchId provided and pricing available
    if (branchIdFilter && service.pricing) {
      const branchPricing = service.pricing.find(
        p => p.branchId === branchIdFilter,
      );
      if (branchPricing) {
        response.pricing = {
          branchId: branchPricing.branchId,
          branchName: branchPricing.branch?.name || 'Unknown Branch',
          price: branchPricing.price.toFixed(2),
          currency: service.customer?.currency || 'USD', // Use customer currency or fallback to USD
        };
      }
    }

    return response;
  }

  /**
   * Transform array of Prisma Services to ServiceResponseDto array
   */
  static fromPrismaList(
    services: (Service & {
      customer?: Pick<Customer, 'name' | 'currency'>;
      pricing?: (ServicePricing & { branch?: { name: string } })[];
    })[],
    branchIdFilter?: string,
  ): ServiceResponseDto[] {
    return services.map(service =>
      ServiceEntity.fromPrisma(service, branchIdFilter),
    );
  }
}
