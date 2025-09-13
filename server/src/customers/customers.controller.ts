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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CustomersService } from './customers.service';
import { CustomerBrandingResponseDto } from './dto/customer-branding.response.dto';
import { UpdateCustomerBrandingDto } from './dto/update-customer-branding.dto';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get('branding/:urlSlug')
  @ApiOperation({
    summary: 'Get customer branding configuration',
    description:
      'Retrieve complete branding configuration for a customer by URL slug',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer branding retrieved successfully',
    type: CustomerBrandingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found or inactive' })
  async getCustomerBranding(
    @Param('urlSlug') urlSlug: string,
  ): Promise<CustomerBrandingResponseDto> {
    return this.customersService.getCustomerBranding(urlSlug);
  }

  @Put(':customerId/branding/config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update customer branding configuration',
    description: 'Update branding configuration without touching files',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer branding updated successfully',
    type: CustomerBrandingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async updateCustomerBranding(
    @Param('customerId') customerId: string,
    @Body() updateDto: UpdateCustomerBrandingDto,
  ): Promise<CustomerBrandingResponseDto> {
    return this.customersService.updateCustomerBranding(customerId, updateDto);
  }
}
