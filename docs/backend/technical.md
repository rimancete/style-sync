# Backend Technical Documentation

## Overview

StyleSync is a multi-tenant barbershop booking system built with a modular monolithic architecture. The system enables multiple barbershop chains (customers) to manage their locations, staff, services, and appointments through a single codebase with complete data isolation.

**Architecture Type**: Modular Monolith with Customer-Scoped Multi-Tenancy

**Key Architectural Features**:
- **Multi-Tenant Architecture**: Complete customer isolation via URL-based context resolution
- **Dual ID Strategy**: CUID primary keys for security + auto-increment display IDs for UX
- **Soft Delete Pattern**: Non-destructive data removal for critical entities
- **Stateless Design**: JWT-based authentication for horizontal scalability
- **Contract Testing**: Frontend-backend compatibility validation

## Technology Stack

### Core Framework & Language
- **Backend Framework**: NestJS v11.0.1
- **Language**: TypeScript v5.7.3
- **Runtime**: Node.js v18+
- **Package Manager**: npm

### Database & ORM
- **Database**: PostgreSQL 15
- **ORM**: Prisma v6.14.0
- **Migration Strategy**: Prisma Migrate
- **Connection Management**: PrismaClient with lifecycle hooks

### Authentication & Security
- **Authentication**: JWT (JSON Web Tokens)
- **Token Strategy**: Access tokens (1d) + Refresh tokens (7d)
- **Password Hashing**: bcrypt (10 rounds)
- **Authorization**: Role-based access control (CLIENT, STAFF, ADMIN)
- **Rate Limiting**: @nestjs/throttler v6.4.0

### Validation & Documentation
- **Input Validation**: class-validator v0.14.2 + class-transformer v0.5.1
- **API Documentation**: Swagger/OpenAPI (@nestjs/swagger v11.2.0)
- **Schema Validation**: DTOs with decorators

### Testing & Code Quality
- **Testing Framework**: Jest v29.7.0
- **Testing Approach**: Contract testing (API validation)
- **Code Coverage**: jest with coverage reports
- **Linting**: ESLint v9.18.0 with TypeScript support
- **Formatting**: Prettier v3.4.2
- **Git Hooks**: Husky v9.1.7 + lint-staged v16.1.5
- **Commit Standards**: Commitizen + Commitlint (conventional commits)

### Development Tools
- **API Testing**: Postman collection
- **Database Admin**: Prisma Studio
- **Container Management**: Docker Compose
- **File Uploads**: Multer (@types/multer v2.0.0)

## Core Modules

### 1. Database Module

The Database module provides centralized database access using Prisma ORM with lifecycle management and health monitoring.

**Implementation** (`server/src/database/database.service.ts`):

```typescript
import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class DatabaseService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(DatabaseService.name);

  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connection established successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('🔌 Database connection closed');
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }
}
```

**Key Features**:
- Extends PrismaClient for direct database access
- Automatic connection management via NestJS lifecycle hooks
- Query logging for development and debugging
- Health check capability for monitoring
- Graceful shutdown handling

### 2. Authentication Module

JWT-based authentication with support for multi-tenant user registration and refresh token rotation.

**Service Implementation** (`server/src/auth/auth.service.ts`):

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Register a new user or link existing user to a customer
   */
  async registerWithCustomer(
    registerDto: RegisterDto,
    customerSlug: string,
  ): Promise<AuthResponseData> {
    // Validate customer exists and is active
    const customer = await this.db.customer.findUnique({
      where: { urlSlug: customerSlug },
    });

    if (!customer?.isActive) {
      throw new BadRequestException('Customer not found or inactive');
    }

    // Check if user already exists
    const existingUser = await this.db.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      // Link existing user to new customer
      const existingLink = await this.db.userCustomer.findUnique({
        where: {
          userId_customerId: {
            userId: existingUser.id,
            customerId: customer.id,
          },
        },
      });

      if (existingLink) {
        throw new ConflictException('Already registered with this customer');
      }

      // Update user data and create link
      user = await this.db.user.update({
        where: { id: existingUser.id },
        data: {
          name: registerDto.name,
          phone: registerDto.phone,
        },
      });

      await this.db.userCustomer.create({
        data: {
          userId: user.id,
          customerId: customer.id,
        },
      });
    } else {
      // Create new user with password hash
      const passwordHash = await bcrypt.hash(registerDto.password, 10);
      user = await this.db.user.create({
        data: {
          email: registerDto.email,
          password: passwordHash,
          name: registerDto.name,
          phone: registerDto.phone,
        },
      });

      // Link to customer
      await this.db.userCustomer.create({
        data: {
          userId: user.id,
          customerId: customer.id,
        },
      });
    }

    // Generate tokens with customer associations
    const userCustomers = await this.getUserCustomers(user.id);
    const customerIds = userCustomers.map(c => c.id);
    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.role,
      customerIds,
      customer.id,
    );

    return {
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      userId: user.id,
      userName: user.name,
      phone: user.phone,
      customers: userCustomers,
      defaultCustomerId: customer.id,
    };
  }

  private generateTokens(
    userId: string,
    email: string,
    role: string,
    customerIds: string[] = [],
    defaultCustomerId?: string,
  ) {
    const payload = {
      sub: userId,
      email,
      role,
      customerIds,
      defaultCustomerId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.secret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.expiresIn'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.getOrThrow<string>('jwt.refreshSecret'),
      expiresIn: this.configService.getOrThrow<string>('jwt.refreshExpiresIn'),
    });

    return { accessToken, refreshToken };
  }
}
```

**JWT Strategy** (`server/src/auth/strategies/jwt.strategy.ts`):

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role as Role,
      customerIds: payload.customerIds || [],
      defaultCustomerId: payload.defaultCustomerId,
    };
  }
}
```

**Authentication Features**:
- Customer-scoped registration at `/api/salon/:customerSlug/auth/register`
- User can belong to multiple customers (multi-tenant support)
- Existing users can link to new customers
- Password hashing with bcrypt (10 rounds)
- JWT tokens contain customer associations
- Refresh token rotation for security
- Token expiration: 1 day (access), 7 days (refresh)

