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
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import {
  BranchResponseDto,
  BranchesListResponseDto,
} from './dto/branch-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Branches')
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
