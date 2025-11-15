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
import { GlobalAdminGuard } from '../common/guards/global-admin.guard';
import { AuthenticatedUser } from '../common/types/auth.types';

// TODO (Phase 4 - ADV-001): Add property-based tests for:
// - Complex availability algorithms with multiple professionals
// - Duration-based slot blocking edge cases
// - Concurrent booking race conditions

describe('Bookings API (Contract Tests)', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Test data
  let testCustomer: { id: string; urlSlug: string; currency: string };
  let testCustomer2: { id: string; urlSlug: string };
  let testBranch: { id: string; customerId: string; name: string };
  let testBranch2: { id: string; customerId: string };
  let testService: {
    id: string;
    customerId: string;
    duration: number;
    name: string;
  };
  let testProfessional1: { id: string; customerId: string; name: string };
  let testProfessional2: { id: string; customerId: string; name: string };
  let testUser: { id: string; name: string };
  let testUser2: { id: string };
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        BookingsModule,
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
              activeCustomerId: testCustomer?.id,
              customerIds: [],
            } as AuthenticatedUser;
          } else if (authHeader.includes('client-token')) {
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
      .overrideGuard(GlobalAdminGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const request = context.switchToHttp().getRequest();
          const user = request.user as AuthenticatedUser;
          return user?.role === 'ADMIN';
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();

    // Apply global pipes, interceptors, and filters
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();

    db = moduleFixture.get<DatabaseService>(DatabaseService);
    adminToken = 'Bearer admin-token';
    clientToken = 'Bearer client-token';

    // Setup test data
    await setupTestData();
  });

  afterAll(async () => {
    await cleanupTestData();
    await app.close();
  });

  async function setupTestData() {
    // Create customers
    testCustomer = await db.customer.create({
      data: {
        name: 'Bookings Test Customer',
        urlSlug: 'bookings-test',
        currency: 'USD',
        isActive: true,
      },
    });

    testCustomer2 = await db.customer.create({
      data: {
        name: 'Other Customer',
        urlSlug: 'other-test',
        currency: 'USD',
        isActive: true,
      },
    });

    // Create country
    const country = await db.country.create({
      data: {
        code: 'US',
        name: 'United States',
        addressFormat: {},
      },
    });

    // Create branches
    testBranch = await db.branch.create({
      data: {
        name: 'Test Branch',
        phone: '+1234567890',
        countryCode: 'US',
        street: '123 Test St',
        city: 'Test City',
        stateProvince: 'TS',
        postalCode: '12345',
        formattedAddress: '123 Test St, Test City, TS 12345',
        countryId: country.id,
        customerId: testCustomer.id,
      },
    });

    testBranch2 = await db.branch.create({
      data: {
        name: 'Other Branch',
        phone: '+1234567891',
        countryCode: 'US',
        street: '456 Other St',
        city: 'Other City',
        stateProvince: 'OS',
        postalCode: '54321',
        formattedAddress: '456 Other St, Other City, OS 54321',
        countryId: country.id,
        customerId: testCustomer2.id,
      },
    });

    // Create service
    testService = await db.service.create({
      data: {
        name: 'Haircut',
        description: 'Standard haircut',
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
        price: 25.0,
      },
    });

    // Create professionals
    testProfessional1 = await db.professional.create({
      data: {
        name: 'John Barber',
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    testProfessional2 = await db.professional.create({
      data: {
        name: 'Jane Stylist',
        isActive: true,
        customerId: testCustomer.id,
      },
    });

    // Link professionals to branch
    await db.professionalBranch.create({
      data: {
        professionalId: testProfessional1.id,
        branchId: testBranch.id,
      },
    });

    await db.professionalBranch.create({
      data: {
        professionalId: testProfessional2.id,
        branchId: testBranch.id,
      },
    });

    // Create users
    testUser = await db.user.create({
      data: {
        email: 'testuser@test.com',
        name: 'Test User',
        password: 'hashed_password',
        role: 'CLIENT',
      },
    });

    testUser2 = await db.user.create({
      data: {
        email: 'otheruser@test.com',
        name: 'Other User',
        password: 'hashed_password',
        role: 'CLIENT',
      },
    });
  }

  async function cleanupTestData() {
    // Delete in correct order to respect foreign key constraints
    await db.booking.deleteMany({
      where: { customerId: testCustomer.id },
    });
    await db.professionalBranch.deleteMany({
      where: { branchId: testBranch.id },
    });
    await db.servicePricing.deleteMany({
      where: { serviceId: testService.id },
    });
    await db.service.deleteMany({
      where: { customerId: testCustomer.id },
    });
    await db.professional.deleteMany({
      where: { customerId: testCustomer.id },
    });
    await db.branch.deleteMany({
      where: { OR: [{ id: testBranch.id }, { id: testBranch2.id }] },
    });
    await db.user.deleteMany({
      where: { OR: [{ id: testUser.id }, { id: testUser2.id }] },
    });
    await db.customer.deleteMany({
      where: { OR: [{ id: testCustomer.id }, { id: testCustomer2.id }] },
    });
    await db.country.deleteMany({ where: { code: 'US' } });
  }

  describe('POST /api/bookings (Admin - Create Booking)', () => {
    it('should create a booking with specified professional', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(10, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', adminToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          userId: testUser.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        branchId: testBranch.id,
        serviceId: testService.id,
        professionalId: testProfessional1.id,
        userId: testUser.id,
        status: 'PENDING',
        totalPrice: '25.00',
        currency: 'USD',
      });

      // Cleanup
      await db.booking.delete({ where: { id: response.body.data.id } });
    });

    it('should auto-assign professional when professionalId is null', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(14, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', adminToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: null,
          userId: testUser.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.professionalId).toBeTruthy();
      expect([testProfessional1.id, testProfessional2.id]).toContain(
        response.body.data.professionalId,
      );

      // Cleanup
      await db.booking.delete({ where: { id: response.body.data.id } });
    });

    it('should reject booking in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', adminToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          userId: testUser.id,
          scheduledAt: pastDate.toISOString(),
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should reject double-booking same professional', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(11, 0, 0, 0);

      // Create first booking
      const firstBooking = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: futureDate,
          totalPrice: 25.0,
          status: 'PENDING',
        },
      });

      // Try to book same professional at same time
      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', adminToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          userId: testUser2.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CONFLICT);

      // Cleanup
      await db.booking.delete({ where: { id: firstBooking.id } });
    });

    it('should reject booking with entities from different customers', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(12, 0, 0, 0);

      // Try to book service from customer1 at branch from customer2
      await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', adminToken)
        .send({
          branchId: testBranch2.id, // Different customer
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          userId: testUser.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('GET /api/bookings (Admin - List All Bookings)', () => {
    let booking1Id: string;
    let booking2Id: string;

    beforeAll(async () => {
      const date1 = new Date();
      date1.setDate(date1.getDate() + 7);
      date1.setHours(9, 0, 0, 0);

      const date2 = new Date();
      date2.setDate(date2.getDate() + 8);
      date2.setHours(10, 0, 0, 0);

      const b1 = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: date1,
          totalPrice: 25.0,
          status: 'PENDING',
        },
      });
      booking1Id = b1.id;

      const b2 = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional2.id,
          scheduledAt: date2,
          totalPrice: 25.0,
          status: 'CONFIRMED',
        },
      });
      booking2Id = b2.id;
    });

    afterAll(async () => {
      await db.booking.deleteMany({
        where: { id: { in: [booking1Id, booking2Id] } },
      });
    });

    it('should list all bookings with pagination', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('bookings');
      expect(response.body.data).toHaveProperty('total');
      expect(response.body.data).toHaveProperty('page');
      expect(response.body.data).toHaveProperty('limit');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
      expect(response.body.data.total).toBeGreaterThanOrEqual(2);
    });

    it('should filter bookings by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/bookings?status=CONFIRMED')
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.bookings.length).toBeGreaterThanOrEqual(1);
      response.body.data.bookings.forEach((booking: { status: string }) => {
        expect(booking.status).toBe('CONFIRMED');
      });
    });
  });

  describe('GET /api/bookings/:id (Admin - Get Booking)', () => {
    let bookingId: string;

    beforeAll(async () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      date.setHours(15, 0, 0, 0);

      const booking = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: date,
          totalPrice: 25.0,
          status: 'PENDING',
        },
      });
      bookingId = booking.id;
    });

    afterAll(async () => {
      await db.booking.delete({ where: { id: bookingId } });
    });

    it('should get booking by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bookings/${bookingId}`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data).toMatchObject({
        id: bookingId,
        userName: testUser.name,
        branchName: testBranch.name,
        serviceName: testService.name,
        professionalName: testProfessional1.name,
      });
    });

    it('should return 404 for non-existent booking', async () => {
      await request(app.getHttpServer())
        .get('/bookings/non-existent-id')
        .set('Authorization', adminToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('PATCH /api/bookings/:id (Admin - Update Booking)', () => {
    let bookingId: string;

    beforeEach(async () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      date.setHours(16, 0, 0, 0);

      const booking = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: date,
          totalPrice: 25.0,
          status: 'PENDING',
        },
      });
      bookingId = booking.id;
    });

    afterEach(async () => {
      await db.booking.deleteMany({ where: { id: bookingId } });
    });

    it('should update booking status', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}`)
        .set('Authorization', adminToken)
        .send({ status: 'CONFIRMED' })
        .expect(HttpStatus.OK);

      expect(response.body.data.status).toBe('CONFIRMED');
    });

    it('should reschedule booking', async () => {
      const newDate = new Date();
      newDate.setDate(newDate.getDate() + 10);
      newDate.setHours(11, 30, 0, 0);

      const response = await request(app.getHttpServer())
        .patch(`/bookings/${bookingId}`)
        .set('Authorization', adminToken)
        .send({ scheduledAt: newDate.toISOString() })
        .expect(HttpStatus.OK);

      const returnedDate = new Date(response.body.data.scheduledAt);
      expect(returnedDate.getTime()).toBe(newDate.getTime());
    });
  });

  describe('DELETE /api/bookings/:id (Admin - Cancel Booking)', () => {
    let bookingId: string;

    beforeEach(async () => {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      date.setHours(17, 0, 0, 0);

      const booking = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: date,
          totalPrice: 25.0,
          status: 'PENDING',
        },
      });
      bookingId = booking.id;
    });

    afterEach(async () => {
      await db.booking.deleteMany({ where: { id: bookingId } });
    });

    it('should cancel booking', async () => {
      await request(app.getHttpServer())
        .delete(`/bookings/${bookingId}`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.NO_CONTENT);

      const booking = await db.booking.findUnique({
        where: { id: bookingId },
      });
      expect(booking?.status).toBe('CANCELLED');
    });
  });

  describe('POST /api/salon/:customerSlug/bookings (Customer - Create Booking)', () => {
    it('should create booking for current user and customer', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      futureDate.setHours(13, 0, 0, 0);

      const response = await request(app.getHttpServer())
        .post(`/salon/${testCustomer.urlSlug}/bookings`)
        .set('Authorization', clientToken)
        .send({
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: futureDate.toISOString(),
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.data.userId).toBe(testUser.id);
      expect(response.body.data.customerId).toBe(testCustomer.id);

      // Cleanup
      await db.booking.delete({ where: { id: response.body.data.id } });
    });
  });

  describe('GET /api/salon/:customerSlug/bookings/my (Customer - Get My Bookings)', () => {
    let userBooking1Id: string;
    let userBooking2Id: string;
    let otherUserBookingId: string;

    beforeAll(async () => {
      const date1 = new Date();
      date1.setDate(date1.getDate() + 7);
      date1.setHours(8, 0, 0, 0);

      const date2 = new Date();
      date2.setDate(date2.getDate() + 8);
      date2.setHours(9, 0, 0, 0);

      const date3 = new Date();
      date3.setDate(date3.getDate() + 9);
      date3.setHours(10, 0, 0, 0);

      // Create bookings for test user
      const b1 = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: date1,
          totalPrice: 25.0,
          status: 'PENDING',
        },
      });
      userBooking1Id = b1.id;

      const b2 = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional2.id,
          scheduledAt: date2,
          totalPrice: 25.0,
          status: 'CONFIRMED',
        },
      });
      userBooking2Id = b2.id;

      // Create booking for other user (should not appear)
      const b3 = await db.booking.create({
        data: {
          userId: testUser2.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: date3,
          totalPrice: 25.0,
          status: 'PENDING',
        },
      });
      otherUserBookingId = b3.id;
    });

    afterAll(async () => {
      await db.booking.deleteMany({
        where: {
          id: { in: [userBooking1Id, userBooking2Id, otherUserBookingId] },
        },
      });
    });

    it('should return only current user bookings', async () => {
      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/bookings/my`)
        .set('Authorization', clientToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.bookings.length).toBeGreaterThanOrEqual(2);
      response.body.data.bookings.forEach((booking: { userId: string }) => {
        expect(booking.userId).toBe(testUser.id);
      });
    });
  });

  describe('GET /api/salon/:customerSlug/availability (Check Availability)', () => {
    let existingBookingId: string;

    beforeAll(async () => {
      // Create a booking at 10:00 to block that slot
      const date = new Date();
      date.setDate(date.getDate() + 7);
      date.setHours(10, 0, 0, 0);

      const booking = await db.booking.create({
        data: {
          userId: testUser.id,
          customerId: testCustomer.id,
          branchId: testBranch.id,
          serviceId: testService.id,
          professionalId: testProfessional1.id,
          scheduledAt: date,
          totalPrice: 25.0,
          status: 'CONFIRMED',
        },
      });
      existingBookingId = booking.id;
    });

    afterAll(async () => {
      await db.booking.delete({ where: { id: existingBookingId } });
    });

    it('should return available time slots', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      const dateString = targetDate.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: testBranch.id,
          serviceId: testService.id,
          date: dateString,
        })
        .set('Authorization', clientToken)
        .expect(HttpStatus.OK);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('date', dateString);
      expect(response.body.data).toHaveProperty('availableSlots');
      expect(Array.isArray(response.body.data.availableSlots)).toBe(true);

      // Verify slot structure
      const slot = response.body.data.availableSlots[0];
      expect(slot).toHaveProperty('time');
      expect(slot).toHaveProperty('available');
      expect(typeof slot.available).toBe('boolean');
    });

    it('should show 10:00 slot as unavailable (booked)', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      const dateString = targetDate.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: testBranch.id,
          serviceId: testService.id,
          date: dateString,
          professionalId: testProfessional1.id,
        })
        .set('Authorization', clientToken)
        .expect(HttpStatus.OK);

      const slot10AM = response.body.data.availableSlots.find(
        (s: { time: string }) => s.time === '10:00',
      );
      expect(slot10AM).toBeDefined();
      expect(slot10AM.available).toBe(false);
    });

    it('should show other slots as available', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      const dateString = targetDate.toISOString().split('T')[0];

      const response = await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: testBranch.id,
          serviceId: testService.id,
          date: dateString,
        })
        .set('Authorization', clientToken)
        .expect(HttpStatus.OK);

      const availableSlots = response.body.data.availableSlots.filter(
        (s: { available: boolean }) => s.available,
      );
      expect(availableSlots.length).toBeGreaterThan(0);
    });

    it('should validate date format', async () => {
      await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: testBranch.id,
          serviceId: testService.id,
          date: 'invalid-date',
        })
        .set('Authorization', clientToken)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('should return 404 for non-existent branch', async () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 7);
      const dateString = targetDate.toISOString().split('T')[0];

      await request(app.getHttpServer())
        .get(`/salon/${testCustomer.urlSlug}/availability`)
        .query({
          branchId: 'non-existent-id',
          serviceId: testService.id,
          date: dateString,
        })
        .set('Authorization', clientToken)
        .expect(HttpStatus.NOT_FOUND);
    });
  });
});
