# Service Module Implementation Plan (Phase 3)

**Status**: Planning  
**Priority**: High  
**Dependencies**: Branches, Professionals, Customers modules  
**Target Completion**: Current Sprint

---

## 📋 Table of Contents

1. [Design Decisions](#design-decisions)
2. [Database Schema Changes](#database-schema-changes)
3. [Module Structure](#module-structure)
4. [API Endpoints](#api-endpoints)
5. [Implementation Checklist](#implementation-checklist)
6. [Testing Strategy](#testing-strategy)
7. [Future Enhancements](#future-enhancements)

---

## 🎯 Design Decisions

### 1. **Soft Delete Strategy: `isActive` Boolean** ✅

**Decision**: Add `isActive` boolean field to Service model (matching Professional pattern)

**Rationale**:
- Simpler than `deletedAt` timestamp for service catalog management
- Services are "resources" like Professionals (can be temporarily unavailable)
- Easier frontend filtering: `services.filter(s => s.isActive)`
- Consistent with Professional model for developer familiarity

**Schema Change**:
```prisma
model Service {
  // ... existing fields
  isActive  Boolean @default(true)  // NEW FIELD
}
```

---

### 2. **Service Deactivation Rules** ✅

**Decision**: Prevent deactivation if service has **ANY** bookings (past or future)

**Rationale**:
- Preserves booking history integrity
- Prevents data anomalies (bookings pointing to "deleted" services)
- Simple, clear business rule: "Cannot remove services with booking history"
- Aligns with Professional deletion behavior

**Implementation**:
```typescript
async remove(id: string, customerId?: string): Promise<void> {
  // Check for any bookings (past or future)
  const bookingsCount = await this.db.booking.count({
    where: { serviceId: id },
  });

  if (bookingsCount > 0) {
    throw new ConflictException(
      'Cannot deactivate service with existing bookings. Consider marking as inactive to hide from new bookings.',
    );
  }

  // Deactivate service
  await this.db.service.update({
    where: { id },
    data: { isActive: false },
  });
}
```

**Error Response Example**:
```json
{
  "status": 409,
  "message": "Cannot deactivate service with existing bookings. Consider marking as inactive to hide from new bookings."
}
```

---

### 3. **Simplified Pricing Model** ✅

**Decision**: Keep one price per service-branch combination (v1)

**Current Constraint**: `@@unique([serviceId, branchId])`

**Accepted Limitations** (v1):
- ❌ No professional-based pricing (junior vs senior rates)
- ❌ No time-based pricing (peak hours, weekend rates)
- ❌ No promotional pricing periods

**Benefits**:
- ✅ Simple to implement and understand
- ✅ Clear business rule: "One service, one price per branch"
- ✅ Easy to query: `SELECT price WHERE serviceId = X AND branchId = Y`
- ✅ Frontend can cache pricing per branch
- ✅ Aligns with "simplified business logic" principle

**Future Enhancement Path**: Add `ServicePricingRule` table with conditions (professional level, time slots, promotions)

---

### 4. **Service-Professional Relationship** ✅

**Decision**: No explicit relationship (v1) - All professionals can perform all services at their branches

**Current Schema**: No `ServiceProfessional` junction table

**Accepted Assumptions**:
- All professionals at a branch can perform all services offered at that branch
- No skill-based restrictions or certifications required
- Booking availability = Professional availability + Service duration

**Benefits**:
- ✅ Simpler availability calculation in Phase 4 (Booking Module)
- ✅ Easier scheduling logic
- ✅ Fewer database queries for availability checks
- ✅ Matches simplified barbershop model

**Documented for Future Enhancement**:
```typescript
// FUTURE: ServiceProfessional junction table
// - Restrict services to certified professionals
// - Track training completion dates
// - Enable professional specializations
```

---

### 5. **Service Ordering Strategy** ✅

**Decision**: Dual sorting - displayId (default) and name (secondary)

**Implementation**:
```typescript
async findAll(customerId?: string, page = 1, limit = 500) {
  const services = await this.db.service.findMany({
    where: {
      customerId,
      isActive: true, // Only active services
    },
    orderBy: [
      { displayId: 'asc' },  // Primary: Creation order
      { name: 'asc' },       // Secondary: Alphabetical
    ],
    skip: (page - 1) * limit,
    take: limit,
  });
}
```

**Benefits**:
- ✅ Creation order (displayId) shows service introduction timeline
- ✅ Alphabetical fallback (name) for readability
- ✅ No additional `displayOrder` field needed for v1
- ✅ Deterministic sorting for UI consistency

**Future Enhancement**: Add explicit `displayOrder` field for custom service menu arrangement

---

## 🗄️ Database Schema Changes

### Migration Required: Add `isActive` to Service Model

**File**: `prisma/schema.prisma`

```prisma
model Service {
  id          String           @id @default(cuid())
  displayId   Int              @default(autoincrement()) @unique
  name        String
  description String?
  duration    Int              // Duration in minutes
  isActive    Boolean          @default(true)  // 🆕 NEW FIELD
  customerId  String
  createdAt   DateTime         @default(now())
  updatedAt   DateTime         @updatedAt
  
  customer    Customer         @relation(fields: [customerId], references: [id], onDelete: Cascade)
  bookings    Booking[]
  pricing     ServicePricing[]

  @@map("services")
}
```

**Migration Command**:
```bash
npx prisma migrate dev --name add_is_active_to_services
```

**Ensure implementation seed data-related is updated** (`prisma/seed.ts`):
```typescript
// Update seed data to include isActive field
const haircut = await prisma.service.create({
  data: {
    name: 'Haircut',
    description: 'Classic men\'s haircut',
    duration: 30,
    isActive: true,  // 🆕 Explicit active status
    customerId: acmeCustomer.id,
  },
});
// Update relevant service data to keep the seed data consistent and aligned with the implemented features
```

---

## 📁 Module Structure

Following the established pattern from Professionals and Branches modules:

```
server/src/services/
├── dto/
│   ├── create-service.dto.ts
│   ├── create-customer-service.dto.ts
│   ├── update-service.dto.ts
│   ├── service-response.dto.ts
│   ├── services-list-response.dto.ts
│   ├── create-service-pricing.dto.ts
│   ├── update-service-pricing.dto.ts
│   └── service-pricing-response.dto.ts
├── entities/
│   ├── service.entity.ts
│   └── service-pricing.entity.ts
├── services.controller.ts         # Admin endpoints
├── services.service.ts
├── services.module.ts
└── services.contract.test.ts
```

**Customer-scoped operations** will be added to the same controller using route decorators.

---

## 🌐 API Endpoints

### Endpoint Summary

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| **Admin (Global)** |
| `GET` | `/api/services` | Admin | List all services (cross-customer) |
| `POST` | `/api/services` | Admin | Create service (admin-managed) |
| `GET` | `/api/services/:id` | Admin | Get service by ID |
| `PATCH` | `/api/services/:id` | Admin | Update service |
| `DELETE` | `/api/services/:id` | Admin | Deactivate service |
| **Customer-Scoped** |
| `GET` | `/api/salon/:customerSlug/services` | JWT + Customer Context | List customer services |
| `POST` | `/api/salon/:customerSlug/services` | Admin + Customer Context | Create customer service |
| `GET` | `/api/salon/:customerSlug/services/:id` | JWT + Customer Context | Get customer service |
| `PATCH` | `/api/salon/:customerSlug/services/:id` | Admin + Customer Context | Update customer service |
| `DELETE` | `/api/salon/:customerSlug/services/:id` | Admin + Customer Context | Deactivate customer service |
| **Branch-Specific (Pricing)** |
| `GET` | `/api/salon/:customerSlug/branches/:branchId/services` | JWT + Customer Context | List services with branch pricing |
| `POST` | `/api/salon/:customerSlug/services/:serviceId/pricing` | Admin + Customer Context | Set/update branch pricing |
| `GET` | `/api/salon/:customerSlug/services/:serviceId/pricing/:branchId` | JWT + Customer Context | Get service pricing for branch |
| `DELETE` | `/api/salon/:customerSlug/services/:serviceId/pricing/:branchId` | Admin + Customer Context | Remove branch pricing |

---

### Detailed Endpoint Specifications

#### 1. **GET** `/api/services` (Admin Only)

**Description**: List all services across all customers

**Auth**: `@UseGuards(JwtAuthGuard, GlobalAdminGuard)`

**Query Parameters**:
- `page?: number` (default: 1)
- `limit?: number` (default: 500)
- `isActive?: boolean` (filter by active status)

**Response** (HTTP 200):
```json
{
  "data": {
    "services": [
      {
        "id": "clg2a5d9i0002gtkb",
        "displayId": 1,
        "name": "Haircut",
        "description": "Classic men's haircut",
        "duration": 30,
        "isActive": true,
        "customerId": "customer_123",
        "customerName": "Acme Barbershop",
        "createdAt": "2025-10-25T10:00:00Z",
        "updatedAt": "2025-10-25T10:00:00Z"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 500
  }
}
```

---

#### 2. **POST** `/api/services` (Admin Only)

**Description**: Create new service (admin-managed, requires customerId)

**Auth**: `@UseGuards(JwtAuthGuard, GlobalAdminGuard)`

**Request Body**:
```json
{
  "name": "Beard Trim",
  "description": "Professional beard styling and trimming",
  "duration": 20,
  "customerId": "customer_123",
  "isActive": true
}
```

**Validation Rules**:
- `name`: Required, min 2 characters, max 100 characters
- `description`: Optional, max 500 characters
- `duration`: Required, positive integer (minutes), min 5, max 480 (8 hours)
- `customerId`: Required, valid CUID, customer must exist
- `isActive`: Optional, defaults to `true`

**Response** (HTTP 201):
```json
{
  "data": {
    "id": "service_xyz",
    "displayId": 42,
    "name": "Beard Trim",
    "description": "Professional beard styling and trimming",
    "duration": 20,
    "isActive": true,
    "customerId": "customer_123",
    "createdAt": "2025-10-25T11:00:00Z",
    "updatedAt": "2025-10-25T11:00:00Z"
  }
}
```

**Error Responses**:
- `404 Not Found`: Customer does not exist
- `409 Conflict`: Service with same name already exists for customer
- `422 Unprocessable Entity`: Validation errors

---

#### 3. **GET** `/api/salon/:customerSlug/services` (Customer-Scoped)

**Description**: List services for a specific customer with optional branch pricing

**Auth**: `@UseGuards(JwtAuthGuard, CustomerContextGuard)`

**Query Parameters**:
- `page?: number` (default: 1)
- `limit?: number` (default: 500)
- `isActive?: boolean` (default: true - only show active services)
- `branchId?: string` (optional - include pricing for specific branch)

**Response** (HTTP 200):
```json
{
  "data": {
    "services": [
      {
        "id": "service_123",
        "displayId": 1,
        "name": "Haircut",
        "description": "Classic men's haircut",
        "duration": 30,
        "isActive": true,
        "pricing": null,  // null if branchId not provided
        "createdAt": "2025-10-25T10:00:00Z",
        "updatedAt": "2025-10-25T10:00:00Z"
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 500
  }
}
```

**With Branch Pricing** (`?branchId=branch_xyz`):
```json
{
  "data": {
    "services": [
      {
        "id": "service_123",
        "displayId": 1,
        "name": "Haircut",
        "description": "Classic men's haircut",
        "duration": 30,
        "isActive": true,
        "pricing": {
          "branchId": "branch_xyz",
          "branchName": "Downtown Location",
          "price": "25.00",
          "currency": "USD"
        },
        "createdAt": "2025-10-25T10:00:00Z",
        "updatedAt": "2025-10-25T10:00:00Z"
      }
    ],
    "total": 8,
    "page": 1,
    "limit": 500
  }
}
```

---

#### 4. **POST** `/api/salon/:customerSlug/services` (Customer-Scoped, Admin)

**Description**: Create service for specific customer (extracts customerId from context)

**Auth**: `@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)`, `@Roles('ADMIN')`

**Request Body** (no customerId needed - extracted from URL):
```json
{
  "name": "Hot Towel Shave",
  "description": "Traditional straight razor shave with hot towels",
  "duration": 45,
  "isActive": true
}
```

**Response** (HTTP 201): Same as admin create endpoint

---

#### 5. **GET** `/api/salon/:customerSlug/branches/:branchId/services`

**Description**: List all services available at a specific branch with pricing

**Auth**: `@UseGuards(JwtAuthGuard, CustomerContextGuard)`

**Purpose**: Frontend booking flow - show services with prices for selected branch

**Response** (HTTP 200):
```json
{
  "data": {
    "branch": {
      "id": "branch_xyz",
      "displayId": 2,
      "name": "Downtown Location"
    },
    "services": [
      {
        "id": "service_123",
        "displayId": 1,
        "name": "Haircut",
        "description": "Classic men's haircut",
        "duration": 30,
        "isActive": true,
        "price": "25.00",
        "currency": "USD",
        "createdAt": "2025-10-25T10:00:00Z"
      },
      {
        "id": "service_456",
        "displayId": 2,
        "name": "Beard Trim",
        "description": "Professional beard styling",
        "duration": 20,
        "isActive": true,
        "price": "15.00",
        "currency": "USD",
        "createdAt": "2025-10-25T10:15:00Z"
      }
    ],
    "total": 2
  }
}
```

**Business Rules**:
- Only show services with pricing configured for the branch
- Only show active services (`isActive: true`)
- Sort by displayId (primary), name (secondary)

**Error Responses**:
- `404 Not Found`: Branch does not exist or doesn't belong to customer
- `403 Forbidden`: User doesn't have access to customer

---

#### 6. **POST** `/api/salon/:customerSlug/services/:serviceId/pricing`

**Description**: Set or update service pricing for a specific branch

**Auth**: `@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)`, `@Roles('ADMIN')`

**Request Body**:
```json
{
  "branchId": "branch_xyz",
  "price": "25.00"
}
```

**Validation Rules**:
- `branchId`: Required, valid CUID, branch must belong to customer
- `price`: Required, decimal, min 0.01, max 9999.99
- Service must belong to customer (validated via URL context)

**Response** (HTTP 201 or 200):
```json
{
  "data": {
    "id": "pricing_123",
    "displayId": 5,
    "serviceId": "service_123",
    "serviceName": "Haircut",
    "branchId": "branch_xyz",
    "branchName": "Downtown Location",
    "price": "25.00",
    "createdAt": "2025-10-25T12:00:00Z",
    "updatedAt": "2025-10-25T12:00:00Z"
  }
}
```

**Behavior**:
- If pricing exists for service-branch combo: **UPDATE** existing pricing
- If pricing doesn't exist: **CREATE** new pricing entry
- Uses Prisma `upsert` for atomic operation

**Error Responses**:
- `404 Not Found`: Service or branch not found
- `400 Bad Request`: Branch doesn't belong to same customer as service
- `422 Unprocessable Entity`: Validation errors

---

#### 7. **PATCH** `/api/salon/:customerSlug/services/:id` (Customer-Scoped, Admin)

**Description**: Update service details (name, description, duration, active status)

**Auth**: `@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)`, `@Roles('ADMIN')`

**Request Body** (all fields optional):
```json
{
  "name": "Executive Haircut",
  "description": "Premium haircut with styling consultation",
  "duration": 45,
  "isActive": true
}
```

**Response** (HTTP 200): Updated service object

**Business Rules**:
- Cannot change `customerId` (service belongs to customer permanently)
- Name uniqueness validated within customer
- Duration changes don't affect existing bookings

---

#### 8. **DELETE** `/api/salon/:customerSlug/services/:id` (Customer-Scoped, Admin)

**Description**: Deactivate service (soft delete via `isActive = false`)

**Auth**: `@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)`, `@Roles('ADMIN')`

**Response** (HTTP 204 No Content): Empty body

**Business Rules**:
- Cannot deactivate if service has any bookings (past or future)
- Sets `isActive: false` (does not delete record)
- Service hidden from booking flow but preserved in database
- Existing service pricing remains but won't be shown in active lists

**Error Response**:
```json
{
  "status": 409,
  "message": "Cannot deactivate service with existing bookings. Consider marking as inactive to hide from new bookings."
}
```

---

## ✅ Implementation Checklist

### Phase 1: Database & Core Setup

- [ ] **1.1 Database Migration**
  - [ ] Add `isActive` field to Service model in `schema.prisma`
  - [ ] Run migration: `npx prisma migrate dev --name add_is_active_to_services`
  - [ ] Update seed data with `isActive: true` for all services
  - [ ] Verify migration in development database

- [ ] **1.2 DTOs Creation**
  - [ ] `create-service.dto.ts` (admin - includes customerId)
  - [ ] `create-customer-service.dto.ts` (customer-scoped - no customerId)
  - [ ] `update-service.dto.ts` (all fields optional)
  - [ ] `service-response.dto.ts` (API response format)
  - [ ] `services-list-response.dto.ts` (paginated list response)
  - [ ] `create-service-pricing.dto.ts` (branchId + price)
  - [ ] `update-service-pricing.dto.ts` (price only)
  - [ ] `service-pricing-response.dto.ts` (pricing details)
  - [ ] `branch-services-response.dto.ts` (branch + services with pricing)

- [ ] **1.3 Entity Classes**
  - [ ] `service.entity.ts` (transform Prisma Service to API response)
  - [ ] `service-pricing.entity.ts` (transform Prisma ServicePricing)

---

### Phase 2: Service Layer Implementation

- [ ] **2.1 ServicesService Core Methods**
  - [ ] `findAll(customerId?, page, limit, isActive?)` - List services
  - [ ] `findOne(id, customerId?)` - Get single service
  - [ ] `create(createServiceDto)` - Create service (admin)
  - [ ] `createForCustomer(createCustomerServiceDto, customerId)` - Customer-scoped create
  - [ ] `update(id, updateServiceDto, customerId?)` - Update service
  - [ ] `remove(id, customerId?)` - Deactivate service (with booking validation)
  - [ ] `validateServiceBelongsToCustomer(serviceId, customerId)` - Helper method
  - [ ] `validateUniqueServiceName(name, customerId, excludeId?)` - Helper method

- [ ] **2.2 ServicePricing Methods**
  - [ ] `setPricing(serviceId, createPricingDto, customerId)` - Upsert pricing
  - [ ] `getPricing(serviceId, branchId, customerId)` - Get specific pricing
  - [ ] `listPricingForService(serviceId, customerId)` - All branch prices for service
  - [ ] `removePricing(serviceId, branchId, customerId)` - Delete pricing
  - [ ] `getServicesWithPricingForBranch(branchId, customerId)` - Branch service menu

- [ ] **2.3 Business Logic Validation**
  - [ ] Validate customer exists when creating service
  - [ ] Validate branch belongs to customer when setting pricing
  - [ ] Validate service has no bookings before deactivation
  - [ ] Validate service name uniqueness per customer
  - [ ] Validate duration constraints (5-480 minutes)
  - [ ] Validate price constraints (0.01-9999.99)

---

### Phase 3: Controller Implementation

- [ ] **3.1 Admin Endpoints** (ServicesController)
  - [ ] `GET /api/services` - List all services
  - [ ] `POST /api/services` - Create service (with customerId)
  - [ ] `GET /api/services/:id` - Get service
  - [ ] `PATCH /api/services/:id` - Update service
  - [ ] `DELETE /api/services/:id` - Deactivate service

- [ ] **3.2 Customer-Scoped Endpoints** (Same controller, different routes)
  - [ ] `GET /api/salon/:customerSlug/services` - List customer services
  - [ ] `POST /api/salon/:customerSlug/services` - Create customer service
  - [ ] `GET /api/salon/:customerSlug/services/:id` - Get customer service
  - [ ] `PATCH /api/salon/:customerSlug/services/:id` - Update customer service
  - [ ] `DELETE /api/salon/:customerSlug/services/:id` - Deactivate customer service

- [ ] **3.3 Branch-Specific Endpoints**
  - [ ] `GET /api/salon/:customerSlug/branches/:branchId/services` - Services with pricing
  - [ ] `POST /api/salon/:customerSlug/services/:serviceId/pricing` - Set/update pricing
  - [ ] `GET /api/salon/:customerSlug/services/:serviceId/pricing/:branchId` - Get pricing
  - [ ] `DELETE /api/salon/:customerSlug/services/:serviceId/pricing/:branchId` - Remove pricing

- [ ] **3.4 Guard Configuration**
  - [ ] Admin endpoints: `@UseGuards(JwtAuthGuard, GlobalAdminGuard)`
  - [ ] Customer endpoints: `@UseGuards(JwtAuthGuard, CustomerContextGuard, RolesGuard)`
  - [ ] Role restrictions: `@Roles('ADMIN')` for create/update/delete
  - [ ] Public endpoints: None (all require authentication)

---

### Phase 4: Swagger Documentation

- [ ] **4.1 Controller Decorators**
  - [ ] `@ApiTags('Services')` on controller class
  - [ ] `@ApiOperation()` for each endpoint with clear description
  - [ ] `@ApiResponse()` for success cases (200, 201, 204)
  - [ ] `@ApiResponse()` for error cases (400, 403, 404, 409, 422)
  - [ ] `@ApiBearerAuth('JWT-auth')` on protected endpoints
  - [ ] `@ApiQuery()` for query parameters (page, limit, isActive, branchId)
  - [ ] `@ApiParam()` for path parameters (customerSlug, id, branchId, serviceId)

- [ ] **4.2 DTO Decorators**
  - [ ] `@ApiProperty()` on all DTO fields with examples
  - [ ] `@ApiPropertyOptional()` for optional fields
  - [ ] Validation decorators: `@IsString()`, `@IsNumber()`, `@Min()`, `@Max()`, etc.
  - [ ] Custom validators for price format and duration ranges

---

### Phase 5: Contract Testing

- [ ] **5.1 Test File Setup**
  - [ ] Create `services.contract.test.ts` using contract test helper
  - [ ] Set up test database cleanup/seeding
  - [ ] Create test customer, branches, services, and pricing fixtures

- [ ] **5.2 Admin Endpoint Tests** (10+ tests)
  - [ ] List all services (paginated response structure)
  - [ ] Create service with valid data (201 response)
  - [ ] Create service with duplicate name (409 error)
  - [ ] Create service with invalid customerId (404 error)
  - [ ] Get service by ID (200 response)
  - [ ] Update service (200 response)
  - [ ] Deactivate service without bookings (204 response)
  - [ ] Deactivate service with bookings (409 error)
  - [ ] Invalid authentication (401 error)
  - [ ] Non-admin user access (403 error)

- [ ] **5.3 Customer-Scoped Endpoint Tests** (12+ tests)
  - [ ] List customer services (filtered by customerId)
  - [ ] List customer services with branch pricing included
  - [ ] Create customer service (customerId from context)
  - [ ] Get customer service (customer validation)
  - [ ] Update customer service
  - [ ] Deactivate customer service
  - [ ] Access service from different customer (403 error)
  - [ ] Invalid customer slug (404 error)
  - [ ] CLIENT role read access (200 response)
  - [ ] CLIENT role create attempt (403 error)
  - [ ] Pagination validation
  - [ ] isActive filter validation

- [ ] **5.4 Branch-Specific Endpoint Tests** (10+ tests)
  - [ ] List services for branch with pricing
  - [ ] Create service pricing for branch (201 response)
  - [ ] Update existing pricing (200 response)
  - [ ] Get specific service pricing for branch
  - [ ] Delete service pricing (204 response)
  - [ ] Create pricing for branch in different customer (400 error)
  - [ ] Create pricing with invalid price format (422 error)
  - [ ] Access branch services from different customer (403 error)
  - [ ] List services shows only active services
  - [ ] Pricing operations require ADMIN role

- [ ] **5.5 Edge Cases & Validation Tests** (8+ tests)
  - [ ] Service name length validation (min/max)
  - [ ] Duration validation (min 5, max 480 minutes)
  - [ ] Price validation (min 0.01, max 9999.99, 2 decimals)
  - [ ] isActive field defaults to true
  - [ ] Service ordering by displayId then name
  - [ ] Empty results with pagination metadata
  - [ ] Invalid CUID format handling
  - [ ] Decimal precision for price field

**Total Expected Tests**: 40+ contract tests

---

### Phase 6: Integration & Finalization

- [ ] **6.1 Module Registration**
  - [ ] Import ServicesModule in AppModule
  - [ ] Verify DatabaseModule dependency injection
  - [ ] Verify BranchesService injection for validation

- [ ] **6.2 Postman Collection Update**
  - [ ] Add all service endpoints to collection
  - [ ] Add example requests and responses
  - [ ] Add pricing management endpoints
  - [ ] Add branch services query endpoints
  - [ ] Update environment variables if needed

- [ ] **6.3 Documentation Updates**
  - [ ] Update `docs/backend/technical.md` with Services module details
  - [ ] Update `docs/backend/status.md` marking Phase 3 complete
  - [ ] Update `docs/backend/implementationHistory.md` with implementation notes
  - [ ] Document design decisions in technical docs
  - [ ] Add Services module to architecture diagram

- [ ] **6.4 Code Quality**
  - [ ] Run `npm run lint` and fix all issues
  - [ ] Run `npm test` and ensure all tests pass (including new service tests)
  - [ ] Verify TypeScript compilation without errors
  - [ ] Run `npm run test:ci` for coverage report
  - [ ] Ensure code follows SOLID principles
  - [ ] Add JSDoc comments to complex methods

- [ ] **6.5 Manual Testing**
  - [ ] Test service creation via Swagger UI
  - [ ] Test pricing management workflow
  - [ ] Test branch services listing with pricing
  - [ ] Test customer context validation
  - [ ] Test role-based access control
  - [ ] Verify error messages are clear and helpful
  - [ ] Test pagination with different page sizes

---

## 🧪 Testing Strategy

### Contract Test Coverage Requirements

**Target**: 40+ contract tests covering all endpoints and edge cases

**Test Categories**:

1. **Authentication & Authorization** (8 tests)
   - JWT validation for all protected endpoints
   - Global admin access validation
   - Customer context validation
   - Role-based access (ADMIN vs CLIENT)
   - Cross-customer access prevention

2. **Service CRUD Operations** (12 tests)
   - Create service (admin and customer-scoped)
   - Read service (single and list)
   - Update service (full and partial)
   - Deactivate service (with and without bookings)
   - Validation errors

3. **Pricing Management** (10 tests)
   - Create pricing
   - Update pricing (upsert behavior)
   - Read pricing (single and list)
   - Delete pricing
   - Branch-service relationship validation

4. **Branch Services Queries** (5 tests)
   - List services with pricing for branch
   - Active services filtering
   - Empty results handling
   - Cross-customer branch access prevention

5. **Validation & Edge Cases** (10+ tests)
   - Field length validations
   - Numeric range validations
   - Decimal precision validations
   - Duplicate name validation
   - Sorting and pagination
   - isActive filtering

**Test Data Strategy**:
- Use deterministic test data (no random generation)
- Create minimal fixtures for each test scenario
- Clean up test data after each suite
- Use transaction rollback where possible

**Example Test Structure**:
```typescript
describe('Services API Contract', () => {
  let app: INestApplication;
  let adminToken: string;
  let clientToken: string;
  let testCustomer: Customer;
  let testBranch: Branch;
  let testService: Service;

  beforeAll(async () => {
    // Setup test app and fixtures
  });

  afterAll(async () => {
    // Cleanup
  });

  describe('POST /api/services (Admin)', () => {
    it('should create service with valid data', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Service',
          description: 'Test description',
          duration: 30,
          customerId: testCustomer.id,
        })
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        name: 'Test Service',
        duration: 30,
        isActive: true,
      });
    });

    it('should return 409 for duplicate service name', async () => {
      // ... test implementation
    });
  });
});
```

---

## 🔮 Future Enhancements (Post-v1)

### Documented for Future Implementation

#### 1. **Service-Professional Relationship**

**Problem**: Not all professionals can perform all services

**Solution**: Add `ServiceProfessional` junction table

```prisma
model ServiceProfessional {
  id             String       @id @default(cuid())
  displayId      Int          @default(autoincrement()) @unique
  serviceId      String
  professionalId String
  certifiedAt    DateTime?    // Certification/training date
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  service        Service      @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  professional   Professional @relation(fields: [professionalId], references: [id], onDelete: Cascade)

  @@unique([serviceId, professionalId])
  @@map("service_professionals")
}
```

**Impact**:
- Booking availability logic must check professional can perform service
- Admin UI for managing professional certifications
- Service catalog shows "available professionals" count

---

#### 2. **Service Categories**

**Problem**: Services need grouping (Haircuts, Grooming, Styling, etc.)

**Solution**: Add `ServiceCategory` model

```prisma
model ServiceCategory {
  id          String    @id @default(cuid())
  displayId   Int       @default(autoincrement()) @unique
  name        String
  description String?
  displayOrder Int      @default(0)
  customerId  String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  customer    Customer  @relation(fields: [customerId], references: [id], onDelete: Cascade)
  services    Service[]

  @@unique([name, customerId])
  @@map("service_categories")
}

// Add to Service model
model Service {
  // ... existing fields
  categoryId  String?
  category    ServiceCategory? @relation(fields: [categoryId], references: [id])
}
```

---

#### 3. **Advanced Pricing Rules**

**Problem**: Need time-based, professional-level, or promotional pricing

**Solution**: Add `PricingRule` model with conditions

```prisma
model ServicePricingRule {
  id          String   @id @default(cuid())
  displayId   Int      @default(autoincrement()) @unique
  serviceId   String
  branchId    String
  basePrice   Decimal  @db.Decimal(10, 2)
  
  // Conditional pricing
  conditions  Json     // { dayOfWeek?, timeRange?, professionalLevel?, promotionCode? }
  
  priority    Int      @default(0)  // Higher priority rules apply first
  validFrom   DateTime?
  validUntil  DateTime?
  isActive    Boolean  @default(true)
  
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  service     Service  @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  branch      Branch   @relation(fields: [branchId], references: [id], onDelete: Cascade)

  @@map("service_pricing_rules")
}
```

**Example Conditions**:
```json
{
  "dayOfWeek": ["Saturday", "Sunday"],
  "timeRange": { "start": "18:00", "end": "22:00" },
  "professionalLevel": "senior",
  "surcharge": 10.00
}
```

---

#### 4. **Custom Service Ordering**

**Problem**: Customers want manual service menu ordering

**Solution**: Add `displayOrder` field to Service model

```prisma
model Service {
  // ... existing fields
  displayOrder Int @default(0)
}

// Update ordering query
orderBy: [
  { displayOrder: 'asc' },  // Custom order (priority)
  { displayId: 'asc' },     // Creation order (fallback)
  { name: 'asc' },          // Name (final fallback)
]
```

**Admin UI**: Drag-and-drop service ordering

---

#### 5. **Service Availability Schedules**

**Problem**: Some services only available at certain times/days

**Solution**: Add availability schedule to Service model

```prisma
model Service {
  // ... existing fields
  availability Json?  // { schedule: [{ dayOfWeek, startTime, endTime }] }
}
```

**Example**:
```json
{
  "schedule": [
    { "dayOfWeek": "Monday", "startTime": "09:00", "endTime": "18:00" },
    { "dayOfWeek": "Tuesday", "startTime": "09:00", "endTime": "18:00" }
  ]
}
```

**Impact**: Booking availability logic must check service schedule

---

## 📝 Implementation Notes

### Key Design Patterns

1. **Repository Pattern**: Service class wraps Prisma queries
2. **DTO Transformation**: Entity classes transform Prisma models to API responses
3. **Guard Composition**: Multiple guards for layered security
4. **Soft Delete**: isActive flag preserves data for auditing
5. **Optimistic Locking**: Use Prisma's updatedAt for conflict detection (future)

### Performance Considerations

1. **Indexing**: displayId and customerId already indexed by Prisma
2. **Pagination**: Default limit of 500 for frontend-first approach
3. **Eager Loading**: Include customer, pricing in single query when needed
4. **Caching**: Consider Redis for service catalog (future optimization)

### Error Handling Standards

- `400 Bad Request`: Invalid input format
- `401 Unauthorized`: Missing or invalid JWT
- `403 Forbidden`: Insufficient permissions or cross-customer access
- `404 Not Found`: Resource doesn't exist
- `409 Conflict`: Duplicate name or cannot delete due to dependencies
- `422 Unprocessable Entity`: Validation errors

---

## 🎯 Success Criteria

**Phase 3 Services Module is complete when**:

- ✅ All 40+ contract tests passing
- ✅ Swagger documentation complete with examples
- ✅ Postman collection updated and tested
- ✅ Code linting passes without errors
- ✅ TypeScript compilation clean
- ✅ Manual testing via Swagger UI successful
- ✅ Documentation updated (technical.md, status.md, implementationHistory.md)
- ✅ Architecture diagram includes Services module
- ✅ Service can be created and priced for branches
- ✅ Services appear in branch service listings with correct pricing
- ✅ Deactivation prevents deletion of services with bookings
- ✅ Customer-scoped operations properly isolated
- ✅ Role-based access control working (ADMIN vs CLIENT)

---

## 📅 Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1 | Database & Core Setup | 2 hours |
| Phase 2 | Service Layer Implementation | 4 hours |
| Phase 3 | Controller Implementation | 3 hours |
| Phase 4 | Swagger Documentation | 1 hour |
| Phase 5 | Contract Testing | 5 hours |
| Phase 6 | Integration & Finalization | 2 hours |
| **Total** | | **17 hours** |

**Sprint Allocation**: 2-3 days (allowing for testing, documentation, and unexpected issues)

---

## 🔗 Related Documentation

- [Business Rules](../businessRules.md)
- [Project Architecture](../projectArchitecture.md)
- [Backend Technical Documentation](./technical.md)
- [Backend Status Tracking](./status.md)
- [Implementation History](./implementationHistory.md)
- [Backend Architecture Diagram](./archictecture.mermaid)

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-25  
**Author**: Development Team  
**Status**: Planning Complete - Ready for Implementation

