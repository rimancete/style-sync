/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication, HttpStatus, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { ServicesModule } from './services.module';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { GlobalAdminGuard } from '../common/guards/global-admin.guard';
import { AuthenticatedUser } from '../common/types/auth.types';
import { CreateServicePricingDto } from './dto/create-service-pricing.dto';

interface CustomerRecord {
  id: string;
  name: string;
  urlSlug: string;
  currency: string;
  isActive: boolean;
}

interface BranchRecord {
  id: string;
  name: string;
  customerId: string;
}

interface ServiceRecord {
  id: string;
  displayId: number;
  name: string;
  description: string | null;
  duration: number;
  isActive: boolean;
  customerId: string;
  createdAt: Date;
  updatedAt: Date | null;
}

describe('Services - Pricing Management (Contract Tests)', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Test data
  let testCustomer: CustomerRecord;
  let testCustomer2: CustomerRecord;
  let testBranch1: BranchRecord;
  let testBranch2: BranchRecord;
  let testService1: ServiceRecord;
  let testService2: ServiceRecord;
  let testCountry: { id: string; code: string };
  let adminToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        ServicesModule,
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          const authHeader = request.headers.authorization;

          if (!authHeader) {
            return false;
          }

          // Mock user based on token
          if (authHeader.includes('admin-token')) {
            request.user = {
              userId: 'admin-user-id',
              email: 'admin@test.com',
              role: 'ADMIN',
              activeCustomerId: undefined,
              customerIds: [], // Empty array = global admin
            } as AuthenticatedUser;
          }

          return true;
        },
      })
      .overrideGuard(CustomerContextGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          request.user.activeCustomerId = testCustomer?.id;
          return true;
        },
      })
      .overrideGuard(GlobalAdminGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          const user = request.user;
          // Allow if user is ADMIN with empty customerIds (global admin)
          return (
            user?.role === 'ADMIN' &&
            (!user.customerIds || user.customerIds.length === 0)
          );
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Enable validation
    const { ValidationPipe } = await import('@nestjs/common');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors();

    db = app.get<DatabaseService>(DatabaseService);

    // Clean up before tests (order matters due to foreign keys)
    await db.booking.deleteMany();
    await db.userCustomer.deleteMany();
    await db.user.deleteMany();
    await db.servicePricing.deleteMany();
    await db.service.deleteMany();
    await db.branch.deleteMany();
    await db.customer.deleteMany();
    await db.country.deleteMany();

    // Create test country
    testCountry = await db.country.create({
      data: {
        code: 'US',
        name: 'United States',
        addressFormat: {
          fields: ['street', 'city', 'stateProvince', 'postalCode'],
          required: ['street', 'city', 'stateProvince', 'postalCode'],
        },
      },
    });

    // Create test customers
    testCustomer = await db.customer.create({
      data: {
        name: 'Test Customer',
        urlSlug: 'test-customer',
        currency: 'USD',
        isActive: true,
      },
    });

    testCustomer2 = await db.customer.create({
      data: {
        name: 'Test Customer 2',
        urlSlug: 'test-customer-2',
        currency: 'BRL',
        isActive: true,
      },
    });

    // Create test branches
    testBranch1 = await db.branch.create({
      data: {
        name: 'Test Branch 1',
        countryCode: 'US',
        street: '123 Test St',
        city: 'Test City',
        stateProvince: 'CA',
        postalCode: '12345',
        phone: '+1234567890',
        formattedAddress: '123 Test St, Test City, CA 12345',
        countryId: testCountry.id,
        customerId: testCustomer.id,
      },
    });

    testBranch2 = await db.branch.create({
      data: {
        name: 'Test Branch 2',
        countryCode: 'US',
        street: '456 Test Ave',
        city: 'Test City',
        stateProvince: 'CA',
        postalCode: '12345',
        phone: '+1234567890',
        formattedAddress: '456 Test Ave, Test City, CA 12345',
        countryId: testCountry.id,
        customerId: testCustomer.id,
      },
    });

    // Set up mock token
    adminToken = 'Bearer admin-token';

    await app.init();
  });

  afterAll(async () => {
    // Clean up after tests (order matters due to foreign keys)
    await db.booking.deleteMany();
    await db.userCustomer.deleteMany();
    await db.user.deleteMany();
    await db.servicePricing.deleteMany();
    await db.service.deleteMany();
    await db.branch.deleteMany();
    await db.customer.deleteMany();
    await db.country.deleteMany();

    await app.close();
  });

  afterEach(async () => {
    // Clean up test data after each test
    await db.servicePricing.deleteMany();
    await db.service.deleteMany();
  });

  beforeEach(async () => {
    // Create test services for each test
    const service1 = await db.service.create({
      data: {
        name: 'Test Service 1',
        description: 'Test description 1',
        duration: 30,
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    testService1 = {
      id: service1.id,
      displayId: service1.displayId,
      name: service1.name,
      description: service1.description,
      duration: service1.duration,
      isActive: service1.isActive,
      customerId: service1.customerId,
      createdAt: service1.createdAt,
      updatedAt: service1.updatedAt,
    };

    const service2 = await db.service.create({
      data: {
        name: 'Test Service 2',
        description: 'Test description 2',
        duration: 60,
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    testService2 = {
      id: service2.id,
      displayId: service2.displayId,
      name: service2.name,
      description: service2.description,
      duration: service2.duration,
      isActive: service2.isActive,
      customerId: service2.customerId,
      createdAt: service2.createdAt,
      updatedAt: service2.updatedAt,
    };
  });

  describe('POST /salon/:customerSlug/services/:serviceId/pricing', () => {
    it('should create pricing for service at branch', async () => {
      const pricingDto: CreateServicePricingDto = {
        branchId: testBranch1.id,
        price: 35.5,
      };

      const response = await request(app.getHttpServer())
        .post(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing`,
        )
        .set('Authorization', adminToken)
        .send(pricingDto)
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        data: {
          id: expect.any(String),
          displayId: expect.any(Number),
          serviceId: testService1.id,
          serviceName: testService1.name,
          branchId: testBranch1.id,
          branchName: testBranch1.name,
          price: '35.50',
          currency: testCustomer.currency,
          createdAt: expect.any(String),
          updatedAt: null, // Should be null on creation
        },
      });
    });

    it('should update existing pricing via upsert', async () => {
      // Create initial pricing
      await db.servicePricing.create({
        data: {
          serviceId: testService1.id,
          branchId: testBranch1.id,
          price: 25.0,
        },
      });

      // Update pricing
      const pricingDto: CreateServicePricingDto = {
        branchId: testBranch1.id,
        price: 30.0,
      };

      const response = await request(app.getHttpServer())
        .post(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing`,
        )
        .set('Authorization', adminToken)
        .send(pricingDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data.price).toBe('30.00');
      expect(response.body.data.updatedAt).not.toBeNull(); // Should have timestamp on update
    });

    it('should reject invalid price (too low)', async () => {
      const pricingDto: CreateServicePricingDto = {
        branchId: testBranch1.id,
        price: 0.001, // Below minimum
      };

      await request(app.getHttpServer())
        .post(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing`,
        )
        .set('Authorization', adminToken)
        .send(pricingDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject invalid price (too high)', async () => {
      const pricingDto: CreateServicePricingDto = {
        branchId: testBranch1.id,
        price: 10000.0, // Above maximum
      };

      await request(app.getHttpServer())
        .post(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing`,
        )
        .set('Authorization', adminToken)
        .send(pricingDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject price with more than 2 decimal places', async () => {
      const pricingDto: CreateServicePricingDto = {
        branchId: testBranch1.id,
        price: 25.999, // 3 decimal places
      };

      await request(app.getHttpServer())
        .post(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing`,
        )
        .set('Authorization', adminToken)
        .send(pricingDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject pricing for branch from different customer', async () => {
      // Create branch for customer 2
      const branch2 = await db.branch.create({
        data: {
          name: 'Customer 2 Branch',
          countryCode: 'US',
          street: '789 Test Blvd',
          city: 'Test City',
          stateProvince: 'CA',
          postalCode: '12345',
          phone: '+1234567890',
          formattedAddress: '789 Test Blvd, Test City, CA 12345',
          countryId: testCountry.id,
          customerId: testCustomer2.id,
        },
      });

      const pricingDto: CreateServicePricingDto = {
        branchId: branch2.id, // Different customer's branch
        price: 35.0,
      };

      await request(app.getHttpServer())
        .post(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing`,
        )
        .set('Authorization', adminToken)
        .send(pricingDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /salon/:customerSlug/services/:serviceId/pricing/:branchId', () => {
    it('should get pricing for service at branch', async () => {
      // Create pricing
      await db.servicePricing.create({
        data: {
          serviceId: testService1.id,
          branchId: testBranch1.id,
          price: 42.75,
        },
      });

      const response = await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing/${testBranch1.id}`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        data: {
          serviceId: testService1.id,
          branchId: testBranch1.id,
          price: '42.75',
          currency: testCustomer.currency,
          updatedAt: null,
        },
      });
    });

    it('should return 404 for non-existent pricing', async () => {
      await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing/${testBranch2.id}`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('GET /salon/:customerSlug/branches/:branchId/services', () => {
    it('should list services with pricing for branch', async () => {
      // Create pricing for both services at branch 1
      await db.servicePricing.createMany({
        data: [
          {
            serviceId: testService1.id,
            branchId: testBranch1.id,
            price: 25.0,
          },
          {
            serviceId: testService2.id,
            branchId: testBranch1.id,
            price: 50.0,
          },
        ],
      });

      const response = await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/branches/${testBranch1.id}/services`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.branch).toMatchObject({
        id: testBranch1.id,
        name: testBranch1.name,
      });
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.services).toHaveLength(2);

      // Find specific services and check pricing
      const service1 = response.body.data.services.find(
        (s: { id: string }) => s.id === testService1.id,
      );
      const service2 = response.body.data.services.find(
        (s: { id: string }) => s.id === testService2.id,
      );

      expect(service1).toMatchObject({
        id: testService1.id,
        pricing: {
          price: '25.00',
          currency: testCustomer.currency,
        },
      });

      expect(service2).toMatchObject({
        id: testService2.id,
        pricing: {
          price: '50.00',
          currency: testCustomer.currency,
        },
      });
    });

    it('should only show services with pricing at the branch', async () => {
      // Only create pricing for service 1
      await db.servicePricing.create({
        data: {
          serviceId: testService1.id,
          branchId: testBranch1.id,
          price: 25.0,
        },
      });

      const response = await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/branches/${testBranch1.id}/services`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].id).toBe(testService1.id);
    });

    it('should only show active services', async () => {
      // Create pricing for both services
      await db.servicePricing.createMany({
        data: [
          {
            serviceId: testService1.id,
            branchId: testBranch1.id,
            price: 25.0,
          },
          {
            serviceId: testService2.id,
            branchId: testBranch1.id,
            price: 50.0,
          },
        ],
      });

      // Deactivate service 2
      await db.service.update({
        where: { id: testService2.id },
        data: { isActive: false },
      });

      const response = await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/branches/${testBranch1.id}/services`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].id).toBe(testService1.id);
    });

    it('should return 404 for non-existent branch', async () => {
      await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/branches/non-existent-branch/services`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('DELETE /salon/:customerSlug/services/:serviceId/pricing/:branchId', () => {
    it('should delete pricing', async () => {
      // Create pricing
      await db.servicePricing.create({
        data: {
          serviceId: testService1.id,
          branchId: testBranch1.id,
          price: 25.0,
        },
      });

      await request(app.getHttpServer())
        .delete(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing/${testBranch1.id}`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.NO_CONTENT);

      // Verify pricing is deleted
      const pricing = await db.servicePricing.findUnique({
        where: {
          serviceId_branchId: {
            serviceId: testService1.id,
            branchId: testBranch1.id,
          },
        },
      });

      expect(pricing).toBeNull();
    });

    it('should return 404 for non-existent pricing', async () => {
      await request(app.getHttpServer())
        .delete(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing/${testBranch2.id}`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('Pricing Validation and Currency Handling', () => {
    it('should correctly show currency from customer configuration', async () => {
      // Create pricing for test service at testCustomer's branch
      await db.servicePricing.create({
        data: {
          serviceId: testService1.id,
          branchId: testBranch1.id,
          price: 50.0,
        },
      });

      const response = await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing/${testBranch1.id}`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      // testCustomer uses USD currency
      expect(response.body.data.currency).toBe('USD');
      expect(response.body.data.price).toBe('50.00');
    });

    it('should format price with 2 decimal places', async () => {
      // Create pricing with whole number
      await db.servicePricing.create({
        data: {
          serviceId: testService1.id,
          branchId: testBranch1.id,
          price: 100,
        },
      });

      const response = await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing/${testBranch1.id}`,
        )
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.price).toBe('100.00');
    });

    it('should reject non-numeric price values', async () => {
      const pricingDto = {
        branchId: testBranch1.id,
        price: 'not-a-number',
      };

      await request(app.getHttpServer())
        .post(
          `/salon/${testCustomer.urlSlug}/services/${testService1.id}/pricing`,
        )
        .set('Authorization', adminToken)
        .send(pricingDto)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
