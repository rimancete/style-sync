import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import {
  TenantResponseDto,
  TenantsListResponseDto,
} from './dto/tenant-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Tenants')
@ApiBearerAuth()
@ApiExtraModels(TenantResponseDto, TenantsListResponseDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new tenant/branch',
    description:
      'Creates a new tenant (branch location) in the system. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Tenant created successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tenant with this name already exists',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Tenant with this name already exists',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async create(
    @Body() createTenantDto: CreateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all tenants/branches',
    description:
      'Retrieves a list of all tenant branches in the system. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of tenants retrieved successfully',
    type: TenantsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async findAll(): Promise<TenantsListResponseDto> {
    return this.tenantsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get tenant by ID',
    description:
      'Retrieves detailed information about a specific tenant by its ID. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the tenant',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant details retrieved successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Tenant with ID clm1234567890abcdef not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async findOne(@Param('id') id: string): Promise<TenantResponseDto> {
    return this.tenantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update tenant information',
    description:
      'Updates information for an existing tenant. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the tenant to update',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tenant updated successfully',
    type: TenantResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Tenant with ID clm1234567890abcdef not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tenant with this name already exists',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Tenant with this name already exists',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete tenant',
    description:
      'Deletes a tenant from the system. Only possible if the tenant has no associated professionals, bookings, or service pricing. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the tenant to delete',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Tenant deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Tenant not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Tenant with ID clm1234567890abcdef not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete tenant with associated data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete tenant with associated professionals',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    return this.tenantsService.remove(id);
  }
}
