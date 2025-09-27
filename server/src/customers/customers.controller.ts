import {
  Controller,
  Get,
  Put,
  Post,
  Param,
  Body,
  UseGuards,
  UploadedFiles,
  HttpCode,
  HttpStatus,
  BadRequestException,
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
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { CustomerAccessGuard } from '../common/guards/customer-access.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../common/types/auth.types';
import { CustomersService } from './customers.service';
import { CustomerBrandingResponseDto } from './dto/customer-branding.response.dto';
import { UpdateCustomerBrandingDto } from './dto/update-customer-branding.dto';
import { CustomerSummaryDto } from '../auth/dto/auth-response.dto';
import { FileService } from '../common/services/file.service';
import { CustomerBrandingUpload } from '../common/decorators/file-upload.decorator';

@ApiTags('Customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly fileService: FileService,
  ) {}

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
  @UseGuards(JwtAuthGuard, CustomerAccessGuard, RolesGuard)
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

  @Get('context/:urlSlug')
  @UseGuards(JwtAuthGuard, CustomerContextGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get customer context for authenticated user',
    description:
      'Validate and retrieve customer context for salon URLs. Used by frontend to establish customer context.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer context validated and retrieved',
    type: CustomerBrandingResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 403, description: 'Access denied to customer' })
  async getCustomerContext(
    @Param('urlSlug') urlSlug: string,
  ): Promise<CustomerBrandingResponseDto> {
    // CustomerContextGuard already validated access, just return context
    return this.customersService.getCustomerBranding(urlSlug);
  }

  @Get('my-customers')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Get user's accessible customers",
    description:
      'Retrieve all customers that the authenticated user has access to.',
  })
  @ApiResponse({
    status: 200,
    description: 'User customers retrieved successfully',
    type: [CustomerSummaryDto],
  })
  async getMyCustomers(
    @User() user: AuthenticatedUser,
  ): Promise<CustomerSummaryDto[]> {
    return this.customersService.getUserCustomers(user.userId);
  }

  @Post(':customerId/branding')
  @UseGuards(JwtAuthGuard, CustomerAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 uploads per minute for admin operations
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Initial customer branding setup',
    description:
      'Upload branding files (logo, favicons) and configuration in one atomic operation. Rate limited for security.',
  })
  @ApiResponse({
    status: 201,
    description: 'Customer branding created successfully',
    type: CustomerBrandingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid files or configuration' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @CustomerBrandingUpload()
  async createCustomerBranding(
    @Param('customerId') customerId: string,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      favicon32x32?: Express.Multer.File[];
      favicon16x16?: Express.Multer.File[];
      appleTouch?: Express.Multer.File[];
    },
    @Body('config') configJson?: string,
  ): Promise<CustomerBrandingResponseDto> {
    // Process uploaded files
    const processedFiles = this.fileService.processUploadedFiles(
      files,
      customerId,
    );

    // Validate that at least one file was uploaded
    if (Object.keys(processedFiles).length === 0) {
      throw new BadRequestException('At least one file must be uploaded');
    }

    // Parse configuration if provided
    let config;
    if (configJson) {
      config = this.customersService.parseConfigurationJson(configJson);
    }

    return await this.customersService.createCustomerBranding(
      customerId,
      processedFiles,
      config,
    );
  }

  @Post(':customerId/branding/upload')
  @UseGuards(JwtAuthGuard, CustomerAccessGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 uploads per minute for admin operations
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update customer branding files',
    description:
      'Update branding files without changing configuration. Rate limited for security.',
  })
  @ApiResponse({
    status: 200,
    description: 'Customer branding files updated successfully',
    type: CustomerBrandingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid files' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - rate limit exceeded',
  })
  @CustomerBrandingUpload()
  async updateCustomerBrandingFiles(
    @Param('customerId') customerId: string,
    @UploadedFiles()
    files: {
      logo?: Express.Multer.File[];
      favicon32x32?: Express.Multer.File[];
      favicon16x16?: Express.Multer.File[];
      appleTouch?: Express.Multer.File[];
    },
  ): Promise<CustomerBrandingResponseDto> {
    // Process uploaded files
    const processedFiles = this.fileService.processUploadedFiles(
      files,
      customerId,
    );

    // Validate that at least one file was uploaded
    if (Object.keys(processedFiles).length === 0) {
      throw new BadRequestException('At least one file must be uploaded');
    }

    return await this.customersService.updateCustomerBrandingFiles(
      customerId,
      processedFiles,
    );
  }
}
