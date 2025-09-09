/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CountriesModule } from './countries.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

// Type definitions for API responses
interface CreateCountryRequest {
  code: string;
  name: string;
  addressFormat: {
    fields: string[];
    required: string[];
    validation: Record<string, string | string[]>;
    labels: Record<string, string>;
  };
}

interface UpdateCountryRequest {
  code?: string;
  name?: string;
  addressFormat?: {
    fields: string[];
    required: string[];
    validation: Record<string, string | string[]>;
    labels: Record<string, string>;
  };
}

describe('Countries API Contracts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const countries: Array<{
      id: string;
      code: string;
      name: string;
      addressFormat: Record<string, unknown>;
      createdAt: Date;
      tenants: unknown[];
    }> = [];

    const mockDb: Partial<DatabaseService> = {
      country: {
        findUnique: jest.fn(({ where }) => {
          if (where.code) {
            return countries.find(c => c.code === where.code) || null;
          }
          if (where.id) {
            return countries.find(c => c.id === where.id) || null;
          }
          return null;
        }),
        findFirst: jest.fn(({ where }) => {
          if (where.code) {
            return countries.find(c => c.code === where.code) || null;
          }
          if (where.name) {
            return countries.find(c => c.name === where.name) || null;
          }
          return null;
        }),
        findMany: jest.fn(() => {
          return countries.map(c => ({
            id: c.id,
            code: c.code,
            name: c.name,
            addressFormat: c.addressFormat,
            createdAt: c.createdAt,
          }));
        }),
        create: jest.fn(({ data }) => {
          const created = {
            id: `country_${countries.length + 1}`,
            code: data.code,
            name: data.name,
            addressFormat: data.addressFormat,
            createdAt: new Date(),
            tenants: [],
          };
          countries.push(created);
          return {
            id: created.id,
            code: created.code,
            name: created.name,
            addressFormat: created.addressFormat,
            createdAt: created.createdAt,
          };
        }),
        update: jest.fn(({ where, data }) => {
          const country = countries.find(c => c.id === where.id);
          if (!country) return null;

          Object.assign(country, data);
          return {
            id: country.id,
            code: country.code,
            name: country.name,
            addressFormat: country.addressFormat,
            createdAt: country.createdAt,
          };
        }),
        delete: jest.fn(({ where }) => {
          const index = countries.findIndex(c => c.id === where.id);
          if (index === -1) return null;

          const deleted = countries[index];
          countries.splice(index, 1);
          return deleted;
        }),
      } as any,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        CountriesModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDb)
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

  describe('POST /api/countries', () => {
    it('should create a new country with valid data', async () => {
      const createCountryData: CreateCountryRequest = {
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
      };

      const response = await request(app.getHttpServer())
        .post('/api/countries')
        .send(createCountryData)
        .expect(201);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: expect.any(String),
          code: createCountryData.code,
          name: createCountryData.name,
          addressFormat: createCountryData.addressFormat,
          createdAt: expect.any(String),
        }),
      });
    });

    it('should return 409 when country code already exists', async () => {
      const createCountryData: CreateCountryRequest = {
        code: 'BR',
        name: 'Brazil Duplicate',
        addressFormat: {
          fields: ['street', 'city', 'stateProvince', 'postalCode'],
          required: ['street', 'city', 'stateProvince', 'postalCode'],
          validation: {},
          labels: {},
        },
      };

      const response = await request(app.getHttpServer())
        .post('/api/countries')

        .send(createCountryData)
        .expect(409);

      expect(response.body).toEqual({
        status: 409,
        message: 'Country with this code already exists',
      });
    });
  });

  describe('GET /api/countries', () => {
    it('should return list of all countries', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/countries')

        .expect(200);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          countries: expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              code: expect.any(String),
              name: expect.any(String),
              addressFormat: expect.any(Object),
              createdAt: expect.any(String),
            }),
          ]),
          total: expect.any(Number),
        }),
      });
    });
  });

  describe('GET /api/countries/code/:code', () => {
    it('should return country details by code', async () => {
      // First create a country
      await request(app.getHttpServer())
        .post('/api/countries')

        .send({
          code: 'US',
          name: 'United States',
          addressFormat: {
            fields: ['street', 'city', 'stateProvince', 'postalCode'],
            required: ['street', 'city', 'stateProvince', 'postalCode'],
            validation: {},
            labels: {},
          },
        });

      const response = await request(app.getHttpServer())
        .get('/api/countries/code/US')
        .expect(200);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: expect.any(String),
          code: 'US',
          name: 'United States',
          addressFormat: expect.any(Object),
          createdAt: expect.any(String),
        }),
      });
    });

    it('should return 404 for non-existent country code', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/countries/code/NONEXISTENT')
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: 'Country with code NONEXISTENT not found',
      });
    });
  });

  describe('PATCH /api/countries/:id', () => {
    it('should update country information', async () => {
      // First create a country
      const createResponse = await request(app.getHttpServer())
        .post('/api/countries')

        .send({
          code: 'CA',
          name: 'Canada',
          addressFormat: {
            fields: ['street', 'city', 'stateProvince', 'postalCode'],
            required: ['street', 'city', 'stateProvince', 'postalCode'],
            validation: {},
            labels: {},
          },
        });

      const countryId = createResponse.body.data.id;
      const updateData: UpdateCountryRequest = {
        name: 'Canada Updated',
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/countries/${countryId}`)

        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        data: expect.objectContaining({
          id: countryId,
          code: 'CA',
          name: updateData.name,
          addressFormat: expect.any(Object),
          createdAt: expect.any(String),
        }),
      });
    });

    it('should return 404 for non-existent country', async () => {
      const updateData: UpdateCountryRequest = {
        name: 'Updated Name',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/countries/non_existent_id')

        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: 'Country with ID non_existent_id not found',
      });
    });
  });

  describe('DELETE /api/countries/:id', () => {
    it('should return 404 for non-existent country', async () => {
      const response = await request(app.getHttpServer())
        .delete('/api/countries/non_existent_id')

        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: 'Country with ID non_existent_id not found',
      });
    });
  });
});