### 3. Multi-Tenant Customer Module

URL-based customer context resolution with branding configuration and file upload support.

**Customer Context Guard** (`server/src/common/guards/customer-context.guard.ts`):

```typescript
@Injectable()
export class CustomerContextGuard implements CanActivate {
  constructor(
    private readonly db: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Extract customer context from URL pattern: /api/salon/{customerSlug}/...
    const customerSlug = CustomerUrlUtil.extractCustomerSlug(request.url);

    if (!customerSlug) {
      return true; // No customer context - allow for admin/public routes
    }

    // Validate customer slug format
    if (!CustomerUrlUtil.isValidCustomerSlug(customerSlug)) {
      throw new BadRequestException(
        `Invalid customer identifier: ${customerSlug}`,
      );
    }

    // Resolve customer by URL slug
    const customer = await this.db.customer.findUnique({
      where: {
        urlSlug: customerSlug,
        isActive: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer not found: ${customerSlug}`);
    }

    // Validate user has access to this customer
    if (!user.customerIds.includes(customer.id)) {
      throw new ForbiddenException(
        `Access denied to customer: ${customerSlug}`,
      );
    }

    // Set resolved customer context
    user.activeCustomerId = customer.id;
    user.activeCustomerSlug = customerSlug;

    return true;
  }
}
```

**URL Utilities** (`server/src/common/utils/url-customer.util.ts`):

```typescript
export class CustomerUrlUtil {
  private static readonly RESERVED_ROUTES = [
    'admin', 'api', 'health', 'auth', 'docs', 'swagger',
    'about', 'pricing', 'contact', 'terms', 'privacy',
    'login', 'register', 'salon',
  ];

  /**
   * Extract customer slug from URL path
   * Pattern: /api/salon/{customer-slug}/...
   */
  static extractCustomerSlug(urlPath: string): string | null {
    const salonMatch = urlPath.match(/^(?:\/api)?\/salon\/([^/]+)/);
    return salonMatch ? salonMatch[1] : null;
  }

