<!-- spec-kit: endpoints -->
<!-- version: 1.1 -->
<!-- last-updated: 2026-08-15 -->
<!-- updated-by: agent -->

# Endpoints

## Backend Routes

Global prefix: `/api`. All responses wrapped in `{ "data": ... }` except `/health` and 204 responses.

### Public Endpoints (no auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/health` | Basic liveness check |
| GET | `/api/health/database` | Database connectivity |
| GET | `/api/health/detailed` | Full system status |
| POST | `/api/auth/login` | User login → access + refresh tokens |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/salon/:customerSlug/auth/register` | Customer-scoped user registration (creates or links user) |
| GET | `/api/customers/branding/:slug` | Get tenant branding config (logo, colors, favicons) |
| GET | `/api/salon/:customerSlug/availability` | Public availability check for a branch+service+date |

### Admin Endpoints (JWT + ADMIN role)

#### Countries

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/countries` | List all countries |
| POST | `/api/countries` | Create country |
| GET | `/api/countries/:code` | Get country by ISO code |
| PATCH | `/api/countries/:id` | Update country |
| DELETE | `/api/countries/:id` | Delete country |

#### Branches (cross-customer)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/branches` | List all branches |
| POST | `/api/branches` | Create branch (admin) |
| GET | `/api/branches/:id` | Get branch by CUID |
| PUT | `/api/branches/:id` | Update branch (full) |
| DELETE | `/api/branches/:id` | Soft-delete branch |

#### Professionals (cross-customer)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/professionals` | List all professionals |
| POST | `/api/professionals` | Create professional |
| GET | `/api/professionals/:id` | Get professional by CUID |
| PUT | `/api/professionals/:id` | Update professional |
| DELETE | `/api/professionals/:id` | Deactivate professional (isActive: false) |

#### Services (cross-customer)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/services` | List all services |
| POST | `/api/services` | Create service |
| GET | `/api/services/:id` | Get service by CUID |
| PATCH | `/api/services/:id` | Update service |
| DELETE | `/api/services/:id` | Deactivate service (blocked if bookings exist) |

#### Bookings (cross-customer)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/bookings` | List all bookings |
| POST | `/api/bookings` | Create booking (admin) |
| GET | `/api/bookings/:id` | Get booking by CUID |
| PATCH | `/api/bookings/:id` | Update booking |
| DELETE | `/api/bookings/:id` | Cancel booking |

### Customer-Scoped Endpoints (JWT + CustomerContextGuard + role check)

Guards: `JwtAuthGuard` → `CustomerContextGuard` (resolves slug → injects `activeCustomerId`) → `RolesGuard`

#### Branding

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/customers/context/:slug` | ADMIN | Get customer context |
| GET | `/api/customers/my-customers` | JWT | Get user's accessible customers |
| PUT | `/api/customers/:customerId/branding/config` | ADMIN | Update branding config (no files) |
| POST | `/api/customers/:customerId/branding` | ADMIN | Initial branding setup (files + config) |
| POST | `/api/customers/:customerId/branding/upload` | ADMIN | Update branding files |

#### Branches

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/salon/:slug/branches` | JWT | List branches for customer |
| POST | `/api/salon/:slug/branches` | ADMIN | Create branch |
| GET | `/api/salon/:slug/branches/:id` | JWT | Get branch |
| PATCH | `/api/salon/:slug/branches/:id` | ADMIN | Update branch |
| DELETE | `/api/salon/:slug/branches/:id` | ADMIN | Soft-delete branch |
| GET | `/api/salon/:slug/branches/:id/professionals` | JWT | Professionals at branch |

