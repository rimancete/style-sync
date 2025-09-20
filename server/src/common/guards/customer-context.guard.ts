import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../../database/database.service';
import { CustomerUrlUtil } from '../utils/url-customer.util';

@Injectable()
export class CustomerContextGuard implements CanActivate {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Extract customer context from URL
    const customerSlug = this.extractCustomerContext(request);

    if (!customerSlug) {
      // No customer context - allow for admin/public routes
      return true;
    }

    // Validate customer slug format
    if (!CustomerUrlUtil.isValidCustomerSlug(customerSlug)) {
      throw new BadRequestException(
        `Invalid customer identifier: ${customerSlug}`,
      );
    }

    // Resolve customer by URL slug
    const customer = await this.db.customer.findUnique({
      where: {
        urlSlug: customerSlug,
        isActive: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer not found: ${customerSlug}`);
    }

    // Validate user has access to this customer
    if (!user.customerIds.includes(customer.id)) {
      throw new ForbiddenException(
        `Access denied to customer: ${customerSlug}`,
      );
    }

    // Set resolved customer context
    user.activeCustomerId = customer.id;
    user.activeCustomerSlug = customerSlug;

    return true;
  }

  private extractCustomerContext(request: AuthenticatedRequest): string | null {
    // Extract customer slug from URL path (/api/salon/{customer-slug}/...)
    return CustomerUrlUtil.extractCustomerSlug(request.url);
  }
}
