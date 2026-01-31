## 📚 1. API Development

### 1.1 Swagger Documentation

- **Local**: http://localhost:3001/api/docs
- **JSON Schema**: http://localhost:3001/api-json

### 1.2 Postman Collection

Import the collection from `docs/postman-collection.json`:

1. Open Postman
2. Import → Upload Files → Select `postman-collection.json`
3. Set environment variables:
   - `baseUrl`: `http://localhost:3001/api`
   - `authToken`: (will be auto-filled after login)

### 1.3 Testing Strategy

**Contract Testing Approach** (Primary Strategy):

- **Contract tests** for API validation and business rules
- Focus on frontend-backend compatibility over implementation details
- Deterministic test data for reliability
- Reusable testing utilities in `src/testing/helpers/`

**Supplementary Testing**:

- Unit tests for complex business logic (future modules)
- E2E tests for critical booking flows (future)
- Property-based tests for booking availability logic (when implemented)

**Test File Naming Convention**:

- `*.contract.test.ts` - API contract validation
- `*.test.ts` - Unit tests
- `*.integration.test.ts` - Integration tests
- `*.e2e-spec.ts` - End-to-end tests

**Available Scripts**:

- `pnpm test` - Run all tests (from server dir)
- `pnpm test:ci` - Run all coverage tests (from server dir)

**Testing Architecture Decisions**:

- ✅ **Contract testing over verbose unit tests**
- ✅ **Deterministic over random test data**- ✅ **Frontend-focused testing**: Prioritize API contract validation over implementation details
- ✅ **Reusable test utilities**: Centralized helpers in `src/testing/helpers/` for scalability
- 🔄 **Property-based testing**: Reserved for complex booking logic (future implementation)
- 🔄 **Mutation testing**: Planned for CI/CD pipeline to validate test quality

✅ **All Tests Passing** (82 Tests, 9 Test Suites)

**Test Suite Summary** (as of October 11, 2025):

- ✅ `app.controller.test.ts` - Application controller tests
- ✅ `health.contract.test.ts` - Health check API contracts
- ✅ `countries.contract.test.ts` - Countries API contracts
- ✅ `customers.contract.test.ts` - Customer branding API contracts
- ✅ `customers.rate-limit.test.ts` - Rate limiting and DDoS protection
- ✅ `customers.upload.contract.test.ts` - File upload API contracts
- ✅ `auth.contract.test.ts` - Authentication API contracts
- ✅ `branches.contract.test.ts` - Branch management API contracts
- ✅ `professionals.contract.test.ts` - Professional management API contracts (25 tests)


**Testing Endpoints Strategy**

#### 1.3.1 Health Checks
```bash
# Basic health
curl http://localhost:3001/api/health

# Database health
curl http://localhost:3001/api/health/database

# Detailed health
curl http://localhost:3001/api/health/detailed
```

#### 1.3.2 Test Scripts

```bash
cd server
pnpm test            # Run all tests
```

```bash
pnpm lint            # Check for lint errors
```

```bash
# From project root
pnpm dev:server      # Run server
# Or from server directory: cd server && pnpm start:dev
```

#### 1.3.3 Test Data

// EVALUATE 'server/prisma/seed.ts' TO UPDATE THE FOLLOWING:

**Development Users:**
```javascript
// Available test accounts (password: 123456)
{
  admin: 'admin@stylesync.com',
  client: 'client@test.com', 
  staff: 'staff@stylesync.com'
}
```

**Sample Data:**
- 2 Branches (Unidade 1, Unidade 2)
- 4 Services with location-based pricing
- 4 Professionals across branches
- Sample bookings for testing

#### 1.3.4 Manual Testing
- Test health endpoints
- Verify database operations
- Check Swagger documentation
- Use Postman collection

### 1.4 Database Schema Changes

```bash
# 1. Modify schema in prisma/schema.prisma
# 2. Create migration
cd server
pnpm prisma:migrate

# 3. Update seed data if needed
# Edit prisma/seed.ts
pnpm prisma:seed

# 4. Test changes
pnpm start:dev
# Or from project root: pnpm dev:server
```
### 1.5 Adding New Endpoints

