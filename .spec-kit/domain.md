<!-- spec-kit: domain -->
<!-- version: 1.0 -->
<!-- last-updated: 2026-06-27 -->
<!-- updated-by: agent -->

# Domain

## Shared Domain

### Glossary

| Term | Definition |
|------|-----------|
| **Customer** | A barbershop chain / tenant. Identified by `urlSlug` in URLs (e.g. `/salon/barbershop-xyz/…`). Has full branding config (colors, logo, favicon). |
| **Branch** | A physical location of a Customer. Has address, phone, timezone, schedule. A customer can have multiple branches. |
| **Professional** | A staff member (barber) belonging to a Customer, assignable to one or more Branches. Can have a schedule and photo. |
| **Service** | A service offering (e.g. "Haircut") belonging to a Customer. Has `duration` in minutes. Pricing is per-branch. |
| **Booking** | An appointment. Links User → Customer → Branch → Service → Optional Professional. Created as PENDING, confirmed via token. |
| **User** | An end-user. Can belong to multiple Customers (multi-tenant). Roles: CLIENT, STAFF, ADMIN. |
| **urlSlug** | Unique human-readable identifier for a Customer (e.g. `barbershop-xyz`). Used as URL path segment. Distinct from CUID `id`. |
| **displayId** | Auto-increment integer for human-facing references (e.g. "Booking #42"). Never used for lookups or FK references. |
| **CUID** | Primary key for all entities (e.g. `clg2a5d9i0002gtkb`). Non-enumerable, URL-safe. Always used in API calls. |
| **confirmationToken** | UUID generated at booking creation. Sent via email. Used to confirm or cancel a PENDING booking without auth. |
| **serviceSlug** | Does not exist — services are identified by CUID only. |
| **activeCustomerId** | The resolved Customer CUID injected into `request.user` by `CustomerContextGuard` after validating the URL slug. |
| **UserCustomer** | Junction table linking a User to a Customer. A User can have multiple UserCustomer records (one per tenant they belong to). |

### Booking Status Lifecycle

```
PENDING → CONFIRMED → COMPLETED
       ↘ CANCELLED       ↗ CANCELLED
```

- **PENDING**: Created. A `confirmationToken` is sent by email. Counted in conflict checks.
- **CONFIRMED**: Token validated and availability re-checked. Counted in conflict checks.
- **COMPLETED**: Appointment done. Not cancellable.
- **CANCELLED**: Soft-cancelled. Excluded from conflict checks.

---

## Backend Domain

### Entities (Prisma Models)

#### Customer (`customers` table)

```
id: CUID (PK)
displayId: Int (auto-increment, unique)
name: String
urlSlug: String (unique) ← tenant identifier in URLs
documentTitle, logoUrl, logoAlt, favicon32x32, favicon16x16, appleTouch: branding assets
primaryMain, primaryLight, primaryDark, primaryContrast: hex colors
secondaryMain, secondaryLight, secondaryDark, secondaryContrast: hex colors
backgroundColor: hex color
currency: ISO 4217 (default "USD")
defaultTimezone: IANA (default "UTC")
isActive: Boolean
```

#### Branch (`branches` table)

```
id: CUID
displayId: Int
name, phone: String
street, unit?, district?, city, stateProvince, postalCode, formattedAddress
timezone: IANA
countryCode, countryId (FK → Country)
customerId (FK → Customer)
deletedAt: DateTime? ← soft delete
```

Constraint: Cannot be deleted while active Professionals are assigned.

#### BranchSchedule (`branch_schedules` table)

```
id: CUID
branchId (FK → Branch, cascade delete)
dayOfWeek: Int (0=Sunday … 6=Saturday)
startTime, endTime: String (HH:mm)
isClosed: Boolean
@@unique([branchId, dayOfWeek])
```

#### Professional (`professionals` table)

```
id: CUID
displayId: Int
name: String
documentId?: String (CPF, SSN, etc.) — unique per customer
photoUrl?: String
isActive: Boolean ← soft delete
customerId (FK → Customer, cascade)
@@unique([documentId, customerId])
```

Constraint: Cannot be hard-deleted if bookings exist (use isActive: false).

#### ProfessionalBranch (`professional_branches` table)

Junction: Professional ↔ Branch. A professional can work at multiple branches of the same customer.
```
@@unique([professionalId, branchId])
```

#### ProfessionalSchedule (`professional_schedules` table)

```
id: CUID
professionalId (FK → Professional, cascade)
dayOfWeek: Int (0–6)
startTime, endTime: String (HH:mm)
breakStartTime?, breakEndTime?: String (HH:mm)
isClosed: Boolean
@@unique([professionalId, dayOfWeek])
```

