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
  UseInterceptors,
  UploadedFile,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
  ApiConsumes,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ProfessionalsService } from './professionals.service';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';
import {
  ProfessionalResponseDto,
  ProfessionalsListResponseDto,
} from './dto/professional-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { GlobalAdminGuard } from '../common/guards/global-admin.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { User } from '../common/decorators/user.decorator';
import { AuthenticatedUser } from '../common/types/auth.types';

@ApiTags('Admin - Professional Management')
@ApiBearerAuth()
@ApiExtraModels(ProfessionalResponseDto, ProfessionalsListResponseDto)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Post()
  @UseGuards(GlobalAdminGuard)
  @ApiOperation({
    summary: 'Create a new professional',
    description:
      'Creates a new professional for a customer. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Professional created successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Professional with this name already exists for this customer',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example:
            'Professional with this name already exists for this customer',
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
    @Body() createProfessionalDto: CreateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.create(createProfessionalDto);
  }

  @Get(':id')
  @UseGuards(GlobalAdminGuard)
  @ApiOperation({
    summary: 'Get professional by ID',
    description:
      'Retrieves detailed information about a specific professional by its ID. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Professional details retrieved successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
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
  async findOne(@Param('id') id: string): Promise<ProfessionalResponseDto> {
    return this.professionalsService.findOne(id);
  }

  @Get()
  @UseGuards(GlobalAdminGuard)
  @ApiOperation({
    summary: 'Get all professionals',
    description:
      'Retrieves a list of all professionals in the system. Only accessible by admin users.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description: 'Include inactive professionals in the results',
    example: true,
    type: Boolean,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of professionals retrieved successfully',
    type: ProfessionalsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ProfessionalsListResponseDto> {
    return this.professionalsService.findAll(
      undefined,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 1000,
      includeInactive !== 'false', // Default true for admin
    );
  }

  @Patch(':id')
  @UseGuards(GlobalAdminGuard)
  @ApiOperation({
    summary: 'Update professional information',
    description:
      'Updates information for an existing professional. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional to update',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Professional updated successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Professional with this name already exists for this customer',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example:
            'Professional with this name already exists for this customer',
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
    @Body() updateProfessionalDto: UpdateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    return this.professionalsService.update(id, updateProfessionalDto);
  }

  @Delete(':id')
  @UseGuards(GlobalAdminGuard)
  @ApiOperation({
    summary: 'Deactivate professional',
    description:
      'Deactivates a professional from the system. Only possible if the professional has no associated bookings. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional to deactivate',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Professional deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot deactivate professional with associated bookings',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete professional with associated bookings',
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
    return this.professionalsService.remove(id);
  }

  @Post(':id/photo')
  @UseGuards(GlobalAdminGuard)
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 1,
      },
      fileFilter: (req, file, callback) => {
        // Validate file type by extension
        const allowedExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
        const ext =
          file.originalname.toLowerCase().match(/\.[^.]*$/)?.[0] || '';

        if (!allowedExtensions.includes(ext)) {
          return callback(
            new BadRequestException(
              `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`,
            ),
            false,
          );
        }

        // Validate MIME type
        const allowedMimeTypes = [
          'image/png',
          'image/jpeg',
          'image/jpg',
          'image/webp',
        ];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              `Invalid MIME type. Expected image file, got ${file.mimetype}`,
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload professional photo',
    description:
      'Uploads a photo for a professional. Only accessible by admin users. ' +
      'Allowed formats: PNG, JPG, JPEG, WebP. Maximum size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional',
    example: 'clm1234567890abcdef',
  })
  @ApiBody({
    description: 'Professional photo file',
    schema: {
      type: 'object',
      properties: {
        photo: {
          type: 'string',
          format: 'binary',
          description: 'Photo file (PNG, JPG, JPEG, WebP - max 5MB)',
        },
      },
      required: ['photo'],
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Professional photo uploaded successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file type or size, or no file provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'string',
          example: 'Invalid file type. Allowed types: .png, .jpg, .jpeg, .webp',
        },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
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
  @ApiResponse({
    status: HttpStatus.PAYLOAD_TOO_LARGE,
    description: 'File size exceeds 5MB limit',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 413 },
        message: { type: 'string', example: 'File too large' },
        error: { type: 'string', example: 'Payload Too Large' },
      },
    },
  })
  async uploadPhoto(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ProfessionalResponseDto> {
    if (!file) {
      throw new BadRequestException('No photo file provided');
    }
    return this.professionalsService.uploadPhoto(id, file);
  }

  @Delete(':id/photo')
  @UseGuards(GlobalAdminGuard)
  @ApiOperation({
    summary: 'Delete professional photo',
    description:
      'Deletes the photo for a professional. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Professional photo deleted successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
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
  async deletePhoto(@Param('id') id: string): Promise<ProfessionalResponseDto> {
    return this.professionalsService.deletePhoto(id);
  }
}

@ApiTags('Professionals')
@ApiBearerAuth()
@ApiExtraModels(ProfessionalResponseDto, ProfessionalsListResponseDto)
@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
@Controller('salon/:customerSlug/branches/:branchId/professionals')
export class CustomerBranchProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get professionals for branch',
    description:
      'Retrieves all active professionals working at a specific branch within the customer context.',
  })
  @ApiParam({
    name: 'branchId',
    description: 'Unique identifier of the branch',
    example: 'clm1234567890abcdef',
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description:
      'Include inactive professionals (default: true for customer admins)',
    example: true,
    type: Boolean,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Branch professionals retrieved successfully',
    type: ProfessionalsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to customer or branch',
  })
  async getBranchProfessionals(
    @Param('branchId') branchId: string,
    @User() user: AuthenticatedUser,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ProfessionalsListResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.professionalsService.findByBranch(
      branchId,
      user.activeCustomerId,
      includeInactive !== 'false', // Default true for customer admins
    );
  }
}

@ApiTags('Professionals')
@ApiBearerAuth()
@ApiExtraModels(ProfessionalResponseDto, ProfessionalsListResponseDto)
@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)
@Controller('salon/:customerSlug/professionals')
export class CustomerProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get customer professionals',
    description:
      'Retrieves all professionals for the current customer context from salon URL.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 1000,
  })
  @ApiQuery({
    name: 'includeInactive',
    required: false,
    description:
      'Include inactive professionals (default: true for customer admins)',
    example: true,
    type: Boolean,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer professionals retrieved successfully',
    type: ProfessionalsListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied to customer',
  })
  async getCustomerProfessionals(
    @User() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ProfessionalsListResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.professionalsService.findAll(
      user.activeCustomerId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 1000,
      includeInactive !== 'false', // Default true for customer admins
    );
  }

  @Post()
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Create customer professional',
    description:
      'Creates a new professional for the current customer context. Only ADMIN users can create professionals. Customer ID is automatically determined from the URL context.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Professional created successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied - ADMIN role required',
  })
  async createCustomerProfessional(
    @Body() createProfessionalDto: Omit<CreateProfessionalDto, 'customerId'>,
    @User() user: AuthenticatedUser,
  ): Promise<ProfessionalResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    const fullCreateDto = {
      ...createProfessionalDto,
      customerId: user.activeCustomerId,
    };

    return this.professionalsService.create(fullCreateDto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get customer professional by ID',
    description:
      'Retrieves a specific professional within the customer context.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer professional retrieved successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found in customer context',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
        },
      },
    },
  })
  async getCustomerProfessional(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<ProfessionalResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.professionalsService.findOne(id, user.activeCustomerId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Update customer professional',
    description:
      'Updates a professional within the customer context. Only ADMIN users can update professionals. Only professionals belonging to the current customer can be updated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional to update',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Professional updated successfully',
    type: ProfessionalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found in customer context',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
        },
      },
    },
  })
  async updateCustomerProfessional(
    @Param('id') id: string,
    @Body() updateProfessionalDto: UpdateProfessionalDto,
    @User() user: AuthenticatedUser,
  ): Promise<ProfessionalResponseDto> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.professionalsService.update(
      id,
      updateProfessionalDto,
      user.activeCustomerId,
    );
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({
    summary: 'Deactivate customer professional',
    description:
      'Deactivates a professional within the customer context. Only ADMIN users can deactivate professionals. Only possible if the professional has no associated bookings.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the professional to deactivate',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Professional deactivated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Professional not found in customer context',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Professional not found',
        },
      },
    },
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCustomerProfessional(
    @Param('id') id: string,
    @User() user: AuthenticatedUser,
  ): Promise<void> {
    if (!user.activeCustomerId) {
      throw new BadRequestException('Customer context is required');
    }

    return this.professionalsService.remove(id, user.activeCustomerId);
  }
}
