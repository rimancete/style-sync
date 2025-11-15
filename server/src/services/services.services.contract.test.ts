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
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateCustomerServiceDto } from './dto/create-customer-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

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

describe('Services - Service Management (Contract Tests)', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Test data
  let testCustomer: CustomerRecord;
  let testCustomer2: CustomerRecord;
  let testBranch1: BranchRecord;
  let testService1: ServiceRecord;
  let testService2: ServiceRecord;
  let adminToken: string;
  let clientToken: string;

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
          } else if (authHeader.includes('client-token')) {
            request.user = {
              userId: 'client-user-id',
              email: 'client@test.com',
              role: 'CLIENT',
              activeCustomerId: testCustomer?.id,
              customerIds: [testCustomer?.id],
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
    const testCountry = await db.country.create({
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

    // Create test branch
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

    // Set up mock tokens
    adminToken = 'Bearer admin-token';
    clientToken = 'Bearer client-token';

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
    // Clean up test services after each test (order matters due to foreign keys)
    await db.booking.deleteMany();
    await db.userCustomer.deleteMany();
    await db.user.deleteMany();
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

  describe('Admin Service Management', () => {
    describe('POST /services', () => {
      it('should create a service successfully', async () => {
        const createDto: CreateServiceDto = {
          name: 'New Admin Service',
          description: 'Admin service description',
          duration: 45,
          isActive: true,
          customerId: testCustomer.id,
        };

        const response = await request(app.getHttpServer())
          .post('/services')
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toMatchObject({
          data: {
            id: expect.any(String),
            displayId: expect.any(Number),
            name: 'New Admin Service',
            description: 'Admin service description',
            duration: 45,
            isActive: true,
            customerId: testCustomer.id,
            customerName: testCustomer.name,
            createdAt: expect.any(String),
            updatedAt: null, // Should be null on creation
          },
        });
      });

      it('should reject service creation with invalid duration', async () => {
        const createDto: CreateServiceDto = {
          name: 'Invalid Duration Service',
          description: 'Test',
          duration: 3, // Too short (< 5 minutes)
          isActive: true,
          customerId: testCustomer.id,
        };

        await request(app.getHttpServer())
          .post('/services')
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.BAD_REQUEST);
      });

      it('should reject service creation with duplicate name for same customer (when existing is active)', async () => {
        const createDto: CreateServiceDto = {
          name: testService1.name, // Duplicate of active service
          description: 'Test',
          duration: 30,
          isActive: true,
          customerId: testCustomer.id,
        };

        const response = await request(app.getHttpServer())
          .post('/services')
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.CONFLICT);

        // Verify error message mentions "active service"
        expect(response.body.message).toContain('active service');
      });
    });

    describe('GET /services', () => {
      it('should list all services across customers', async () => {
        const response = await request(app.getHttpServer())
          .get('/services')
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        expect(response.body.data).toMatchObject({
          services: expect.arrayContaining([
            expect.objectContaining({
              id: testService1.id,
              name: testService1.name,
            }),
            expect.objectContaining({
              id: testService2.id,
              name: testService2.name,
            }),
          ]),
          total: expect.any(Number),
          page: 1,
          limit: 500,
        });
      });

      it('should filter services by isActive', async () => {
        // Create inactive service
        await db.service.create({
          data: {
            name: 'Inactive Service',
            duration: 30,
            isActive: false,
            customerId: testCustomer.id,
          },
        });

        const response = await request(app.getHttpServer())
          .get('/services?isActive=true')
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        const inactiveServices = response.body.data.services.filter(
          (s: { isActive: boolean }) => !s.isActive,
        );
        expect(inactiveServices).toHaveLength(0);
      });
    });

    describe('GET /services/:id', () => {
      it('should get service by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          data: {
            id: testService1.id,
            name: testService1.name,
            description: testService1.description,
            duration: testService1.duration,
            isActive: testService1.isActive,
            customerName: testCustomer.name,
            updatedAt: null, // Should be null (not updated yet)
          },
        });
      });

      it('should return 404 for non-existent service', async () => {
        await request(app.getHttpServer())
          .get('/services/non-existent-id')
          .set('Authorization', adminToken)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('PATCH /services/:id', () => {
      it('should update service successfully', async () => {
        const updateDto: UpdateServiceDto = {
          name: 'Updated Service Name',
          duration: 90,
        };

        const response = await request(app.getHttpServer())
          .patch(`/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .send(updateDto)
          .expect(HttpStatus.OK);

        expect(response.body).toMatchObject({
          data: {
            id: testService1.id,
            name: 'Updated Service Name',
            duration: 90,
            updatedAt: expect.any(String), // Should have timestamp after update
          },
        });

        // Verify updatedAt is not null
        expect(response.body.data.updatedAt).not.toBeNull();
      });

      it('should allow deactivation via isActive field', async () => {
        const updateDto: UpdateServiceDto = {
          isActive: false,
        };

        const response = await request(app.getHttpServer())
          .patch(`/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .send(updateDto)
          .expect(HttpStatus.OK);

        expect(response.body.data.isActive).toBe(false);
      });
    });

    describe('DELETE /services/:id', () => {
      it('should delete service without bookings', async () => {
        await request(app.getHttpServer())
          .delete(`/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.NO_CONTENT);

        // Verify service is deactivated (isActive: false)
        const service = await db.service.findUnique({
          where: { id: testService1.id },
        });

        expect(service?.isActive).toBe(false);
      });

      it('should prevent deletion if bookings exist', async () => {
        // Create a test user for the booking
        const testUser = await db.user.create({
          data: {
            name: 'Test Booking User',
            email: 'testbooking@test.com',
            password: 'hashedPassword123',
            role: 'CLIENT',
            customers: {
              create: {
                customerId: testCustomer.id,
              },
            },
          },
        });

        // Create a booking for the service
        await db.booking.create({
          data: {
            userId: testUser.id,
            customerId: testCustomer.id,
            branchId: testBranch1.id,
            serviceId: testService1.id,
            scheduledAt: new Date('2025-12-01T10:00:00Z'),
            status: 'CONFIRMED',
            totalPrice: 25.0,
          },
        });

        const response = await request(app.getHttpServer())
          .delete(`/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.CONFLICT);

        expect(response.body.message).toContain('bookings');
      });
    });
  });

  describe('Customer-Scoped Service Management', () => {
    describe('POST /salon/:customerSlug/services', () => {
      it('should create service for customer', async () => {
        const createDto: CreateCustomerServiceDto = {
          name: 'Customer Service',
          description: 'Customer service description',
          duration: 30,
          isActive: true,
        };

        const response = await request(app.getHttpServer())
          .post(`/salon/${testCustomer.urlSlug}/services`)
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toMatchObject({
          data: {
            id: expect.any(String),
            name: 'Customer Service',
            customerId: testCustomer.id,
            updatedAt: null,
          },
        });
      });

      it('should reject CLIENT role from creating services', async () => {
        const createDto: CreateCustomerServiceDto = {
          name: 'Client Service',
          duration: 30,
        };

        await request(app.getHttpServer())
          .post(`/salon/${testCustomer.urlSlug}/services`)
          .set('Authorization', clientToken)
          .send(createDto)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('GET /salon/:customerSlug/services', () => {
      it('should list customer services', async () => {
        const response = await request(app.getHttpServer())
          .get(`/salon/${testCustomer.urlSlug}/services`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        expect(response.body.data).toMatchObject({
          services: expect.arrayContaining([
            expect.objectContaining({
              id: testService1.id,
              customerId: testCustomer.id,
            }),
          ]),
          total: expect.any(Number),
        });
      });

      it('should filter services by branchId and show pricing', async () => {
        // Create pricing for service at branch
        await db.servicePricing.create({
          data: {
            serviceId: testService1.id,
            branchId: testBranch1.id,
            price: 25.0,
          },
        });

        const response = await request(app.getHttpServer())
          .get(
            `/salon/${testCustomer.urlSlug}/services?branchId=${testBranch1.id}`,
          )
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        const serviceWithPricing = response.body.data.services.find(
          (s: { id: string }) => s.id === testService1.id,
        );

        expect(serviceWithPricing).toMatchObject({
          id: testService1.id,
          pricing: {
            branchId: testBranch1.id,
            branchName: testBranch1.name,
            price: '25.00',
            currency: testCustomer.currency, // From customer
          },
        });
      });
    });

    describe('GET /salon/:customerSlug/services/:id', () => {
      it('should get customer service by ID', async () => {
        const response = await request(app.getHttpServer())
          .get(`/salon/${testCustomer.urlSlug}/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        expect(response.body.data).toMatchObject({
          id: testService1.id,
          customerId: testCustomer.id,
        });
      });

      it('should not allow accessing service from different customer', async () => {
        // Create service for customer 2
        const service2 = await db.service.create({
          data: {
            name: 'Customer 2 Service',
            duration: 30,
            isActive: true,
            customerId: testCustomer2.id,
          },
        });

        // Try to access customer 2's service via customer 1's URL
        await request(app.getHttpServer())
          .get(`/salon/${testCustomer.urlSlug}/services/${service2.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('PATCH /salon/:customerSlug/services/:id', () => {
      it('should update customer service', async () => {
        const updateDto: UpdateServiceDto = {
          name: 'Updated Customer Service',
        };

        const response = await request(app.getHttpServer())
          .patch(`/salon/${testCustomer.urlSlug}/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .send(updateDto)
          .expect(HttpStatus.OK);

        expect(response.body.data.name).toBe('Updated Customer Service');
        expect(response.body.data.updatedAt).not.toBeNull();
      });

      it('should reject CLIENT role from updating services', async () => {
        const updateDto: UpdateServiceDto = {
          name: 'Client Update',
        };

        await request(app.getHttpServer())
          .patch(`/salon/${testCustomer.urlSlug}/services/${testService1.id}`)
          .set('Authorization', clientToken)
          .send(updateDto)
          .expect(HttpStatus.FORBIDDEN);
      });
    });

    describe('DELETE /salon/:customerSlug/services/:id', () => {
      it('should delete customer service', async () => {
        await request(app.getHttpServer())
          .delete(`/salon/${testCustomer.urlSlug}/services/${testService1.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.NO_CONTENT);
      });

      it('should reject CLIENT role from deleting services', async () => {
        await request(app.getHttpServer())
          .delete(`/salon/${testCustomer.urlSlug}/services/${testService1.id}`)
          .set('Authorization', clientToken)
          .expect(HttpStatus.FORBIDDEN);
      });
    });
  });

  describe('Service Validation and Edge Cases', () => {
    it('should handle very long service names (at limit)', async () => {
      const longName = 'A'.repeat(100); // Max is 100 characters
      const createDto: CreateCustomerServiceDto = {
        name: longName,
        duration: 30,
      };

      const response = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data.name).toBe(longName);
    });

    it('should reject service names that are too long', async () => {
      const tooLongName = 'A'.repeat(101); // Max is 100
      const createDto: CreateCustomerServiceDto = {
        name: tooLongName,
        duration: 30,
      };

      await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject service names that are too short', async () => {
      const tooShortName = 'A'; // Min is 2 characters
      const createDto: CreateCustomerServiceDto = {
        name: tooShortName,
        duration: 30,
      };

      await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should handle maximum duration (480 minutes)', async () => {
      const createDto: CreateCustomerServiceDto = {
        name: 'Long Duration Service',
        duration: 480, // 8 hours max
      };

      const response = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto)
        .expect(HttpStatus.CREATED);

      expect(response.body.data.duration).toBe(480);
    });

    it('should reject duration exceeding maximum', async () => {
      const createDto: CreateCustomerServiceDto = {
        name: 'Too Long Service',
        duration: 481, // Exceeds 8 hours
      };

      await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should allow services with same name for different customers', async () => {
      const serviceName = 'Shared Service Name';

      // Create for customer 1
      const createDto1: CreateServiceDto = {
        name: serviceName,
        duration: 30,
        customerId: testCustomer.id,
      };

      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', adminToken)
        .send(createDto1)
        .expect(HttpStatus.CREATED);

      // Create same name for customer 2
      const createDto2: CreateServiceDto = {
        name: serviceName,
        duration: 30,
        customerId: testCustomer2.id,
      };

      await request(app.getHttpServer())
        .post('/services')
        .set('Authorization', adminToken)
        .send(createDto2)
        .expect(HttpStatus.CREATED);
    });

    it('should sort services by displayId then name', async () => {
      // Services should be sorted by displayId (creation order), then name
      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      const services = response.body.data.services;

      // Verify ordering
      for (let i = 0; i < services.length - 1; i++) {
        const current = services[i];
        const next = services[i + 1];

        // displayId should be ascending
        if (current.displayId === next.displayId) {
          // If displayIds are equal, name should be ascending
          expect(current.name.localeCompare(next.name)).toBeLessThanOrEqual(0);
        } else {
          expect(current.displayId).toBeLessThan(next.displayId);
        }
      }
    });

    it('should allow creating a service with same name as an inactive service', async () => {
      const serviceName = 'Seasonal Special';

      // Create first service
      const createDto1: CreateCustomerServiceDto = {
        name: serviceName,
        duration: 30,
      };

      const response1 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto1)
        .expect(HttpStatus.CREATED);

      const firstServiceId = response1.body.data.id;

      // Deactivate the first service
      await request(app.getHttpServer())
        .patch(`/salon/${testCustomer.urlSlug}/services/${firstServiceId}`)
        .set('Authorization', adminToken)
        .send({ isActive: false })
        .expect(HttpStatus.OK);

      // Create new service with same name (should succeed)
      const createDto2: CreateCustomerServiceDto = {
        name: serviceName,
        duration: 45,
        description: 'New version',
      };

      const response2 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto2)
        .expect(HttpStatus.CREATED);

      expect(response2.body.data.name).toBe(serviceName);
      expect(response2.body.data.id).not.toBe(firstServiceId);
      expect(response2.body.data.duration).toBe(45);
    });

    it('should reject creating a service with same name as an active service', async () => {
      const serviceName = 'Active Service Name';

      // Create first service
      const createDto1: CreateCustomerServiceDto = {
        name: serviceName,
        duration: 30,
      };

      await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto1)
        .expect(HttpStatus.CREATED);

      // Try to create second service with same name (should fail)
      const createDto2: CreateCustomerServiceDto = {
        name: serviceName,
        duration: 45,
      };

      const response = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto2)
        .expect(HttpStatus.CONFLICT);

      expect(response.body.message).toContain('active service');
      expect(response.body.message).toContain(serviceName);
    });

    it('should only show new active service in listings after replacing inactive service', async () => {
      const serviceName = 'Replaceable Service';

      // Create and deactivate first service
      const createDto1: CreateCustomerServiceDto = {
        name: serviceName,
        duration: 30,
        description: 'Old version',
      };

      const response1 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto1)
        .expect(HttpStatus.CREATED);

      const oldServiceId = response1.body.data.id;

      await request(app.getHttpServer())
        .patch(`/salon/${testCustomer.urlSlug}/services/${oldServiceId}`)
        .set('Authorization', adminToken)
        .send({ isActive: false })
        .expect(HttpStatus.OK);

      // Create new service with same name
      const createDto2: CreateCustomerServiceDto = {
        name: serviceName,
        duration: 60,
        description: 'New version',
      };

      const response2 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .send(createDto2)
        .expect(HttpStatus.CREATED);

      const newServiceId = response2.body.data.id;

      // List active services - should only show new one
      const listResponse = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/services`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      const servicesWithName = listResponse.body.data.services.filter(
        (s: any) => s.name === serviceName,
      );

      expect(servicesWithName).toHaveLength(1);
      expect(servicesWithName[0].id).toBe(newServiceId);
      expect(servicesWithName[0].description).toBe('New version');
      expect(servicesWithName[0].duration).toBe(60);

      // List inactive services - should show the old one
      const inactiveServicesResponse = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/services?isActive=false`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      const inactiveServicesWithName =
        inactiveServicesResponse.body.data.services.filter(
          (s: any) => s.name === serviceName,
        );

      expect(inactiveServicesWithName.length).toBeGreaterThanOrEqual(1);
      expect(
        inactiveServicesWithName.some((s: any) => s.id === oldServiceId),
      ).toBe(true);
    });
  });
});