  /**
   * Validate if a slug can be used as a customer identifier
   */
  static isValidCustomerSlug(slug: string): boolean {
    if (this.RESERVED_ROUTES.includes(slug.toLowerCase())) {
      return false;
    }
    const validPattern = /^[a-z0-9-_]+$/i;
    return validPattern.test(slug) && slug.length >= 2 && slug.length <= 50;
  }
}
```

**Multi-Tenant Features**:
- URL-based customer identification: `/api/salon/:customerSlug/*`
- Customer branding configuration (logo, colors, favicons)
- File upload handling for customer assets
- Reserved route protection
- Active customer context injection into requests
- User-customer association validation

### 4. Branches Module

Location management with soft deletes, address validation, and customer-scoped operations.

**Service Implementation** (`server/src/branches/branches.service.ts`):

```typescript
@Injectable()
export class BranchesService {
  constructor(
    private readonly db: DatabaseService,
    private readonly countriesService: CountriesService,
  ) {}

  async create(createBranchDto: CreateBranchDto): Promise<BranchResponseDto> {
    // Validate address format against country rules
    await this.countriesService.validateAddressFormat(
      createBranchDto.countryCode,
      createBranchDto,
    );

    const country = await this.countriesService.findByCode(
      createBranchDto.countryCode,
    );

    const formattedAddress = this.formatAddress(createBranchDto);

    const branch = await this.db.branch.create({
      data: {
        name: createBranchDto.name,
        countryCode: createBranchDto.countryCode,
        street: createBranchDto.street,
        unit: createBranchDto.unit || null,
        district: createBranchDto.district || null,
        city: createBranchDto.city,
        stateProvince: createBranchDto.stateProvince,
        postalCode: createBranchDto.postalCode,
        formattedAddress,
        phone: createBranchDto.phone,
        countryId: country.id,
        customerId: createBranchDto.customerId,
      },
      include: {
        country: true,
        customer: true,
      },
    });

    return this.mapToResponseDto(branch);
  }

  async remove(id: string): Promise<void> {
    const existingBranch = await this.db.branch.findUnique({
      where: { id, deletedAt: null },
      include: {
        professionals: {
          include: {
            professional: true,
          },
        },
        bookings: true,
        servicePricing: true,
      },
    });

    if (!existingBranch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    // Validate no active dependencies
    const activeProfessionals = existingBranch.professionals.filter(
      pb => pb.professional.isActive,
    );
    
    if (activeProfessionals.length > 0) {
      throw new ConflictException(
        'Cannot delete branch with associated professionals',
      );
    }

    // Soft delete the branch
    await this.db.branch.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * Customer-scoped operations
   */
  async findByCustomer(
    customerId: string,
    page = 1,
    limit = 500,
  ): Promise<BranchesListResponseDto> {
    const skip = (page - 1) * limit;

    const [branches, total] = await Promise.all([
      this.db.branch.findMany({
        where: {
          customerId,
          deletedAt: null,
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' },
        include: {
          country: true,
          customer: true,
        },
      }),
      this.db.branch.count({
        where: {
          customerId,
          deletedAt: null,
        },
      }),
    ]);

    return {
      branches: branches.map(branch => this.mapToResponseDto(branch)),
      total,
      page,
      limit,
    };
  }
}
```

**Branch Features**:
- Soft delete with `deletedAt` timestamp
- Address validation against country format rules
- Formatted address generation
- Customer-scoped CRUD operations
- Dependency validation before deletion
- Pagination support

### 5. Professionals Module

Staff management with multi-branch assignments and photo upload capabilities.

**Key Features** (`server/src/professionals/professionals.service.ts`):

```typescript
@Injectable()
export class ProfessionalsService {
  async create(
    createProfessionalDto: CreateProfessionalDto,
  ): Promise<ProfessionalResponseDto> {
    // Validate branch IDs belong to the same customer
    if (createProfessionalDto.branchIds?.length > 0) {
      const branches = await this.db.branch.findMany({
        where: {
          id: { in: createProfessionalDto.branchIds },
          customerId: createProfessionalDto.customerId,
          deletedAt: null,
        },
      });

      if (branches.length !== createProfessionalDto.branchIds.length) {
        throw new BadRequestException(
          'Some branch IDs are invalid or belong to different customers',
        );
      }
    }

    // Create professional with branch associations
    const professional = await this.db.professional.create({
      data: {
        name: createProfessionalDto.name,
        documentId: createProfessionalDto.documentId,
        isActive: createProfessionalDto.isActive ?? true,
        customerId: createProfessionalDto.customerId,
        branches: createProfessionalDto.branchIds
          ? {
              create: createProfessionalDto.branchIds.map(branchId => ({
                branchId,
              })),
            }
          : undefined,
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

    return ProfessionalEntity.fromPrisma(professional);
  }

  async remove(id: string, customerId?: string): Promise<void> {
    await this.findOne(id, customerId);

    // Check for existing bookings
    const bookingsCount = await this.db.booking.count({
      where: { professionalId: id },
    });

    if (bookingsCount > 0) {
      throw new ConflictException(
        'Cannot delete professional with associated bookings',
      );
    }

    // Soft delete by deactivating
    await this.db.professional.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

**Professional Features**:
- Multi-branch assignment via junction table (ProfessionalBranch)
- Active/inactive status management
- Photo upload with file management
- Document ID tracking (e.g., CPF, SSN)
- Customer-scoped operations
- Soft delete via `isActive` flag

### 6. Countries Module

Country and address format management for international support.

**Features**:
- Country code and name storage
- Address format validation rules (JSON schema)
- Used by Branches for address validation
- Supports multiple address formats (US, BR, etc.)

## Multi-Tenant Architecture

### Customer Context Resolution Flow

```
1. Request: GET /api/salon/barbershop-xyz/branches
2. JwtAuthGuard validates authentication
3. CustomerContextGuard extracts "barbershop-xyz"
4. Validates slug format and reserved routes
5. Resolves customer from database
6. Validates user has access to customer
7. Injects activeCustomerId into request context
8. Controller filters data by customerId
```

### Customer-Scoped Endpoint Pattern

**Customer-Specific Endpoints**:
```
GET    /api/salon/:customerSlug/branches
POST   /api/salon/:customerSlug/branches
GET    /api/salon/:customerSlug/branches/:id
PATCH  /api/salon/:customerSlug/branches/:id
DELETE /api/salon/:customerSlug/branches/:id
```

**Admin Endpoints** (cross-customer):
```
GET    /api/branches
POST   /api/branches
GET    /api/branches/:id
PUT    /api/branches/:id
DELETE /api/branches/:id
```

### Data Isolation Strategy

1. **JWT Token Level**: Customer IDs embedded in JWT payload
2. **Guard Level**: CustomerContextGuard validates access
3. **Service Level**: All queries filtered by customerId
4. **Database Level**: Foreign key constraints enforce relationships

## Common Infrastructure

### 1. Response Transformation

All successful API responses are wrapped in a standardized format.

**Interceptor** (`server/src/common/interceptors/response-transform.interceptor.ts`):

```typescript
@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T> | T>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    const request = context.switchToHttp().getRequest<Request>();

    // Skip transformation for health endpoints
    if (request.url.startsWith('/health')) {
      return next.handle() as Observable<T>;
    }

    return next.handle().pipe(
      map((data: T) => ({
        data,
      })),
    );
  }
}
```

**Response Format**:
```typescript
// Success Response
{
  "data": {
    "id": "clg2a5d9i0002gtkb",
    "name": "John Doe",
    // ... other fields
  }
}

// HTTP 204 No Content
// Empty body for successful DELETE operations
```

### 2. Error Handling

Standardized error responses with validation error formatting.

**Exception Filter** (`server/src/common/filters/http-exception.filter.ts`):

```typescript
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // Skip transformation for health endpoints
    if (request.url.startsWith('/health')) {
      const originalResponse = exception.getResponse();
      response.status(status).json(originalResponse);
      return;
    }

    const exceptionResponse = exception.getResponse();
    let apiError: ApiError;

    // Handle validation errors (class-validator)
    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as Record<string, unknown>;

      if (responseObj.message && Array.isArray(responseObj.message)) {
        const errors: Record<string, string[]> = {};
        (responseObj.message as string[]).forEach((msg: string) => {
          const fieldMatch = msg.match(/^(\w+) /);
          const field = fieldMatch ? fieldMatch[1].toLowerCase() : 'general';
          if (!errors[field]) errors[field] = [];
          errors[field].push(msg);
        });

        apiError = {
          status,
          message: 'Validation failed',
          errors,
        };
      } else {
        apiError = {
          status,
          message: (responseObj.message as string) || exception.message,
        };
      }
    } else {
      apiError = {
        status,
        message: exception.message,
      };
    }

    response.status(status).json(apiError);
  }
}
```

**Error Response Formats**:
```typescript
// Simple Error
{
  "status": 404,
  "message": "Branch with ID xyz not found"
}

// Validation Error
{
  "status": 422,
  "message": "Validation failed",
  "errors": {
    "email": ["email must be a valid email address"],
    "password": ["password must be at least 8 characters"]
  }
}
```

### 3. Security Guards

**Guard Hierarchy**:
1. **JwtAuthGuard**: Validates JWT token and extracts user
2. **RolesGuard**: Validates user role (CLIENT, STAFF, ADMIN)
3. **CustomerContextGuard**: Validates customer access
4. **RateLimitGuard**: Throttles request frequency

**JWT Authentication Guard** (`server/src/auth/guards/jwt-auth.guard.ts`):
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

### 4. Validation Pipeline

**Global Configuration** (`server/src/main.ts`):

```typescript
app.useGlobalPipes(
  new ValidationPipe({
    transform: true,           // Transform payloads to DTO instances
    whitelist: true,           // Strip properties not in DTO
    forbidNonWhitelisted: true, // Throw error on unknown properties
    errorHttpStatusCode: 422,  // Use 422 for validation errors
  }),
);
```

**DTO Example**:
```typescript
export class CreateBranchDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  countryCode: string;

  @IsString()
  @IsNotEmpty()
  street: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  @IsPhoneNumber()
  phone: string;
}
```

### 5. Rate Limiting

**Configuration** (`server/src/app.module.ts`):

```typescript
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000,  // 1 minute
    limit: 60,   // 60 requests per minute per IP
  },
  {
    name: 'strict',
    ttl: 60000,  // 1 minute
    limit: 10,   // 10 requests per minute for sensitive endpoints
  },
]),
```

**Rate Limit Tiers**:
- **Default**: 60 requests/minute (general endpoints)
- **Strict**: 10 requests/minute (auth, admin operations)
- **Branding**: 20 requests/minute (public branding endpoints)

## Database Schema Design

### Dual ID Strategy

Every entity in the system has two identifiers for different purposes:

```prisma
model Branch {
  id          String    @id @default(cuid())              // Primary key (security)
  displayId   Int       @default(autoincrement()) @unique // Display ID (UX)
  name        String
  // ... other fields
}
```

**CUID (Primary Key)**:
- **Format**: `clg2a5d9i0002gtkb` (25 characters)
- **Purpose**: Security and API operations
- **Benefits**:
  - Non-enumerable (prevents enumeration attacks)
  - Hides business intelligence (customer count, booking volume)
  - URL-safe and collision-resistant
  - Used in all API endpoints and database relationships

**Display ID (Auto-increment)**:
- **Format**: `42`, `1234`
- **Purpose**: User-friendly references
- **Benefits**:
  - Easy to communicate ("Booking #12345")
  - Natural sorting and ordering
  - Gap analysis for analytics
  - Customer support friendly
  - Enables sequential tracking

**Usage Example**:
```json
{
  "data": {
    "id": "clg2a5d9i0002gtkb",
    "displayId": 42,
    "name": "Downtown Barbershop",
    "createdAt": "2025-10-11T10:30:00.000Z"
  }
}
```

### Core Entities

**Customer** (Multi-Tenant Parent):
```prisma
model Customer {
  id          String @id @default(cuid())
  displayId   Int    @default(autoincrement()) @unique
  name        String
  urlSlug     String @unique  // URL identifier: /salon/:urlSlug/...

  // Branding Configuration
  documentTitle   String @default("")
  logoUrl     String?
  logoAlt     String @default("")
  favicon32x32  String?
  favicon16x16  String?
  appleTouch    String?

  // Theme Colors (Light theme)
  primaryMain     String @default("#272726FF")
  primaryLight    String @default("#706E6DFF")
  primaryDark     String @default("#1B1B1BFF")
  primaryContrast String @default("#ECE8E6FF")
  
  secondaryMain     String @default("#8D8C8BFF")
  secondaryLight    String @default("#E7E7E6FF")
  secondaryDark     String @default("#3B3B3BFF")
  secondaryContrast String @default("#1B1B1BFF")
  
  backgroundColor String @default("#F7F7F7FF")

  isActive    Boolean @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relationships
  branches      Branch[]
  services      Service[]
  users         UserCustomer[]
  professionals Professional[]

  @@map("customers")
}
```

**Branch** (Locations with Soft Delete):
```prisma
model Branch {
  id               String   @id @default(cuid())
  displayId        Int      @default(autoincrement()) @unique
  name             String
  phone            String
  
  // Address Fields
  countryCode      String
  street           String
  unit             String?
  district         String?
  city             String
  stateProvince    String
  postalCode       String
  formattedAddress String
  
  // Soft Delete
  deletedAt        DateTime?
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Relationships
  countryId        String
  customerId       String
  country          Country              @relation(fields: [countryId], references: [id])
  customer         Customer             @relation(fields: [customerId], references: [id])
  bookings         Booking[]
  professionals    ProfessionalBranch[]
  servicePricing   ServicePricing[]

  @@map("branches")
}
```

**Professional** (Staff Management):
```prisma
model Professional {
  id         String    @id @default(cuid())
  displayId  Int       @default(autoincrement()) @unique
  name       String
  documentId String?   // CPF, SSN, etc.
  photoUrl   String?
  isActive   Boolean   @default(true)
  customerId String
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt
  
  bookings   Booking[]
  customer   Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  branches   ProfessionalBranch[]

  @@unique([documentId, customerId])
  @@map("professionals")
}

model ProfessionalBranch {
  id             String       @id @default(cuid())
  displayId      Int          @default(autoincrement()) @unique
  professionalId String
  branchId       String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)
  branch         Branch       @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@unique([professionalId, branchId])
  @@map("professional_branches")
}
```

**User** (Multi-Customer Support):
```prisma
model User {
  id        String    @id @default(cuid())
  displayId Int       @default(autoincrement()) @unique
  email     String    @unique
  password  String
  name      String
  phone     String?
  role      UserRole  @default(CLIENT)
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  
  bookings  Booking[]
  customers UserCustomer[]

  @@map("users")
}

model UserCustomer {
  id         String   @id @default(cuid())
  displayId  Int      @default(autoincrement()) @unique
  userId     String
  customerId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@unique([userId, customerId])
  @@map("user_customers")
}

enum UserRole {
  CLIENT   // End users booking appointments
  STAFF    // Branch staff members
  ADMIN    // System administrators
}
```

**Country** (Address Validation):
```prisma
model Country {
  id            String   @id @default(cuid())
  displayId     Int      @default(autoincrement()) @unique
  code          String   @unique  // ISO country code (US, BR, etc.)
  name          String
  addressFormat Json     // JSON schema for address validation
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  branches      Branch[]

  @@map("countries")
}
```

### Future Entities (Planned)

**Service** (Service Catalog):
```prisma
model Service {
  id          String           @id @default(cuid())
  displayId   Int              @default(autoincrement()) @unique
  name        String
  description String?
  duration    Int              // Duration in minutes
  customerId  String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  customer    Customer         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  bookings    Booking[]
  pricing     ServicePricing[]

  @@map("services")
}

model ServicePricing {
  id        String   @id @default(cuid())
  displayId Int      @default(autoincrement()) @unique
  serviceId String
  branchId  String
  price     Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  service   Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  branch    Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@unique([serviceId, branchId])
  @@map("service_pricing")
}
```

**Booking** (Appointments):
```prisma
model Booking {
  id             String        @id @default(cuid())
  displayId      Int           @default(autoincrement()) @unique
  userId         String
  branchId       String
  serviceId      String
  professionalId String?       // NULL = "any available professional"
  scheduledAt    DateTime
  status         BookingStatus @default(PENDING)
  totalPrice     Decimal       @db.Decimal(10, 2)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  professional   Professional? @relation(fields: [professionalId], references: [id])
  service        Service       @relation(fields: [serviceId], references: [id])
  branch         Branch        @relation(fields: [branchId], references: [id], onDelete: Cascade)
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("bookings")
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

### Soft Delete Pattern

**Implementation**:
- `deletedAt` field (nullable DateTime)
- All queries filter by `deletedAt: null`
- DELETE operations set `deletedAt: new Date()`
- Prevents accidental data loss
- Enables data recovery and audit trails

**Query Example**:
```typescript
const branches = await this.db.branch.findMany({
  where: {
    customerId,
    deletedAt: null,  // Only active branches
  },
});
```

## Configuration Management

### Environment Configuration

**Configuration Factory** (`server/src/config/configuration.ts`):

```typescript
export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',

  database: {
    url: process.env.DATABASE_URL,
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  health: {
    enabled: process.env.HEALTH_CHECK_ENABLED === 'true' || true,
    databaseTimeout: parseInt(
      process.env.HEALTH_CHECK_DATABASE_TIMEOUT || '5000',
      10,
    ),
  },

  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true' || true,
    title: process.env.SWAGGER_TITLE || 'StyleSync API',
    description: process.env.SWAGGER_DESCRIPTION || 
      'Multi-location barbershop booking system API',
    version: process.env.SWAGGER_VERSION || '1.0',
  },

  rateLimit: {
    defaultTtl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    defaultLimit: parseInt(process.env.RATE_LIMIT_DEFAULT || '60', 10),
    brandingTtl: parseInt(process.env.RATE_LIMIT_BRANDING_TTL || '60000', 10),
    brandingLimit: parseInt(process.env.RATE_LIMIT_BRANDING || '20', 10),
    adminTtl: parseInt(process.env.RATE_LIMIT_ADMIN_TTL || '60000', 10),
    adminLimit: parseInt(process.env.RATE_LIMIT_ADMIN || '5', 10),
  },
});
```

### Environment Variables

**Required Variables** (`.env`):

```env
# Database
DATABASE_URL="postgresql://stylesync:5&cT_5;j!c@localhost:5433/stylesync"

# Application
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Health Check
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_DATABASE_TIMEOUT=5000

# API Documentation
SWAGGER_ENABLED=true
SWAGGER_TITLE="StyleSync API"
SWAGGER_DESCRIPTION="Multi-location barbershop booking system API"
SWAGGER_VERSION="1.0"

# Rate Limiting
RATE_LIMIT_TTL=60000
RATE_LIMIT_DEFAULT=60
RATE_LIMIT_BRANDING=20
RATE_LIMIT_ADMIN=5
```

## Deployment Architecture

### Docker Configuration

**Docker Compose** (`docker/docker-compose.yml`):

```yaml
version: '3.7'

services:
  postgres:
    image: postgres:15
    container_name: stylesync-postgres-dev
    restart: "no"  # Manual startup only
    environment:
      POSTGRES_DB: stylesync
      POSTGRES_USER: stylesync
      POSTGRES_PASSWORD: 5&cT_5;j!c
    ports:
      - "5433:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - stylesync-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U stylesync -d stylesync"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
    driver: local

networks:
  stylesync-network:
    driver: bridge
```

**Container Features**:
- PostgreSQL 15 with persistent volumes
- Health check monitoring
- Manual startup (no auto-restart)
- Project-scoped naming: `stylesync-postgres-dev`
- Port 5433 to avoid conflicts

**Start Database**:
```bash
docker compose -f docker/docker-compose.yml up -d
```

### Application Bootstrap

**Main Application** (`server/src/main.ts`):

```typescript
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable CORS
  app.enableCors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });

  // Serve static files from uploads directory
  const uploadsPath =
    process.env.NODE_ENV === 'production'
      ? join(__dirname, '..', 'uploads')
      : join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadsPath, {
    prefix: '/uploads/',
  });

  // Global API prefix
  app.setGlobalPrefix('api');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    }),
  );

  // Global response transform interceptor
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation setup
  if (
    process.env.SWAGGER_ENABLED === 'true' ||
    process.env.NODE_ENV === 'development'
  ) {
    const config = new DocumentBuilder()
      .setTitle(process.env.SWAGGER_TITLE || 'StyleSync API')
      .setDescription(
        process.env.SWAGGER_DESCRIPTION ||
          'Multi-location barbershop booking system API',
      )
      .setVersion(process.env.SWAGGER_VERSION || '1.0')
      .addTag('Health & Monitoring', 'Application and system health endpoints')
      .addTag('Authentication', 'User authentication and authorization')
      .addTag('Branches', 'Branch/location management')
      .addTag('Professionals', 'Staff management')
      .addTag('Services', 'Service catalog and pricing')
      .addTag('Bookings', 'Appointment booking system')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'StyleSync API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    });

    logger.log('📚 Swagger documentation is available at: /api/docs');
  }

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);

  logger.log(`🚀 StyleSync API is running on: http://localhost:${port}/api`);
}

