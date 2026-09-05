<!-- spec-kit: constitution -->
<!-- version: 1.2 -->
<!-- last-updated: 2026-09-05 -->
<!-- updated-by: agent -->

# Constitution

## Root

### Branching Strategy

- `main` — production-ready code
- `develop` — integration branch for all features
- Feature branches: `{issue-number}-{slug}` cut from `develop`
- Hotfix branches cut from `main`, back-merged to `develop`
- One Issue → one branch → one PR

### Commit Format

Conventional Commits enforced by Commitlint + Commitizen + Husky:

```
type(scope): description

Types: feat | fix | docs | refactor | test | chore
Scopes: auth | booking | branches | professionals | services | customers | countries | health | schedules
```

### Lint and Format

- ESLint with TypeScript strict rules in both workspaces (no `any` types — zero tolerance)
- Prettier as ESLint errors (not just warnings): 2-space indent, single quotes, trailing commas, 80-char line width
- `pnpm lint` runs both workspaces (`pnpm -r lint:check`)
- Pre-commit hooks: ESLint + Prettier auto-fix via lint-staged, then commit message validated

### Package Manager

- `pnpm` exclusively (v10.28.2+). Never use `npm` or `yarn`.
- Workspace install from root: `pnpm install`
- Workspace-specific command: `pnpm --filter <workspace-name> <command>`

### CI/CD

- GitHub Actions: runs on all PRs and pushes to `main`/`develop`
- CI jobs: install → generate Prisma client → lint (both workspaces)
- Tests currently not run in CI (run locally). Backend: `pnpm test:ci` in `server/`

---

## Backend

### Framework and Principles

- NestJS v11 + TypeScript strict mode
- Modular monolith: one module per domain (auth, bookings, branches, professionals, services, customers, countries, health, schedules)
- SOLID principles — each service has one responsibility; inject via constructor, never instantiate services directly
- DTOs for all inputs and outputs; class-validator decorators only, never raw object assertions
- No `any` types. Interfaces in `src/common/types/` and `src/common/interfaces/`

### Naming Conventions

- Files: `kebab-case.type.ts` (e.g. `branch-response.dto.ts`, `jwt.strategy.ts`)
- Classes: PascalCase; Injectable services, guards, interceptors decorated accordingly
- Constants/enums: SCREAMING_SNAKE_CASE for enum values; PascalCase for enum names

### Multi-Tenancy Rule (Non-Negotiable)

Every database query inside a customer-scoped service **must** be filtered by `customerId`. The `CustomerContextGuard` resolves and injects `user.activeCustomerId` — never assume it from the URL alone.

URL pattern: `/api/salon/:customerSlug/...` — slug is a human-readable alias; the CUID `customerId` is the canonical identifier.

### Dual ID Strategy (Non-Negotiable)

Every entity has:
- `id` (CUID): used in all API endpoints, DB relations, and inter-service references
- `displayId` (auto-increment): shown in UI, customer support references, analytics. **Never use `displayId` for lookups or foreign keys.**

### Soft Delete Pattern

- Branches: `deletedAt DateTime?` — set to `new Date()` on deletion; all queries filter `where: { deletedAt: null }`
- Professionals: `isActive: false` flag
- Services: `isActive: false` flag
- Before soft-deleting: validate no active dependents (professionals, bookings)

### Nullable `updatedAt` Pattern

- `updatedAt DateTime? @updatedAt` — `null` means "never modified"
- New entities must follow this pattern. Branch and Professional still have non-nullable `updatedAt` (legacy, pending migration)

### Testing (Backend)

- Contract testing is the primary strategy — validate API request/response contracts
- File naming: `*.contract.test.ts` (primary), `*.test.ts` (utilities only)
- Use deterministic, seed-based test data — never `faker` or random values in contract tests
- Run contract tests against a Docker-managed PostgreSQL test DB (`pnpm test:ci` from `server/`)
- **Every new endpoint must have a corresponding contract test before merge**

### Postman Collection (Non-Negotiable)

`docs/backend/postman-collection.json` must be kept in sync with the API surface. Update it whenever an HTTP endpoint is added, removed, renamed, or its request/response shape changes. This is the primary tool for manual API testing and onboarding.

### Forbidden Backend Patterns

- No `any` types
- Do not bypass `CustomerContextGuard` on customer-scoped endpoints
- Do not use `displayId` for foreign keys or API lookups
- Do not perform availability checks only at booking creation — always re-check at confirmation

---

## Frontend

### Stack and Tooling

- React 19 + TypeScript 5 + Vite
- File-based routing via TanStack Router (routes in `src/routes/`)
- Screens live in `src/screens/` (mirroring route structure); routes import screens
- All user-facing strings must go through i18next — no hardcoded text in JSX

### Component Rules

- shadcn/ui is the exclusive UI component library — no raw Tailwind in screen-level JSX beyond spacing/layout utilities
- No class-based React components
- Controlled forms only via React Hook Form + Zod schemas; no uncontrolled inputs

### API Layer

- All API calls go through the `api` facade object (`src/api/api.ts`) — never call TanStack Query hooks directly
- Queries: wrap in `useQuery<T>` custom hook with `endpoint`, `queryKey`, and `mockData`
- Mutations: wrap in `useMutation<TResponse, TInput>` custom hook with `endpoint` and `mutationKey`
- MSW and the `mockData` short-circuit run only when `VITE_ENABLE_MOCKS=true` (off by default). Provide handlers so the flag can be turned on for UI work without the backend.

### State Management

- **Zustand** (`src/store/`): data that survives navigation — `authStore`, `themeStore`, `bookingStore` (multi-step booking funnel)
- **Constate** (`src/hooks/`): complex single-page flows (reducer pattern). Do not use Zustand for ephemeral page-level state
- No Redux — it is forbidden

### Axios

- Native Fetch API only — Axios is forbidden

### Testing (Frontend)

- Vitest + MSW
- Tests live next to the code they cover (`*.test.ts` / `*.test.tsx`). `src/test/` is not the only location.
- MSW handlers mirror the `mockData` used in API hooks and stay behind `VITE_ENABLE_MOCKS`

### Forbidden Frontend Patterns

- No `any` types
- No direct TanStack Query calls — must go through `api` facade
- No Axios
- No Redux
- No class-based components
- No hardcoded strings — must use i18next
