import { ApiProperty } from '@nestjs/swagger';

export class HealthResponse {
  @ApiProperty({
    description: 'Overall health status',
    example: 'ok',
  })
  status: 'ok' | 'error';

  @ApiProperty({
    description: 'Timestamp when health check was performed',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Application uptime in milliseconds',
    example: 123456789,
  })
  uptime: number;

  @ApiProperty({
    description: 'Additional health information',
    required: false,
  })
  details?: Record<string, any>;
}

export class DatabaseHealthResponse {
  @ApiProperty({
    description: 'Database connection status',
    example: 'ok',
  })
  status: 'ok' | 'error';

  @ApiProperty({
    description: 'Database connection details',
  })
  database: {
    connected: boolean;
    connectionInfo?: any;
    error?: string;
  };

  @ApiProperty({
    description: 'Timestamp when check was performed',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;
}

export class DetailedHealthResponse {
  @ApiProperty({
    description: 'Overall system status',
    example: 'ok',
  })
  status: 'ok' | 'error';

  @ApiProperty({
    description: 'Timestamp when check was performed',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Application information',
  })
  application: {
    name: string;
    version: string;
    environment: string;
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
  };

  @ApiProperty({
    description: 'Database health information',
  })
  database: {
    connected: boolean;
    connectionInfo?: any;
    error?: string;
  };

  @ApiProperty({
    description: 'System information',
  })
  system: {
    platform: string;
    nodeVersion: string;
    cpuArch: string;
    totalMemory?: number;
    freeMemory?: number;
  };
}
