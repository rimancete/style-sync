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
      phone?: string;
      role: 'CLIENT' | 'STAFF' | 'ADMIN';
    }> = [];

    const mockDb: Partial<DatabaseService> = {
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

  it('POST /auth/register should create user and return tokens', async () => {
    const res = await request(
      app.getHttpServer() as Parameters<typeof request>[0],
    )
      .post('/auth/register')
      .send({ email: 'client@test.com', password: '123456', name: 'Client' })
      .expect(201);

    expect(res.body).toEqual({
      data: expect.objectContaining({
        token: expect.any(String),
        refresh_token: expect.any(String),
        user_id: expect.any(String),
        user_name: 'Client',
        phone: null,
      }),
    });
  });

  it('POST /auth/login should return tokens for valid credentials', async () => {
    const res = await request(
      app.getHttpServer() as Parameters<typeof request>[0],
    )
      .post('/auth/login')
      .send({ email: 'client@test.com', password: '123456' })
      .expect(200);

    expect(res.body).toEqual({
      data: expect.objectContaining({
        token: expect.any(String),
        refresh_token: expect.any(String),
        user_id: expect.any(String),
        user_name: 'Client',
        phone: null,
      }),
    });
  });

  it('POST /auth/refresh should return fresh tokens', async () => {
    const login = await request(
      app.getHttpServer() as Parameters<typeof request>[0],
    )
      .post('/auth/login')
      .send({ email: 'client@test.com', password: '123456' })
      .expect(200);

    // For contract testing, we'll use a valid refresh token from the actual JWT service
    // This tests the full flow including JWT verification with header-based token
    const refresh = await request(
      app.getHttpServer() as Parameters<typeof request>[0],
    )
      .post('/auth/refresh')
      .set('Authorization', `Bearer ${login.body.data.refresh_token}`)
      .expect(200);

    expect(refresh.body).toEqual({
      data: expect.objectContaining({
        token: expect.any(String),
        refresh_token: expect.any(String),
        user_id: expect.any(String),
        user_name: 'Client',
        phone: null,
      }),
    });
  });

  it('POST /auth/refresh should return 401 when Authorization header is missing', async () => {
    await request(app.getHttpServer() as Parameters<typeof request>[0])
      .post('/auth/refresh')
      .expect(401);
  });
});
