import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { AuthenticatedRequest } from '../types/auth.types';

/**
 * Guard that ensures the user is a global admin (StyleSync admin)
 * Global admins have role 'ADMIN' and an empty customerIds array
 */
@Injectable()
export class GlobalAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has ADMIN role
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Access denied: Global admin privileges required',
      );
    }

    // Check if user is a global admin (empty customerIds)
    if (user.customerIds && user.customerIds.length > 0) {
      throw new ForbiddenException(
        'Access denied: This endpoint is restricted to StyleSync administrators only',
      );
    }

    return true;
  }
}
