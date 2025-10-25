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
- [x] **Customer-Linked Registration**: Multi-tenant user registration system
- [x] **Tests**: Contract tests for auth endpoints (following Health module pattern)

##### ✅ Customer-Linked Registration Implementation (Two-Step Flow)

**Registration Flow**:

```
POST /api/salon/acme/auth/register
├─ Validate customer 'acme' exists and is active
│  └─ 400 if invalid/inactive
├─ Check if user with email exists
│  ├─ No → Create new user + Link to customer → Return tokens (201)
│  └─ Yes → Already linked to this customer?
│     ├─ Yes → 409 "Already registered with this customer"
│     └─ No → Two-Step Flow:
│        ├─ Step 1: confirmLink=false (or missing)
│        │  └─ 428 "User already exists. Please confirm to link..."
│        └─ Step 2: confirmLink=true
│           └─ Update user data (name, phone) + Link to customer → Return tokens (201)
```

**API Endpoint**:

```typescript
POST /api/salon/:customerSlug/auth/register
Content-Type: application/json

Request Body (Step 1 - New User or Initial Attempt):
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe",
  "phone": "(11) 99999-9999"
}

Request Body (Step 2 - Confirm Link for Existing User):
{
  "email": "user@example.com",
  "password": "ignored",  // Password ignored for existing users
  "name": "John Doe Updated",
  "phone": "(11) 88888-8888",
  "confirmLink": true  // Required to proceed with linking
}

Response (201 - Success):
{
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "refreshToken": "eyJhbGciOiJIUzI1...",
    "userId": "user_123",
    "userName": "John Doe",
    "phone": "(11) 99999-9999",
    "customers": [
      {
        "id": "customer_acme",
        "displayId": 1,
        "name": "Acme Barbershop",
        "urlSlug": "acme",
        "logoUrl": "https://cdn.example.com/acme/logo.png"
      }
    ],
    "defaultCustomerId": "customer_acme"
  }
}

Response (428 - Confirmation Required):
{
  "status": 428,
  "message": "User already exists. Please confirm to link this account to the customer."
}
```

**Business Logic**:
- **New User Registration**: Creates user account + links to customer → Returns tokens (201)
- **Existing User Linking (Two-Step Flow)**:
  1. **First Attempt** (without confirmLink): Returns HTTP 428 Precondition Required
  2. **Second Attempt** (with confirmLink=true): Links existing user to new customer + updates profile → Returns tokens (201)
- Password is only used during initial user creation (ignored for existing users)
- User profile (name, phone) updated with latest registration data when linking
- Registration customer becomes the defaultCustomerId in JWT
- **UX Benefit**: Frontend can prompt user explicitly before linking accounts across customers

**Error Handling**:
- `400 Bad Request`: Customer not found or inactive
- `428 Precondition Required`: User exists, confirmation required to link (new)
- `409 Conflict`: User already registered with this customer

**Testing Coverage**:
- ✅ New user registration with customer link
- ✅ Existing user returns HTTP 428 without confirmLink
- ✅ Existing user linking to additional customer with confirmLink=true
- ✅ User profile (name, phone) updated when linking with confirmation
- ✅ Invalid customer slug validation
- ✅ Inactive customer rejection
- ✅ Duplicate registration prevention
- ✅ Login returns all linked customers
- ✅ JWT includes all customerIds
- ✅ All 87 tests passing (9 auth contract tests)

**Implementation Details**:

1. **DTO Enhancement** (`server/src/auth/dto/register.dto.ts`):
   ```typescript
   @ApiProperty({
     example: false,
     required: false,
     description: 'Confirms linking an existing user account to this customer...',
   })
   @IsOptional()
   @IsBoolean()
   confirmLink?: boolean;
   ```

2. **Custom Exception** (`server/src/common/exceptions/precondition-required.exception.ts`):
   ```typescript
   export class PreconditionRequiredException extends HttpException {
     constructor(message: string = 'Precondition Required') {
       super(message, 428); // HTTP 428 Precondition Required
     }
   }
   ```

