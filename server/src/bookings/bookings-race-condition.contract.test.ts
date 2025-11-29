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

describe('Bookings Race Condition Tests', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Test data
  let testCustomer: { id: string; urlSlug: string };
  let testBranch: { id: string };
  let testService: { id: string; duration: number };
  let testProfessional: { id: string };
  let testUser: { id: string };
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
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    const uniqueSlug = `race-test-${Date.now()}`;

    testCustomer = await db.customer.create({
      data: {
        name: 'Race Test Customer',
        urlSlug: uniqueSlug,
        currency: 'USD',
        isActive: true,
      },
    });

    const country =
      (await db.country.findUnique({ where: { code: 'US' } })) ||
      (await db.country.create({
        data: {
          code: 'US',
          name: 'United States',
          addressFormat: {},
        },
      }));

    testBranch = await db.branch.create({
      data: {
        name: 'Race Branch',
        phone: '+1234567890',
        countryCode: 'US',
        street: '123 Race St',
        city: 'Race City',
        stateProvince: 'RC',
        postalCode: '12345',
        formattedAddress: '123 Race St, Race City, RC 12345',
        countryId: country.id,
        customerId: testCustomer.id,
      },
    });

    // Create branch schedule
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

    testService = await db.service.create({
      data: {
        name: 'Race Service',
        description: 'Service for race test',
        duration: 30,
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    await db.servicePricing.create({
      data: {
        serviceId: testService.id,
        branchId: testBranch.id,
        price: 30.0,
      },
    });

    testProfessional = await db.professional.create({
      data: {
        name: 'Race Pro',
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    // Create professional schedule
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

    await db.professionalBranch.create({
      data: {
        professionalId: testProfessional.id,
        branchId: testBranch.id,
      },
    });

    testUser = await db.user.create({
      data: {
        email: 'raceuser@test.com',
        name: 'Race User',
        password: 'hashed_password',
        role: 'CLIENT',
      },
    });
  }

  async function cleanupTestData() {
    await db.booking.deleteMany({ where: { customerId: testCustomer.id } });
    await db.professionalSchedule.deleteMany({
      where: { professionalId: testProfessional.id },
    });
    await db.branchSchedule.deleteMany({ where: { branchId: testBranch.id } });
    await db.professionalBranch.deleteMany({
      where: { branchId: testBranch.id },
    });
    await db.servicePricing.deleteMany({
      where: { serviceId: testService.id },
    });
    await db.service.deleteMany({ where: { customerId: testCustomer.id } });
    await db.professional.deleteMany({
      where: { customerId: testCustomer.id },
    });
    await db.branch.deleteMany({ where: { id: testBranch.id } });
    await db.user.deleteMany({ where: { id: testUser.id } });
    await db.customer.deleteMany({ where: { id: testCustomer.id } });
    // Don't delete country as it might be shared with other tests
  }

  describe('Race Condition: Double Booking Prevention', () => {
    it('should prevent double-booking at creation time', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      futureDate.setHours(10, 0, 0, 0);

      // Create first booking
      const response1 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings`)
        .set('Authorization', clientToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      expect(response1.body.data.status).toBe('PENDING');

      // Try to create second booking at the SAME time slot - should FAIL immediately
      const response2 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings`)
        .set('Authorization', clientToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CONFLICT);

      expect(response2.body.message).toContain(
        'You already have a booking at this time',
      );
    });

    it('should prevent same user from booking two different professionals at the same time', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      futureDate.setHours(12, 0, 0, 0);

      // Create a second professional
      const professional2 = await db.professional.create({
        data: {
          name: 'Race Pro 2',
          isActive: true,
          customerId: testCustomer.id,
        },
      });

      await db.professionalSchedule.create({
        data: {
          professionalId: professional2.id,
          dayOfWeek: futureDate.getDay(),
          startTime: '09:00',
          endTime: '18:00',
          isClosed: false,
        },
      });

      await db.professionalBranch.create({
        data: {
          professionalId: professional2.id,
          branchId: testBranch.id,
        },
      });

      // 1. Create first booking with Pro 1
      const response1 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings`)
        .set('Authorization', clientToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      expect(response1.body.data.status).toBe('PENDING');

      // 2. Try to create second booking with Pro 2 at SAME time
      // This should fail because the USER is already booked
      const response2 = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings`)
        .set('Authorization', clientToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: professional2.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CONFLICT);

      expect(response2.body.message).toContain(
        'You already have a booking at this time',
      );

      // Cleanup
      await db.professionalBranch.deleteMany({
        where: { professionalId: professional2.id },
      });
      await db.professionalSchedule.deleteMany({
        where: { professionalId: professional2.id },
      });
      await db.professional.delete({ where: { id: professional2.id } });
    });
  });
});
