import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { HealthController } from '../../health/health.controller';
import { HealthService } from '../../health/health.service';

// Type definitions for better Jest mock typing
interface MockDatabaseService {
  isHealthy: jest.MockedFunction<() => Promise<boolean>>;
  getConnectionInfo: jest.MockedFunction<
    () => Promise<DatabaseConnectionInfo[]>
  >;
  onModuleInit: jest.MockedFunction<() => void>;
  onModuleDestroy: jest.MockedFunction<() => void>;
}

interface DatabaseConnectionInfo {
  database_name: string;
  user_name: string;
  version: string;
  timestamp: Date;
}

/**
 * Contract Testing Helper
 * Provides utilities for testing API contracts without implementation complexity
 */
export class ContractTestHelper {
  /**
   * Creates a test application with minimal, predictable mocks
   * Uses the same pattern as existing integration tests
   */
  static async createHealthTestApp(): Promise<INestApplication> {
    const mockDatabaseService = this.createMockDatabaseService();

    const testModule: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    const app = testModule.createNestApplication();
    await app.init();
    return app;
  }

  /**
   * Creates a simple, predictable database service mock
   */
  private static createMockDatabaseService(): MockDatabaseService {
    return {
      isHealthy: jest.fn<Promise<boolean>, []>().mockResolvedValue(true),
      getConnectionInfo: jest
        .fn<Promise<DatabaseConnectionInfo[]>, []>()
        .mockResolvedValue([
          {
            database_name: 'test_stylesync',
            user_name: 'test_user',
            version: 'PostgreSQL 15.0',
            timestamp: new Date('2024-01-15T10:30:00.000Z'),
          },
        ]),
      onModuleInit: jest.fn<void, []>(),
      onModuleDestroy: jest.fn<void, []>(),
    };
  }

  /**
   * Generates deterministic test data for contract testing
   * Using predictable values ensures test reliability
   */
  static generateTestData = {
    databaseConnectionInfo: (): DatabaseConnectionInfo => ({
      database_name: 'contract_test_db',
      user_name: 'contract_user',
      version: 'PostgreSQL 15.1',
      timestamp: new Date('2024-01-15T12:00:00.000Z'),
    }),

    healthScenario: () => ({
      uptime: 150000, // Deterministic value for contract testing
      version: '1.0.0',
      environment: 'test',
    }),

    // Deterministic variation scenarios for testing different states
    scenarioVariations: {
      lowUptime: () => ({ uptime: 5000, environment: 'development' }),
      highUptime: () => ({ uptime: 999999, environment: 'production' }),
      testEnv: () => ({ uptime: 100000, environment: 'test' }),
    },
  };

  /**
   * Contract validation schemas with proper typing
   */
  static contracts = {
    basicHealth: {
      status: expect.stringMatching(/^(ok|error)$/),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      uptime: expect.any(Number),
      details: expect.any(Object),
    },

    databaseHealth: {
      status: expect.stringMatching(/^(ok|error)$/),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      database: expect.objectContaining({
        connected: expect.any(Boolean),
      }),
    },

    detailedHealth: {
      status: expect.stringMatching(/^(ok|error)$/),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      application: expect.objectContaining({
        name: expect.any(String),
        version: expect.any(String),
        environment: expect.any(String),
        uptime: expect.any(Number),
        memoryUsage: expect.any(Object),
      }),
      database: expect.any(Object),
      system: expect.objectContaining({
        platform: expect.any(String),
        nodeVersion: expect.stringMatching(/^v\d+\.\d+\.\d+/),
        cpuArch: expect.any(String),
        totalMemory: expect.any(Number),
        freeMemory: expect.any(Number),
      }),
    },
  };

  /**
   * Business rule validators with proper typing
   */
  static validators = {
    isValidISOTimestamp: (timestamp: string): boolean => {
      const date = new Date(timestamp);
      return !isNaN(date.getTime()) && timestamp === date.toISOString();
    },

    isHealthyStatus: (status: string): boolean => {
      return ['ok', 'error'].includes(status);
    },

    isReasonableUptime: (uptime: number): boolean => {
      return uptime >= 0 && uptime < Number.MAX_SAFE_INTEGER;
    },

    hasExpectedDatabaseStructure: (
      database: Record<string, unknown>,
    ): boolean => {
      const connected = database.connected as boolean;
      if (connected) {
        return (
          database.connectionInfo !== undefined && database.error === undefined
        );
      } else {
        return (
          database.error !== undefined && database.connectionInfo === undefined
        );
      }
    },
  };

  /**
   * Scenario helpers for different system states with proper typing
   */
  static mockScenarios = {
    healthy: (databaseService: MockDatabaseService): void => {
      databaseService.isHealthy.mockResolvedValue(true);
      databaseService.getConnectionInfo.mockResolvedValue([
        {
          database_name: 'stylesync_test',
          user_name: 'test_user',
          version: 'PostgreSQL 15.0',
          timestamp: new Date(),
        },
      ]);
    },

    unhealthy: (databaseService: MockDatabaseService): void => {
      databaseService.isHealthy.mockResolvedValue(false);
      databaseService.getConnectionInfo.mockRejectedValue(
        new Error('Connection failed'),
      );
    },

    timeout: (databaseService: MockDatabaseService): void => {
      databaseService.isHealthy.mockRejectedValue(
        new Error('Connection timeout'),
      );
    },

    // Deterministic failure scenarios for contract testing
    predictableFailures: {
      networkError: (databaseService: MockDatabaseService): void => {
        databaseService.isHealthy.mockRejectedValue(new Error('Network error'));
      },

      authenticationError: (databaseService: MockDatabaseService): void => {
        databaseService.isHealthy.mockRejectedValue(
          new Error('Authentication failed'),
        );
      },

      databaseNotFound: (databaseService: MockDatabaseService): void => {
        databaseService.isHealthy.mockRejectedValue(
          new Error('Database not found'),
        );
      },
    },
  };
}