void bootstrap();
```

**Bootstrap Features**:
- CORS configuration for frontend
- Static file serving for uploads
- Global `/api` prefix
- Validation pipeline
- Response transformation
- Exception handling
- Swagger documentation (dev/staging only)
- Health check endpoints

## Testing Strategy

### Contract Testing Approach

StyleSync uses contract testing as the primary testing strategy to validate frontend-backend compatibility.

**Test Statistics** (as of October 11, 2025):
- ✅ 82 tests passing
- ✅ 9 test suites
- ✅ All modules covered

**Test Suites**:
1. `health.contract.test.ts` - Health check API contracts
2. `countries.contract.test.ts` - Countries API contracts
3. `customers.contract.test.ts` - Customer branding API contracts
4. `customers.rate-limit.test.ts` - Rate limiting validation
5. `customers.upload.contract.test.ts` - File upload contracts
6. `auth.contract.test.ts` - Authentication API contracts
7. `branches.contract.test.ts` - Branch management contracts
8. `professionals.contract.test.ts` - Professional management contracts (25 tests)
9. `app.controller.test.ts` - Application controller tests

**Testing Principles**:
- ✅ Contract testing over verbose unit tests
- ✅ Deterministic over random test data
- ✅ Frontend-focused: API contract validation over implementation details
- ✅ Reusable test utilities: Centralized helpers in `src/testing/helpers/`
- 🔄 Property-based testing: Reserved for complex booking logic (future)
- 🔄 Mutation testing: Planned for CI/CD pipeline

### Test File Naming Convention

- `*.contract.test.ts` - API contract validation
- `*.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.e2e-spec.ts` - End-to-end tests

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test:ci

# Run specific test suite
npm test -- branches.contract.test

# Run tests in watch mode
npm test -- --watch
```

