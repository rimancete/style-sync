/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as request from 'supertest';
import {
  INestApplication,
  HttpStatus,
  ForbiddenException,
  NotFoundException,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import configuration from '../config/configuration';
import { BranchesModule } from './branches.module';
import { CountriesModule } from '../countries/countries.module';
import { CountriesService } from '../countries/countries.service';
import { DatabaseService } from '../database/database.service';
import { ResponseTransformInterceptor } from '../common/interceptors/response-transform.interceptor';
import { HttpExceptionFilter } from '../common/filters/http-exception.filter';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerContextGuard } from '../common/guards/customer-context.guard';
import { AuthenticatedUser } from '../common/types/auth.types';
import { CreateCustomerBranchDto } from './dto/create-customer-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { CustomerUrlUtil } from '../common/utils/url-customer.util';

interface CountryRecord {
  id: string;
  code: string;
  name: string;
  addressFormat: Record<string, unknown>;
}

interface CustomerRecord {
  id: string;
  name: string;
  urlSlug: string;
  isActive: boolean;
}

type BranchRecord = {
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
  professionals?: Array<{ id: string; isActive: boolean }>;
  bookings?: Array<Record<string, unknown>>;
  servicePricing?: Array<Record<string, unknown>>;
};

const countries: CountryRecord[] = [
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

const customers: CustomerRecord[] = [
  {
    id: 'customer-1',
    name: 'Acme Barbershop',
    urlSlug: 'acme',
    isActive: true,
  },
  {
    id: 'customer-2',
    name: 'Elite Cuts',
    urlSlug: 'elite-cuts',
    isActive: true,
  },
  {
    id: 'customer-3',
    name: 'Inactive Customer',
    urlSlug: 'inactive',
    isActive: false,
  },
];

const baseBranches = (): BranchRecord[] => [
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
    createdAt: new Date('2024-01-01T10:00:00.000Z'),
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
    createdAt: new Date('2024-01-02T10:00:00.000Z'),
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
    createdAt: new Date('2024-01-03T10:00:00.000Z'),
    deletedAt: new Date('2024-01-04T10:00:00.000Z'),
    countryId: 'mock-country-br',
    customerId: 'customer-1',
  },
  {
    id: 'branch-4',
    name: 'Elite Branch 1',
    countryCode: 'US',
    street: '400 Market Street',
    unit: null,
    district: 'Financial District',
    city: 'San Francisco',
    stateProvince: 'CA',
    postalCode: '94104',
    formattedAddress: '400 Market Street, San Francisco, CA 94104, US',
    phone: '(415) 555-0100',
    createdAt: new Date('2024-01-05T10:00:00.000Z'),
    deletedAt: null,
    countryId: 'mock-country-us',
    customerId: 'customer-2',
  },
];

const branches: BranchRecord[] = [];
let branchSequence = 100;

const nextBranchId = (): string => {
  branchSequence += 1;
  return `branch_${branchSequence}`;
};

const resetBranches = (): void => {
  branches.splice(0, branches.length, ...baseBranches());
};

const findCountryById = (countryId: string): CountryRecord | null =>
  countries.find(country => country.id === countryId) || null;

const findCountryByCode = (countryCode: string): CountryRecord | null =>
  countries.find(country => country.code === countryCode) || null;

const findCustomerById = (customerId: string): CustomerRecord | null =>
  customers.find(customer => customer.id === customerId) || null;

const matchesCustomerWhere = (
  customer: CustomerRecord,
  where: Record<string, unknown>,
): boolean => {
  if (!where) return true;
  if (where.id && customer.id !== where.id) return false;
  if (where.urlSlug && customer.urlSlug !== where.urlSlug) return false;
  if (
    typeof where.isActive === 'boolean' &&
    customer.isActive !== where.isActive
  ) {
    return false;
  }
  return true;
};

const findCustomerBySlug = (slug: string): CustomerRecord | null =>
  customers.find(customer => customer.urlSlug === slug) || null;

