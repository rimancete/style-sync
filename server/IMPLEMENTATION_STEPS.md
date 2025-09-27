# StyleSync Backend Implementation Plan

## Project Overview

StyleSync is a multi-location barbershop booking system with the following key requirements:

- **Customer-Scoped**: Complete customer-scoped management. One single code base, multiple clients.
- **Multi-branch**: Multiple branch locations ("Unidade 1", "Unidade 2")
- **Professional selection**: Clients can choose specific professionals or "any available"
- **Single service booking**: One service per appointment (simplified business logic)
- **Location-based pricing**: Same services can have different prices per branch
- **Multilingual support**: Primary Portuguese, expandable to other languages

## Architecture Decisions

### Technology Stack

- **Backend**: NestJS + TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens
- **Development Database**: Docker Compose
- **API Documentation**: Swagger/OpenAPI + Postman collection
- **Validation**: class-validator + class-transformer

### Business Logic Clarifications

1. **Professional Preferences**: Clients can book "any available professional" (professionalId = null)
2. **Service Combinations**: Single service per booking (no complex multi-service logic)
3. **Pricing Strategy**: Location-specific pricing for services
4. **Cancellation Rules**: Deferred to future implementation

## Database Schema Design

### Core Entities

```prisma
model Country {
  id            String   @id @default(cuid())
  code          String   @unique
  name          String
  addressFormat Json
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  branches      Branch[]

  @@map("countries")
}

model Customer {
  id          String @id @default(cuid())
  name        String
  urlSlug     String @unique

  // Branding Configuration
  documentTitle   String @default("")
  logoUrl     String?
  logoAlt     String @default("")

  // Favicons
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

model Branch {
  id               String           @id @default(cuid())
  name             String
  phone            String
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt
  deletedAt        DateTime?
  countryCode      String
  street           String
  unit             String?
  district         String?
  city             String
  stateProvince    String
  postalCode       String
  formattedAddress String
  countryId        String
  customerId       String
  country          Country          @relation(fields: [countryId], references: [id])
  customer         Customer         @relation(fields: [customerId], references: [id])
  bookings         Booking[]
  professionals    Professional[]
  servicePricing   ServicePricing[]

  @@map("branches")
}

model Professional {
  id        String    @id @default(cuid())
  name      String
  photoUrl  String?
  isActive  Boolean   @default(true)
  branchId  String
  customerId String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  bookings  Booking[]
  branch    Branch    @relation(fields: [branchId], references: [id], onDelete: Cascade)
  customer  Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@map("professionals")
}

model Service {
  id          String           @id @default(cuid())
  name        String
  description String?
  duration    Int
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

model User {
  id        String    @id @default(cuid())
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
  userId     String
  customerId String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  customer   Customer @relation(fields: [customerId], references: [id], onDelete: Cascade)

  @@unique([userId, customerId])
  @@map("user_customers")
}

model Booking {
  id             String        @id @default(cuid())
  userId         String
  branchId       String
  serviceId      String
  professionalId String?
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

enum UserRole {
  CLIENT
  STAFF
  ADMIN
}

enum BookingStatus {
  PENDING
  CONFIRMED
  COMPLETED
  CANCELLED
}
```

## Core directory Structure