## Development Workflow

### Local Development Setup

**Initial Setup**:
```bash
# 1. Clone repository
git clone <repository-url>
cd style-sync

# 2. Start database
docker compose -f docker/docker-compose.yml up -d

# 3. Install dependencies
cd server
npm install

# 4. Configure environment
cp env.template .env
# Edit .env with your settings

# 5. Run migrations
npm run prisma:migrate

# 6. Seed development data
npm run prisma:seed

# 7. Start development server
npm run start:dev
```

**Available Commands** (`server/package.json`):

```bash
# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger

# Building
npm run build              # Build for production
npm run start:prod         # Run production build

# Database
npm run prisma:generate    # Generate Prisma client
npm run prisma:migrate     # Create and apply migrations
npm run prisma:seed        # Seed development data
npm run prisma:studio      # Open Prisma Studio (GUI)
npm run db:reset          # Reset database (⚠️ deletes all data)

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run lint:check         # Check lint errors only
npm run format             # Run Prettier formatting
npm run format:check       # Check formatting only

# Testing
npm test                   # Run all tests
npm run test:ci            # Run with coverage
npm run test:debug         # Debug tests
npm run test:e2e           # Run E2E tests

# Git & Commits
npm run commit             # Interactive commit with Commitizen
npm run commit:retry       # Retry last commit
npm run validate:commit    # Validate commit message

# Environment
npm run env:validate       # Validate .env file
```

### Database Migration Workflow

**Creating Migrations**:
```bash
# 1. Modify schema in prisma/schema.prisma
# 2. Create migration
npm run prisma:migrate

# 3. Migration will be created in prisma/migrations/
# 4. Update seed data if needed (prisma/seed.ts)
# 5. Re-seed database
npm run prisma:seed
```

**Migration Best Practices**:
- Always test migrations locally before committing
- Write descriptive migration names
- Update seed data to match schema changes
- Document breaking changes in migration files

### Code Quality Standards

**ESLint Configuration**:
- TypeScript strict mode enabled
- No `any` types (use proper typing)
- Consistent naming conventions
- Import organization
- Unused variables detection

**Prettier Configuration**:
- 2-space indentation
- Single quotes
- Trailing commas
- 80-character line width (flexible)

**Pre-commit Hooks** (Husky + lint-staged):
```json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md,yml,yaml}": [
    "prettier --write"
  ]
}
```

**Commit Message Format** (Commitizen + Commitlint):
```
type(scope): description

Examples:
feat(auth): add JWT authentication
fix(booking): resolve availability calculation bug
docs(api): update endpoint documentation
refactor(health): improve error handling
test(users): add integration tests
```

**Commit Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

## API Structure

### Endpoint Patterns

**Global Prefix**: All endpoints are prefixed with `/api`

**Public Endpoints**:
```
GET  /api/health                   # Basic health check
GET  /api/health/database          # Database connectivity
GET  /api/health/detailed          # Comprehensive system status
```

**Authentication Endpoints**:
```
POST /api/auth/login               # User login
POST /api/auth/refresh             # Refresh access token
POST /api/salon/:customerSlug/auth/register  # Customer-scoped registration
```

**Customer-Scoped Endpoints**:
```
# Branding
GET  /api/salon/:customerSlug/branding
PATCH /api/salon/:customerSlug/branding
POST /api/salon/:customerSlug/branding/logo
DELETE /api/salon/:customerSlug/branding/logo

# Branches
GET    /api/salon/:customerSlug/branches
POST   /api/salon/:customerSlug/branches
GET    /api/salon/:customerSlug/branches/:id
PATCH  /api/salon/:customerSlug/branches/:id
DELETE /api/salon/:customerSlug/branches/:id

# Professionals (future)
GET  /api/salon/:customerSlug/professionals
POST /api/salon/:customerSlug/professionals
```

**Admin Endpoints** (cross-customer):
```
# Countries
GET  /api/countries
POST /api/countries
GET  /api/countries/:code

# Branches (admin)
GET    /api/branches
POST   /api/branches
GET    /api/branches/:id
PUT    /api/branches/:id
DELETE /api/branches/:id

# Professionals (admin)
GET    /api/professionals
POST   /api/professionals
GET    /api/professionals/:id
PUT    /api/professionals/:id
DELETE /api/professionals/:id
```

### Response Formats

**Success Response** (HTTP 200, 201):
```json
{
  "data": {
    "id": "clg2a5d9i0002gtkb",
    "displayId": 42,
    "name": "Downtown Barbershop",
    "createdAt": "2025-10-11T10:30:00.000Z"
  }
}
```

**List Response** (HTTP 200):
```json
{
  "data": {
    "branches": [...],
    "total": 25,
    "page": 1,
    "limit": 500
  }
}
```

**No Content** (HTTP 204):
```
// Empty body for successful DELETE operations
```

**Error Response** (HTTP 4xx, 5xx):
```json
{
  "status": 404,
  "message": "Branch with ID xyz not found"
}
```

**Validation Error** (HTTP 422):
```json
{
  "status": 422,
  "message": "Validation failed",
  "errors": {
    "email": ["email must be a valid email address"],
    "password": ["password must be at least 8 characters"]
  }
}
```