const matchesWhere = (
  branch: BranchRecord,
  where: Record<string, any> = {},
): boolean => {
  if (!where) return true;

  if ('deletedAt' in where) {
    if (where.deletedAt === null && branch.deletedAt !== null) {
      return false;
    }
    if (where.deletedAt !== null && where.deletedAt !== undefined) {
      if (
        !(where.deletedAt instanceof Date) ||
        branch.deletedAt?.getTime() !== where.deletedAt.getTime()
      ) {
        return false;
      }
    }
  }

  if ('customerId' in where && where.customerId !== branch.customerId) {
    return false;
  }

  if ('name' in where && where.name !== branch.name) {
    return false;
  }

  if ('id' in where) {
    const idFilter = where.id;
    if (typeof idFilter === 'object' && idFilter !== null) {
      if ('not' in idFilter && branch.id === idFilter.not) {
        return false;
      }
      if ('equals' in idFilter && branch.id !== idFilter.equals) {
        return false;
      }
    } else if (branch.id !== idFilter) {
      return false;
    }
  }

  if ('NOT' in where) {
    const notClauses = Array.isArray(where.NOT) ? where.NOT : [where.NOT];
    for (const clause of notClauses) {
      if (clause?.id && branch.id === clause.id) {
        return false;
      }
    }
  }

  return true;
};

const applyIncludes = (
  branch: BranchRecord,
  include: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const result: Record<string, unknown> = { ...branch };

  if (include?.['country']) {
    const country = findCountryById(branch.countryId);
    result.country = country
      ? { id: country.id, code: country.code, name: country.name }
      : null;
  }

  if (include?.['customer']) {
    const customer = findCustomerById(branch.customerId);
    result.customer = customer
      ? { id: customer.id, name: customer.name }
      : null;
  }

  if (include?.['professionals']) {
    const professionals = branch.professionals ?? [];
    const professionalInclude = include['professionals'] as
      | { where?: { isActive?: boolean } }
      | true;
    if (
      typeof professionalInclude === 'object' &&
      professionalInclude?.where?.isActive === true
    ) {
      result.professionals = professionals.filter(p => p.isActive);
    } else {
      result.professionals = professionals;
    }
  }

  if (include?.['bookings']) {
    result.bookings = branch.bookings ?? [];
  }

  if (include?.['servicePricing']) {
    result.servicePricing = branch.servicePricing ?? [];
  }

  return result;
};