**Directory Structure:**
```
src/
├── module-name/
│   ├── dto/
│   │   ├── create-entity.dto.ts
│   │   ├── update-entity.dto.ts
│   │   └── query-entity.dto.ts
│   ├── entities/
│   │   └── entity.entity.ts
│   ├── module-name.controller.ts
│   ├── module-name.service.ts
│   ├── module-name.module.ts
│   └── tests/
│       ├── module-name.controller.spec.ts
│       └── module-name.service.spec.ts
```

**Implementation Checklist:**
- [ ] Create DTOs with validation decorators
- [ ] Add Swagger documentation (`@ApiOperation`, `@ApiResponse`)
- [ ] Implement service logic
- [ ] Add controller endpoints
- [ ] Write contract tests
- [ ] Update Postman collection
- [ ] Update API documentation (swagger)
- [ ] Update API ./tasks/backendTasks.md

## 📦 2. Production Deployment

### 2.1 Build Process

```bash
# 1. Install dependencies
pnpm install --frozen-lockfile

# 2. Build application
cd server
pnpm build

# 3. Set production environment variables
export NODE_ENV=production
export DATABASE_URL="postgresql://..."
export JWT_SECRET="secure-production-secret"

# 4. Run migrations
pnpm prisma:migrate

# 5. Start production server
pnpm start:prod
```

### 2.2 Environment Variables (Production)

```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://...
JWT_SECRET=<strong-secret-key>
JWT_REFRESH_SECRET=<strong-refresh-key>
SWAGGER_ENABLED=false
```

## 3 Database Schema Design

### 3.1 Dual ID Strategy (Security + UX)

**Implementation Date**: October 11, 2025

StyleSync uses a **dual ID system** for all entities, balancing security with user experience:

- **Primary Key (`id`)**: CUID (Collision-Resistant Unique Identifier)
  - Used in URLs, API requests, and database relationships
  - Prevents enumeration attacks (competitors can't discover `/api/bookings/1`, `/api/bookings/2`, etc.)
  - Hides business intelligence (booking volume, customer count, etc.)
  - Example: `clg2a5d9i0002gtkb`

- **Display ID (`displayId`)**: Auto-incrementing Integer
  - User-friendly reference: "Booking #12345", "Professional #007"
  - Enables natural ordering and sorting
  - Useful for customer support and internal operations
  - Analytics-friendly (gap analysis, growth metrics)
  - Example: `42`

**API Response Example**:

```json
{
  "data": {
    "id": "clg2a5d9i0002gtkb",
    "displayId": 42,
    "name": "João Silva",
    "createdAt": "2025-10-11T10:30:00.000Z"
  }
}
```

**Benefits**:

- ✅ Security: Non-enumerable CUID primary keys
- ✅ UX: Friendly sequential display IDs
- ✅ Analytics: Sequential IDs enable growth tracking
- ✅ Support: Easy ticket references ("Booking #12345")
- ✅ Performance: Both fields indexed for their use cases
- ✅ Backward Compatible: No foreign key changes required

**Entities with Dual IDs**:
All database entities now have both `id` (CUID) and `displayId` (Int) fields:

- Country
- Customer
- Branch
- Professional
- ProfessionalBranch
- Service
- ServicePricing
- User
- UserCustomer
- Booking

### 3.2 Core Entities

```prisma
model Country {
  id            String   @id @default(cuid())
  displayId     Int      @default(autoincrement()) @unique
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
  displayId        Int              @default(autoincrement()) @unique
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
  displayId Int       @default(autoincrement()) @unique
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
  displayId   Int              @default(autoincrement()) @unique
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
  displayId      Int           @default(autoincrement()) @unique
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

## 4 Core directory Structure

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

## 5 Core API Endpoints Overview

### Health & Monitoring

- `GET /api/health` - Application health check
- `GET /api/health/database` - Database connection health
- `GET /api/health/detailed` - Detailed system status

### Authentication

- `POST /api/auth/login` - User login (returns tokens with all linked customers)
- `POST /api/auth/refresh` - Token refresh
- `POST /api/salon/:customerSlug/auth/register` - Customer-scoped user registration (creates or links user to customer)

### Customer
// UPDATE

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




### Code Standards

- Use NestJS conventions (feature modules)
- Implement DTOs for all API inputs/outputs
- Add Swagger decorators to controllers
- Write meaningful commit messages
- Keep business logic in services, not controllers

## 6. Security Considerations

- JWT token expiration handling
- Password hashing (bcrypt)
- Input validation and sanitization
- Role-based access control
- Rate limiting (future consideration)

