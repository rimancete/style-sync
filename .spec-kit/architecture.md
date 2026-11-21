<!-- spec-kit: architecture -->
<!-- version: 1.2 -->
<!-- last-updated: 2026-11-14 -->
<!-- updated-by: agent -->

# Architecture

## System Overview

StyleSync is a fullstack monorepo managed with **pnpm workspaces**.

| Workspace | Folder | Technology | Deployment Unit |
|-----------|--------|------------|-----------------|
| `style-sync-server` | `server/` | NestJS 11 + TypeScript | Node.js API server |
| `style-sync-client` | `client/` | React 19 + Vite | Static SPA |

Communication: REST over HTTP. The frontend calls the backend via native `Fetch` using the `api` facade. No tRPC, GraphQL, or WebSockets.

Local dev startup:
```bash
docker compose -f docker/docker-compose.yml up -d   # PostgreSQL on port 5433
pnpm install
# In server/: cp env.template .env && pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed
pnpm dev   # starts both client (port 3000) and server (port 3001) in parallel
```

---

## Backend Architecture

**Type**: Modular Monolith with URL-based multi-tenancy

### Layers

```
HTTP Request
  → CORS Middleware
  → GlobalPrefix (/api)
  → ThrottlerGuard (rate limiting)
  → JwtAuthGuard (validates JWT)
  → CustomerContextGuard (resolves tenant, injects activeCustomerId)
  → RolesGuard (CLIENT | STAFF | ADMIN)
  → Controller (validates DTO, calls Service)
  → Service (business logic, calls DatabaseService)
  → DatabaseService (extends PrismaClient, PostgreSQL)
  → ResponseTransformInterceptor (wraps response in { data: ... })
```

Errors exit via `HttpExceptionFilter` which formats all HTTP errors consistently.

### Modules

| Module | Path | Responsibility |
|--------|------|----------------|
| `AuthModule` | `src/auth/` | JWT login, refresh, customer-scoped registration, bcrypt hashing |
| `CustomersModule` | `src/customers/` | Branding config, logo/favicon uploads, customer context lookup |
| `BranchesModule` | `src/branches/` | Location CRUD with soft delete, address validation, customer-scoped ops |
| `ProfessionalsModule` | `src/professionals/` | Staff CRUD, multi-branch assignment, photo uploads, isActive soft delete |
| `ServicesModule` | `src/services/` | Service catalog CRUD, location-based pricing (ServicePricing), isActive soft delete |
| `BookingsModule` | `src/bookings/` | Appointment booking, availability calculation, race condition prevention, token-based confirmation |
| `SchedulesModule` | `src/schedules/` | Internal service only (no HTTP endpoints). Reads BranchSchedule and ProfessionalSchedule for availability calculations in BookingsService |
| `CountriesModule` | `src/countries/` | ISO country codes and JSON-based address format validation rules |
| `HealthModule` | `src/health/` | `/api/health`, `/api/health/database`, `/api/health/detailed` |
| `DatabaseModule` | `src/database/` | PrismaClient lifecycle (connect, disconnect, health check) |
| `CommonModule` | `src/common/` | Shared guards, decorators, filters, interceptors, utils, types |

### Key Guards

| Guard | Purpose |
|-------|---------|
| `JwtAuthGuard` | Validates Bearer JWT; populates `request.user` |
| `CustomerContextGuard` | Extracts slug from URL (`/api/salon/:slug/…`), resolves customer, validates user has access, injects `user.activeCustomerId` |
| `RolesGuard` | Checks `user.role` (CLIENT, STAFF, ADMIN) against `@Roles()` decorator |
| `GlobalAdminGuard` | Admin-only cross-customer operations |
| `@Public()` decorator | Bypasses JwtAuthGuard for public endpoints |

### Data Flow: Customer-Scoped Request

```
GET /api/salon/barbershop-xyz/branches
1. JwtAuthGuard → validates token, populates user.customerIds
2. CustomerContextGuard → extracts "barbershop-xyz" → resolves Customer record
   → validates user.customerIds.includes(customer.id)
   → injects user.activeCustomerId
3. BranchesController → passes user.activeCustomerId to BranchesService
4. BranchesService → db.branch.findMany({ where: { customerId, deletedAt: null } })
5. ResponseTransformInterceptor → wraps in { data: [...] }
```