#### Service (`services` table)

```
id: CUID
displayId: Int
name: String — unique per customer among active services
description?: String
duration: Int (minutes, 5–480)
isActive: Boolean
customerId (FK → Customer, cascade)
```

Rule: Active service names must be unique per customer. Inactive services don't block name reuse (seasonal/temporary services pattern).

#### ServicePricing (`service_pricing` table)

```
id: CUID
serviceId (FK → Service, cascade)
branchId (FK → Branch, cascade)
price: Decimal(10,2)
@@unique([serviceId, branchId])
```

One price per service+branch combination. Currency is on the Customer, not here.

#### Booking (`bookings` table)

```
id: CUID
displayId: Int
userId (FK → User, cascade)
customerId (FK → Customer, cascade) ← denormalized for perf
branchId (FK → Branch, cascade)
serviceId (FK → Service)
professionalId?: CUID (FK → Professional) ← null = "any available"
scheduledAt: DateTime (must be in the future)
status: BookingStatus (PENDING | CONFIRMED | COMPLETED | CANCELLED)
confirmationToken?: String (unique) ← UUID, sent by email
totalPrice: Decimal(10,2) ← snapshot at creation from ServicePricing
updatedAt: DateTime? ← null until first update
```

#### User (`users` table)

```
id: CUID
displayId: Int
email: String (unique)
password: String (bcrypt, 10 rounds)
name, phone?: String
role: UserRole (CLIENT | STAFF | ADMIN, default CLIENT)
```

#### UserCustomer (`user_customers` table)

Junction: User ↔ Customer.
```
@@unique([userId, customerId])
```

#### Country (`countries` table)

```
code: String (ISO, unique) ← lookup key
name: String
addressFormat: Json ← JSON schema for address validation per country
```

### Business Rules

1. **Double-booking prevention**: A User cannot have two overlapping bookings (PENDING or CONFIRMED) at the same time (`scheduledAt` + service `duration`).
2. **Race condition guard**: Availability is checked at booking CREATION and again at CONFIRMATION (via token). If availability changes between the two, confirmation fails.
3. **Professional auto-assignment**: When `professionalId` is null, the system finds the first available active professional at the branch for the requested slot. If none available → 409 Conflict.
4. **Price snapshot**: `totalPrice` is captured from `ServicePricing` at booking creation. Subsequent price changes don't affect existing bookings.
5. **Pricing required**: A booking cannot be created if `ServicePricing` for the service+branch combination does not exist.
6. **Cross-customer validation**: All entities in a booking (branch, service, professional) must belong to the same Customer.
7. **Soft delete cascade**: Deleting a Branch soft-deletes it; dependent pricing and schedules remain for historical bookings but are excluded from future queries.
8. **Cancellation**: Currently sets `status: CANCELLED`. No full cancellation policy implemented yet.
9. **Operating hours (v1 hardcoded)**: Availability slots generated 09:00–18:00, 30-minute intervals. Schedule-based hours not yet enforced at booking time.
10. **Reserved slugs**: `admin`, `api`, `health`, `auth`, `docs`, `swagger`, `about`, `pricing`, `contact`, `terms`, `privacy`, `login`, `register`, `salon` cannot be used as `urlSlug`.

---

## Frontend Domain

### TypeScript Types (Zustand Stores)

```typescript
// authStore
interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'admin';  // Note: maps from backend CLIENT/ADMIN
}
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// themeStore
interface ThemeConfig {
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  spacing?: Record<string, string>;
}
interface ThemeState {
  mode: 'light' | 'dark';
  config: ThemeConfig | null;
}

// bookingStore (multi-step funnel, NOT persisted)
interface BookingState {
  selectedBranch: { id: string; name: string } | null;
  selectedService: { id: string; name: string; price: number } | null;
  selectedProfessional: { id: string; name: string } | null;
  selectedDateTime: Date | null;
}
```

> Note: Frontend `role: 'customer' | 'admin'` does not directly map to backend `UserRole: CLIENT | STAFF | ADMIN`. A STAFF role is not yet represented in the frontend store. <!-- inferred — confirm with tech lead -->

### Form Schemas (Zod — pattern)

```typescript
// Login
z.object({ email: z.string().email(), password: z.string().min(8) })

// Registration (customer-scoped)
z.object({ email: z.string().email(), password: z.string().min(8), name: z.string(), phone: z.string().optional() })
```

### i18n

- Library: `i18next` + `react-i18next`
- All user-facing strings must go through `t('key')` — hardcoded strings are forbidden in JSX
- Primary language: English (US)
- Translations in `src/i18n/`
