import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { ContractTestHelper } from '../testing/helpers/contract-test.helper';

// Type definitions for API responses to avoid 'any' types
interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  details?: Record<string, unknown>;
}

interface DatabaseHealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  database: {
    connected: boolean;
    connectionInfo?: {
      database_name: string;
      user_name: string;
      version: string;
      timestamp: string;
    };
    error?: string;
  };
}

interface DetailedHealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  application: {
    name: string;
    version: string;
    environment: string;
    uptime: number;
    memoryUsage: Record<string, number>;
  };
  database: Record<string, unknown>;
  system: {
    platform: string;
    nodeVersion: string;
    cpuArch: string;
    totalMemory: number;
    freeMemory: number;
  };
}

/**
 * Health Module Contract Tests
 *
 * These tests validate API contracts and business rules without
 * getting lost in implementation details. Perfect for frontend-focused
 * development where API reliability is key.
 *
 * Replaces 51 verbose unit/integration tests with 8 focused contract tests.
 */
describe('Health API Contracts', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await ContractTestHelper.createHealthTestApp();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /health - Basic Health Contract', () => {
    it('should return valid basic health contract', async () => {
      // Type assertion for supertest - app.getHttpServer() returns any from NestJS
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/health')
        .expect(200);

      const body = response.body as HealthResponse;

      // Contract validation: structure and types
      expect(body).toMatchObject(ContractTestHelper.contracts.basicHealth);

      // Business rules validation
      expect(ContractTestHelper.validators.isHealthyStatus(body.status)).toBe(
        true,
      );
      expect(
        ContractTestHelper.validators.isValidISOTimestamp(body.timestamp),
      ).toBe(true);
      expect(
        ContractTestHelper.validators.isReasonableUptime(body.uptime),
      ).toBe(true);
    });
  });

  describe('GET /health/database - Database Health Contract', () => {
    it('should return valid database health contract', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/health/database')
        .expect(200);

      const body = response.body as DatabaseHealthResponse;

      // Contract validation
      expect(body).toMatchObject(ContractTestHelper.contracts.databaseHealth);

      // Business rules validation
      expect(ContractTestHelper.validators.isHealthyStatus(body.status)).toBe(
        true,
      );
      expect(
        ContractTestHelper.validators.isValidISOTimestamp(body.timestamp),
      ).toBe(true);
      expect(
        ContractTestHelper.validators.hasExpectedDatabaseStructure(
          body.database,
        ),
      ).toBe(true);
    });
  });

  describe('GET /health/detailed - Detailed Health Contract', () => {
    it('should return valid detailed health contract', async () => {
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/health/detailed')
        .expect(200);

      const body = response.body as DetailedHealthResponse;

      // Contract validation
      expect(body).toMatchObject(ContractTestHelper.contracts.detailedHealth);

      // Business rules validation
      expect(ContractTestHelper.validators.isHealthyStatus(body.status)).toBe(
        true,
      );
      expect(
        ContractTestHelper.validators.isValidISOTimestamp(body.timestamp),
      ).toBe(true);
      expect(
        ContractTestHelper.validators.isReasonableUptime(
          body.application.uptime,
        ),
      ).toBe(true);

      // System info should be reasonable
      expect(body.system.totalMemory).toBeGreaterThan(0);
      expect(body.system.freeMemory).toBeGreaterThanOrEqual(0);
      expect(body.system.freeMemory).toBeLessThanOrEqual(
        body.system.totalMemory,
      );
    });
  });

  describe('API Consistency Rules', () => {
    it('all endpoints should return consistent timestamp format', async () => {
      const serverInstance = app.getHttpServer() as Parameters<
        typeof request
      >[0];
      const [basicResponse, databaseResponse, detailedResponse] =
        await Promise.all([
          request(serverInstance).get('/health'),
          request(serverInstance).get('/health/database'),
          request(serverInstance).get('/health/detailed'),
        ]);

      const basic = basicResponse.body as HealthResponse;
      const database = databaseResponse.body as DatabaseHealthResponse;
      const detailed = detailedResponse.body as DetailedHealthResponse;

      // Business rule: All timestamps must be consistent ISO format
      [basic.timestamp, database.timestamp, detailed.timestamp].forEach(
        timestamp => {
          expect(
            ContractTestHelper.validators.isValidISOTimestamp(timestamp),
          ).toBe(true);
        },
      );

      // Business rule: All responses should have same timestamp structure
      const timestampRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(basic.timestamp).toMatch(timestampRegex);
      expect(database.timestamp).toMatch(timestampRegex);
      expect(detailed.timestamp).toMatch(timestampRegex);
    });

    it('should handle non-existent endpoints gracefully', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .get('/health/nonexistent')
        .expect(404);
    });

    it('should reject non-GET methods consistently', async () => {
      const serverInstance = app.getHttpServer() as Parameters<
        typeof request
      >[0];
      // NestJS returns 404 for undefined route+method combinations
      await request(serverInstance).post('/health').expect(404);
      await request(serverInstance).put('/health').expect(404);
      await request(serverInstance).delete('/health').expect(404);
    });
  });

  describe('Performance Contracts', () => {
    it('should respond within acceptable time limits', async () => {
      const start = Date.now();

      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .get('/health')
        .expect(200);

      const duration = Date.now() - start;

      // Business rule: Health checks should be fast (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    it('should handle concurrent requests without degradation', async () => {
      const serverInstance = app.getHttpServer() as Parameters<
        typeof request
      >[0];
      const promises = Array(3)
        .fill(null)
        .map(() => request(serverInstance).get('/health').expect(200));

      const responses = await Promise.all(promises);

      // Business rule: All concurrent requests should succeed
      responses.forEach(response => {
        const body = response.body as HealthResponse;
        expect(ContractTestHelper.validators.isHealthyStatus(body.status)).toBe(
          true,
        );
      });
    });
  });

  describe('Contract Test Data Generation', () => {
    it('should demonstrate deterministic test data generation', async () => {
      // Example of using deterministic test data for contract testing
      const testScenario = ContractTestHelper.generateTestData.healthScenario();

      // This demonstrates deterministic values perfect for contract testing
      expect(testScenario.uptime).toBe(150000); // Always the same value
      expect(testScenario.version).toBe('1.0.0'); // Predictable version
      expect(testScenario.environment).toBe('test'); // Known environment

      // Test scenario variations for different test cases
      const lowUptimeScenario =
        ContractTestHelper.generateTestData.scenarioVariations.lowUptime();
      expect(lowUptimeScenario.uptime).toBe(5000);
      expect(lowUptimeScenario.environment).toBe('development');

      // The actual API call remains deterministic for contract testing
      const response = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .get('/health')
        .expect(200);

      const body = response.body as HealthResponse;
      expect(ContractTestHelper.validators.isHealthyStatus(body.status)).toBe(
        true,
      );
    });
  });
});
