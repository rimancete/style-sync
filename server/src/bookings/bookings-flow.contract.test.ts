/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication, HttpStatus, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { BookingsModule } from './bookings.module';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { AuthenticatedUser } from '../common/types/auth.types';
import { SchedulesModule } from '../schedules/schedules.module';

describe('Bookings Flow (Contract Tests)', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Test data
  let testCustomer: { id: string; urlSlug: string; currency: string };
  let testBranch: { id: string; customerId: string; name: string };
  let testService: {
    id: string;
    customerId: string;
    duration: number;
    name: string;
  };
  let testProfessional: { id: string; customerId: string; name: string };
  let testUser: { id: string; name: string };
  let clientToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        BookingsModule,
        SchedulesModule,
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

          if (authHeader.includes('client-token')) {
            request.user = {
              userId: testUser?.id,
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
          const user = request.user as AuthenticatedUser;

          if (user && testCustomer) {
            user.activeCustomerId = testCustomer.id;
            user.activeCustomerSlug = testCustomer.urlSlug;
          }

          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    db = moduleFixture.get<DatabaseService>(DatabaseService);
    clientToken = 'Bearer client-token';

    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestDataSafe();
    await app.close();
  });

  async function setupTestData() {
    // Create customer with unique slug
    const uniqueSlug = `flow-test-${Date.now()}`;
    testCustomer = await db.customer.create({
      data: {
        name: 'Flow Test Customer',
        urlSlug: uniqueSlug,
        currency: 'USD',
        isActive: true,
      },
    });

    // Create or get country
    const country = await db.country.upsert({
      where: { code: 'US' },
      update: {},
      create: {
        code: 'US',
        name: 'United States',
        addressFormat: {},
      },
    });

    // Create branch
    testBranch = await db.branch.create({
      data: {
        name: 'Flow Branch',
        phone: '+1234567890',
        countryCode: 'US',
        street: '123 Flow St',
        city: 'Flow City',
        stateProvince: 'FL',
        postalCode: '12345',
        formattedAddress: '123 Flow St, Flow City, FL 12345',
        timezone: 'UTC', // Explicitly set timezone for consistent testing
        countryId: country.id,
        customerId: testCustomer.id,
      },
    });

    // Create branch schedule (Open every day)
    for (let i = 0; i <= 6; i++) {
      await db.branchSchedule.create({
        data: {
          branchId: testBranch.id,
          dayOfWeek: i,
          startTime: '09:00',
          endTime: '18:00',
          isClosed: false,
        },
      });
    }

    // Create service
    testService = await db.service.create({
      data: {
        name: 'Flow Service',
        description: 'Service for flow test',
        duration: 30,
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    // Create service pricing
    await db.servicePricing.create({
      data: {
        serviceId: testService.id,
        branchId: testBranch.id,
        price: 30.0,
      },
    });

    // Create professional
    testProfessional = await db.professional.create({
      data: {
        name: 'Flow Pro',
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    // Create professional schedule (Open every day)
    for (let i = 0; i <= 6; i++) {
      await db.professionalSchedule.create({
        data: {
          professionalId: testProfessional.id,
          dayOfWeek: i,
          startTime: '09:00',
          endTime: '18:00',
          isClosed: false,
        },
      });
    }

    // Link professional to branch
    await db.professionalBranch.create({
      data: {
        professionalId: testProfessional.id,
        branchId: testBranch.id,
      },
    });

    // Create user
    testUser = await db.user.create({
      data: {
        email: 'flowuser@test.com',
        name: 'Flow User',
        password: 'hashed_password',
        role: 'CLIENT',
      },
    });
  }

  async function cleanupTestDataSafe() {
    // Cleanup using test variables if available
    if (testCustomer?.id) {
      await db.booking.deleteMany({ where: { customerId: testCustomer.id } });
      await db.servicePricing.deleteMany({
        where: { service: { customerId: testCustomer.id } },
      });
      await db.service.deleteMany({ where: { customerId: testCustomer.id } });
      await db.professionalSchedule.deleteMany({
        where: { professional: { customerId: testCustomer.id } },
      });
      await db.professionalBranch.deleteMany({
        where: { professional: { customerId: testCustomer.id } },
      });
      await db.professional.deleteMany({
        where: { customerId: testCustomer.id },
      });
      await db.branchSchedule.deleteMany({
        where: { branch: { customerId: testCustomer.id } },
      });
      await db.branch.deleteMany({ where: { customerId: testCustomer.id } });
      await db.customer.delete({ where: { id: testCustomer.id } });
    }

    // Clean up test user if available
    if (testUser?.id) {
      await db.user.deleteMany({ where: { id: testUser.id } });
    }
  }

  describe('Booking Confirmation Flow', () => {
    let bookingId: string;
    let confirmationToken: string;

    it('Step 1: Create a booking (PENDING)', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(10, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings`)
        .set('Authorization', clientToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.confirmationToken).toBeDefined();

      bookingId = response.body.data.id;
      confirmationToken = response.body.data.confirmationToken;
    });

    it('Step 2: Get booking details by token', async () => {
      const response = await request(app.getHttpServer())
        .get(
          `/salon/${testCustomer.urlSlug}/bookings/token/${confirmationToken}`,
        )
        .expect(HttpStatus.OK);

      expect(response.body.data.id).toBe(bookingId);
      expect(response.body.data.serviceName).toBe(testService.name);
      expect(response.body.data.professionalName).toBe(testProfessional.name);
    });

    it('Step 3: Confirm booking', async () => {
      const response = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings/confirm`)
        .send({ token: confirmationToken })
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('Step 4: Verify booking is confirmed', async () => {
      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/bookings/${bookingId}`)
        .set('Authorization', clientToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe('CONFIRMED');
    });
  });

  describe('Booking Cancellation Flow', () => {
    let bookingId: string;
    let confirmationToken: string;

    it('Step 1: Create another booking', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      futureDate.setHours(11, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings`)
        .set('Authorization', clientToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      bookingId = response.body.data.id;
      confirmationToken = response.body.data.confirmationToken;
    });

    it('Step 2: Cancel booking by token', async () => {
      await request(app.getHttpServer())
        .delete(
          `/salon/${testCustomer.urlSlug}/bookings/cancel/${confirmationToken}`,
        )
        .expect(HttpStatus.NO_CONTENT);
    });

    it('Step 3: Verify booking is cancelled', async () => {
      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/bookings/${bookingId}`)
        .set('Authorization', clientToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe('CANCELLED');
    });
  });
});