#### Professionals

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/salon/:slug/professionals` | JWT | List customer professionals |
| POST | `/api/salon/:slug/professionals` | ADMIN | Create professional |
| GET | `/api/salon/:slug/professionals/:id` | JWT | Get professional |
| PATCH | `/api/salon/:slug/professionals/:id` | ADMIN | Update professional |
| DELETE | `/api/salon/:slug/professionals/:id` | ADMIN | Deactivate professional |

#### Services

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/salon/:slug/services` | JWT | List customer services |
| POST | `/api/salon/:slug/services` | ADMIN | Create service |
| GET | `/api/salon/:slug/services/:id` | JWT | Get service |
| PATCH | `/api/salon/:slug/services/:id` | ADMIN | Update service |
| DELETE | `/api/salon/:slug/services/:id` | ADMIN | Deactivate service |
| GET | `/api/salon/:slug/branches/:branchId/services` | JWT | Services with branch pricing |
| POST | `/api/salon/:slug/services/:serviceId/pricing` | ADMIN | Set/update branch pricing |
| GET | `/api/salon/:slug/services/:serviceId/pricing/:branchId` | JWT | Get pricing for service+branch |
| DELETE | `/api/salon/:slug/services/:serviceId/pricing/:branchId` | ADMIN | Remove pricing |

#### Bookings

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/salon/:slug/bookings` | ADMIN | List customer bookings |
| POST | `/api/salon/:slug/bookings` | CLIENT | Create booking (→ PENDING + confirmationToken) |
| GET | `/api/salon/:slug/bookings/:id` | JWT | Get booking |
| PATCH | `/api/salon/:slug/bookings/:id` | ADMIN | Update booking |
| DELETE | `/api/salon/:slug/bookings/:id` | CLIENT/ADMIN | Cancel booking |
| GET | `/api/salon/:slug/bookings/my` | CLIENT | User's own bookings |
| POST | `/api/salon/:slug/bookings/confirm` | PUBLIC | Confirm booking by token (→ CONFIRMED) |
| DELETE | `/api/salon/:slug/bookings/cancel/:token` | PUBLIC | Cancel booking by token |
| GET | `/api/salon/:slug/bookings/token/:token` | PUBLIC | Get booking details by confirmation token |
| GET | `/api/salon/:slug/availability` | PUBLIC | Available time slots for branch+service+date |

---

## Frontend Routes

| Path | Component | Auth Guard | Purpose |
|------|-----------|------------|---------|
| `/` | `routes/index.tsx` | — | Redirect (to login or dashboard) |
| `/_public/login` | `screens/Login/Login.tsx` | none | Login form |
| `/_public/register` | `screens/Register/Register.tsx` | none | Registration form |
| `/_authenticated/admin` | `routes/_authenticated/admin/route.tsx` | JWT + ADMIN | Admin layout |
| `/_authenticated/admin/bookings` | `screens/Admin/Bookings/Bookings.tsx` | JWT + ADMIN | Booking management |
| `/_authenticated/admin/club` | `screens/Admin/Club/Club.tsx` | JWT + ADMIN | Club/customer config |
| `/_authenticated/admin/plan` | `screens/Admin/Plan/Plan.tsx` | JWT + ADMIN | Plan/subscription |
| `/_authenticated/admin/profile` | `screens/Admin/Profile/Profile.tsx` | JWT + ADMIN | Admin profile |
| `/_authenticated/user` | `routes/_authenticated/user/route.tsx` | JWT | User layout |
| `/_authenticated/user/profile` | `screens/User/Profile/Profile.tsx` | JWT | User profile |
| `/_authenticated/admin/home` | `screens/Admin/Home/Home.tsx` | JWT + ADMIN | Admin home |
| `/_authenticated/user/home` | `screens/User/Home/Home.tsx` | JWT | User home / booking flow |

> Note: Booking confirmation page (`/salon/:slug/bookings/confirm?token=...`) is not yet routed in the frontend. <!-- inferred — confirm with tech lead -->

---

## API Contracts

**Canonical source**: Backend DTOs in `server/src/*/dto/`

**Validation**: Backend contract tests (`server/src/**/*.contract.test.ts`) are the source of truth for API behaviour. Any endpoint change requires updating the corresponding contract test.

**Frontend types**: Manually maintained in `client/src/interfaces/` (currently empty) and inline in hook files.

**Drift prevention**: Backend contract tests catch regressions. Frontend TypeScript strict mode surfaces mismatches at compile time.

**No codegen** currently. OpenAPI spec available at `/api/docs` in development/staging.
