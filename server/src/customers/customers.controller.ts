import {
  Controller,
  Get,
  Put,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CustomerBrandingResponseDto } from './dto/customer-branding.response.dto';
import { UpdateCustomerBrandingDto } from './dto/update-customer-branding.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('branding/:urlSlug')
  @Public()
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 requests per minute for branding
  @ApiOperation({
    summary: 'Get customer branding configuration',
    description:
      'Retrieve complete branding configuration for a customer by URL slug. Rate limited to prevent DDoS attacks.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer branding retrieved successfully',
    type: CustomerBrandingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found or inactive' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async getCustomerBranding(
    @Param('urlSlug') urlSlug: string,
  ): Promise<CustomerBrandingResponseDto> {
    return this.customersService.getCustomerBranding(urlSlug);
  }

  @Put(':customerId/branding/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 updates per minute for admin operations
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update customer branding configuration',
    description:
      'Update branding configuration without touching files. Rate limited for security.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer branding updated successfully',
    type: CustomerBrandingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  async updateCustomerBranding(
    @Param('customerId') customerId: string,
    @Body() updateDto: UpdateCustomerBrandingDto,
  ): Promise<CustomerBrandingResponseDto> {
    return this.customersService.updateCustomerBranding(customerId, updateDto);
  }
}