describe('Branches API Contracts', () => {
  let app: INestApplication;
  let currentUser: AuthenticatedUser | null = null;

  const setAuthenticatedUser = (user: AuthenticatedUser | null): void => {
    currentUser = user ? { ...user } : null;
  };

  const withCustomerContext = (
    customerId: string,
    options: {
      additionalCustomerIds?: string[];
      role?: AuthenticatedUser['role'];
    } = {},
  ): AuthenticatedUser => {
    const customer = findCustomerById(customerId);
    if (!customer) {
      throw new Error(`Customer with ID ${customerId} not found`);
    }

    return {
      userId: 'user-1',
      email: 'user1@test.com',
      role: options.role ?? 'ADMIN',
      customerIds: [customerId, ...(options.additionalCustomerIds ?? [])],
      defaultCustomerId: customerId,
    };
  };

  const expectBranchesList = (
    response: request.Response,
    expectedTotal: number,
  ): void => {
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual(
      expect.objectContaining({
        branches: expect.any(Array),
        total: expectedTotal,
      }),
    );

    for (const branch of response.body.data.branches as Array<
      Record<string, unknown>
    >) {
      expect(branch).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
          customerId: expect.any(String),
          formattedAddress: expect.any(String),
          phone: expect.any(String),
          deletedAt: null,
        }),
      );
    }
  };

  const expectBranchResponse = (
    response: request.Response,
    expectedOverrides: Partial<Record<string, unknown>> = {},
  ): void => {
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        name: expect.any(String),
        countryCode: expect.any(String),
        street: expect.any(String),
        city: expect.any(String),
        stateProvince: expect.any(String),
        postalCode: expect.any(String),
        phone: expect.any(String),
        customerId: expect.any(String),
        formattedAddress: expect.any(String),
        deletedAt: null,
        createdAt: expect.any(String),
        customerName: expect.any(String),
        ...expectedOverrides,
      }),
    );
  };

  beforeAll(async () => {
    resetBranches();

    const mockCountriesService: Partial<CountriesService> = {
      findByCode: jest.fn((code: string) => {
        const country = findCountryByCode(code);
        if (!country) {
          throw new NotFoundException(`Country with code ${code} not found`);
        }
        return Promise.resolve({
          id: country.id,
          code: country.code,
          name: country.name,
          addressFormat: country.addressFormat as {
            fields: string[];
            required: string[];
            validation: Record<string, string | string[]>;
            labels: Record<string, string>;
          },
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
        });
      }),
      validateAddressFormat: jest.fn(() => Promise.resolve()),
    };

    const mockDb: Partial<DatabaseService> = {
      branch: {
        findFirst: jest.fn(({ where, include }: any = {}) => {
          const branch = branches.find(candidate =>
            matchesWhere(candidate, where),
          );
          if (!branch) {
            return Promise.resolve(null);
          }
          return Promise.resolve(applyIncludes(branch, include));
        }),
        findMany: jest.fn(({ where, include, orderBy }: any = {}) => {
          let filtered = branches.filter(candidate =>
            matchesWhere(candidate, where),
          );
          if (orderBy?.createdAt) {
            filtered = filtered.sort((a, b) =>
              orderBy.createdAt === 'asc'
                ? a.createdAt.getTime() - b.createdAt.getTime()
                : b.createdAt.getTime() - a.createdAt.getTime(),
            );
          }
          const results = filtered
            .filter(
              branch => branch.deletedAt === null || where?.deletedAt !== null,
            )
            .map(branch => applyIncludes(branch, include));
          return Promise.resolve(results);
        }),
        findUnique: jest.fn(({ where, include }: any) => {
          const branch = branches.find(candidate =>
            matchesWhere(candidate, where),
          );
          if (!branch) {
            return Promise.resolve(null);
          }
          return Promise.resolve(applyIncludes(branch, include));
        }),
        count: jest.fn(({ where }: any = {}) => {
          const filtered = branches.filter(candidate =>
            matchesWhere(candidate, where),
          );
          return Promise.resolve(filtered.length);
        }),
        create: jest.fn(({ data, include }: any) => {
          const country = findCountryByCode(data.countryCode);
          if (!country) {
            throw new Error(`Country with code ${data.countryCode} not found`);
          }

          const customer = findCustomerById(data.customerId);
          if (!customer) {
            throw new Error(`Customer with ID ${data.customerId} not found`);
          }

          const created: BranchRecord = {
            id: nextBranchId(),
            name: data.name,
            countryCode: data.countryCode,
            street: data.street,
            unit: data.unit ?? null,
            district: data.district ?? null,
            city: data.city,
            stateProvince: data.stateProvince,
            postalCode: data.postalCode,
            formattedAddress: data.formattedAddress,
            phone: data.phone,
            createdAt: new Date('2024-01-10T10:00:00.000Z'),
            deletedAt: null,
            countryId: country.id,
            customerId: data.customerId,
          };

          branches.push(created);
          return Promise.resolve(applyIncludes(created, include));
        }),
        update: jest.fn(({ where, data, include }: any) => {
          const branch = branches.find(candidate =>
            matchesWhere(candidate, { id: where.id }),
          );
          if (!branch) {
            return Promise.resolve(null);
          }

          Object.assign(branch, {
            ...data,
            unit: data.unit ?? branch.unit,
            district: data.district ?? branch.district,
            customerId: data.customerId ?? branch.customerId,
            countryId: data.countryId ?? branch.countryId,
          });

          if (data.deletedAt) {
            branch.deletedAt = data.deletedAt;
          }

          return Promise.resolve(applyIncludes(branch, include));
        }),
      } as any,
      customer: {
        findUnique: jest.fn(({ where }: any) => {
          const customer = customers.find(candidate =>
            matchesCustomerWhere(candidate, where),
          );
          return Promise.resolve(customer ?? null);
        }),
        findMany: jest.fn(() => Promise.resolve(customers)),
      } as any,
    };

    const mockJwtAuthGuard = {
      canActivate: jest.fn((context: ExecutionContext) => {
        if (!currentUser) {
          throw new ForbiddenException('Authentication required');
        }
        const request = context.switchToHttp().getRequest();
        request.user = { ...currentUser };
        return true;
      }),
    };

    const mockCustomerContextGuard = {
      canActivate: jest.fn((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const user = request.user as AuthenticatedUser | undefined;

        if (!user) {
          throw new ForbiddenException('Authentication required');
        }

        const customerSlug = CustomerUrlUtil.extractCustomerSlug(request.url);

        if (!customerSlug) {
          return true;
        }

        if (!CustomerUrlUtil.isValidCustomerSlug(customerSlug)) {
          throw new BadRequestException(
            `Invalid customer identifier: ${customerSlug}`,
          );
        }

        const customer = findCustomerBySlug(customerSlug);
        if (!customer?.isActive) {
          throw new NotFoundException(`Customer not found: ${customerSlug}`);
        }

        if (!user.customerIds.includes(customer.id)) {
          throw new ForbiddenException(
            `Access denied to customer: ${customerSlug}`,
          );
        }

        request.user = {
          ...user,
          activeCustomerId: customer.id,
          activeCustomerSlug: customerSlug,
        };

        return true;
      }),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
        BranchesModule,
        CountriesModule,
      ],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDb)
      .overrideProvider(CountriesService)
      .useValue(mockCountriesService)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtAuthGuard)
      .overrideGuard(CustomerContextGuard)
      .useValue(mockCustomerContextGuard)
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

  beforeEach(() => {
    resetBranches();
    setAuthenticatedUser(null);
    jest.clearAllMocks();
  });

  describe('Admin Branches Endpoints', () => {
    it('should list active branches across all customers', async () => {
      setAuthenticatedUser(
        withCustomerContext('customer-1', {
          additionalCustomerIds: ['customer-2'],
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/api/branches')
        .expect(HttpStatus.OK);

      expectBranchesList(response, 3);
      const branchIds = (
        response.body.data.branches as Array<Record<string, unknown>>
      ).map(branch => branch.id);
      expect(branchIds).toEqual(
        expect.arrayContaining(['branch-1', 'branch-2', 'branch-4']),
      );
    });
  });

  describe('Customer-scoped Branch Endpoints', () => {
    it('should return active branches for accessible customer context', async () => {
      setAuthenticatedUser(
        withCustomerContext('customer-1', {
          additionalCustomerIds: ['customer-2'],
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/api/salon/acme/branches')
        .expect(HttpStatus.OK);

      expectBranchesList(response, 2);
      const branchIds = (
        response.body.data.branches as Array<Record<string, unknown>>
      ).map(branch => branch.id);
      expect(branchIds).toEqual(
        expect.arrayContaining(['branch-1', 'branch-2']),
      );
      expect(branchIds).not.toContain('branch-3');
      expect(branchIds).not.toContain('branch-4');
    });

    it('should deny access when user lacks customer permission', async () => {
      setAuthenticatedUser(withCustomerContext('customer-2'));

      const response = await request(app.getHttpServer())
        .get('/api/salon/acme/branches')
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body).toEqual({
        status: HttpStatus.FORBIDDEN,
        message: 'Access denied to customer: acme',
      });
    });

    it('should return 400 for invalid customer slug format', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const response = await request(app.getHttpServer())
        .get('/api/salon/invalid!/branches')
        .expect(HttpStatus.BAD_REQUEST);

      expect(response.body).toEqual({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid customer identifier: invalid!',
      });
    });

    it('should return 404 for unknown customer slug', async () => {
      setAuthenticatedUser(
        withCustomerContext('customer-1', {
          additionalCustomerIds: ['customer-2'],
        }),
      );

      const response = await request(app.getHttpServer())
        .get('/api/salon/nonexistent/branches')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        status: HttpStatus.NOT_FOUND,
        message: 'Customer not found: nonexistent',
      });
    });

    it('should return branch details within customer context', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const response = await request(app.getHttpServer())
        .get('/api/salon/acme/branches/branch-1')
        .expect(HttpStatus.OK);

      expectBranchResponse(response, {
        id: 'branch-1',
        customerId: 'customer-1',
      });
    });

    it('should return 404 when branch does not belong to customer', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const response = await request(app.getHttpServer())
        .get('/api/salon/acme/branches/branch-4')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        status: HttpStatus.NOT_FOUND,
        message: 'Branch with ID branch-4 not found in customer context',
      });
    });

    it('should create a branch within customer context and assign customer automatically', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const createPayload: CreateCustomerBranchDto = {
        name: 'New Customer Branch',
        countryCode: 'US',
        street: '900 Innovation Way',
        city: 'Austin',
        stateProvince: 'TX',
        postalCode: '73301',
        phone: '(512) 555-1010',
        district: 'Tech District',
      } as CreateCustomerBranchDto;

      const response = await request(app.getHttpServer())
        .post('/api/salon/acme/branches')
        .send(createPayload)
        .expect(HttpStatus.CREATED);

      expectBranchResponse(response, {
        name: 'New Customer Branch',
        customerId: 'customer-1',
      });

      const listResponse = await request(app.getHttpServer())
        .get('/api/salon/acme/branches')
        .expect(HttpStatus.OK);

      expectBranchesList(listResponse, 3);
      const createdBranch = (
        listResponse.body.data.branches as Array<Record<string, unknown>>
      ).find(branch => branch.name === 'New Customer Branch');
      expect(createdBranch?.customerId).toBe('customer-1');
    });

    it('should reject branch creation for non-admin users', async () => {
      setAuthenticatedUser(
        withCustomerContext('customer-1', {
          role: 'CLIENT',
        }),
      );

      const response = await request(app.getHttpServer())
        .post('/api/salon/acme/branches')
        .send({
          name: 'Client Branch Attempt',
          countryCode: 'US',
          street: '101 Main',
          city: 'Dallas',
          stateProvince: 'TX',
          postalCode: '75001',
          phone: '(972) 555-0000',
        })
        .expect(HttpStatus.FORBIDDEN);

      expect(response.body).toEqual({
        status: HttpStatus.FORBIDDEN,
        message: 'Forbidden resource',
      });
    });

    it('should prevent duplicate branch names within the same customer', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const response = await request(app.getHttpServer())
        .post('/api/salon/acme/branches')
        .send({
          name: 'Active Branch 1',
          countryCode: 'US',
          street: 'Duplicate Street',
          city: 'Austin',
          stateProvince: 'TX',
          postalCode: '73301',
          phone: '(512) 555-2020',
        })
        .expect(HttpStatus.CONFLICT);

      expect(response.body).toEqual({
        status: HttpStatus.CONFLICT,
        message: 'Branch with this name already exists',
      });
    });

    it('should update a branch inside customer context', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const updatePayload: UpdateBranchDto = {
        name: 'Updated Branch Name',
        phone: '(11) 98888-1234',
      };

      const response = await request(app.getHttpServer())
        .patch('/api/salon/acme/branches/branch-1')
        .send(updatePayload)
        .expect(HttpStatus.OK);

      expectBranchResponse(response, {
        id: 'branch-1',
        name: 'Updated Branch Name',
        customerId: 'customer-1',
      });

      const updatedBranch = branches.find(branch => branch.id === 'branch-1');
      expect(updatedBranch?.name).toBe('Updated Branch Name');
    });

    it('should reject branch name collisions within customer context on update', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const response = await request(app.getHttpServer())
        .patch('/api/salon/acme/branches/branch-1')
        .send({ name: 'Active Branch 2' })
        .expect(HttpStatus.CONFLICT);

      expect(response.body).toEqual({
        status: HttpStatus.CONFLICT,
        message: 'Branch with this name already exists for this customer',
      });
    });

    it('should return 404 when updating branch outside customer context', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const response = await request(app.getHttpServer())
        .patch('/api/salon/acme/branches/branch-4')
        .send({ name: 'Invalid Update' })
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        status: HttpStatus.NOT_FOUND,
        message: 'Branch with ID branch-4 not found for this customer',
      });
    });

    it('should soft delete a branch in customer context', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      await request(app.getHttpServer())
        .delete('/api/salon/acme/branches/branch-2')
        .expect(HttpStatus.NO_CONTENT);

      const branch = branches.find(candidate => candidate.id === 'branch-2');
      expect(branch?.deletedAt).not.toBeNull();

      const listResponse = await request(app.getHttpServer())
        .get('/api/salon/acme/branches')
        .expect(HttpStatus.OK);

      expectBranchesList(listResponse, 1);
      const branchIds = (
        listResponse.body.data.branches as Array<Record<string, unknown>>
      ).map(item => item.id);
      expect(branchIds).not.toContain('branch-2');
    });

    it('should return 404 when deleting branch outside customer context', async () => {
      setAuthenticatedUser(withCustomerContext('customer-1'));

      const response = await request(app.getHttpServer())
        .delete('/api/salon/acme/branches/branch-4')
        .expect(HttpStatus.NOT_FOUND);

      expect(response.body).toEqual({
        status: HttpStatus.NOT_FOUND,
        message: 'Branch with ID branch-4 not found for this customer',
      });
    });
  });
});
