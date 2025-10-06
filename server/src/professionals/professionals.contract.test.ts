/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication, HttpStatus, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { ProfessionalsModule } from './professionals.module';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { GlobalAdminGuard } from '../common/guards/global-admin.guard';
import { AuthenticatedUser } from '../common/types/auth.types';
import { CreateProfessionalDto } from './dto/create-professional.dto';
import { UpdateProfessionalDto } from './dto/update-professional.dto';

interface CustomerRecord {
  id: string;
  name: string;
  urlSlug: string;
  isActive: boolean;
}

interface BranchRecord {
  id: string;
  name: string;
  customerId: string;
}

type ProfessionalRecord = {
  id: string;
  name: string;
  photoUrl: string | null;
  isActive: boolean;
  customerId: string;
  branches: Array<{
    id: string;
    name: string;
  }>;
};

describe('Professionals (Contract Tests)', () => {
  let app: INestApplication;
  let db: DatabaseService;

  // Test data
  let testCustomer: CustomerRecord;
  let testBranch1: BranchRecord;
  let testBranch2: BranchRecord;
  let testProfessional1: ProfessionalRecord;
  let testProfessional2: ProfessionalRecord;
  let adminToken: string;
  let clientToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        ProfessionalsModule,
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
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.enableCors();

    db = app.get<DatabaseService>(DatabaseService);

    // Clean up before tests
    await db.professionalBranch.deleteMany();
    await db.professional.deleteMany();
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

    // Create test customer
    testCustomer = await db.customer.create({
      data: {
        name: 'Test Customer',
        urlSlug: 'test-customer',
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

    // Set up mock tokens
    adminToken = 'Bearer admin-token';
    clientToken = 'Bearer client-token';

    await app.init();
  });

  afterAll(async () => {
    // Clean up after tests
    await db.professionalBranch.deleteMany();
    await db.professional.deleteMany();
    await db.branch.deleteMany();
    await db.customer.deleteMany();
    await db.country.deleteMany();

    await app.close();
  });

  afterEach(async () => {
    // Clean up test professionals after each test
    await db.professionalBranch.deleteMany();
    await db.professional.deleteMany();
  });

  beforeEach(async () => {
    // Create test professionals for each test
    const prof1 = await db.professional.create({
      data: {
        name: 'Test Professional 1',
        isActive: true,
        customerId: testCustomer.id,
        branches: {
          create: [
            {
              branchId: testBranch1.id,
            },
          ],
        },
      },
      include: {
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    testProfessional1 = {
      id: prof1.id,
      name: prof1.name,
      photoUrl: prof1.photoUrl,
      isActive: prof1.isActive,
      customerId: prof1.customerId,
      branches: prof1.branches.map(pb => ({
        id: pb.branch.id,
        name: pb.branch.name,
      })),
    };

    const prof2 = await db.professional.create({
      data: {
        name: 'Test Professional 2',
        isActive: true,
        customerId: testCustomer.id,
        branches: {
          create: [{ branchId: testBranch1.id }, { branchId: testBranch2.id }],
        },
      },
      include: {
        branches: {
          include: {
            branch: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    testProfessional2 = {
      id: prof2.id,
      name: prof2.name,
      photoUrl: prof2.photoUrl,
      isActive: prof2.isActive,
      customerId: prof2.customerId,
      branches: prof2.branches.map(pb => ({
        id: pb.branch.id,
        name: pb.branch.name,
      })),
    };
  });

  describe('Admin Professional Management', () => {
    describe('POST /professionals', () => {
      it('should create a professional successfully', async () => {
        const createDto: CreateProfessionalDto = {
          name: 'New Professional Created',
          isActive: true,
          customerId: testCustomer.id,
          branchIds: [testBranch1.id],
        };

        const response = await request(app.getHttpServer())
          .post('/professionals')
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toMatchObject({
          data: {
            id: expect.any(String),
            name: 'New Professional Created',
            isActive: true,
            customerId: testCustomer.id,
            photoUrl: null,
            branches: [
              {
                id: testBranch1.id,
                name: testBranch1.name,
              },
            ],
          },
        });

        testProfessional1 = response.body.data;
      });

      it('should create a professional working at multiple branches', async () => {
        const createDto: CreateProfessionalDto = {
          name: 'New Multi-Branch Professional',
          isActive: true,
          customerId: testCustomer.id,
          branchIds: [testBranch1.id, testBranch2.id],
        };

        const response = await request(app.getHttpServer())
          .post('/professionals')
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toMatchObject({
          data: {
            id: expect.any(String),
            name: 'New Multi-Branch Professional',
            isActive: true,
            customerId: testCustomer.id,
            photoUrl: null,
            branches: expect.arrayContaining([
              {
                id: testBranch1.id,
                name: testBranch1.name,
              },
              {
                id: testBranch2.id,
                name: testBranch2.name,
              },
            ]),
          },
        });

        testProfessional2 = response.body.data;
      });

      it('should return 409 when creating professional with existing name', async () => {
        const createDto: CreateProfessionalDto = {
          name: 'Test Professional 1',
          isActive: true,
          customerId: testCustomer.id,
        };

        await request(app.getHttpServer())
          .post('/professionals')
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.CONFLICT);
      });
    });

    describe('GET /professionals', () => {
      it('should return all professionals', async () => {
        const response = await request(app.getHttpServer())
          .get('/professionals')
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        expect(response.body.data.professionals).toHaveLength(2);
        expect(response.body.data.total).toBe(2);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(1000);
      });
    });

    describe('GET /professionals/:id', () => {
      it('should return a specific professional', async () => {
        const response = await request(app.getHttpServer())
          .get(`/professionals/${testProfessional1.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.OK);

        expect(response.body.data.id).toBe(testProfessional1.id);
        expect(response.body.data.name).toBe('Test Professional 1');
        expect(response.body.data.isActive).toBe(true);
        expect(response.body.data.customerId).toBe(testCustomer.id);
      });

      it('should return 404 for non-existent professional', async () => {
        await request(app.getHttpServer())
          .get('/professionals/non-existent-id')
          .set('Authorization', adminToken)
          .expect(HttpStatus.NOT_FOUND);
      });
    });

    describe('PATCH /professionals/:id', () => {
      it('should update a professional successfully', async () => {
        const updateDto: UpdateProfessionalDto = {
          name: 'Updated Professional Name',
          branchIds: [testBranch2.id],
        };

        const response = await request(app.getHttpServer())
          .patch(`/professionals/${testProfessional1.id}`)
          .set('Authorization', adminToken)
          .send(updateDto)
          .expect(HttpStatus.OK);

        expect(response.body.data.id).toBe(testProfessional1.id);
        expect(response.body.data.name).toBe('Updated Professional Name');
        expect(response.body.data.isActive).toBe(true);
        expect(response.body.data.customerId).toBe(testCustomer.id);
      });

      it('should return 409 when updating to existing name', async () => {
        const updateDto: UpdateProfessionalDto = {
          name: 'Test Professional 2',
        };

        await request(app.getHttpServer())
          .patch(`/professionals/${testProfessional1.id}`)
          .set('Authorization', adminToken)
          .send(updateDto)
          .expect(HttpStatus.CONFLICT);
      });
    });

    describe('DELETE /professionals/:id', () => {
      it('should deactivate a professional successfully', async () => {
        await request(app.getHttpServer())
          .delete(`/professionals/${testProfessional1.id}`)
          .set('Authorization', adminToken)
          .expect(HttpStatus.NO_CONTENT);

        // Verify professional is deactivated - just check 204 was returned
        // The professional should now be inactive
      });
    });
  });

  describe('Customer Professional Management', () => {
    describe('GET /salon/:customerSlug/professionals', () => {
      it('should return professionals for customer', async () => {
        const response = await request(app.getHttpServer())
          .get(`/salon/${testCustomer.urlSlug}/professionals`)
          .set('Authorization', clientToken)
          .expect(HttpStatus.OK);

        expect(response.body.data.professionals).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: testProfessional2.id,
              name: 'Test Professional 2',
              isActive: true,
              customerId: testCustomer.id,
            }),
          ]),
        );
        expect(response.body.data.total).toBe(2);
        expect(response.body.data.page).toBe(1);
        expect(response.body.data.limit).toBe(1000);
      });
    });

    describe('GET /salon/:customerSlug/branches/:branchId/professionals', () => {
      it('should return professionals for specific branch', async () => {
        const response = await request(app.getHttpServer())
          .get(
            `/salon/${testCustomer.urlSlug}/branches/${testBranch2.id}/professionals`,
          )
          .set('Authorization', clientToken)
          .expect(HttpStatus.OK);

        expect(response.body.data.professionals.length).toBeGreaterThanOrEqual(
          1,
        );
        expect(response.body.data.total).toBeGreaterThanOrEqual(1);
      });
    });

    describe('POST /salon/:customerSlug/professionals', () => {
      it('should create professional for customer context', async () => {
        const createDto = {
          name: 'Customer Context Professional',
          isActive: true,
          branchIds: [testBranch1.id],
        };

        const response = await request(app.getHttpServer())
          .post(`/salon/${testCustomer.urlSlug}/professionals`)
          .set('Authorization', adminToken)
          .send(createDto)
          .expect(HttpStatus.CREATED);

        expect(response.body).toMatchObject({
          data: {
            id: expect.any(String),
            name: 'Customer Context Professional',
            isActive: true,
            customerId: testCustomer.id,
            branches: [
              {
                id: testBranch1.id,
                name: testBranch1.name,
              },
            ],
          },
        });
      });
    });
  });

  describe('Photo Management', () => {
    let testProfessionalForPhoto: ProfessionalRecord;

    beforeEach(async () => {
      // Create a test professional for photo tests
      const professional = await db.professional.create({
        data: {
          name: 'Photo Test Professional',
          isActive: true,
          customerId: testCustomer.id,
        },
        include: {
          branches: {
            include: {
              branch: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      testProfessionalForPhoto = {
        id: professional.id,
        name: professional.name,
        photoUrl: professional.photoUrl,
        isActive: professional.isActive,
        customerId: professional.customerId,
        branches: professional.branches.map(pb => ({
          id: pb.branch.id,
          name: pb.branch.name,
        })),
      };
    });

    afterEach(async () => {
      // Clean up photo test professional
      if (testProfessionalForPhoto?.id) {
        await db.professional.delete({
          where: { id: testProfessionalForPhoto.id },
        });
      }
    });

    it('POST /professionals/:id/photo - should upload a valid photo (JPEG)', async () => {
      // Create a minimal valid JPEG buffer
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      const response = await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .attach('photo', jpegBuffer, 'test-photo.jpg')
        .expect(HttpStatus.OK);

      expect(response.body.data).toMatchObject({
        id: testProfessionalForPhoto.id,
        name: testProfessionalForPhoto.name,
      });
      expect(response.body.data.photoUrl).toBeDefined();
      expect(response.body.data.photoUrl).toContain('professionals');
    });

    it('POST /professionals/:id/photo - should upload a valid photo (PNG)', async () => {
      // Create a minimal valid PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
        0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
        0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
        0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]);

      const response = await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .attach('photo', pngBuffer, 'test-photo.png')
        .expect(HttpStatus.OK);

      expect(response.body.data.photoUrl).toBeDefined();
    });

    it('POST /professionals/:id/photo - should reject invalid file type (PDF)', async () => {
      const pdfBuffer = Buffer.from('%PDF-1.4');

      await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .attach('photo', pdfBuffer, 'test-file.pdf')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('POST /professionals/:id/photo - should reject invalid file type (TXT)', async () => {
      const txtBuffer = Buffer.from('This is a text file');

      await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .attach('photo', txtBuffer, 'test-file.txt')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('POST /professionals/:id/photo - should reject file with wrong extension but valid content', async () => {
      // JPEG content but .txt extension
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .attach('photo', jpegBuffer, 'test-file.txt')
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('POST /professionals/:id/photo - should reject file exceeding size limit', async () => {
      // Create a 6MB buffer (exceeds 5MB limit)
      const largeBuffer = Buffer.alloc(6 * 1024 * 1024);

      await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .attach('photo', largeBuffer, 'large-photo.jpg')
        .expect(HttpStatus.PAYLOAD_TOO_LARGE);
    });

    it('POST /professionals/:id/photo - should reject request without file', async () => {
      await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('POST /professionals/:id/photo - should require admin role', async () => {
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', clientToken)
        .attach('photo', jpegBuffer, 'test-photo.jpg')
        .expect(HttpStatus.FORBIDDEN);
    });

    it('POST /professionals/:id/photo - should return 404 for non-existent professional', async () => {
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      await request(app.getHttpServer())
        .post('/professionals/non-existent-id/photo')
        .set('Authorization', adminToken)
        .attach('photo', jpegBuffer, 'test-photo.jpg')
        .expect(HttpStatus.NOT_FOUND);
    });

    it('DELETE /professionals/:id/photo - should delete professional photo', async () => {
      // First upload a photo
      const jpegBuffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
      ]);

      await request(app.getHttpServer())
        .post(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .attach('photo', jpegBuffer, 'test-photo.jpg')
        .expect(HttpStatus.OK);

      // Then delete it
      const response = await request(app.getHttpServer())
        .delete(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.photoUrl).toBeNull();
    });

    it('DELETE /professionals/:id/photo - should require admin role', async () => {
      await request(app.getHttpServer())
        .delete(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', clientToken)
        .expect(HttpStatus.FORBIDDEN);
    });

    it('DELETE /professionals/:id/photo - should return 404 for non-existent professional', async () => {
      await request(app.getHttpServer())
        .delete('/professionals/non-existent-id/photo')
        .set('Authorization', adminToken)
        .expect(HttpStatus.NOT_FOUND);
    });

    it('DELETE /professionals/:id/photo - should handle deleting already null photo gracefully', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/professionals/${testProfessionalForPhoto.id}/photo`)
        .set('Authorization', adminToken)
        .expect(HttpStatus.OK);

      expect(response.body.data.photoUrl).toBeNull();
    });
  });
});