```
├── docker/
│   ├── docker-compose.yml 🚫 (auto-hidden)
│   └── init.sql 🚫 (auto-hidden)
├── server/
│   ├── .husky/ 🚫 (auto-hidden)
│   ├── coverage/ 🚫 (auto-hidden)
│   ├── dist/ 🚫 (auto-hidden)
│   ├── docs/
│   │   └── ENVIRONMENT_SETUP.md 🚫 (auto-hidden)
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma 🚫 (auto-hidden)
│   │   └── seed.ts 🚫 (auto-hidden)
│   ├── src/
│   │   ├── auth/
│   │   │   ├── dto/
│   │   │   │   ├── auth-response.dto.ts 🚫 (auto-hidden)
│   │   │   │   ├── login.dto.ts 🚫 (auto-hidden)
│   │   │   │   ├── register.dto.ts 🚫 (auto-hidden)
│   │   │   │   └── token.dto.ts 🚫 (auto-hidden)
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts 🚫 (auto-hidden)
│   │   │   │   └── roles.guard.ts 🚫 (auto-hidden)
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts 🚫 (auto-hidden)
│   │   │   ├── auth.contract.test.ts 🚫 (auto-hidden)
│   │   │   ├── auth.controller.ts 🚫 (auto-hidden)
│   │   │   ├── auth.module.ts 🚫 (auto-hidden)
│   │   │   └── auth.service.ts 🚫 (auto-hidden)
│   │   ├── branches/
│   │   │   ├── dto/
│   │   │   │   ├── branch-response.dto.ts 🚫 (auto-hidden)
│   │   │   │   ├── create-branch.dto.ts 🚫 (auto-hidden)
│   │   │   │   ├── create-customer-branch.dto.ts 🚫 (auto-hidden)
│   │   │   │   └── update-branch.dto.ts 🚫 (auto-hidden)
│   │   │   ├── entities/
│   │   │   │   └── branch.entity.ts 🚫 (auto-hidden)
│   │   │   ├── branches.contract.test.ts 🚫 (auto-hidden)
│   │   │   ├── branches.controller.ts 🚫 (auto-hidden)
│   │   │   ├── branches.module.ts 🚫 (auto-hidden)
│   │   │   └── branches.service.ts 🚫 (auto-hidden)
│   │   ├── common/
│   │   │   ├── decorators/
│   │   │   │   ├── public.decorator.ts 🚫 (auto-hidden)
│   │   │   │   ├── rate-limit.decorator.ts 🚫 (auto-hidden)
│   │   │   │   ├── roles.decorator.ts 🚫 (auto-hidden)
│   │   │   │   └── user.decorator.ts 🚫 (auto-hidden)
│   │   │   ├── filters/
│   │   │   │   └── http-exception.filter.ts 🚫 (auto-hidden)
│   │   │   ├── guards/
│   │   │   │   ├── customer-context.guard.ts 🚫 (auto-hidden)
│   │   │   │   └── rate-limit.guard.ts 🚫 (auto-hidden)
│   │   │   ├── interceptors/
│   │   │   │   └── response-transform.interceptor.ts 🚫 (auto-hidden)
│   │   │   ├── interfaces/
│   │   │   │   └── api-response.interface.ts 🚫 (auto-hidden)
│   │   │   ├── pipes/
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts 🚫 (auto-hidden)
│   │   │   └── utils/
│   │   │       └── url-customer.util.ts 🚫 (auto-hidden)
│   │   ├── config/
│   │   │   └── configuration.ts 🚫 (auto-hidden)
│   │   ├── countries/
│   │   │   ├── dto/
│   │   │   │   ├── country-response.dto.ts 🚫 (auto-hidden)
│   │   │   │   ├── create-country.dto.ts 🚫 (auto-hidden)
│   │   │   │   └── update-country.dto.ts 🚫 (auto-hidden)
│   │   │   ├── entities/
│   │   │   │   └── country.entity.ts 🚫 (auto-hidden)
│   │   │   ├── countries.contract.test.ts 🚫 (auto-hidden)
│   │   │   ├── countries.controller.ts 🚫 (auto-hidden)
│   │   │   ├── countries.module.ts 🚫 (auto-hidden)
│   │   │   └── countries.service.ts 🚫 (auto-hidden)
│   │   ├── customers/
│   │   │   ├── dto/
│   │   │   │   ├── customer-branding.response.dto.ts 🚫 (auto-hidden)
│   │   │   │   └── update-customer-branding.dto.ts 🚫 (auto-hidden)
│   │   │   ├── entities/
│   │   │   │   └── customer.entity.ts 🚫 (auto-hidden)
│   │   │   ├── customers.contract.test.ts 🚫 (auto-hidden)
│   │   │   ├── customers.controller.ts 🚫 (auto-hidden)
│   │   │   ├── customers.module.ts 🚫 (auto-hidden)
│   │   │   ├── customers.rate-limit.test.ts 🚫 (auto-hidden)
│   │   │   └── customers.service.ts 🚫 (auto-hidden)
│   │   ├── database/
│   │   │   ├── database.module.ts 🚫 (auto-hidden)
│   │   │   └── database.service.ts 🚫 (auto-hidden)
│   │   ├── health/
│   │   │   ├── dto/
│   │   │   │   └── health-response.dto.ts 🚫 (auto-hidden)
│   │   │   ├── health.contract.test.ts 🚫 (auto-hidden)
│   │   │   ├── health.controller.ts 🚫 (auto-hidden)
│   │   │   ├── health.module.ts 🚫 (auto-hidden)
│   │   │   └── health.service.ts 🚫 (auto-hidden)
│   │   ├── testing/
│   │   │   └── helpers/
│   │   │       └── contract-test.helper.ts 🚫 (auto-hidden)
│   │   ├── app.controller.test.ts 🚫 (auto-hidden)
│   │   ├── app.controller.ts 🚫 (auto-hidden)
│   │   ├── app.module.ts 🚫 (auto-hidden)
│   │   ├── app.service.ts 🚫 (auto-hidden)
│   │   └── main.ts 🚫 (auto-hidden)
│   ├── test/
│   │   ├── app.e2e-spec.ts 🚫 (auto-hidden)
│   │   └── jest-e2e.json 🚫 (auto-hidden)
│   ├── .env 🚫 (auto-hidden)
│   ├── .env.production 🚫 (auto-hidden)
│   ├── .env.staging 🚫 (auto-hidden)
│   ├── README.md 🚫 (auto-hidden)
│   ├── env.template 🚫 (auto-hidden)
│   ├── package.json 🚫 (auto-hidden)
```