3. **Service Logic** (`server/src/auth/auth.service.ts`):
   ```typescript
   if (existingUser) {
     // Check if already linked
     if (existingLink) {
       throw new ConflictException('Already registered with this customer');
     }
     
     // Two-step flow: require confirmation
     if (!registerDto.confirmLink) {
       throw new PreconditionRequiredException(
         'User already exists. Please confirm to link this account to the customer.',
       );
     }
     
     // Proceed with linking and profile update
     user = await this.db.user.update(...);
     await this.db.userCustomer.create(...);
   }
   ```

4. **API Documentation** (`server/src/auth/auth.controller.ts`):
   - Added `@ApiResponse` decorator for HTTP 428
   - Updated operation description to explain two-step flow
   - Enhanced examples and error scenarios

5. **Contract Tests** (`server/src/auth/auth.contract.test.ts`):
   - Test for HTTP 428 response without confirmLink
   - Test for successful linking with confirmLink=true
   - Test for profile updates during linking
   - All edge cases covered

**Files Modified**:
- `server/src/auth/dto/register.dto.ts` - Added confirmLink field
- `server/src/common/exceptions/precondition-required.exception.ts` - Created custom exception
- `server/src/auth/auth.service.ts` - Implemented two-step flow logic
- `server/src/auth/auth.controller.ts` - Updated API documentation
- `server/src/auth/auth.contract.test.ts` - Enhanced test coverage (9 tests)

#### Step 2.4: Customers Module

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

// DOCUMENT THE CUSTOMER MODULE STRUCTURE

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

##### 📊 **Pagination Configuration**

**Updated Default Limits for Frontend-First Approach:**

```typescript
// Professionals Module
async findAll(customerId?: string, page = 1, limit = 1000) // High limit for frontend loading

// Branches Module
async findAll(page = 1, limit = 500) // High limit for admin management
async findByCustomer(customerId: string, page = 1, limit = 500) // High limit for customer context
```

**Pagination Features:**

- ✅ High default limits (1000 professionals, 500 branches) for initial frontend implementation
- ✅ Optional pagination parameters in API endpoints
- ✅ Consistent pagination across all list endpoints
- ✅ Proper API documentation with query parameter examples
- ✅ Ready for future pagination UI implementation in frontend

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
- [x] POST /api/customers/:id/branding (initial setup)
- [x] PUT /api/customers/:id/branding/config (config updates)
- [x] POST /api/customers/:id/branding/upload (file updates)
- [x] File validation: size limits, type checking, customer ownership
- [ ] Local file storage with URL generation working
- [ ] Frontend can fetch and apply complete customer branding
- [x] System handles missing/invalid customers gracefully

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

#### Step 3.1: Professionals Module ✅ COMPLETED

- [x] **Database Schema Updated**: Modified Professional model to support multiple branches per customer
  - ✅ Created ProfessionalBranch junction table for many-to-many relationship
  - ✅ Removed single branchId field, added branches array relationship
  - ✅ Added `documentId` field for professional identification (CPF, SSN, license numbers, etc.)
  - ✅ Unique constraint on `[documentId, customerId]` to prevent duplicates per customer
  - ✅ Database schema pushed successfully with `prisma db push`

- [x] **Professional CRUD with branch association**
  - ✅ Admin endpoints: `/api/professionals/*` (full CRUD)
  - ✅ Customer-scoped endpoints: `/api/salon/{customerSlug}/professionals/*`
  - ✅ Branch-specific endpoints: `/api/salon/{customerSlug}/branches/{branchId}/professionals`
  - ✅ Multiple branches per professional supported
  - ✅ Branch validation ensures branches belong to same customer
  - ✅ Customer existence validation returns 404 (not 400) for invalid customer IDs
  - ✅ DocumentId uniqueness validation per customer

