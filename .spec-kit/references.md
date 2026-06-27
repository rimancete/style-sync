<!-- spec-kit: references -->
<!-- version: 1.0 -->
<!-- last-updated: 2026-06-27 -->
<!-- updated-by: agent -->

# References

## Root

### Package Manager

| Dependency | Version | Purpose |
|------------|---------|---------|
| `pnpm` | 10.28.2 | Workspace package manager |
| `husky` | ^9.1.7 | Git hooks |
| `lint-staged` | ^16.1.5 | Pre-commit per-file lint |
| `commitizen` | ^4.3.1 | Interactive commit prompts |
| `cz-conventional-changelog` | ^3.3.0 | Commitizen adapter |
| `@commitlint/cli` | ^19.8.1 | Commit message linting |
| `@commitlint/config-conventional` | ^19.8.1 | Conventional commits ruleset |

### Local Development Setup

```bash
# 1. Start database
docker compose -f docker/docker-compose.yml up -d

# 2. Install all dependencies
pnpm install

# 3. Configure backend environment
cd server && cp env.template .env  # edit DATABASE_URL, JWT_SECRET, etc.

# 4. Generate Prisma client + migrate + seed
cd server && pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed

# 5. Start both workspaces in parallel
cd .. && pnpm dev
# Server: http://localhost:3001/api
# Client: http://localhost:3000
# Swagger: http://localhost:3001/api/docs
```

### Key Root Scripts

| Script | Command |
|--------|---------|
| `pnpm dev` | Start client + server in parallel |
| `pnpm build` | Build both workspaces |
| `pnpm lint` | Lint all workspaces (ESLint check) |
| `pnpm lint:fix` | Lint + auto-fix all workspaces |
| `pnpm test` | Run tests in all workspaces |
| `pnpm commit` | Interactive commit with Commitizen |

---

## Backend

### Core Framework

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@nestjs/core` | ^11.0.1 | NestJS framework |
| `typescript` | ^5.7.3 | Language |
| Node.js | >=24.13.0 | Runtime (see `.nvmrc`) |

### Database

| Dependency | Version | Purpose |
|------------|---------|---------|
| `prisma` | ^6.14.0 | ORM, migrations |
| `@prisma/client` | ^6.14.0 | Type-safe DB client |
| PostgreSQL | 15 | Database (Docker image: `postgres:15`) |

Dev DB: `localhost:5433` (to avoid conflict with default 5432)
Test DB: `localhost:5434` (Docker-managed, lifecycle via `pnpm db:test:*`)

### Authentication & Security

| Dependency | Version | Purpose |
|------------|---------|---------|
| `@nestjs/jwt` | latest | JWT signing/verification |
| `@nestjs/passport` | latest | Passport.js integration |
| `passport-jwt` | latest | JWT Passport strategy |
| `bcrypt` | latest | Password hashing (10 rounds) |
| `@nestjs/throttler` | ^6.4.0 | Rate limiting (default 60/min, strict 10/min) |

### Validation & Docs

| Dependency | Version | Purpose |
|------------|---------|---------|
| `class-validator` | ^0.14.2 | DTO validation decorators |
| `class-transformer` | ^0.5.1 | DTO transformation |
| `@nestjs/swagger` | ^11.2.0 | Swagger/OpenAPI documentation (`/api/docs`) |

### File Uploads

| Dependency | Version | Purpose |
|------------|---------|---------|
| `multer` | runtime | Multipart file uploads (customer logos, professional photos) |
| `@types/multer` | ^2.0.0 | TypeScript types |

Files stored locally at `server/uploads/`. Future: move to object storage (S3/GCS).

### Testing

| Dependency | Version | Purpose |
|------------|---------|---------|
| `jest` | ^29.7.0 | Test runner |
| `@nestjs/testing` | latest | NestJS test utilities |
| `supertest` | latest | HTTP integration testing |

Key scripts (from `server/`):
```bash
pnpm test:ci                  # Contract tests + coverage + auto DB lifecycle (CI mode)
pnpm test:contract:managed    # Contract tests with auto DB lifecycle
pnpm test:contract            # Contract tests (requires manual db:test:setup first)
pnpm db:test:setup            # Start + migrate + seed test database
pnpm db:test:reset            # Recreate test database from scratch
```

### Environment Variables (server/.env)

```env
DATABASE_URL=postgresql://stylesync:password@localhost:5433/stylesync
NODE_ENV=development
PORT=3001
CLIENT_ORIGIN=http://localhost:3000
JWT_SECRET=...
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=...
JWT_REFRESH_EXPIRES_IN=7d
SWAGGER_ENABLED=true
HEALTH_CHECK_ENABLED=true
RATE_LIMIT_TTL=60000
RATE_LIMIT_DEFAULT=60
RATE_LIMIT_BRANDING=20
RATE_LIMIT_ADMIN=5
```

See `server/env.template` for full list with descriptions.

### External Docs

- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- PostgreSQL 15: https://www.postgresql.org/docs/15/
- JWT: https://jwt.io/introduction
- Swagger: http://localhost:3001/api/docs (dev)
- Postman Collection: `docs/backend/postman-collection.json`

---

## Frontend

### Core Stack

| Dependency | Purpose |
|------------|---------|
| `react` ^19 | UI framework |
| `typescript` ^5 | Language |
| `vite` | Build tool and dev server |
| `tailwindcss` | Utility-first CSS |
| `shadcn/ui` | UI component library (built on Radix UI + Tailwind) |

### Routing & Data

| Dependency | Purpose |
|------------|---------|
| `@tanstack/react-router` | File-based routing with type-safe routes |
| `@tanstack/react-query` | Server state management, cache, background refetch |

### State Management

| Dependency | Purpose |
|------------|---------|
| `zustand` | Global stores (auth, theme, booking funnel) |
| `constate` | Page-level context (reducer pattern for complex flows) |

### Forms & Validation

| Dependency | Purpose |
|------------|---------|
| `react-hook-form` | Controlled form management |
| `zod` | Schema validation (form schemas + type inference) |

### Internationalisation

| Dependency | Purpose |
|------------|---------|
| `i18next` | i18n framework |
| `react-i18next` | React integration hooks |

Translations: `client/src/i18n/`

### Testing

| Dependency | Purpose |
|------------|---------|
| `vitest` | Test runner |
| `msw` (Mock Service Worker) | API mocking in tests and development |

MSW worker registered in `client/public/mockServiceWorker.js`.

### Build & Quality

| Dependency | Purpose |
|------------|---------|
| `eslint` (vite plugin checker) | Runtime lint errors surfaced in browser overlay |
| `prettier` | Formatter (enforced as ESLint errors) |
| `commitlint` | Commit message validation |