## Implementation Phases

### Phase 1: Database Foundation (Bi-week 1)

**Goal**: Get PostgreSQL + Prisma working with multi-branch schema

#### Step 1.1: Docker Setup

- [x] Create `docker/docker-compose.yml` for PostgreSQL
- [x] Test database connection
- [x] Document connection process

> 📚 **For database setup instructions**, see [`docs/SETUP.md`](../docs/SETUP.md)

#### Step 1.2: Prisma Initialization

- [x] Install Prisma dependencies
- [x] Initialize Prisma configuration
- [x] Create multi-branch schema
- [x] Run initial migration
- [x] Create seed data for development

#### Step 1.3: Essential Dependencies

```bash
npm install @nestjs/config @nestjs/jwt @nestjs/passport @nestjs/swagger @nestjs/terminus
npm install passport passport-jwt bcrypt class-validator class-transformer
npm install @prisma/client prisma
npm install --save-dev @types/bcrypt @types/passport-jwt
```

#### Step 1.4: Environment Configuration

- [x] Create `.env.example` template
- [x] Set up `@nestjs/config` module
- [x] Configure database connection (see `docs/SETUP.md` for details)
- [x] Set up JWT secrets
- [x] Configure health check settings

#### Step 1.5: Code linting

- [x] Configure base eslint, prettier and editorconfig if necessary
- [x] Set up modern ESLint v9 with TypeScript support
- [x] Configure Prettier integration with ESLint
- [x] Add .editorconfig for consistent editor settings
- [x] Fix TypeScript unsafe operations with proper typing
- [x] Configure test-specific ESLint rules for Jest
- [x] Set up pre-commit hooks with husky and lint-staged
- [x] Add lint:check and format:check scripts for CI/CD

### Phase 2: Core Modules (Bi-week 2)

**Goal**: Implement essential business modules

#### Step 2.1: Health Check Module

- [x] Create `health/health.module.ts` with @nestjs/terminus
- [x] Implement basic health endpoint (`GET /api/health`)
- [x] Add database health check (`GET /api/health/database`)
- [x] Add detailed system status endpoint
- [x] Add to app module
- [x] **Tests**: Contract testing approach implemented
  - [x] Created contract testing infrastructure (`src/testing/helpers/contract-test.helper.ts`)
  - [x] Added contract-specific npm scripts (`test:contracts`, `test:watch:contracts`, `test:cov:contracts`)
  - [x] Configured ESLint relaxed rules for testing utilities

#### Step 2.2: Database Module

- [x] Create `database/database.module.ts`
- [x] Implement Prisma service wrapper
- [x] Add to app module
- [x] Test database connection via health endpoint

#### Step 2.3: Auth Module

- [x] JWT strategy implementation
- [x] Login/Register endpoints
- [x] Password hashing with bcrypt
- [x] Basic user registration
- [x] **Tests**: Contract tests for auth endpoints (following Health module pattern)

#### Step 2.4: Customers Module

##### Backend Implementation (Priority)

**Goal**: Implement customer identification and branding data management:

- [x] Database Schema Updated

- [x] Add Customer entity as top-level entity
- [x] Rename Tenant to Branch for clarity
- [x] Add customerId relationships to relevant entities
- [x] Maintain customer-specific services and user associations
  - [x] Business Rules Implemented
  - [x] Users can belong to multiple customers
  - [x] Services are customer-specific
  - [x] Professionals can work across multiple branches of same customer
  - [x] Branch-specific pricing maintained

##### Step 2.4.1: Customer Database Schema & Entities