**Field Naming Convention**: All fields use `camelCase` consistently across the API.

## Future Modules (Planned)

### Services Module

**Features**:
- Service catalog management
- Location-based pricing via ServicePricing entity
- Customer-scoped service definitions
- Service duration tracking (minutes)
- Service descriptions and metadata

**Endpoints** (planned):
```
GET  /api/salon/:customerSlug/services
POST /api/salon/:customerSlug/services
GET  /api/salon/:customerSlug/services/:id
PATCH /api/salon/:customerSlug/services/:id
DELETE /api/salon/:customerSlug/services/:id

# Branch-specific pricing
GET  /api/salon/:customerSlug/branches/:branchId/services
POST /api/salon/:customerSlug/services/:serviceId/pricing
```

**Implementation Considerations**:
- Services belong to customers (multi-tenant)
- Pricing varies by branch location
- Single pricing per service-branch combination
- Duration affects availability calculation

### Bookings Module

**Features**:
- Appointment booking system
- Professional selection (specific or "any available")
- Time slot availability calculation
- Booking status lifecycle management
- Price calculation based on branch-specific pricing

**Business Rules**:
- Single service per booking (simplified logic)
- Optional professional selection (`professionalId: null` = any available)
- Status progression: PENDING → CONFIRMED → COMPLETED
- Cancellation support (CANCELLED status)

**Endpoints** (planned):
```
POST /api/salon/:customerSlug/bookings
GET  /api/salon/:customerSlug/bookings/my
GET  /api/salon/:customerSlug/bookings/:id
PATCH /api/salon/:customerSlug/bookings/:id
DELETE /api/salon/:customerSlug/bookings/:id

# Availability
GET  /api/salon/:customerSlug/branches/:branchId/availability
```

**Implementation Considerations**:
- Complex availability calculation logic
- Professional scheduling conflicts
- Branch operating hours (future)
- Time zone handling
- Concurrent booking prevention
- Booking confirmation workflows

## Scaling Considerations

### Horizontal Scaling

**Stateless Application Design**:
- JWT tokens contain all necessary user context
- No server-side session storage
- Each request is self-contained
- Load balancer compatible

**Docker Containerization**:
- Application is containerizable
- Database runs in separate container
- Environment-based configuration
- Health check endpoints for orchestration

**Deployment Strategies**:
- Multiple application instances behind load balancer
- Shared PostgreSQL database or read replicas
- Static file storage can be moved to CDN (S3, CloudFront)
- File uploads can use object storage services

**Load Balancer Configuration**:
```
Client → Load Balancer → [App Instance 1]
                      → [App Instance 2]
                      → [App Instance 3]
                           ↓
                    PostgreSQL Database
```

### Performance Optimization

**Database Indexing**:
- CUID primary keys are indexed by default
- Display IDs have unique indexes
- Foreign keys are automatically indexed
- Custom indexes on frequently queried fields:
  - `customer.urlSlug` (unique index)
  - `user.email` (unique index)
  - `branch.customerId` + `branch.deletedAt` (composite)
  - `professional.customerId` + `professional.isActive` (composite)

**Query Optimization**:
- Prisma query optimization with `include` and `select`
- Pagination on all list endpoints (default limit: 500-1000)
- Soft delete filtering at query level
- Avoid N+1 queries with proper includes
- Use transactions for multi-step operations

**Connection Pooling**:
- Prisma manages connection pool automatically
- Default pool size: calculated based on system resources
- Configure via DATABASE_URL parameters:
  ```
  ?connection_limit=10&pool_timeout=20
  ```

**Caching Opportunities** (future with Redis):
- Customer branding configuration (infrequent changes)
- Country/address format data (static)
- Service catalog per customer (cache invalidation on update)
- JWT token blacklist for logout (if implemented)
- Rate limiting counters

**File Upload Optimization**:
- Current: Local filesystem (`uploads/` directory)
- Future: Object storage (S3, GCS, Azure Blob)
- Separate static file serving from application
- CDN for customer branding assets
- Image optimization and resizing

### Monitoring and Observability

**Health Check Endpoints**:
```typescript
GET /api/health          // Basic application health
GET /api/health/database // Database connectivity check
GET /api/health/detailed // Comprehensive system status
```

**Health Check Response**:
```json
{
  "status": "ok",
  "info": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy"
    }
  },
  "error": {},
  "details": {
    "database": {
      "status": "up",
      "message": "Database connection is healthy"
    }
  }
}
```

**Logging Strategy**:
- NestJS built-in Logger for application logs
- Prisma query logging (enabled in development)
- HTTP request/response logging (middleware)
- Error stack traces in development
- Structured JSON logging in production (future)

**Future Monitoring Enhancements**:
- **Application Performance Monitoring (APM)**:
  - New Relic, DataDog, or Elastic APM
  - Request tracing and performance metrics
  - Database query performance analysis
  
- **Centralized Logging**:
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Log aggregation from multiple instances
  - Searchable and filterable logs
  
- **Metrics Collection**:
  - Prometheus for metrics collection
  - Grafana for visualization
  - Custom business metrics (bookings/day, customer growth)
  
- **Error Tracking**:
  - Sentry for error tracking and alerting
  - Stack trace analysis
  - User impact assessment

### Database Scaling

**Read Replicas**:
- PostgreSQL read replicas for read-heavy operations
- Route read queries to replicas
- Keep writes on primary database
- Eventual consistency considerations

**Query Optimization**:
- EXPLAIN ANALYZE for slow queries
- Index optimization based on query patterns
- Materialized views for complex aggregations
- Partial indexes for soft-deleted data

**Database Partitioning** (future):
- Partition bookings by date range
- Partition by customer for extreme multi-tenancy
- Improves query performance on large tables

**Backup and Recovery**:
- Automated daily backups
- Point-in-time recovery capability
- Backup retention policy (30 days recommended)
- Disaster recovery procedures

## Code Quality and Standards

### TypeScript Guidelines

**Strict Typing**:
```typescript
// ❌ Avoid any types
function processData(data: any) { ... }

// ✅ Use proper typing
function processData(data: CreateBranchDto): Promise<BranchResponseDto> { ... }
```

