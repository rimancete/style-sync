/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { BookingsModule } from './bookings.module';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { SchedulesModule } from '../schedules/schedules.module';

describe('Bookings Availability (Contract Tests)', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Test data
  let testCustomer: { id: string; urlSlug: string };
  let testBranch: { id: string };
  let testService: { id: string; duration: number };
  let testProfessional: { id: string };

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
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    db = moduleFixture.get<DatabaseService>(DatabaseService);

    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create customer
    testCustomer = await db.customer.create({
      data: {
        name: 'Avail Test Customer',
        urlSlug: 'avail-test',
        currency: 'USD',
        isActive: true,
      },
    });

    // Create country
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
        name: 'Avail Branch',
        phone: '+1234567890',
        countryCode: 'US',
        street: '123 Avail St',
        city: 'Avail City',
        stateProvince: 'AV',
        postalCode: '12345',
        formattedAddress: '123 Avail St, Avail City, AV 12345',
        timezone: 'UTC', // Explicitly set timezone for consistent testing
        countryId: country.id,
        customerId: testCustomer.id,
      },
    });

    // Create branch schedule (Mon-Fri 09:00-17:00, Sat Closed)
    // We'll use specific dates for testing, so we need to know the day of week.
    // Let's just create schedules for all days to be safe, but vary them.
    // 0=Sun, 1=Mon, ...
    for (let i = 0; i <= 6; i++) {
      await db.branchSchedule.create({
        data: {
          branchId: testBranch.id,
          dayOfWeek: i,
          startTime: '09:00',
          endTime: '17:00',
          isClosed: i === 6, // Closed on Saturday
        },
      });
    }

    // Create service
    testService = await db.service.create({
      data: {
        name: 'Avail Service',
        description: 'Service for avail test',
        duration: 60, // 1 hour
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    // Create service pricing
    await db.servicePricing.create({
      data: {
        serviceId: testService.id,
        branchId: testBranch.id,
        price: 50.0,
      },
    });

    // Create professional
    testProfessional = await db.professional.create({
      data: {
        name: 'Avail Pro',
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    // Create professional schedule (Mon-Fri 09:00-17:00, Break 12:00-13:00)
    for (let i = 0; i <= 6; i++) {
      await db.professionalSchedule.create({
        data: {
          professionalId: testProfessional.id,
          dayOfWeek: i,
          startTime: '09:00',
          endTime: '17:00',
          isClosed: i === 6,
          breakStartTime: '12:00',
          breakEndTime: '13:00',
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
  }

  async function cleanupTestData() {
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
    await db.customer.deleteMany({ where: { id: testCustomer.id } });
    await db.country.deleteMany({ where: { code: 'US' } });
  }

  describe('GET /api/salon/:customerSlug/availability', () => {
    it('should return available slots for a working day', async () => {
      // Find a Monday
      const date = new Date();
      while (date.getDay() !== 1) {
        date.setDate(date.getDate() + 1);
      }
      const dateString = date.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: testBranch.id,
          serviceId: testService.id,
          date: dateString,
        })
        .expect(HttpStatus.OK);

      const slots = response.body.data.availableSlots;
      expect(slots.length).toBeGreaterThan(0);

      // Check 09:00 is available
      const slot0900 = slots.find((s: any) => s.time === '09:00');
      expect(slot0900.available).toBe(true);

      // Check 12:00 is NOT available (break)
      const slot1200 = slots.find((s: any) => s.time === '12:00');
      expect(slot1200.available).toBe(false);
    });

    it('should return no slots for a closed day (Saturday)', async () => {
      // Find a Saturday
      const date = new Date();
      while (date.getDay() !== 6) {
        date.setDate(date.getDate() + 1);
      }
      const dateString = date.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: testBranch.id,
          serviceId: testService.id,
          date: dateString,
        })
        .expect(HttpStatus.OK);

      const slots = response.body.data.availableSlots;
      // Depending on implementation, it might return empty array or slots with available=false
      // My implementation returns empty array if branch is closed
      expect(slots.length).toBe(0);
    });

    it('should mark booked slots as unavailable', async () => {
      // Find a Tuesday
      const date = new Date();
      while (date.getDay() !== 2) {
        date.setDate(date.getDate() + 1);
      }
      // Use UTC hours to match branch timezone (UTC)
      date.setUTCHours(10, 0, 0, 0);
      const dateString = date.toISOString().split('T')[0];

      // Create a booking at 10:00 UTC
      // We need a user for this, let's create a dummy one
      const user = await db.user.create({
        data: {
          email: 'temp@test.com',
          name: 'Temp User',
          password: 'pw',
          role: 'CLIENT',
        },
      });

      const booking = await db.booking.create({
        data: {
          userId: user.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional.id,
          scheduledAt: date,
          totalPrice: 50.0,
          status: 'CONFIRMED',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: testBranch.id,
          serviceId: testService.id,
          date: dateString,
        })
        .expect(HttpStatus.OK);

      const slots = response.body.data.availableSlots;
      const slot1000 = slots.find((s: any) => s.time === '10:00');
      expect(slot1000.available).toBe(false);

      // Cleanup
      await db.booking.delete({ where: { id: booking.id } });
      await db.user.delete({ where: { id: user.id } });
    });
  });
});