- [x] Add Customer model to Prisma schema
  - [x] Basic fields: id, name, urlSlug (unique), isActive, createdAt, updatedAt
  - [x] Branding fields: documentTitle, logoUrl, logoAlt, favicon32x32, favicon16x16, appleTouch
  - [x] Theme colors: primaryMain, primaryLight, primaryDark, primaryContrast, secondaryMain, secondaryLight, secondaryDark, secondaryContrast, backgroundColor
- [x] Update the relevant entities with 'customerId' field and its relationships.
- [x] Create database migration
- [x] Update seed data with sample customers (Acme, Elite Cuts, etc.)
- [x] Create Customer entity and interfaces

##### Step 2.4.2: Customer Module Structure

##### Step 2.4.3: Customer Branding API (DDoS Protected)

- [x] Create `GET /api/customers/branding/:urlSlug` endpoint
- [x] Implement URL slug validation and customer lookup
- [x] Return simplified branding response format
- [x] Add caching for customer configurations (<100ms target)
- [x] Handle inactive/non-existent customers gracefully
- [x] Add contract tests for the branding endpoint
- [x] **DDoS Protection Implementation**:
  - ✅ Rate limiting with @nestjs/throttler (20 requests/minute for branding)
  - ✅ IP-based throttling with custom tracking per URL slug
  - ✅ Global rate limiting (60 requests/minute default)
  - ✅ Custom rate limits for admin operations (5 requests/minute)
  - ✅ Proper HTTP 429 responses with clear error messages
  - ✅ Rate limit headers in responses (X-RateLimit-\* headers)
  - ✅ Manual testing confirmed: blocks after limit exceeded
  - ✅ Configurable via environment variables

##### Step 2.4.4: Branding Management API(protected)

- [x] **Config Update Endpoint**: `PUT /api/customers/:customerId/branding/config`
  - Update branding data without touching files
  - ✅ Implemented and tested
- [x] **Initial Setup Endpoint**: `POST /api/customers/:customerId/branding`
  - ✅ Multipart form data: logo, favicon32x32, favicon16x16, appleTouch files
  - ✅ JSON config field with documentTitle, logoAlt, theme colors
  - ✅ Atomic operation: files + config in one request
  - ✅ Return complete branding configuration
  - ✅ Admin-only access with JWT authentication
  - ✅ Rate limiting (3 requests/minute)
- [x] **File Update Endpoint**: `POST /api/customers/:customerId/branding/upload`
  - ✅ Update images without changing configuration
  - ✅ Handle individual file replacements
  - ✅ Admin-only access with JWT authentication
  - ✅ Rate limiting (5 requests/minute)
- [x] File processing middleware
  - ✅ Size limits (5MB for logo, 1MB for favicons, 2MB for apple touch)
  - ✅ Type validation (PNG, JPG, JPEG, SVG, WebP for logo; ICO, PNG for favicons)
  - ✅ Local storage with CDN-ready structure (`uploads/customers/{customerId}/`)
  - ✅ URL generation for stored files with timestamp naming
  - ✅ Static file serving via Express
  - ✅ Automatic cleanup of old files on updates

##### Step 2.4.5: Backend Testing & Validation

- [x] Contract tests for customer branding API (basic functionality tested)
- [x] Contract tests for file upload endpoints (upload validation, auth, error handling)
- [x] Performance tests for customer lookup (<100ms) - tested manually
- [x] Error handling tests for invalid customers - tested manually
- [x] File upload integration tests (manual testing with test script)
- [x] Static file serving validation (HTTP accessibility of uploaded files)

##### ✅ **Customer Module Implementation Complete**

- **Database Schema**: ✅ Customer entity with full branding support
- **API Endpoints**:
  - ✅ GET /api/customers/branding/:urlSlug (public, rate-limited)
  - ✅ PUT /api/customers/:id/branding/config (admin-only, config updates)
  - ✅ POST /api/customers/:id/branding (admin-only, initial setup with files + config)
  - ✅ POST /api/customers/:id/branding/upload (admin-only, file updates only)
- **File Upload System**:
  - ✅ Multipart form data handling with Multer
  - ✅ File validation (type, size, field validation)
  - ✅ Customer-specific storage organization
  - ✅ Atomic file operations with database updates
  - ✅ Automatic cleanup of old files
  - ✅ Static file serving with HTTP accessibility
