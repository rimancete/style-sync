import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateCustomerServiceDto } from './dto/create-customer-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';
import { ServiceResponseDto } from './dto/service-response.dto';
import { ServicesListResponseDto } from './dto/services-list-response.dto';
import { ServicePricingResponseDto } from './dto/service-pricing-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';

@ApiTags('Services')
@Controller()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  // ==================== ADMIN ENDPOINTS (Global) ====================

  @Get('services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List all services (Admin)',
    description:
      'Retrieve all services across all customers (admin-only operation)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 500,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
    type: ServicesListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findAllAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
  ): Promise<ServicesListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 500;
    const isActiveBool =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;

    return this.servicesService.findAll(pageNum, limitNum, isActiveBool);
  }

  @Post('services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create service (Admin)',
    description:
      'Create a new service for a specific customer (admin-only operation)',
  })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - Active service with this name already exists for customer',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async createAdmin(
    @Body() createServiceDto: CreateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.create(createServiceDto);
  }

  @Get('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get service by ID (Admin)',
    description: 'Retrieve a single service by ID (admin-only operation)',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Service retrieved successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  async findOneAdmin(@Param('id') id: string): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id);
  }

  @Patch('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update service (Admin)',
    description: 'Update service details (admin-only operation)',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Active service with this name already exists',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete('services/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate service (Admin)',
    description:
      'Deactivate service (soft delete) - cannot deactivate if bookings exist',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({ status: 204, description: 'Service deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot deactivate service with bookings',
  })
  async removeAdmin(@Param('id') id: string): Promise<void> {
    return this.servicesService.remove(id);
  }

  // ==================== CUSTOMER-SCOPED ENDPOINTS ====================

  @Get('salon/:customerSlug/services')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List customer services',
    description:
      'Retrieve services for a specific customer (optionally with branch pricing)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 500,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    type: Boolean,
    description: 'Filter by active status (default: true)',
  })
  @ApiQuery({
    name: 'branchId',
    required: false,
    description: 'Include pricing for specific branch',
  })
  @ApiResponse({
    status: 200,
    description: 'Services retrieved successfully',
    type: ServicesListResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findByCustomer(
    @User() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('branchId') branchId?: string,
  ): Promise<ServicesListResponseDto> {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 500;
    const isActiveBool = isActive === 'false' ? false : true; // Default to true

    if (!user.activeCustomerId) {
      throw new Error('Customer context is required');
    }

    return this.servicesService.findByCustomer(
      user.activeCustomerId,
      pageNum,
      limitNum,
      isActiveBool,
      branchId,
    );
  }

  @Post('salon/:customerSlug/services')
  @UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create customer service',
    description: 'Create a new service for the current customer (admin-only)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiResponse({
    status: 201,
    description: 'Service created successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required or access denied to customer',
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict - Active service with this name already exists for customer',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async createForCustomer(
    @User() user: AuthenticatedUser,
    @Body() createCustomerServiceDto: CreateCustomerServiceDto,
  ): Promise<ServiceResponseDto> {
    if (!user.activeCustomerId) {
      throw new Error('Customer context is required');
    }

    return this.servicesService.createForCustomer(
      createCustomerServiceDto,
      user.activeCustomerId,
    );
  }

  @Get('salon/:customerSlug/services/:id')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get customer service by ID',
    description: 'Retrieve a single service for the current customer',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Service retrieved successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or does not belong to customer',
  })
  async findOneForCustomer(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.findOne(id, user.activeCustomerId);
  }

  @Patch('salon/:customerSlug/services/:id')
  @UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update customer service',
    description: 'Update service details for the current customer (admin-only)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Service updated successfully',
    type: ServiceResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required or access denied to customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or does not belong to customer',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Active service with this name already exists',
  })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async updateForCustomer(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    return this.servicesService.update(
      id,
      updateServiceDto,
      user.activeCustomerId,
    );
  }

  @Delete('salon/:customerSlug/services/:id')
  @UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Deactivate customer service',
    description:
      'Deactivate service for current customer (soft delete) - cannot deactivate if bookings exist',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'id',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({ status: 204, description: 'Service deactivated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin role required or access denied to customer',
  })
  @ApiResponse({
    status: 404,
    description: 'Service not found or does not belong to customer',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Cannot deactivate service with bookings',
  })
  async removeForCustomer(
    @User() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<void> {
    return this.servicesService.remove(id, user.activeCustomerId);
  }

  // ==================== BRANCH-SPECIFIC ENDPOINTS (Pricing) ====================

  @Get('salon/:customerSlug/branches/:branchId/services')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'List services with pricing for branch',
    description:
      'Get all active services available at a specific branch with pricing',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Services with pricing retrieved successfully',
    schema: {
      example: {
        data: {
          branch: { id: 'branch_123', displayId: 2, name: 'Downtown Location' },
          services: [
            {
              id: 'service_123',
              displayId: 1,
              name: 'Haircut',
              description: 'Classic haircut',
              duration: 30,
              isActive: true,
              price: '25.00',
              currency: 'USD',
              createdAt: '2025-10-25T10:00:00Z',
            },
          ],
          total: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({ status: 404, description: 'Branch not found' })
  async getServicesForBranch(
    @User() user: AuthenticatedUser,
    @Param('branchId') branchId: string,
  ) {
    return this.servicesService.getServicesWithPricingForBranch(
      branchId,
      user.activeCustomerId,
    );
  }

  @Post('salon/:customerSlug/services/:serviceId/pricing')
  @UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Set/update service pricing',
    description:
      'Create or update pricing for a service at a specific branch (admin-only)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 201,
    description: 'Pricing created successfully',
    type: ServicePricingResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing updated successfully',
    type: ServicePricingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Branch does not belong to same customer',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Service or branch not found' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async setPricing(
    @User() user: AuthenticatedUser,
    @Param('serviceId') serviceId: string,
    @Body() createPricingDto: CreateServicePricingDto,
  ): Promise<ServicePricingResponseDto> {
    return this.servicesService.setPricing(
      serviceId,
      createPricingDto,
      user.activeCustomerId,
    );
  }

  @Get('salon/:customerSlug/services/:serviceId/pricing/:branchId')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get service pricing for branch',
    description: 'Retrieve pricing for a specific service at a specific branch',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({
    status: 200,
    description: 'Pricing retrieved successfully',
    type: ServicePricingResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Access denied to customer',
  })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  async getPricing(
    @User() user: AuthenticatedUser,
    @Param('serviceId') serviceId: string,
    @Param('branchId') branchId: string,
  ): Promise<ServicePricingResponseDto> {
    return this.servicesService.getPricing(
      serviceId,
      branchId,
      user.activeCustomerId,
    );
  }

  @Delete('salon/:customerSlug/services/:serviceId/pricing/:branchId')
  @UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove service pricing',
    description:
      'Delete pricing for a service at a specific branch (admin-only)',
  })
  @ApiParam({
    name: 'customerSlug',
    description: 'Customer URL slug',
    example: 'acme',
  })
  @ApiParam({
    name: 'serviceId',
    description: 'Service ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Branch ID (CUID)',
    example: 'clg2a5d9i0002gtkb',
  })
  @ApiResponse({ status: 204, description: 'Pricing removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Pricing not found' })
  async removePricing(
    @User() user: AuthenticatedUser,
    @Param('serviceId') serviceId: string,
    @Param('branchId') branchId: string,
  ): Promise<void> {
    return this.servicesService.removePricing(
      serviceId,
      branchId,
      user.activeCustomerId,
    );
  }
}
