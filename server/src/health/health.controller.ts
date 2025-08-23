import { Controller, Get, HttpStatus } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiExtraModels,
} from '@nestjs/swagger';
import { HealthService } from './health.service';
import {
  HealthResponse,
  DatabaseHealthResponse,
  DetailedHealthResponse,
} from './dto/health-response.dto';

@ApiTags('Health & Monitoring')
@ApiExtraModels(HealthResponse, DatabaseHealthResponse, DetailedHealthResponse)
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({
    summary: 'Basic application health check',
    description:
      'Returns basic health status of the StyleSync API application. This endpoint provides a quick way to verify the application is running and responsive.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Application is healthy and running',
    type: HealthResponse,
  })
  async getHealth(): Promise<HealthResponse> {
    return this.healthService.getBasicHealth();
  }

  @Get('database')
  @ApiOperation({
    summary: 'Database connectivity health check',
    description:
      'Checks the database connection status and returns connection information. This endpoint verifies that the application can successfully connect to and query the PostgreSQL database.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Database health status',
    type: DatabaseHealthResponse,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'Database connection failed',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        database: {
          type: 'object',
          properties: {
            connected: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Connection timeout' },
          },
        },
      },
    },
  })
  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    return this.healthService.getDatabaseHealth();
  }

  @Get('detailed')
  @ApiOperation({
    summary: 'Detailed system health status',
    description:
      'Returns comprehensive health information including application details, database status, and system metrics. This endpoint provides detailed diagnostics for monitoring and troubleshooting.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Detailed system health information',
    type: DetailedHealthResponse,
  })
  @ApiResponse({
    status: HttpStatus.SERVICE_UNAVAILABLE,
    description: 'One or more system components are unhealthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', example: 'error' },
        timestamp: { type: 'string', example: '2024-01-15T10:30:00.000Z' },
        application: { type: 'object' },
        database: {
          type: 'object',
          properties: {
            connected: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        system: { type: 'object' },
      },
    },
  })
  async getDetailedHealth(): Promise<DetailedHealthResponse> {
    return this.healthService.getDetailedHealth();
  }
}