- **Authentication**: ✅ JWT-based admin-only access control
- **Error Handling**: ✅ Proper 404s, 401s, and 400s for invalid requests
- **Data Persistence**: ✅ Branding changes saved and retrieved correctly
- **Business Logic**: ✅ Customer-specific branding with theme customization
- **Security & DDoS Protection**: ✅ Rate limiting implemented and tested
  - ✅ 20 requests/minute limit for public branding endpoint
  - ✅ 3 requests/minute limit for initial branding setup
  - ✅ 5 requests/minute limit for file updates and config changes
  - ✅ IP-based tracking with URL slug consideration
  - ✅ Proper error responses and monitoring headers
  - ✅ Configurable limits via environment variables

##### 🔒 **DDoS Protection Configuration**

**Environment Variables for Rate Limiting:**

```bash
# Global rate limiting (default: 60 requests/minute)
RATE_LIMIT_TTL=60000
RATE_LIMIT_DEFAULT=60

# Branding endpoint specific (default: 20 requests/minute)
RATE_LIMIT_BRANDING_TTL=60000
RATE_LIMIT_BRANDING=20

# Admin operations (default: 5 requests/minute)
RATE_LIMIT_ADMIN_TTL=60000
RATE_LIMIT_ADMIN=5
```

**Rate Limiting Features:**

- ✅ IP-based throttling with fallback to connection address
- ✅ Support for X-Forwarded-For and X-Real-IP headers (proxy-aware)
- ✅ Per-endpoint custom limits using @Throttle decorator
- ✅ Automatic HTTP 429 responses with clear error messages
- ✅ Rate limit headers in all responses for client awareness
- ✅ Custom tracking for branding endpoints (IP + URL slug)
- ✅ Comprehensive logging for monitoring suspicious activity

##### Frontend Implementation (After Backend)

**Goal**: Integrate customer branding into React application

##### Step 2.4.6: Customer Context Provider

- [ ] Create React context for customer state management
- [ ] Implement customer config fetching from backend
- [ ] Add loading states and error boundaries
- [ ] URL parsing logic to extract customer slug

##### Step 2.4.7: Dynamic Branding Application

- [ ] Update document title based on customer config
- [ ] Apply CSS variables for theme colors
- [ ] Dynamic logo loading and display
- [ ] Fallback handling for missing assets

##### Step 2.4.8: Customer URL Integration

- [ ] URL change detection and customer context updates
- [ ] Default customer fallback for missing URL slugs
- [ ] Route protection based on customer context

##### Step 2.4.9: Frontend Testing & Validation

- [ ] Unit tests for customer context logic
- [ ] Integration tests for branding application
- [ ] E2E tests for customer identification flow

##### Key Technical Considerations

- URL Structure: `https://solutiondomain.com/{customer-url-slug}/`
- Customer URL slug: lowercase, hyphens, alphanumeric only (max 50 chars)
- Backend-first approach ensures API stability before frontend integration

##### API Endpoints Summary (Protected):

```typescript
// Retrieve complete branding configuration
GET /api/customers/branding/:urlSlug

// Initial branding setup (files + config)
POST /api/customers/:customerId/branding
Content-Type: multipart/form-data
Fields: logo, favicon32x32, favicon16x16, appleTouch (files)
        config (JSON string)

// Update branding configuration only
PUT /api/customers/:customerId/branding/config
Content-Type: application/json

// Update branding files only
POST /api/customers/:customerId/branding/upload
Content-Type: multipart/form-data
```

##### API Response Format:

```typescript
GET /api/customers/branding/:urlSlug

Response:
{
  "data": {
    "id": "customer-123",
    "name": "Acme Barbershop",
    "urlSlug": "acme",
    "branding": {
      "favicon32x32": "https://cdn.example.com/customers/acme/favicon32x32.ico",
      "favicon16x16": "https://cdn.example.com/customers/acme/favicon16x16.ico",
      "appleTouch": "https://cdn.example.com/customers/acme/appleTouch.ico",
      "documentTitle": "Acme Barbershop - Book Your Appointment",
      "theme": {
         "light": {
            "logoUrl": "https://cdn.example.com/logos/acme.png",
            "logoAlt": "Acme Barbershop",
            "primary": {
               "main": "#272726FF",
               "light": "#706E6DFF",
               "dark": "#1B1B1BFF",
               "contrast": "#ECE8E6FF"
            },
            "secondary": {
               "main": "#8D8C8BFF",
               "light": "#E7E7E6FF",
               "dark": "#3B3B3BFF",
               "contrast": "#1B1B1BFF"
            },
            "background": "#F7F7F7FF"
         }
      }
    },
    "isActive": true
  }
}
```

