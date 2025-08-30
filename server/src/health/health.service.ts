import { Injectable, Logger } from '@nestjs/common';
import {
  DatabaseService,
  DatabaseConnectionInfo,
} from '../database/database.service';
import {
  HealthResponse,
  DatabaseHealthResponse,
  DetailedHealthResponse,
} from './dto/health-response.dto';
import * as os from 'os';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startTime = Date.now();

  constructor(private readonly databaseService: DatabaseService) {}

  getBasicHealth(): Promise<HealthResponse> {
    this.logger.log('Performing basic health check');

    return Promise.resolve({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      details: {
        message: 'StyleSync API is running',
      },
    });
  }

  async getDatabaseHealth(): Promise<DatabaseHealthResponse> {
    this.logger.log('Performing database health check');

    const timestamp = new Date().toISOString();

    try {
      const isConnected = await this.databaseService.isHealthy();

      if (isConnected) {
        const connectionInfo: DatabaseConnectionInfo[] =
          await this.databaseService.getConnectionInfo();

        return {
          status: 'ok',
          timestamp,
          database: {
            connected: true,
            connectionInfo:
              Array.isArray(connectionInfo) && connectionInfo.length > 0
                ? connectionInfo[0]
                : null,
          },
        };
      } else {
        return {
          status: 'error',
          timestamp,
          database: {
            connected: false,
            error: 'Database connection failed',
          },
        };
      }
    } catch (error) {
      this.logger.error('Database health check failed:', error);

      return {
        status: 'error',
        timestamp,
        database: {
          connected: false,
          error:
            error instanceof Error ? error.message : 'Unknown database error',
        },
      };
    }
  }

  async getDetailedHealth(): Promise<DetailedHealthResponse> {
    this.logger.log('Performing detailed health check');

    const timestamp = new Date().toISOString();
    let overallStatus: 'ok' | 'error' = 'ok';

    // Check database
    const dbHealth = await this.getDatabaseHealth();
    if (dbHealth.status === 'error') {
      overallStatus = 'error';
    }

    // Get system information
    const memoryUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    return {
      status: overallStatus,
      timestamp,
      application: {
        name: 'StyleSync API',
        version: process.env.npm_package_version || '0.0.1',
        environment: process.env.NODE_ENV || 'development',
        uptime: Date.now() - this.startTime,
        memoryUsage,
      },
      database: dbHealth.database,
      system: {
        platform: os.platform(),
        nodeVersion: process.version,
        cpuArch: os.arch(),
        totalMemory,
        freeMemory,
      },
    };
  }
}