- [x] **Photo upload handling (complete with validation)**
  - ✅ File upload endpoint: `POST /api/professionals/{id}/photo`
  - ✅ Photo deletion endpoint: `DELETE /api/professionals/{id}/photo`
  - ✅ File storage in `professionals/{customerId}/` directory
  - ✅ Automatic cleanup of old photos
  - ✅ **File type validation**: Only PNG, JPG, JPEG, WebP allowed
  - ✅ **File size validation**: 5MB maximum
  - ✅ **MIME type validation**: Double-check for security
  - ✅ **Extension validation**: Prevents file type spoofing

- [x] **Active/inactive status management**
  - ✅ Soft delete implementation (deactivate instead of hard delete)
  - ✅ Validation to prevent deletion of professionals with bookings
  - ✅ Status filtering in API responses
  - ⚠️ Note: Uses `isActive` flag, not `deletedAt` timestamp (differs from Branch model)

- [x] **Pagination Configuration**
  - ✅ Default limit: **1000 professionals** (frontend-first implementation)
  - ✅ Optional `page` and `limit` query parameters
  - ✅ Consistent pagination across admin and customer-scoped endpoints
  - ✅ Branches default limit: **500** (as per requirements)

- [x] **Tests & Documentation**
  - ✅ Comprehensive contract tests covering all endpoints
  - ✅ Admin and customer context testing
  - ✅ Multiple branches per professional scenarios
  - ✅ Photo upload validation
  - ✅ Error handling validation
  - ✅ Complete curl-based testing plan created (`PROFESSIONAL_TESTING_PLAN.md`)
  - ✅ Swagger/OpenAPI documentation updated
  - ✅ Postman collection updated with all new endpoints

**Key Business Features Implemented:**

- ✅ Professionals can work at multiple branches of the same customer
- ✅ Professional document ID (CPF/SSN/license) support with uniqueness validation
- ✅ Duplicate name prevention per customer
- ✅ Cannot delete professionals with active bookings
- ✅ Role-based access control (ADMIN can create/update/delete, CLIENTs can only read)
- ✅ Customer context enforcement in all scoped endpoints
- ✅ High pagination limits for frontend data loading without immediate pagination UI

##### ✅ **PROFESSIONALS MODULE IMPLEMENTATION COMPLETE**

**Implementation Summary:**

- ✅ **Database Schema**: Modified Professional model to support multiple branches per customer via ProfessionalBranch junction table
- ✅ **Full CRUD Operations**: Complete create, read, update, delete functionality with proper validation
- ✅ **Multi-Branch Support**: Professionals can work at multiple branches of the same customer
- ✅ **Photo Management**: File upload, deletion, and storage with automatic cleanup
- ✅ **Role-Based Access**: Admin-only management with customer-scoped operations
- ✅ **Contract Testing**: Comprehensive test coverage for all endpoints and scenarios
- ✅ **Linting Compliance**: All code style issues resolved
- ✅ **Postman Collection**: Complete API documentation with examples
- ✅ **High Default Limits**: 1000 professionals, 500 branches for frontend-first approach

**API Endpoints Implemented:**

- `GET /api/professionals` - List all professionals (Admin)
- `POST /api/professionals` - Create professional (Admin)
- `GET /api/professionals/:id` - Get professional by ID (Admin)
- `PATCH /api/professionals/:id` - Update professional (Admin)
- `DELETE /api/professionals/:id` - Deactivate professional (Admin)
- `POST /api/professionals/:id/photo` - Upload photo (Admin)
- `DELETE /api/professionals/:id/photo` - Delete photo (Admin)
- `GET /api/salon/:customerSlug/professionals` - List customer professionals
- `POST /api/salon/:customerSlug/professionals` - Create customer professional
- `GET /api/salon/:customerSlug/professionals/:id` - Get customer professional
- `PATCH /api/salon/:customerSlug/professionals/:id` - Update customer professional
- `DELETE /api/salon/:customerSlug/professionals/:id` - Deactivate customer professional
- `GET /api/salon/:customerSlug/branches/:branchId/professionals` - List branch professionals