##### Database Schema:

```prisma
model Customer {
  id          String @id @default(cuid())
  name        String
  urlSlug     String @unique

  // Branding Configuration
  documentTitle   String @default("")
  logoUrl     String?
  logoAlt     String @default("")

  // Favicons
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

  @@map("customers")
}
```

##### Success Criteria (Backend First)

- [x] Customer database schema created and migrated
- [x] GET /api/customers/branding/:urlSlug endpoint working (<100ms target)
- [ ] POST /api/customers/:id/branding (initial setup)
- [ ] PUT /api/customers/:id/branding/config (config updates)
- [ ] POST /api/customers/:id/branding/upload (file updates)
- [ ] File validation: size limits, type checking, customer ownership
- [ ] Contract tests passing for all branding endpoints
- [ ] Local file storage with URL generation working
- [ ] Frontend can fetch and apply complete customer branding
- [ ] System handles missing/invalid customers gracefully

##### Developer Workflow & Usage Examples

**1. Initial Branding Setup (Complete)**

```bash
# Complete branding setup with files and configuration
curl -X POST "http://localhost:3001/api/customers/{customerId}/branding" \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -F "logo=@logo.png" \
  -F "favicon32x32=@favicon32.ico" \
  -F "favicon16x16=@favicon16.ico" \
  -F "appleTouch=@apple-touch.png" \
  -F 'config={
    "documentTitle": "Acme Barbershop - Book Your Appointment",
    "logoAlt": "Acme Barbershop Logo",
    "theme": {
      "light": {
        "primary": {"main": "#272726FF", "light": "#706E6DFF", "dark": "#1B1B1BFF", "contrast": "#ECE8E6FF"},
        "secondary": {"main": "#8D8C8BFF", "light": "#E7E7E6FF", "dark": "#3B3B3BFF", "contrast": "#1B1B1BFF"},
        "background": "#F7F7F7FF"
      }
    }
  }'
```

**2. File-Only Updates**

```bash
# Update only specific files without changing configuration
curl -X POST "http://localhost:3001/api/customers/{customerId}/branding/upload" \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -F "logo=@new-logo.png" \
  -F "favicon32x32=@new-favicon.ico"
```

**3. Configuration-Only Updates**

```bash
# Update only configuration without touching files
curl -X PUT "http://localhost:3001/api/customers/{customerId}/branding/config" \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "documentTitle": "Updated Barbershop Title",
    "logoAlt": "Updated Logo Description",
    "theme": {
      "light": {
        "primary": {"main": "#FF0000"}
      }
    }
  }'
```

**4. Retrieve Branding (Public)**

```bash
# Get complete branding configuration (public endpoint, rate-limited)
curl "http://localhost:3001/api/customers/branding/{urlSlug}"
```

**5. Access Uploaded Files**

```bash
# Files are accessible via static HTTP serving
# Format: http://localhost:3001/uploads/customers/{customerId}/{filename}
curl "http://localhost:3001/uploads/customers/cmfy4ppjn0002gt1azx6tls4l/cmfy4ppjn0002gt1azx6tls4l_logo_1758727189371.png"
```

#### Step 2.5: Branches Module

- [x] CRUD operations for branches: Implement soft-delete registry
- [x] Basic branch management with customer relationships
- [x] Address & Countries management
- [x] Admin-only routes with JWT authentication
- [x] **Customer Integration**: Branches linked to customers via customerId
- [x] **Renamed from Tenants**: Complete module rename (tenants → branches)
- [x] **API Endpoints**: Updated to `/api/branches/*`
- [x] **Tests**: Contract tests for branches management APIs
- [x] **Database Migration**: Successfully migrated existing tenant data
- [x] **Customer-Scoped CRUD**: Complete branch management for customers
  - [x] **CreateCustomerBranchDto**: Customer-scoped DTO without customerId field
  - [x] **Service Methods**: Customer-scoped create, update, delete with proper validation
  - [x] **Controller Endpoints**: Full CRUD at `/api/salon/{slug}/branches/*`
  - [x] **Role-Based Access Control**:
    - CLIENT users: Read-only access (GET operations only)
    - ADMIN users: Full CRUD access (POST, PATCH, DELETE operations)
    - STAFF users: Not used (simplified implementation)
  - [x] **Soft Delete**: Proper soft-delete implementation with customer context
  - [x] **Postman Collection**: Complete customer branch management endpoints

