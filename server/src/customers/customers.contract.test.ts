/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersModule } from './customers.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CustomerAccessGuard } from '../common/guards/customer-access.guard';

// Contract tests - types are validated through API responses

const LIGHT_EXTRA_COLUMNS = {
  foregroundColor: '#0F172A',
  surfaceColor: '#FFFFFF',
  borderColor: '#E2E8F0',
  mutedForegroundColor: '#475569',
};

const DARK_COLUMNS = {
  darkPrimaryMain: '#CFFAFE',
  darkPrimaryLight: '#ECFEFF',
  darkPrimaryDark: '#A5F3FC',
  darkPrimaryContrast: '#020617',
  darkSecondaryMain: '#22D3EE',
  darkSecondaryLight: '#67E8F9',
  darkSecondaryDark: '#0891B2',
  darkSecondaryContrast: '#020617',
  darkBackgroundColor: '#080C14',
  darkForegroundColor: '#F1F5F9',
  darkSurfaceColor: '#0B1220',
  darkBorderColor: '#1C1F27',
  darkMutedForegroundColor: '#94A3B8',
};

const LIGHT_EXTRA_TOKENS = {
  foreground: '#0F172A',
  surface: '#FFFFFF',
  border: '#E2E8F0',
  mutedForeground: '#475569',
};

function expectedDarkPalette(logoAlt: string) {
  return {
    logoUrl: null,
    logoAlt,
    primary: {
      main: '#CFFAFE',
      light: '#ECFEFF',
      dark: '#A5F3FC',
      contrast: '#020617',
    },
    secondary: {
      main: '#22D3EE',
      light: '#67E8F9',
      dark: '#0891B2',
      contrast: '#020617',
    },
    background: '#080C14',
    foreground: '#F1F5F9',
    surface: '#0B1220',
    border: '#1C1F27',
    mutedForeground: '#94A3B8',
  };
}

