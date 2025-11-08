import { ServicePricing, Service, Branch, Customer } from '@prisma/client';
import { ServicePricingResponseDto } from '../dto/service-pricing-response.dto';

/**
 * ServicePricing Entity
 * Transforms Prisma ServicePricing model to API response format
 */
export class ServicePricingEntity {
  /**
   * Transform Prisma ServicePricing to ServicePricingResponseDto
   * @param pricing - Prisma ServicePricing object with required relations
   */
  static fromPrisma(
    pricing: ServicePricing & {
      service: Service & {
        customer: Customer;
      };
      branch: Branch;
    },
  ): ServicePricingResponseDto {
    return {
      id: pricing.id,
      displayId: pricing.displayId,
      serviceId: pricing.serviceId,
      serviceName: pricing.service.name,
      branchId: pricing.branchId,
      branchName: pricing.branch.name,
      price: pricing.price.toFixed(2),
      currency: pricing.service.customer.currency,
      createdAt: pricing.createdAt,
      updatedAt: pricing.updatedAt,
    };
  }

  /**
   * Transform array of Prisma ServicePricing to ServicePricingResponseDto array
   */
  static fromPrismaList(
    pricingList: (ServicePricing & {
      service: Service & {
        customer: Customer;
      };
      branch: Branch;
    })[],
  ): ServicePricingResponseDto[] {
    return pricingList.map(pricing => ServicePricingEntity.fromPrisma(pricing));
  }
}