**Key Achievements:**

- ✅ **Scalable Architecture**: Supports professionals working across multiple branches
- ✅ **Production Ready**: Full validation, error handling, and security
- ✅ **Frontend Optimized**: High pagination limits for initial implementation
- ✅ **Comprehensive Testing**: Contract tests ensure API reliability
- ✅ **Documentation Complete**: Swagger docs and Postman collection updated

#### Step 3.2: Services Module Planning (October 25, 2025)

**Implementation Date**: October 25, 2025  
**Status**: Planning Complete - Ready for Implementation  
**Estimated Implementation Time**: 17 hours (2-3 days)

#### Planning Session Design Decisions

**1. Soft Delete Strategy: `isActive` Boolean** ✅

**Decision**: Add `isActive` boolean field to Service model (matching Professional pattern)

**Rationale**: 
- Inconsistency identified: Branch uses `deletedAt`, Professional uses `isActive`, Service had neither
- Chose `isActive` to match Professional model since services are "resources" like professionals
- Simpler frontend filtering and state management
- Developer familiarity through consistency

**2. Service Deactivation Business Rule** ✅

**Decision**: Prevent deactivation if service has ANY bookings (past or future)

**Rationale**:
- Preserves booking history integrity
- Prevents data anomalies (orphaned booking references)
- Clear, simple business rule: "Cannot remove services with booking history"
- Aligns with Professional deletion behavior
- Returns HTTP 409 Conflict with clear error message

**3. Simplified Pricing Model (v1)** ✅

**Decision**: Keep one price per service-branch combination

**Accepted Limitations for v1**:
- ❌ No professional-level pricing (junior vs senior rates)
- ❌ No time-based pricing (peak hours, weekend rates)
- ❌ No promotional pricing periods

**Benefits**:
- Simple to implement and understand
- Clear business rule enforcement via `@@unique([serviceId, branchId])`
- Easy frontend caching and display
- Aligns with "simplified business logic" principle

**Future Enhancement Path**: Documented `ServicePricingRule` table with conditional pricing

**4. Service-Professional Relationship (v1)** ✅

**Decision**: No explicit relationship - all professionals can perform all services at their branches

**Rationale**:
- Simplifies availability calculation in Phase 4 (Booking Module)
- Matches simplified barbershop business model
- Fewer database queries for booking availability
- Easier scheduling logic

**Documented for Future Enhancement**: `ServiceProfessional` junction table for skill restrictions, certifications, and specializations

**5. Service Ordering Strategy** ✅

**Decision**: Dual sorting - displayId (primary) + name (secondary)

**Implementation**:
```typescript
orderBy: [
  { displayId: 'asc' },  // Creation order
  { name: 'asc' },       // Alphabetical fallback
]
```

**Benefits**:
- Shows service introduction timeline
- Alphabetical fallback for readability
- No additional `displayOrder` field needed for v1
- Deterministic sorting for UI consistency

**Future Enhancement**: Add explicit `displayOrder` field for custom drag-and-drop menu arrangement

#### Documentation Created

1. **SERVICE_MODULE_IMPLEMENTATION_PLAN.md** (Comprehensive 500+ line plan)
   - Database schema changes
   - 14 API endpoint specifications
   - DTO and Entity class definitions
   - Service layer method signatures
   - Business validation rules
   - 40+ contract test specifications
   - Implementation phases with time estimates
   - Future enhancement documentation

2. **SERVICE_MODULE_QUICKREF.md** (Quick reference guide)
   - Design decisions summary table
   - API endpoints overview
   - Authentication matrix
   - Implementation checklist
   - Testing strategy overview
   - Critical validation rules

3. **Updated Task Tracking**
   - `tasks/backendTasks.md` - Detailed implementation phases
   - `docs/backend/status.md` - Progress tracking
   - Created 10 TODO items for implementation tracking

#### API Endpoints Designed (14 total)

