/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { BranchesModule } from './branches.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { DatabaseService } from '../database/database.service';
import { CountriesService } from '../countries/countries.service';
import { CountriesModule } from '../countries/countries.module';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// Contract tests - types are validated through API responses

describe('Branches API Contracts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const branches: Array<{
      id: string;
      name: string;
      countryCode: string;
      street: string;
      unit: string | null;
      district: string | null;
      city: string;
      stateProvince: string;
      postalCode: string;
      formattedAddress: string;
      phone: string;
      createdAt: Date;
      deletedAt: Date | null;
      countryId: string;
      customerId: string;
    }> = [
      {
        id: 'branch-1',
        name: 'Active Branch 1',
        countryCode: 'BR',
        street: 'Rua Teste 123',
        unit: null,
        district: 'Centro',
        city: 'São Paulo',
        stateProvince: 'SP',
        postalCode: '01234-567',
        formattedAddress: 'Rua Teste 123, Centro, São Paulo, SP 01234-567, BR',
        phone: '(11) 99999-9999',
        createdAt: new Date(),
        deletedAt: null,
        countryId: 'mock-country-br',
        customerId: 'customer-1',
      },
      {
        id: 'branch-2',
        name: 'Active Branch 2',
        countryCode: 'US',
        street: '123 Main St',
        unit: 'Apt 4B',
        district: null,
        city: 'New York',
        stateProvince: 'NY',
        postalCode: '10001',
        formattedAddress: '123 Main St, Apt 4B, New York, NY 10001, US',
        phone: '(555) 123-4567',
        createdAt: new Date(),
        deletedAt: null,
        countryId: 'mock-country-us',
        customerId: 'customer-1',
      },
      {
        id: 'branch-3',
        name: 'Deleted Branch',
        countryCode: 'BR',
        street: 'Rua Antiga 456',
        unit: null,
        district: 'Old District',
        city: 'Rio de Janeiro',
        stateProvince: 'RJ',
        postalCode: '20000-000',
        formattedAddress:
          'Rua Antiga 456, Old District, Rio de Janeiro, RJ 20000-000, BR',
        phone: '(21) 88888-8888',
        createdAt: new Date(),
        deletedAt: new Date(), // This branch should not appear in active list
        countryId: 'mock-country-br',
        customerId: 'customer-1',
      },
    ];

    // Mock countries data
    const countries: Array<{
      id: string;
      code: string;
      name: string;
      addressFormat: Record<string, unknown>;
    }> = [
      {
        id: 'mock-country-br',
        code: 'BR',
        name: 'Brazil',
        addressFormat: {
          fields: [
            'street',
            'unit',
            'district',
            'city',
            'stateProvince',
            'postalCode',
          ],
          required: ['street', 'city', 'stateProvince', 'postalCode'],
          validation: {
            postalCode: '^[0-9]{5}-?[0-9]{3}$',
            stateProvince: ['SP', 'RJ', 'MG'],
          },
          labels: {
            street: 'Logradouro',
            unit: 'Número/Apartamento',
            district: 'Bairro',
            city: 'Cidade',
            stateProvince: 'Estado',
            postalCode: 'CEP',
          },
        },
      },
      {
        id: 'mock-country-us',
        code: 'US',
        name: 'United States',
        addressFormat: {
          fields: ['street', 'unit', 'city', 'stateProvince', 'postalCode'],
          required: ['street', 'city', 'stateProvince', 'postalCode'],
          validation: {
            postalCode: '^\\d{5}(-\\d{4})?$',
            stateProvince: ['NY', 'CA', 'TX'],
          },
          labels: {
            street: 'Street Address',
            unit: 'Apt/Suite',
            city: 'City',
            stateProvince: 'State',
            postalCode: 'ZIP Code',
          },
        },
      },
    ];

    const mockCountriesService = {
      findByCode: jest.fn((code: string) => {
        const country = countries.find(c => c.code === code);
        if (!country) {
          throw new Error(`Country with code ${code} not found`);
        }
        return country;
      }),
      validateAddressFormat: jest.fn(() => {
        // Always return true for mocked validation
        return Promise.resolve();
      }),
    };

    const mockDb: Partial<DatabaseService> = {
      branch: {
        findFirst: jest.fn(({ where }: any) => {
          if (where.name && where.deletedAt === null) {
            return (
              branches.find(
                b => b.name === where.name && b.deletedAt === null,
              ) || null
            );
          }
          if (where.name) {
            return branches.find(b => b.name === where.name) || null;
          }
          return null;
        }),
        findMany: jest.fn(({ where }: any = {}) => {
          let filteredBranches = branches;
          if (where.deletedAt === null) {
            filteredBranches = branches.filter(b => b.deletedAt === null);
          }
          return filteredBranches.map(b => ({
            id: b.id,
            name: b.name,
            countryCode: b.countryCode,
            street: b.street,
            unit: b.unit,
            district: b.district,
            city: b.city,
            stateProvince: b.stateProvince,
            postalCode: b.postalCode,
            formattedAddress: b.formattedAddress,
            phone: b.phone,
            createdAt: b.createdAt,
            deletedAt: b.deletedAt,
            customerId: b.customerId,
            country: {
              id: b.countryId,
              code: b.countryCode,
              name: 'Mock Country',
            },
          }));
        }),
        findUnique: jest.fn(({ where, include }: any) => {
          const branch = branches.find(b => b.id === where.id);
          if (!branch) return null;

          if (where.deletedAt === null && branch.deletedAt !== null) {
            return null; // Exclude soft-deleted if filtering for active only
          }

          const result: any = {
            id: branch.id,
            name: branch.name,
            countryCode: branch.countryCode,
            street: branch.street,
            unit: branch.unit,
            district: branch.district,
            city: branch.city,
            stateProvince: branch.stateProvince,
            postalCode: branch.postalCode,
            formattedAddress: branch.formattedAddress,
            phone: branch.phone,
            createdAt: branch.createdAt,
            deletedAt: branch.deletedAt,
            customerId: branch.customerId,
          };

          if (include?.country) {
            result.country = {
              id: branch.countryId,
              code: branch.countryCode,
              name: 'Mock Country',
            };
          }

          if (include?.customer) {
            result.customer = {
              id: branch.customerId,
              name: 'Mock Customer',
            };
          }

          if (include?.professionals) {
            result.professionals = [];
          }

          if (include?.bookings) {
            result.bookings = [];
          }

          if (include?.servicePricing) {
            result.servicePricing = [];
          }

          return result as Record<string, unknown>;
        }),
        create: jest.fn(({ data }: any) => {
          const created = {
            id: `branch_${branches.length + 1}`,
            name: data.name,
            countryCode: data.countryCode,
            street: data.street,
            unit: data.unit || null,
            district: data.district || null,
            city: data.city,
            stateProvince: data.stateProvince,
            postalCode: data.postalCode,
            formattedAddress: data.formattedAddress,
            phone: data.phone,
            createdAt: new Date(),
            deletedAt: null,
            countryId: 'country_1',
            customerId: data.customerId,
          };
          branches.push(created);
          return {
            id: created.id,
            name: created.name,
            countryCode: created.countryCode,
            street: created.street,
            unit: created.unit,
            district: created.district,
            city: created.city,
            stateProvince: created.stateProvince,
            postalCode: created.postalCode,
            formattedAddress: created.formattedAddress,
            phone: created.phone,
            createdAt: created.createdAt,
            deletedAt: created.deletedAt,
            customerId: created.customerId,
            country: {
              id: created.countryId,
              code: created.countryCode,
              name: 'Mock Country',
            },
          };
        }),
        update: jest.fn(({ where, data }: any) => {
          const branch = branches.find(b => b.id === where.id);
          if (!branch) return null;

          Object.assign(branch, data);
          return {
            id: branch.id,
            name: branch.name,
            countryCode: branch.countryCode,
            street: branch.street,
            unit: branch.unit,
            district: branch.district,
            city: branch.city,
            stateProvince: branch.stateProvince,
            postalCode: branch.postalCode,
            formattedAddress: branch.formattedAddress,
            phone: branch.phone,
            createdAt: branch.createdAt,
            deletedAt: branch.deletedAt,
            customerId: branch.customerId,
            country: {
              id: branch.countryId,
              code: branch.countryCode,
              name: 'Mock Country',
            },
          };
        }),
      } as any,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        BranchesModule,
        CountriesModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDb)
      .overrideProvider(CountriesService)
      .useValue(mockCountriesService)
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/branches', () => {
    it('should return list of active branches only', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/branches')

        .expect(200);

      expect(response.body.data.branches).toHaveLength(2);
      expect(response.body.data.total).toBe(2);

      // Verify first branch structure
      const firstBranch = response.body.data.branches[0];
      expect(firstBranch).toHaveProperty('id');
      expect(firstBranch).toHaveProperty('name');
      expect(firstBranch).toHaveProperty('countryCode');
      expect(firstBranch).toHaveProperty('street');
      expect(firstBranch).toHaveProperty('city');
      expect(firstBranch).toHaveProperty('stateProvince');
      expect(firstBranch).toHaveProperty('postalCode');
      expect(firstBranch).toHaveProperty('formattedAddress');
      expect(firstBranch).toHaveProperty('phone');
      expect(firstBranch).toHaveProperty('createdAt');
      expect(firstBranch).toHaveProperty('deletedAt', null);
    });
  });

  describe('GET /api/branches/:id', () => {
    it('should return branch details by ID', async () => {
      // First create a branch
      const createResponse = await request(app.getHttpServer())
        .post('/api/branches')

        .send({
          name: 'Test Branch',
          countryCode: 'BR',
          street: 'Test Street',
          city: 'Test City',
          stateProvince: 'TS',
          postalCode: '12345-678',
          phone: '(11) 99999-9999',
          customerId: 'customer-1',
        })
        .expect(201);

      const branchId = createResponse.body.data.id;

      const response = await request(app.getHttpServer())
        .get(`/api/branches/${branchId}`)

        .expect(200);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: branchId,
          name: 'Test Branch',
          countryCode: 'BR',
          street: 'Test Street',
          city: 'Test City',
          stateProvince: 'TS',
          postalCode: '12345-678',
          phone: '(11) 99999-9999',
          deletedAt: null,
        }),
      });
    });

    it('should return 404 for non-existent branch', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/branches/non_existent_id')

        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: 'Branch with ID non_existent_id not found',
      });
    });
  });

  describe('DELETE /api/branches/:id', () => {
    it('should soft delete branch successfully', async () => {
      // First create a branch
      const createResponse = await request(app.getHttpServer())
        .post('/api/branches')

        .send({
          name: 'Branch to Delete',
          countryCode: 'BR',
          street: 'Delete Street',
          city: 'Delete City',
          stateProvince: 'DC',
          postalCode: '12345-678',
          phone: '(11) 99999-9999',
          customerId: 'customer-1',
        })
        .expect(201);

      const branchId = createResponse.body.data.id;

      // Soft delete the branch
      await request(app.getHttpServer())
        .delete(`/api/branches/${branchId}`)

        .expect(HttpStatus.NO_CONTENT);

      // Verify branch is no longer returned in list
      const listResponse = await request(app.getHttpServer())
        .get('/api/branches')

        .expect(200);

      const deletedBranch = listResponse.body.data.branches.find(
        (b: any) => b.id === branchId,
      );
      expect(deletedBranch).toBeUndefined();
    });

    it('should return 404 for non-existent branch', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/branches/non_existent_id')

        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        status: 404,
        message: 'Branch with ID non_existent_id not found',
      });
    });
  });
});
