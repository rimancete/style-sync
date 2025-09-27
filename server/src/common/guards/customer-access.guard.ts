import {
  Injectable,
  CanActivate,
  ExecutionContext,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../types/auth.types';
import { DatabaseService } from '../../database/database.service';

/**
 * Guard that validates user access to a specific customer by customer ID
 * Used for endpoints that take customerId as a path parameter
 */
@Injectable()
export class CustomerAccessGuard implements CanActivate {
  constructor(private readonly db: DatabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Extract customer ID from URL parameters
    const customerId = request.params?.customerId;

    if (!customerId) {
      throw new BadRequestException('Customer ID is required');
    }

    // Validate customer exists and is active
    const customer = await this.db.customer.findUnique({
      where: {
        id: customerId,
        isActive: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID '${customerId}' not found`);
    }

    // Validate user has access to this customer
    if (!user.customerIds.includes(customerId)) {
      throw new ForbiddenException(
        `Access denied to customer: ${customer.name}`,
      );
    }

    // Set resolved customer context for use in controllers
    user.activeCustomerId = customer.id;
    user.activeCustomerSlug = customer.urlSlug;

    return true;
  }
}
