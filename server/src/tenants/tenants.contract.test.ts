/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication, HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { TenantsModule } from './tenants.module';
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

describe('Tenants API Contracts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const tenants: Array<{
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
    }> = [
      {
        id: 'tenant-1',
        name: 'Active Tenant 1',
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
      },
      {
        id: 'tenant-2',
        name: 'Active Tenant 2',
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
      },
      {
        id: 'tenant-3',
        name: 'Deleted Tenant',
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
        deletedAt: new Date(), // This tenant should not appear in active list
        countryId: 'mock-country-br',
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
      tenant: {
        findFirst: jest.fn(({ where }: any) => {
          if (where.name && where.deletedAt === null) {
            return (
              tenants.find(
                t => t.name === where.name && t.deletedAt === null,
              ) || null
            );
          }
          if (where.name) {
            return tenants.find(t => t.name === where.name) || null;
          }
          return null;
        }),
        findMany: jest.fn(({ where }: any = {}) => {
          let filteredTenants = tenants;
          if (where.deletedAt === null) {
            filteredTenants = tenants.filter(t => t.deletedAt === null);
          }
          return filteredTenants.map(t => ({
            id: t.id,
            name: t.name,
            countryCode: t.countryCode,
            street: t.street,
            unit: t.unit,
            district: t.district,
            city: t.city,
            stateProvince: t.stateProvince,
            postalCode: t.postalCode,
            formattedAddress: t.formattedAddress,
            phone: t.phone,
            createdAt: t.createdAt,
            deletedAt: t.deletedAt,
            country: {
              id: t.countryId,
              code: t.countryCode,
              name: 'Mock Country',
            },
          }));
        }),
        findUnique: jest.fn(({ where, include }: any) => {
          const tenant = tenants.find(t => t.id === where.id);
          if (!tenant) return null;

          if (where.deletedAt === null && tenant.deletedAt !== null) {
            return null; // Exclude soft-deleted if filtering for active only
          }

          const result: any = {
            id: tenant.id,
            name: tenant.name,
            countryCode: tenant.countryCode,
            street: tenant.street,
            unit: tenant.unit,
            district: tenant.district,
            city: tenant.city,
            stateProvince: tenant.stateProvince,
            postalCode: tenant.postalCode,
            formattedAddress: tenant.formattedAddress,
            phone: tenant.phone,
            createdAt: tenant.createdAt,
            deletedAt: tenant.deletedAt,
          };

          if (include?.country) {
            result.country = {
              id: tenant.countryId,
              code: tenant.countryCode,
              name: 'Mock Country',
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
            id: `tenant_${tenants.length + 1}`,
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
          };
          tenants.push(created);
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
            country: {
              id: created.countryId,
              code: created.countryCode,
              name: 'Mock Country',
            },
          };
        }),
        update: jest.fn(({ where, data }: any) => {
          const tenant = tenants.find(t => t.id === where.id);
          if (!tenant) return null;

          Object.assign(tenant, data);
          return {
            id: tenant.id,
            name: tenant.name,
            countryCode: tenant.countryCode,
            street: tenant.street,
            unit: tenant.unit,
            district: tenant.district,
            city: tenant.city,
            stateProvince: tenant.stateProvince,
            postalCode: tenant.postalCode,
            formattedAddress: tenant.formattedAddress,
            phone: tenant.phone,
            createdAt: tenant.createdAt,
            deletedAt: tenant.deletedAt,
            country: {
              id: tenant.countryId,
              code: tenant.countryCode,
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
        TenantsModule,
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

  describe('GET /api/tenants', () => {
    it('should return list of active tenants only', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tenants')

        .expect(200);

      expect(response.body.data.tenants).toHaveLength(2);
      expect(response.body.data.total).toBe(2);

      // Verify first tenant structure
      const firstTenant = response.body.data.tenants[0];
      expect(firstTenant).toHaveProperty('id');
      expect(firstTenant).toHaveProperty('name');
      expect(firstTenant).toHaveProperty('countryCode');
      expect(firstTenant).toHaveProperty('street');
      expect(firstTenant).toHaveProperty('city');
      expect(firstTenant).toHaveProperty('stateProvince');
      expect(firstTenant).toHaveProperty('postalCode');
      expect(firstTenant).toHaveProperty('formattedAddress');
      expect(firstTenant).toHaveProperty('phone');
      expect(firstTenant).toHaveProperty('createdAt');
      expect(firstTenant).toHaveProperty('deletedAt', null);
    });
  });

  describe('GET /api/tenants/:id', () => {
    it('should return tenant details by ID', async () => {
      // First create a tenant
      const createResponse = await request(app.getHttpServer())
        .post('/api/tenants')

        .send({
          name: 'Test Tenant',
          countryCode: 'BR',
          street: 'Test Street',
          city: 'Test City',
          stateProvince: 'TS',
          postalCode: '12345-678',
          phone: '(11) 99999-9999',
        })
        .expect(201);

      const tenantId = createResponse.body.data.id;

      const response = await request(app.getHttpServer())
        .get(`/api/tenants/${tenantId}`)

        .expect(200);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: tenantId,
          name: 'Test Tenant',
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

    it('should return 404 for non-existent tenant', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/tenants/non_existent_id')

        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: 'Tenant with ID non_existent_id not found',
      });
    });
  });

  describe('DELETE /api/tenants/:id', () => {
    it('should soft delete tenant successfully', async () => {
      // First create a tenant
      const createResponse = await request(app.getHttpServer())
        .post('/api/tenants')

        .send({
          name: 'Tenant to Delete',
          countryCode: 'BR',
          street: 'Delete Street',
          city: 'Delete City',
          stateProvince: 'DC',
          postalCode: '12345-678',
          phone: '(11) 99999-9999',
        })
        .expect(201);

      const tenantId = createResponse.body.data.id;

      // Soft delete the tenant
      await request(app.getHttpServer())
        .delete(`/api/tenants/${tenantId}`)

        .expect(HttpStatus.NO_CONTENT);

      // Verify tenant is no longer returned in list
      const listResponse = await request(app.getHttpServer())
        .get('/api/tenants')

        .expect(200);

      const deletedTenant = listResponse.body.data.tenants.find(
        (t: any) => t.id === tenantId,
      );
      expect(deletedTenant).toBeUndefined();
    });

    it('should return 404 for non-existent tenant', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/tenants/non_existent_id')

        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        status: 404,
        message: 'Tenant with ID non_existent_id not found',
      });
    });
  });
});
