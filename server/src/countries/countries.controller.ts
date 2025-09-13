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
import { CountriesService } from './countries.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import {
  CountryResponseDto,
  CountriesListResponseDto,
} from './dto/country-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Countries')
@ApiExtraModels(CountryResponseDto, CountriesListResponseDto)
@Controller('countries')
export class CountriesController {
  constructor(private readonly countriesService: CountriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new country',
    description:
      'Creates a new country with address format configuration. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Country created successfully',
    type: CountryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Country with this code or name already exists',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Country with this code already exists',
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
    @Body() createCountryDto: CreateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.countriesService.create(createCountryDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all countries',
    description:
      'Retrieves a list of all countries with their address format configurations. Only accessible by admin users.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of countries retrieved successfully',
    type: CountriesListResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Admin role required',
  })
  async findAll(): Promise<CountriesListResponseDto> {
    return this.countriesService.findAll();
  }

  @Get('code/:code')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get country by code',
    description:
      'Retrieves country information by its ISO 3166-1 alpha-2 code. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'code',
    description: 'ISO 3166-1 alpha-2 country code',
    example: 'BR',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Country details retrieved successfully',
    type: CountryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Country not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: { type: 'string', example: 'Country with code BR not found' },
      },
    },
  })
  async findByCode(@Param('code') code: string): Promise<CountryResponseDto> {
    return this.countriesService.findByCode(code);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update country information',
    description:
      'Updates information for an existing country. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the country to update',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Country updated successfully',
    type: CountryResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Country not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Country with ID clm1234567890abcdef not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Country with this code or name already exists',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Country with this code already exists',
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
    @Body() updateCountryDto: UpdateCountryDto,
  ): Promise<CountryResponseDto> {
    return this.countriesService.update(id, updateCountryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete country',
    description:
      'Deletes a country from the system. Only possible if the country has no associated branches. Only accessible by admin users.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique identifier of the country to delete',
    example: 'clm1234567890abcdef',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Country deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Country not found',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: 'Country with ID clm1234567890abcdef not found',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Cannot delete country with associated branches',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'number', example: 409 },
        message: {
          type: 'string',
          example: 'Cannot delete country with associated branches',
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
    return this.countriesService.remove(id);
  }
}
