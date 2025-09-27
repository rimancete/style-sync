/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { DatabaseService } from '../database/database.service';
import { CustomersModule } from './customers.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

describe('Customers Upload API Contracts', () => {
  let app: INestApplication;
  let customerId: string;

  beforeAll(async () => {
    // Set up test data
    const customers = [
      {
        id: 'test-customer-1',
        name: 'Test Barbershop',
        urlSlug: 'test-barbershop',
        documentTitle: 'Test Barbershop - Professional Haircuts',
        logoAlt: 'Test Barbershop Logo',
        primaryMain: '#272726FF',
        primaryLight: '#706E6DFF',
        primaryDark: '#1B1B1BFF',
        primaryContrast: '#ECE8E6FF',
        secondaryMain: '#8D8C8BFF',
        secondaryLight: '#E7E7E6FF',
        secondaryDark: '#3B3B3BFF',
        secondaryContrast: '#1B1B1BFF',
        backgroundColor: '#F7F7F7FF',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const users = [
      {
        id: 'admin-user-1',
        email: 'admin@test.com',
        password: '$2b$10$hashedpassword', // bcrypt hash for 'password123'
        name: 'Admin User',
        phone: '+1234567890',
        role: 'ADMIN' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockDb: Partial<DatabaseService> = {
      customer: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id) {
            return Promise.resolve(
              customers.find(c => c.id === where.id) || null,
            );
          }
          if (where.urlSlug) {
            return Promise.resolve(
              customers.find(c => c.urlSlug === where.urlSlug) || null,
            );
          }
          return Promise.resolve(null);
        }),
        update: jest.fn().mockImplementation(({ where, data }) => {
          const customer = customers.find(c => c.id === where.id);
          if (!customer) return Promise.resolve(null);

          const updated = { ...customer, ...data, updatedAt: new Date() };
          const index = customers.findIndex(c => c.id === where.id);
          customers[index] = updated;
          return Promise.resolve(updated);
        }),
      } as any,
      user: {
        findUnique: jest.fn().mockImplementation(({ where }) => {
          return Promise.resolve(
            users.find(u => u.email === where.email) || null,
          );
        }),
      } as any,
      userCustomer: {
        findMany: jest.fn().mockResolvedValue([]),
      } as any,
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        CustomersModule,
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDb)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');

    await app.init();
    customerId = customers[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/customers/:customerId/branding', () => {
    it('should create customer branding with files and config', async () => {
      const configJson = JSON.stringify({
        documentTitle: 'Updated Test Barbershop',
        logoAlt: 'Updated Logo Alt',
        theme: {
          light: {
            primary: {
              main: '#FF0000',
            },
          },
        },
      });

      // Create a simple 1x1 PNG buffer for testing
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xfc, 0xff, 0x9f, 0x01,
        0x00, 0x07, 0x00, 0x02, 0x7f, 0x21, 0xc8, 0x6f, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app.getHttpServer())
        .post(`/api/customers/${customerId}/branding`)
        .attach('logo', testImageBuffer, 'test-logo.png')
        .attach('favicon32x32', testImageBuffer, 'test-favicon.png')
        .field('config', configJson);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', customerId);
      expect(response.body.data).toHaveProperty('branding');
      expect(response.body.data.branding).toHaveProperty(
        'documentTitle',
        'Updated Test Barbershop',
      );
      expect(response.body.data.branding.theme.light).toHaveProperty(
        'logoAlt',
        'Updated Logo Alt',
      );
      expect(response.body.data.branding.theme.light.primary).toHaveProperty(
        'main',
        '#FF0000',
      );
    });

    it('should return 400 when no files are uploaded', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/customers/${customerId}/branding`)
        .field('config', '{"documentTitle": "Test"}');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty(
        'message',
        'At least one file must be uploaded',
      );
    });

    it('should return 404 for non-existent customer', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app.getHttpServer())
        .post('/api/customers/non-existent-id/branding')
        .attach('logo', testImageBuffer, 'test-logo.png');

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('status', 404);
      expect(response.body.message).toContain('not found');
    });

    it('should work with bypassed authentication (test setup)', async () => {
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xfc, 0xff, 0x9f, 0x01,
        0x00, 0x07, 0x00, 0x02, 0x7f, 0x21, 0xc8, 0x6f, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app.getHttpServer())
        .post(`/api/customers/${customerId}/branding`)
        .attach('logo', testImageBuffer, 'test-logo.png');

      expect(response.status).toBe(201);
    });
  });

  describe('POST /api/customers/:customerId/branding/upload', () => {
    it('should update customer branding files only', async () => {
      const testImageBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0xfc, 0xff, 0x9f, 0x01,
        0x00, 0x07, 0x00, 0x02, 0x7f, 0x21, 0xc8, 0x6f, 0x00, 0x00, 0x00, 0x00,
        0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app.getHttpServer())
        .post(`/api/customers/${customerId}/branding/upload`)
        .attach('logo', testImageBuffer, 'updated-logo.png');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', customerId);
      expect(response.body.data).toHaveProperty('branding');
    });

    it('should return 400 when no files are uploaded', async () => {
      const response = await request(app.getHttpServer()).post(
        `/api/customers/${customerId}/branding/upload`,
      );
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty(
        'message',
        'At least one file must be uploaded',
      );
    });
  });

  describe('File Upload Validation', () => {
    it('should handle invalid JSON in config field', async () => {
      const testImageBuffer = Buffer.from('fake-image-data');

      const response = await request(app.getHttpServer())
        .post(`/api/customers/${customerId}/branding`)
        .attach('logo', testImageBuffer, 'test-logo.png')
        .field('config', 'invalid-json');

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body.message).toContain('Invalid JSON');
    });
  });
});
