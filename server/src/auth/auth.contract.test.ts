import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthModule } from './auth.module';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';

describe('Auth API Contracts', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const users: Array<{
      id: string;
      email: string;
      password: string;
      name: string;
      phone: string | null;
      role: 'CLIENT' | 'STAFF' | 'ADMIN';
    }> = [];

    const userCustomers: Array<{
      id: string;
      userId: string;
      customerId: string;
    }> = [];

    const customers = [
      {
        id: 'customer_acme',
        displayId: 1,
        name: 'Acme Barbershop',
        urlSlug: 'acme',
        logoUrl: 'https://example.com/acme-logo.png',
        isActive: true,
      },
      {
        id: 'customer_elite',
        displayId: 2,
        name: 'Elite Cuts',
        urlSlug: 'elite-cuts',
        logoUrl: null,
        isActive: true,
      },
      {
        id: 'customer_inactive',
        displayId: 3,
        name: 'Inactive Shop',
        urlSlug: 'inactive',
        logoUrl: null,
        isActive: false,
      },
    ];

    const mockDb: Partial<DatabaseService> = {
      customer: {
        findUnique: jest.fn(({ where }: any) => {
          return customers.find(c => c.urlSlug === where.urlSlug) || null;
        }),
      } as any,
      user: {
        findUnique: jest.fn(({ where }: any) => {
          if (where.email) {
            return users.find(u => u.email === where.email) || null;
          }
          if (where.id) {
            return users.find(u => u.id === where.id) || null;
          }
          return null;
        }),
        create: jest.fn(({ data }: any) => {
          const created = {
            id: `user_${users.length + 1}`,
            email: data.email,
            password: data.password,
            name: data.name,
            phone: data.phone || null,
            role: 'CLIENT' as const,
          };
          users.push(created);
          return created;
        }),
        update: jest.fn(({ where, data }: any) => {
          const user = users.find(u => u.id === where.id);
          if (!user) return null;
          if (data.name !== undefined) user.name = data.name;
          if (data.phone !== undefined) user.phone = data.phone;
          return user;
        }),
      } as any,
      userCustomer: {
        findUnique: jest.fn(({ where }: any) => {
          const { userId, customerId } = where.userId_customerId || {};
          return (
            userCustomers.find(
              uc => uc.userId === userId && uc.customerId === customerId,
            ) || null
          );
        }),
        findMany: jest.fn(({ where }: any) => {
          const filtered = userCustomers.filter(
            uc => uc.userId === where.userId,
          );
          return filtered.map(uc => {
            const customer = customers.find(c => c.id === uc.customerId);
            return {
              customer: customer || null,
            };
          });
        }),
        create: jest.fn(({ data }: any) => {
          const created = {
            id: `uc_${userCustomers.length + 1}`,
            userId: data.userId,
            customerId: data.customerId,
          };
          userCustomers.push(created);
          return created;
        }),
      } as any,
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        AuthModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDb)
      .compile();

    app = moduleRef.createNestApplication();

    // Apply the same interceptors and filters as main app
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Customer-Scoped Registration', () => {
    it('POST /salon/:customerSlug/auth/register should create new user and link to customer', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/salon/acme/auth/register')
        .send({
          email: 'newuser@test.com',
          password: '123456',
          name: 'New User',
          phone: '(11) 99999-9999',
        })
        .expect(201);

      expect(res.body).toEqual({
        data: expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String),
          userId: expect.any(String),
          userName: 'New User',
          phone: '(11) 99999-9999',
          customers: expect.arrayContaining([
            expect.objectContaining({
              id: 'customer_acme',
              name: 'Acme Barbershop',
              urlSlug: 'acme',
            }),
          ]),
          defaultCustomerId: 'customer_acme',
        }),
      });
    });

    it('POST /salon/:customerSlug/auth/register should link existing user to new customer', async () => {
      // First registration with acme
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/salon/acme/auth/register')
        .send({
          email: 'multiuser@test.com',
          password: '123456',
          name: 'Multi User',
          phone: '(11) 88888-8888',
        })
        .expect(201);

      // Second registration with elite-cuts (same email, different customer)
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/salon/elite-cuts/auth/register')
        .send({
          email: 'multiuser@test.com',
          password: 'ignored', // Password ignored for existing users
          name: 'Updated Name',
          phone: '(11) 77777-7777',
        })
        .expect(201);

      expect(res.body).toEqual({
        data: expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String),
          userId: expect.any(String),
          userName: 'Updated Name',
          phone: '(11) 77777-7777',
          customers: expect.arrayContaining([
            expect.objectContaining({
              id: 'customer_acme',
              urlSlug: 'acme',
            }),
            expect.objectContaining({
              id: 'customer_elite',
              urlSlug: 'elite-cuts',
            }),
          ]),
          defaultCustomerId: 'customer_elite',
        }),
      });
    });

    it('POST /salon/:customerSlug/auth/register should return 400 for invalid customer', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/salon/nonexistent/auth/register')
        .send({
          email: 'test@test.com',
          password: '123456',
          name: 'Test User',
        })
        .expect(400);

      expect(res.body).toEqual({
        status: 400,
        message: 'Customer not found or inactive',
      });
    });

    it('POST /salon/:customerSlug/auth/register should return 400 for inactive customer', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/salon/inactive/auth/register')
        .send({
          email: 'test@test.com',
          password: '123456',
          name: 'Test User',
        })
        .expect(400);

      expect(res.body).toEqual({
        status: 400,
        message: 'Customer not found or inactive',
      });
    });

    it('POST /salon/:customerSlug/auth/register should return 409 if user already linked to customer', async () => {
      // First registration
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/salon/acme/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: '123456',
          name: 'Duplicate User',
        })
        .expect(201);

      // Try to register again with same customer
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/salon/acme/auth/register')
        .send({
          email: 'duplicate@test.com',
          password: '123456',
          name: 'Duplicate User',
        })
        .expect(409);

      expect(res.body).toEqual({
        status: 409,
        message: 'Already registered with this customer',
      });
    });
  });

  describe('Authentication Endpoints', () => {
    beforeAll(async () => {
      // Create a user for login tests
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/salon/acme/auth/register')
        .send({
          email: 'loginuser@test.com',
          password: '123456',
          name: 'Login User',
        });
    });

    it('POST /auth/login should return tokens for valid credentials', async () => {
      const res = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: 'loginuser@test.com', password: '123456' })
        .expect(200);

      expect(res.body).toEqual({
        data: expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String),
          userId: expect.any(String),
          userName: 'Login User',
          customers: expect.arrayContaining([
            expect.objectContaining({
              id: 'customer_acme',
              urlSlug: 'acme',
            }),
          ]),
        }),
      });
    });

    it('POST /auth/refresh should return fresh tokens', async () => {
      const login = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/login')
        .send({ email: 'loginuser@test.com', password: '123456' })
        .expect(200);

      const refresh = await request(
        app.getHttpServer() as Parameters<typeof request>[0],
      )
        .post('/auth/refresh')
        .set('Authorization', `Bearer ${login.body.data.refreshToken}`)
        .expect(200);

      expect(refresh.body).toEqual({
        data: expect.objectContaining({
          token: expect.any(String),
          refreshToken: expect.any(String),
          userId: expect.any(String),
          userName: 'Login User',
        }),
      });
    });

    it('POST /auth/refresh should return 401 when Authorization header is missing', async () => {
      await request(app.getHttpServer() as Parameters<typeof request>[0])
        .post('/auth/refresh')
        .expect(401);
    });
  });
});