describe('Customers API Contracts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const customers: Array<{
      id: string;
      name: string;
      urlSlug: string;
      documentTitle: string;
      logoUrl?: string;
      logoAlt: string;
      favicon32x32?: string;
      favicon16x16?: string;
      appleTouch?: string;
      primaryMain: string;
      primaryLight: string;
      primaryDark: string;
      primaryContrast: string;
      secondaryMain: string;
      secondaryLight: string;
      secondaryDark: string;
      secondaryContrast: string;
      backgroundColor: string;
      isActive: boolean;
      [column: string]: unknown;
      createdAt: Date;
      updatedAt: Date;
    }> = [
      {
        id: 'customer-1',
        name: 'Acme Barbershop',
        urlSlug: 'acme',
        documentTitle: 'Acme Barbershop - Professional Haircuts',
        logoAlt: 'Acme Barbershop Logo',
        primaryMain: '#272726FF',
        primaryLight: '#706E6DFF',
        primaryDark: '#1B1B1BFF',
        primaryContrast: '#ECE8E6FF',
        secondaryMain: '#8D8C8BFF',
        secondaryLight: '#E7E7E6FF',
        secondaryDark: '#3B3B3BFF',
        secondaryContrast: '#1B1B1BFF',
        backgroundColor: '#F7F7F7FF',
        ...LIGHT_EXTRA_COLUMNS,
        ...DARK_COLUMNS,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'customer-2',
        name: 'Inactive Customer',
        urlSlug: 'inactive',
        documentTitle: 'Inactive Customer',
        logoAlt: 'Inactive Logo',
        primaryMain: '#000000',
        primaryLight: '#333333',
        primaryDark: '#000000',
        primaryContrast: '#FFFFFF',
        secondaryMain: '#666666',
        secondaryLight: '#CCCCCC',
        secondaryDark: '#333333',
        secondaryContrast: '#FFFFFF',
        backgroundColor: '#FFFFFF',
        ...LIGHT_EXTRA_COLUMNS,
        ...DARK_COLUMNS,
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockDb: Partial<DatabaseService> = {
      customer: {
        findUnique: jest.fn(({ where }: any) => {
          if (where.urlSlug) {
            return customers.find(c => c.urlSlug === where.urlSlug) || null;
          }
          if (where.id) {
            return customers.find(c => c.id === where.id) || null;
          }
          return null;
        }),
        update: jest.fn(({ where, data }: any) => {
          const customer = customers.find(c => c.id === where.id);
          if (!customer) return null;

          Object.assign(customer, data);
          return customer;
        }),
      } as any,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [configuration],
        }),
        CustomersModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDb)
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            userId: 'admin-user-1',
            email: 'admin@test.com',
            role: 'ADMIN',
            customerIds: ['customer-1', 'customer-2'],
            defaultCustomerId: 'customer-1',
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(CustomerAccessGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        errorHttpStatusCode: 422,
      }),
    );
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());
    app.setGlobalPrefix('api');

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('GET /api/customers/branding/:urlSlug', () => {
    it('should return customer branding for active customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers/branding/acme')
        .expect(200);

      expect(response.body.data).toEqual({
        id: 'customer-1',
        name: 'Acme Barbershop',
        urlSlug: 'acme',
        branding: {
          favicon32x32: null,
          favicon16x16: null,
          appleTouch: null,
          documentTitle: 'Acme Barbershop - Professional Haircuts',
          theme: {
            light: {
              logoUrl: null,
              logoAlt: 'Acme Barbershop Logo',
              primary: {
                main: '#272726FF',
                light: '#706E6DFF',
                dark: '#1B1B1BFF',
                contrast: '#ECE8E6FF',
              },
              secondary: {
                main: '#8D8C8BFF',
                light: '#E7E7E6FF',
                dark: '#3B3B3BFF',
                contrast: '#1B1B1BFF',
              },
              background: '#F7F7F7FF',
              ...LIGHT_EXTRA_TOKENS,
            },
            dark: expectedDarkPalette('Acme Barbershop Logo'),
          },
        },
        isActive: true,
      });
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers/branding/nonexistent')
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: "Customer with URL slug 'nonexistent' not found",
      });
    });

    it('should return 404 for inactive customer', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/customers/branding/inactive')
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: "Customer with URL slug 'inactive' is not active",
      });
    });
  });

  describe('PUT /api/customers/:customerId/branding/config', () => {
    it('should update customer branding successfully', async () => {
      const updateData = {
        documentTitle: 'Updated Acme Barbershop Title',
        logoAlt: 'Updated Logo Alt',
        theme: {
          light: {
            primary: {
              main: '#FF0000',
            },
            background: '#F0F0F0',
          },
        },
      };

      const response = await request(app.getHttpServer())
        .put('/api/customers/customer-1/branding/config')
        .send(updateData)
        .expect(200);

      expect(response.body.data).toEqual({
        id: 'customer-1',
        name: 'Acme Barbershop',
        urlSlug: 'acme',
        branding: {
          favicon32x32: null,
          favicon16x16: null,
          appleTouch: null,
          documentTitle: 'Updated Acme Barbershop Title',
          theme: {
            light: {
              logoUrl: null,
              logoAlt: 'Updated Logo Alt',
              primary: {
                main: '#FF0000',
                light: '#706E6DFF',
                dark: '#1B1B1BFF',
                contrast: '#ECE8E6FF',
              },
              secondary: {
                main: '#8D8C8BFF',
                light: '#E7E7E6FF',
                dark: '#3B3B3BFF',
                contrast: '#1B1B1BFF',
              },
              background: '#F0F0F0',
              ...LIGHT_EXTRA_TOKENS,
            },
            dark: expectedDarkPalette('Updated Logo Alt'),
          },
        },
        isActive: true,
      });
    });

    it('should update only specified fields', async () => {
      const updateData = {
        documentTitle: 'Partially Updated Title',
      };

      const response = await request(app.getHttpServer())
        .put('/api/customers/customer-1/branding/config')
        .send(updateData)
        .expect(200);

      expect(response.body.data.branding.documentTitle).toBe(
        'Partially Updated Title',
      );
      // Other fields should remain unchanged
      expect(response.body.data.branding.theme.light.primary.main).toBe(
        '#FF0000',
      );
    });

    it('should return 404 for non-existent customer', async () => {
      const updateData = {
        documentTitle: 'New Title',
      };

      const response = await request(app.getHttpServer())
        .put('/api/customers/nonexistent-customer/branding/config')
        .send(updateData)
        .expect(404);

      expect(response.body).toEqual({
        status: 404,
        message: "Customer with ID 'nonexistent-customer' not found",
      });
    });

    it('should update dark palette tokens without touching light ones', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/customers/customer-1/branding/config')
        .send({
          theme: {
            dark: {
              primary: { main: '#F472B6' },
              surface: '#26101B',
            },
          },
        })
        .expect(200);

      const { light, dark } = response.body.data.branding.theme;
      expect(dark.primary.main).toBe('#F472B6');
      expect(dark.surface).toBe('#26101B');
      expect(dark.background).toBe('#080C14');
      expect(light.primary.main).toBe('#FF0000');
      expect(light.surface).toBe('#FFFFFF');
    });

    it('should reject a theme color that is not hex', async () => {
      await request(app.getHttpServer())
        .put('/api/customers/customer-1/branding/config')
        .send({ theme: { light: { primary: { main: 'pink' } } } })
        .expect(422);

      await request(app.getHttpServer())
        .put('/api/customers/customer-1/branding/config')
        .send({ theme: { dark: { border: '#12345' } } })
        .expect(422);
    });

    it('should handle empty update payload', async () => {
      const response = await request(app.getHttpServer())
        .put('/api/customers/customer-1/branding/config')
        .send({})
        .expect(200);

      // Should return current branding without changes
      expect(response.body.data.branding.documentTitle).toBe(
        'Partially Updated Title',
      );
    });
  });
});
