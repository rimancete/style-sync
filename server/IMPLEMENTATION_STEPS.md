# StyleSync Backend Implementation Plan

## Project Overview

StyleSync is a multi-location barbershop booking system with the following key requirements:

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
- **API Documentation**: Swagger/OpenAPI
- **Validation**: class-validator + class-transformer

### Business Logic Clarifications

1. **Professional Preferences**: Clients can book "any available professional" (professionalId = null)
2. **Service Combinations**: Single service per booking (no complex multi-service logic)
3. **Pricing Strategy**: Location-specific pricing for services
4. **Cancellation Rules**: Deferred to future implementation

## Database Schema Design

### Core Entities

```prisma
model Branch {
  id       String @id @default(cuid())
  name     String // "Unidade 1", "Unidade 2"
  address  Object // address structure base on the regions
  phone    String

  professionals Professional[]
  bookings     Booking[]
  servicePricing ServicePricing[]
  createdAt    DateTime @default(now())
  @@map("branches")
}

model Professional {
  id       String  @id @default(cuid())
  name     String  // "Michel", "Luiz", "Dario"
  photoUrl String?
  isActive Boolean @default(true)
  branchId String

  branch   Branch    @relation(fields: [branchId], references: [id])
  bookings Booking[]
  @@map("professionals")
}

model Service {
  id          String @id @default(cuid())
  name        String // "Social + Barba"
  description String?
  duration    Int    // minutes (single service only)

  pricing ServicePricing[]
  bookings Booking[]
  @@map("services")
}

model ServicePricing {
  id        String  @id @default(cuid())
  serviceId String
  branchId  String
  price     Decimal @db.Decimal(10,2)

  service Service @relation(fields: [serviceId], references: [id])
  branch  Branch  @relation(fields: [branchId], references: [id])
  @@unique([serviceId, branchId])
  @@map("service_pricing")
}

model User {
  id       String   @id @default(cuid())
  email    String   @unique
  password String
  name     String
  phone    String?
  role     UserRole @default(CLIENT)

  bookings Booking[]
  createdAt DateTime @default(now())
  @@map("users")
}

model Booking {
  id             String        @id @default(cuid())
  userId         String
  branchId       String
  serviceId      String
  professionalId String?       // NULL = "Any professional"
  scheduledAt    DateTime
  status         BookingStatus @default(PENDING)
  totalPrice     Decimal       @db.Decimal(10,2)

  user         User         @relation(fields: [userId], references: [id])
  branch       Branch       @relation(fields: [branchId], references: [id])
  service      Service      @relation(fields: [serviceId], references: [id])
  professional Professional? @relation(fields: [professionalId], references: [id])

  createdAt DateTime @default(now())
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
server/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── health/                 # Health check endpoints
│   │   ├── health.controller.ts
│   │   ├── health.service.ts
│   │   └── health.module.ts
│   ├── auth/                   # JWT authentication
│   │   ├── dto/
│   │   │   ├── login.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   └── token.dto.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── branches/                # Branch/Location management
│   │   ├── dto/
│   │   │   ├── create-branch.dto.ts
│   │   │   └── update-branch.dto.ts
│   │   ├── entities/
│   │   │   └── branch.entity.ts
│   │   ├── branches.controller.ts
│   │   ├── branches.service.ts
│   │   └── branches.module.ts
│   ├── professionals/          # Staff with branch assignments
│   │   ├── dto/
│   │   │   ├── create-professional.dto.ts
│   │   │   └── update-professional.dto.ts
│   │   ├── entities/
│   │   │   └── professional.entity.ts
│   │   ├── professionals.controller.ts
│   │   ├── professionals.service.ts
│   │   └── professionals.module.ts
│   ├── services/               # Service catalog with pricing
│   │   ├── dto/
│   │   │   ├── create-service.dto.ts
│   │   │   └── service-pricing.dto.ts
│   │   ├── entities/
│   │   │   ├── service.entity.ts
│   │   │   └── service-pricing.entity.ts
│   │   ├── services.controller.ts
│   │   ├── services.service.ts
│   │   └── services.module.ts
│   ├── booking/                # Multi-location booking logic
│   │   ├── dto/
│   │   │   ├── create-booking.dto.ts
│   │   │   ├── update-booking.dto.ts
│   │   │   └── availability-query.dto.ts
│   │   ├── availability/
│   │   │   ├── availability.service.ts
│   │   │   └── time-slot.interface.ts
│   │   ├── entities/
│   │   │   └── booking.entity.ts
│   │   ├── booking.controller.ts
│   │   ├── booking.service.ts
│   │   └── booking.module.ts
│   ├── users/                  # User management
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   ├── entities/
│   │   │   └── user.entity.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   └── users.module.ts
│   ├── common/                 # Shared utilities
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   └── public.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── types/
│   │       ├── user-role.enum.ts
│   │       └── booking-status.enum.ts
│   ├── testing/                # Testing utilities
│   │   └── helpers/
│   │       └── contract-test.helper.ts  # Contract testing infrastructure
│   ├── database/               # Database module
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   ├── app.controller.ts
│   ├── app.module.ts
│   ├── app.service.ts
│   └── main.ts                 # Swagger setup
├── docker/
│   └── docker-compose.yml      # PostgreSQL container
├── docs/
│   └── SETUP.md               # Development environment setup guide
├── .env.example
├── .env
├── Dockerfile                  # Optional for deployment
├── package.json
└── README.md
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

#### Step 2.3: Customers Module

##### Backend Implementation (Priority)

**Goal**: Implement customer identification and branding data management:

✅ Database Schema Updated

- Add Customer entity as top-level entity
- Rename Tenant to Branch for clarity
- Add customerId relationships to relevant entities
- Maintain customer-specific services and user associations
  ✅ Business Rules Implemented
- ✅ Users can belong to multiple customers
- ✅ Services are customer-specific
- ✅ Professionals can work across multiple branches of same customer
- ✅ Branch-specific pricing maintained

##### Step 2.3.1: Customer Database Schema & Entities

- [x] Add Customer model to Prisma schema
  - Basic fields: id, name, urlSlug (unique), isActive, createdAt, updatedAt
  - Branding fields: pageTitle, logoUrl, logoAlt, favicon32x32, favicon16x16, appleTouch
  - Theme colors: primaryMain, primaryLight, primaryDark, primaryContrast,
    secondaryMain, secondaryLight, secondaryDark, secondaryContrast, backgroundColor
- [x] Update the relevant entities with 'customerId' field and its relationships.
- [x] Create database migration
- [x] Update seed data with sample customers (Acme, Elite Cuts, etc.)
- [x] Create Customer entity and interfaces

##### Step 2.3.2: Customer Module Structure

- [x] Create `src/customers/` directory structure
  - customers.module.ts, customers.controller.ts, customers.service.ts
  - dto/ folder with request/response DTOs
  - entities/ folder with customer entity
- [x] Add customer module to app module
- [x] Implement basic CRUD operations (focus on read for now)

##### Step 2.3.3: Customer Branding API(protected)

- [x] Create `GET /api/customers/branding/:urlSlug` endpoint
- [x] Implement URL slug validation and customer lookup
- [x] Return simplified branding response format
- [x] Add caching for customer configurations (<100ms target)
- [x] Handle inactive/non-existent customers gracefully
- [x] Add contract tests for the branding endpoint

##### Step 2.3.4: Branding Management API(protected)

- [x] **Config Update Endpoint**: `PUT /api/customers/:customerId/branding/config`
  - Update branding data without touching files
  - ✅ Implemented and tested
- [ ] **Initial Setup Endpoint**: `POST /api/customers/:customerId/branding`
  - Multipart form data: logo, favicon32x32, favicon16x16, appleTouch files
  - JSON config field with pageTitle, logoAlt, theme colors
  - Atomic operation: files + config in one request
  - Return complete branding configuration
- [ ] **File Update Endpoint**: `POST /api/customers/:customerId/branding/upload`
  - Update images without changing configuration
  - Handle individual file replacements
- [ ] File processing middleware
  - Size limits (5MB max), type validation
  - Local storage with CDN-ready structure
  - URL generation for stored files

##### Step 2.3.5: Backend Testing & Validation

- [x] Contract tests for customer branding API (basic functionality tested)
- [x] Performance tests for customer lookup (<100ms) - tested manually
- [x] Error handling tests for invalid customers - tested manually

##### ✅ **Customer Module Implementation Complete**

- **Database Schema**: ✅ Customer entity with full branding support
- **API Endpoints**: ✅ GET /api/customers/branding/:urlSlug ✅ PUT /api/customers/:id/branding/config
- **Authentication**: ✅ JWT-based admin-only access control
- **Error Handling**: ✅ Proper 404s and 401s for invalid requests
- **Data Persistence**: ✅ Branding changes saved and retrieved correctly
- **Business Logic**: ✅ Customer-specific branding with theme customization

##### Frontend Implementation (After Backend)

**Goal**: Integrate customer branding into React application

##### Step 2.3.6: Customer Context Provider

- [ ] Create React context for customer state management
- [ ] Implement customer config fetching from backend
- [ ] Add loading states and error boundaries
- [ ] URL parsing logic to extract customer slug

##### Step 2.3.7: Dynamic Branding Application

- [ ] Update document title based on customer config
- [ ] Apply CSS variables for theme colors
- [ ] Dynamic logo loading and display
- [ ] Fallback handling for missing assets

##### Step 2.3.8: Customer URL Integration

- [ ] URL change detection and customer context updates
- [ ] Default customer fallback for missing URL slugs
- [ ] Route protection based on customer context

##### Step 2.3.9: Frontend Testing & Validation

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
  pageTitle   String @default("")
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

- [ ] Customer database schema created and migrated
- [ ] GET /api/customers/branding/:urlSlug endpoint working (<100ms target)
- [ ] POST /api/customers/:id/branding (initial setup) working
- [ ] PUT /api/customers/:id/branding/config (config updates) working
- [ ] POST /api/customers/:id/branding/upload (file updates) working
- [ ] File validation: size limits, type checking, customer ownership
- [ ] Contract tests passing for all branding endpoints
- [ ] Local file storage with URL generation working
- [ ] Frontend can fetch and apply complete customer branding
- [ ] System handles missing/invalid customers gracefully

##### Developer Workflow (Initial Setup)

```bash
# 1. Complete branding setup in one request
curl -X POST /api/customers/acme-id/branding \
  -F "logo=@logo.png" \
  -F "favicon32x32=@favicon32.ico" \
  -F "favicon16x16=@favicon16.ico" \
  -F "appleTouch=@apple-touch.png" \
  -F 'config={
    "pageTitle": "Acme Barbershop - Book Your Appointment",
    "logoAlt": "Acme Barbershop",
    "theme": {
      "light": {
        "primary": {"main": "#272726FF", "light": "#706E6DFF", ...},
        "secondary": {"main": "#8D8C8BFF", "light": "#E7E7E6FF", ...},
        "background": "#F7F7F7FF"
      }
    }
  }'

# 2. Verify via protected endpoint
curl /api/customers/branding/acme
```

#### Step 2.4: Branches Module

- [x] CRUD operations for branches: Implement soft-delete registry
- [x] Basic branch management with customer relationships
- [x] Address & Countries management
- [x] Admin-only routes with JWT authentication
- [x] **Customer Integration**: Branches linked to customers via customerId
- [x] **Renamed from Tenants**: Complete module rename (tenants → branches)
- [x] **API Endpoints**: Updated to `/api/branches/*`
- [x] **Tests**: Contract tests for branches management APIs
- [x] **Database Migration**: Successfully migrated existing tenant data

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
