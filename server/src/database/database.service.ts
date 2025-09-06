import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface DatabaseConnectionInfo {
  databaseName: string;
  userName: string;
  version: string;
  timestamp: Date;
}

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database connection closed');
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  async getConnectionInfo(): Promise<DatabaseConnectionInfo[]> {
    try {
      const result = await this.$queryRaw`
        SELECT 
          current_database() as "databaseName",
          current_user as "userName",
          version() as version,
          current_timestamp as timestamp
      `;
      return result as DatabaseConnectionInfo[];
    } catch (error) {
      this.logger.error('Failed to get connection info:', error);
      throw error;
    }
  }
}