**Admin (Global) - 5 endpoints**:
- `GET /api/services` - List all services (cross-customer)
- `POST /api/services` - Create service
- `GET /api/services/:id` - Get service
- `PATCH /api/services/:id` - Update service
- `DELETE /api/services/:id` - Deactivate service

**Customer-Scoped - 5 endpoints**:
- `GET /api/salon/:slug/services` - List customer services
- `POST /api/salon/:slug/services` - Create customer service
- `GET /api/salon/:slug/services/:id` - Get customer service
- `PATCH /api/salon/:slug/services/:id` - Update customer service
- `DELETE /api/salon/:slug/services/:id` - Deactivate customer service

**Branch + Pricing - 4 endpoints**:
- `GET /api/salon/:slug/branches/:branchId/services` - Services with pricing
- `POST /api/salon/:slug/services/:serviceId/pricing` - Set/update pricing
- `GET /api/salon/:slug/services/:serviceId/pricing/:branchId` - Get pricing
- `DELETE /api/salon/:slug/services/:serviceId/pricing/:branchId` - Remove pricing

#### Implementation Structure

**Files to Create**:
- 8 DTO files (create, update, response DTOs for services and pricing)
- 2 Entity classes (service, service-pricing)
- 3 Core files (service, controller, module)
- 1 Test file (40+ contract tests)

**Key Business Validations**:
- Service name: 2-100 characters, unique per customer
- Duration: 5-480 minutes (8 hours max)
- Price: 0.01-9999.99 (2 decimals)
- Deactivation: Prevented if bookings exist
- Pricing: Branch must belong to same customer as service

#### Testing Strategy

**Target**: 40+ contract tests

**Test Categories**:
1. Authentication & Authorization (8 tests)
2. Service CRUD Operations (12 tests)
3. Pricing Management (10 tests)
4. Branch Services Queries (5 tests)
5. Validation & Edge Cases (10+ tests)

**Test Approach**:
- Deterministic test data (no random generation)
- Minimal fixtures per scenario
- Transaction rollback for cleanup
- Following Professional module test pattern

#### Success Criteria Defined

- ✅ All 40+ contract tests passing
- ✅ Swagger documentation complete with examples
- ✅ Services can be created and priced per branch
- ✅ Deactivation prevented when bookings exist
- ✅ Customer-scoped operations properly isolated
- ✅ Role-based access control working (ADMIN vs CLIENT)
- ✅ Code quality checks passing
- ✅ Postman collection updated

#### Future Enhancements Documented

1. **ServiceProfessional** junction table - skill restrictions and certifications
2. **ServiceCategory** model - grouping and organization
3. **ServicePricingRule** model - conditional pricing (time, professional level, promotions)
4. **displayOrder** field - custom service menu arrangement
5. **Availability schedules** - time/day restrictions per service

#### Architecture Alignment

**Follows Established Patterns**:
- ✅ Dual Controller Pattern (Admin + Customer-Scoped)
- ✅ Multi-Tenancy via URL Slugs
- ✅ Dual ID Strategy (CUID + displayId)
- ✅ Response Wrapping via Interceptor
- ✅ Guard Composition (JWT + CustomerContext + Roles)
- ✅ Repository Pattern with Prisma
- ✅ DTO Transformation via Entity Classes

#### Next Steps

**Implementation Order**:
1. Database migration (add `isActive` field)
2. Create DTOs and Entity classes
3. Implement service layer with business validations
4. Create controller with all 14 endpoints
5. Add Swagger documentation
6. Write 40+ contract tests
7. Update Postman collection
8. Final documentation updates

**Estimated Timeline**: 17 hours over 2-3 days

---

### Phase 4: Advanced Features (Week 4)

#### Step 4.2: API Documentation

- [x] Swagger/OpenAPI setup in main.ts
- [x] DTO documentation
- [x] API endpoint descriptions

#### Step 4.3: Validation & Error Handling

- [x] Global validation pipes
- [x] Error response standardization
- [x] Input sanitization