#### Step 2.6: Multi-Tenant Authentication System

##### 🎯 **URL Structure Implementation**

**Pattern**: `/salon/{customer-slug}/dashboard`

```typescript
// Example URLs
https://yourdomain.com/salon/acme/dashboard
https://yourdomain.com/salon/elite-cuts/bookings
https://yourdomain.com/admin/customers          // Admin routes
https://yourdomain.com/                         // Landing page
```

##### 🔒 **Enhanced Authentication Flow**

**Login Response Example:**

```json
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "user_123",
    "userName": "John Doe",
    "phone": "+1234567890",
    "customers": [
      {
        "id": "customer_acme",
        "name": "Acme Barbershop",
        "urlSlug": "acme",
        "logoUrl": "https://cdn.example.com/acme/logo.png"
      },
      {
        "id": "customer_elite",
        "name": "Elite Cuts",
        "urlSlug": "elite-cuts",
        "logoUrl": "https://cdn.example.com/elite/logo.png"
      }
    ],
    "defaultCustomerId": "customer_acme"
  }
}
```

**JWT Payload Structure:**

```typescript
{
  "sub": "user_123",
  "email": "john@example.com",
  "role": "CLIENT",
  "customerIds": ["customer_acme", "customer_elite"],
  "defaultCustomerId": "customer_acme",
  "iat": 1640995200,
  "exp": 1640998800
}
```

##### 🛡️ **Security Features**

- **Server-side Validation**: Customer access verified against database
- **URL-enforced Context**: Customer context extracted from `/salon/{slug}` URLs
- **Access Control**: Users only access customers they belong to
- **Automatic Filtering**: All data queries scoped to active customer

##### 📚 **New API Endpoints**

⚠️ UPDATE

```typescript
// Customer context validation (protected)
GET /api/customers/context/:urlSlug
Authorization: Bearer {jwt_token}
X-Customer-Slug: {customer-slug} // Optional header fallback

// User's accessible customers (protected)
GET /api/customers/my-customers
Authorization: Bearer {jwt_token}

// EVALUATE AND UPDATE THEM
```

##### 🎨 **Frontend Integration**

**Customer URL Utility:**

```typescript
// Extract customer from URL
const customerSlug = CustomerUrlService.extractCustomerSlug();
// Result: "acme" from "/salon/acme/dashboard"

// Build customer URLs
const bookingUrl = CustomerUrlService.buildCustomerUrl('acme', '/bookings');
// Result: "/salon/acme/bookings"

// Navigate to customer context
CustomerUrlService.navigateToCustomer('elite-cuts', '/services');
// Navigates to: "/salon/elite-cuts/services"
```

**Customer Context Flow:**

1. User visits `/salon/acme/dashboard`
2. Frontend extracts `acme` from URL
3. Frontend calls `/api/customers/context/acme` to validate
4. Backend verifies user has access to `acme` customer
5. Customer context established for all subsequent requests
6. All data automatically filtered to `acme` customer

**Key Testing Scenarios:**

1. **Authentication Flow**: Register/Login with enhanced customer data
2. **Customer Context**: Validate customer access via URL slugs
3. **Customer-Scoped Access**: Test `/salon/{slug}/branches` endpoints
4. **Security Validation**: Verify unauthorized access prevention
5. **Multi-Tenant Data**: Confirm customer filtering in responses

### Phase 3: Business Logic (Week 3)

**Goal**: Implement booking-specific functionality

#### Step 3.1: Professionals Module

- [ ] Professional CRUD with branch association
- [ ] Photo upload handling (basic)
- [ ] Active/inactive status management
- [ ] **Tests**: Contract tests for professional management APIs

#### Step 3.2: Services Module

- [ ] Service catalog management
- [ ] Location-based pricing implementation
- [ ] Service duration configuration
- [ ] **Tests**: Contract tests for service catalog and pricing APIs

#### Step 3.3: Booking Module Foundation

- [ ] Basic booking CRUD
- [ ] Availability query structure
- [ ] Simple time slot logic
- [ ] **Tests**: Contract tests for booking APIs + property-based tests for availability logic

### Phase 4: Advanced Features (Week 4)

**Goal**: Complete booking flow

#### Step 4.1: Availability Service

- [ ] Professional availability calculation
- [ ] "Any professional" slot aggregation
- [ ] Service duration slot blocking
- [ ] **Tests**: Property-based tests for complex availability algorithms

#### Step 4.2: API Documentation