**Interface and Type Definitions**:
```typescript
// Define clear interfaces
export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: Role;
  customerIds: string[];
  defaultCustomerId?: string;
  activeCustomerId?: string;
  activeCustomerSlug?: string;
}
```

**SOLID Principles**:
- **Single Responsibility**: Each service has one clear purpose
- **Open/Closed**: Use DTOs and interfaces for extensibility
- **Liskov Substitution**: Interfaces can be swapped without breaking
- **Interface Segregation**: Small, focused interfaces
- **Dependency Inversion**: Depend on abstractions (interfaces)

**Error Handling**:
```typescript
// Throw specific NestJS exceptions
throw new NotFoundException(`Branch with ID ${id} not found`);
throw new ConflictException('Branch with this name already exists');
throw new BadRequestException('Invalid customer identifier');
throw new ForbiddenException('Access denied to customer');
```

**JSDoc Documentation**:
```typescript
/**
 * Register a new user or link existing user to a customer
 * @param registerDto - User registration data
 * @param customerSlug - Customer URL slug
 * @returns Authentication response with tokens and customer data
 */
async registerWithCustomer(
  registerDto: RegisterDto,
  customerSlug: string,
): Promise<AuthResponseData> { ... }
```

### Testing Requirements

**Contract Test Structure**:
```typescript
describe('Branches API Contract', () => {
  describe('GET /api/salon/:customerSlug/branches', () => {
    it('should return paginated list of branches', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/salon/${customer.urlSlug}/branches`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('branches');
      expect(response.body.data).toHaveProperty('total');
      expect(Array.isArray(response.body.data.branches)).toBe(true);
    });
  });
});
```

**Deterministic Test Data**:
```typescript
// ✅ Use consistent, predictable test data
const testUser = {
  email: 'test@example.com',
  password: 'Test123!@#',
  name: 'Test User',
};

// ❌ Avoid random or generated data in contracts
const testUser = {
  email: faker.internet.email(),  // Non-deterministic
  password: randomBytes(10),      // Non-deterministic
};
```

**Test Coverage Goals**:
- All API endpoints have contract tests
- Core business logic has unit tests
- Critical user flows have E2E tests
- Minimum 80% code coverage (aspirational)

### Commit Conventions

**Commitizen Integration**:
```bash
# Use interactive commit tool
npm run commit

# Or use git commit directly (triggers Commitizen)
git commit
```

**Commit Message Format**:
```
type(scope): short description

[optional body]

[optional footer]
```

**Examples**:
```
feat(auth): add JWT refresh token rotation
fix(branches): resolve soft delete filter bug
docs(api): update authentication flow documentation
refactor(database): optimize query performance
test(professionals): add multi-branch assignment tests
chore(deps): update NestJS to v11.0.1
```

**Pre-commit Validation**:
- Runs ESLint and Prettier
- Validates TypeScript compilation
- Runs affected tests (optional)
- Validates commit message format

## Production Deployment

### Build Process

**Production Build**:
```bash
# 1. Install dependencies
npm ci  # Clean install from package-lock.json

# 2. Generate Prisma Client
npm run prisma:generate

# 3. Build TypeScript
npm run build

# 4. Run database migrations
DATABASE_URL="postgresql://..." npm run prisma:migrate

# 5. Start production server
NODE_ENV=production npm run start:prod
```

**Build Artifacts**:
- Compiled JavaScript in `dist/` directory
- Prisma Client generated in `node_modules/.prisma/client`
- Source maps for debugging (optional in production)

### Production Configuration

**Environment Variables** (production):

```env
# Application
NODE_ENV=production
PORT=3001

# Database (use production credentials)
DATABASE_URL="postgresql://user:password@db-host:5432/stylesync?sslmode=require"

# JWT (use strong secrets)
JWT_SECRET="<generated-256-bit-secret>"
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET="<generated-256-bit-secret>"
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CLIENT_ORIGIN="https://your-domain.com"

# API Documentation (disable in production)
SWAGGER_ENABLED=false

# Health Checks
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_DATABASE_TIMEOUT=5000

# Rate Limiting (adjust based on traffic)
RATE_LIMIT_TTL=60000
RATE_LIMIT_DEFAULT=100
RATE_LIMIT_BRANDING=50
RATE_LIMIT_ADMIN=10
```

**Security Considerations**:
- Use strong, randomly generated JWT secrets (256-bit minimum)
- Enable SSL/TLS for database connections (`?sslmode=require`)
- Disable Swagger in production (`SWAGGER_ENABLED=false`)
- Use environment-specific credentials
- Enable CORS only for trusted origins
- Consider WAF (Web Application Firewall)
- Regular security updates for dependencies

**Database Connection Pooling**:
```
postgresql://user:pass@host:5432/db?connection_limit=20&pool_timeout=30
```

**Performance Tuning**:
- Increase rate limits based on actual traffic patterns
- Optimize database connection pool size
- Enable response compression (gzip)
- Use process managers (PM2, systemd) for resilience
- Set up application monitoring and alerting

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Database backups configured
- [ ] SSL/TLS certificates installed
- [ ] Health check endpoints verified
- [ ] Rate limiting tested
- [ ] Error tracking configured (Sentry)
- [ ] Logging configured
- [ ] Monitoring dashboards set up
- [ ] Load balancer configured (if applicable)
- [ ] Static file serving optimized
- [ ] CORS origins configured
- [ ] Swagger disabled
- [ ] Security headers configured
- [ ] Database connection pooling optimized

## Additional Resources

**Documentation**:
- API Documentation: http://localhost:3001/api/docs (development)
- Postman Collection: `docs/backend/postman-collection.json`
- Architecture Diagram: `docs/backend/architecture.mermaid`
- Business Rules: `docs/businessRules.md`

**Development Tools**:
- Prisma Studio: `npm run prisma:studio`
- Database logs: `docker logs stylesync-postgres-dev`
- Coverage reports: `server/coverage/lcov-report/index.html`

**External Documentation**:
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- PostgreSQL: https://www.postgresql.org/docs
- JWT: https://jwt.io/introduction