### Multi-Tenancy Isolation Layers

1. JWT payload contains `customerIds[]` — user can belong to multiple tenants
2. `CustomerContextGuard` validates URL slug and access
3. Service layer always filters by `customerId`
4. DB foreign key constraints enforce relationships

---

## Frontend Architecture

**Type**: Single-Page Application (SPA)

### Layers

```
Browser
  → TanStack Router (file-based routing, src/routes/)
  → Route Layout (authenticated vs public)
  → Screen Component (src/screens/)
  → api facade (src/api/)
  → Custom useQuery / useMutation wrappers
  → request() + errorTreatment()
  → Native Fetch → NestJS Backend
  → Zustand / Constate (global/page-level state)
  → notify / Toaster (mutation feedback)
  → shadcn/ui + Tailwind CSS (presentation)
```

### Route Structure

| Route | Screen | Auth | Role |
|-------|--------|------|------|
| `/` | redirect to salon or admin home | — | — |
| `/login` | `screens/Login/Login.tsx` | none | ADMIN, STAFF |
| `/select-company` | `screens/SelectCompany/SelectCompany.tsx` | JWT | ADMIN, STAFF |
| `/admin/*` | `AdminShell` + admin screens | JWT | ADMIN, STAFF |
| `/salon/$slug/login` | `screens/Login/Login.tsx` | none | CLIENT |
| `/salon/$slug/register` | `screens/Register/Register.tsx` | none | CLIENT |
| `/salon/$slug/*` | `ClientShell` + client screens | JWT + link | CLIENT |

### State Stores (Zustand)

| Store | File | Persisted | Purpose |
|-------|------|-----------|---------|
| `useAuthStore` | `store/authStore.ts` | localStorage (`StyleSync_Auth_Dev` via `VITE_AUTH_STORAGE_KEY`, v3) | session tokens, user profile, `role`/`email` from JWT, customers, active salon/company |
| `useThemeStore` | `store/themeStore.ts` | localStorage (`StyleSync_Theme_Dev` via `VITE_THEME_STORAGE_KEY`) | light/dark preference (OS default when unset) |
| `useBookingStore` | `store/bookingStore.ts` | no | multi-step booking funnel: branch → service → professional → dateTime |

### API Facade

`src/api/api.ts` is the single import point for all API operations:

```typescript
api.auth.login       // useLogin mutation (neutral or salon)
api.auth.register    // useRegister mutation
api.customers.mine   // useGetMyCustomers query
api.customers.brandingQueryOptions // public branding for loaders
api.branches.list    // useGetBranches query
api.services.list    // useGetServices query
api.professionals.list // useGetProfessionals query
api.bookings.create  // useCreateBooking mutation
```

Every hook accepts `mockData`. MSW and the `mockData` short-circuit run only when `VITE_ENABLE_MOCKS=true` (off by default).

### Multi-Tenancy / Theming on the Frontend

1. `/salon/$slug` loaders call `ensureQueryData(api.customers.brandingQueryOptions(slug))`
2. Unknown or inactive slugs render `SalonNotFoundScreen` on the system theme
3. `applyCustomerBranding` writes one `<style id="tenant-theme">` (`:root` + `:root.dark`) plus title/favicons; leaving the salon tree resets them
4. `themeStore` only owns light/dark preference; the OS scheme is the default until the user toggles

---

## Cross-Workspace Contracts

**Protocol**: REST/JSON

**Authentication header**: `Authorization: Bearer <JWT>`

**Response envelope** (all success responses):
```json
{ "data": <payload> }
```

**Error response**:
```json
{ "status": 404, "message": "..." }
```

**Validation error** (HTTP 422):
```json
{ "status": 422, "message": "Validation failed", "errors": { "field": ["msg"] } }
```

**Contract management**: Manual — the developer keeps frontend TypeScript types in sync with backend DTOs. No codegen, no shared types package.

**Drift detection**: Backend contract tests (`*.contract.test.ts`) catch regressions on the server side. Frontend compilation errors surface type mismatches.

**No-content**: DELETE operations return HTTP 204 with empty body.

**Field naming**: `camelCase` throughout.