- [x] Swagger/OpenAPI setup in main.ts
- [x] DTO documentation
- [x] API endpoint descriptions

#### Step 4.3: Validation & Error Handling

- [x] Global validation pipes
- [x] Error response standardization
- [x] Input sanitization

## Development Guidelines

### Code Standards

- Use NestJS conventions (feature modules)
- Implement DTOs for all API inputs/outputs
- Add Swagger decorators to controllers
- Write meaningful commit messages
- Keep business logic in services, not controllers

### Testing Strategy

**Contract Testing Approach** (Primary Strategy):

- **Contract tests** for API validation and business rules
- Focus on frontend-backend compatibility over implementation details
- Deterministic test data for reliability
- Reusable testing utilities in `src/testing/helpers/`

**Supplementary Testing**:

- Unit tests for complex business logic (future modules)
- E2E tests for critical booking flows
- Property-based tests for booking availability logic (when implemented)

**Test File Naming Convention**:

- `*.contract.test.ts` - API contract validation
- `*.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.e2e-spec.ts` - End-to-end tests

**Available Scripts**:

- `npm run test:contracts` - Run contract tests only
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests only
- `npm test` - Run all tests

**Testing Architecture Decisions**:

- ✅ **Contract testing over verbose unit tests**
- ✅ **Deterministic over random test data**- ✅ **Frontend-focused testing**: Prioritize API contract validation over implementation details
- ✅ **Reusable test utilities**: Centralized helpers in `src/testing/helpers/` for scalability
- 🔄 **Property-based testing**: Reserved for complex booking logic (future implementation)
- 🔄 **Mutation testing**: Planned for CI/CD pipeline to validate test quality

### Security Considerations

- JWT token expiration handling
- Password hashing (bcrypt)
- Input validation and sanitization
- Role-based access control
- Rate limiting (future consideration)

## Core API Endpoints Overview

### Health & Monitoring

- `GET /api/health` - Application health check
- `GET /api/health/database` - Database connection health
- `GET /api/health/detailed` - Detailed system status

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Token refresh

### Branches (Admin only)

- `GET /api/branches` - List all branches
- `POST /api/branches` - Create branch
- `GET /api/branches/:id` - Get branch details
- `PUT /api/branches/:id` - Update branch
- `DELETE /api/branches/:id` - Delete branch

### Branches (Customer)

- Customer-scoped REST surface validated via contract suite:
  - `GET /api/salon/{customerSlug}/branches`
  - `GET /api/salon/{customerSlug}/branches/:id`
  - `POST /api/salon/{customerSlug}/branches`
  - `PATCH /api/salon/{customerSlug}/branches/:id`
  - `DELETE /api/salon/{customerSlug}/branches/:id`

### Countries (Admin only)

- `GET /api/countries` - List all countries
- `POST /api/countries` - Create country
- `GET /api/countries/:code` - Get Country details

### Professionals

- `GET /api/branches/:branchId/professionals` - List professionals by branch
- `POST /api/professionals` - Create professional (Admin)
- `PUT /api/professionals/:id` - Update professional
- `DELETE /api/professionals/:id` - Deactivate professional

### Services

- `GET /api/services` - List all services
- `GET /api/branches/:branchId/services` - Services with branch pricing
- `POST /api/services` - Create service (Admin)
- `POST /api/services/:id/pricing` - Set branch-specific pricing

### Bookings

- `POST /api/bookings` - Create booking
- `GET /api/bookings/my` - User's booking history
- `GET /api/bookings/availability` - Query available time slots
- `PUT /api/bookings/:id` - Update booking status
- `DELETE /api/bookings/:id` - Cancel booking

### Customer (⚠️ UPDATE)

## Future Considerations

### Not Implementing Initially

- Advanced cancellation policies
- Multi-service bookings
- Professional working hours management
- Automated SMS/Email notifications
- Payment processing integration
- Advanced reporting/analytics

### Multilingual Support

- Frontend: i18next (React)
- Backend: Simple translation service for API responses
- Database: Store translatable content in JSON columns when needed

## Success Metrics

- [ ] User can register and login
- [ ] Admin can manage branches and services
- [ ] Client can view available time slots
- [ ] Client can book appointments
- [ ] System handles "any professional" booking logic
- [ ] API is documented with Swagger
- [ ] Database supports multiple branches with different pricing

## Notes

- Start with Portuguese as primary language
- Focus on core booking functionality first
- Keep business rules simple initially
- Prioritize working software over perfect architecture
- Document decisions and trade-offs as you go
