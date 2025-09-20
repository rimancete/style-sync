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
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { CreateCustomerBranchDto } from './dto/create-customer-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import {
  BranchResponseDto,
  BranchesListResponseDto,
} from './dto/branch-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';

@ApiTags('Admin - Branch Management')
@ApiBearerAuth()
@ApiExtraModels(BranchResponseDto, BranchesListResponseDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new branch',
    description:
      'Creates a new branch location in the system. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Branch created successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Branch with this name already exists',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Branch with this name already exists',
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
    @Body() createBranchDto: CreateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all branches',
    description:
      'Retrieves a list of all branches in the system. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of branches retrieved successfully',
    type: BranchesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async findAll(): Promise<BranchesListResponseDto> {
    return this.branchesService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get branch by ID',
    description:
      'Retrieves detailed information about a specific branch by its ID. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the branch',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch details retrieved successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Branch with ID clm1234567890abcdef not found',
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
  async findOne(@Param('id') id: string): Promise<BranchResponseDto> {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update branch information',
    description:
      'Updates information for an existing branch. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the branch to update',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch updated successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Branch with ID clm1234567890abcdef not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Branch with this name already exists',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Branch with this name already exists',
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
    @Body() updateBranchDto: UpdateBranchDto,
  ): Promise<BranchResponseDto> {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete branch',
    description:
      'Deletes a branch from the system. Only possible if the branch has no associated professionals, bookings, or service pricing. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the branch to delete',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Branch deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Branch with ID clm1234567890abcdef not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete branch with associated data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete branch with associated professionals',
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
    return this.branchesService.remove(id);
  }
}

@ApiTags('Branches')
@ApiBearerAuth()
@ApiExtraModels(
  BranchResponseDto,
  BranchesListResponseDto,
  CreateCustomerBranchDto,
)
@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
@Controller('salon/:customerSlug/branches')
export class CustomerBranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create customer branch',
    description:
      'Creates a new branch for the current customer context. Only ADMIN users can create branches. Customer ID is automatically determined from the URL context.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Branch created successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - ADMIN role required',
  })
  async createCustomerBranch(
    @Body() createBranchDto: CreateCustomerBranchDto,
    @User() user: AuthenticatedUser,
  ): Promise<BranchResponseDto> {
    // CustomerContextGuard ensures activeCustomerId is set and validated
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    const fullCreateDto = {
      ...createBranchDto,
      customerId: user.activeCustomerId,
    };

    return this.branchesService.create(fullCreateDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get customer branches',
    description:
      'Retrieves all branches for the current customer context from salon URL.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer branches retrieved successfully',
    type: BranchesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to customer',
  })
  async getCustomerBranches(
    @User() user: AuthenticatedUser,
  ): Promise<BranchesListResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.branchesService.findByCustomer(user.activeCustomerId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get customer branch by ID',
    description: 'Retrieves a specific branch within the customer context.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the branch',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer branch retrieved successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found in customer context',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example:
            'Branch with ID clm1234567890abcdef not found for this customer',
        },
      },
    },
  })
  async getCustomerBranch(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<BranchResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.branchesService.findOneByCustomer(id, user.activeCustomerId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update customer branch',
    description:
      'Updates a branch within the customer context. Only ADMIN users can update branches. Only branches belonging to the current customer can be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the branch to update',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch updated successfully',
    type: BranchResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found in customer context',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example:
            'Branch with ID clm1234567890abcdef not found for this customer',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Branch with this name already exists for this customer',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Branch with this name already exists for this customer',
        },
      },
    },
  })
  async updateCustomerBranch(
    @Param('id') id: string,
    @Body() updateBranchDto: UpdateBranchDto,
    @User() user: AuthenticatedUser,
  ): Promise<BranchResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.branchesService.updateByCustomer(
      id,
      updateBranchDto,
      user.activeCustomerId,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Delete customer branch',
    description:
      'Soft deletes a branch within the customer context. Only ADMIN users can delete branches. Only possible if the branch has no associated professionals, bookings, or service pricing.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the branch to delete',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Branch deleted successfully (soft delete)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Branch not found in customer context',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example:
            'Branch with ID clm1234567890abcdef not found for this customer',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete branch with associated data',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete branch with associated professionals',
        },
      },
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCustomerBranch(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.branchesService.removeByCustomer(id, user.activeCustomerId);
  }
}
