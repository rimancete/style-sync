# StyleSync - Salon Booking System

StyleSync is a fullstack SaaS solution for modern salons to enable online booking, smart scheduling, and automated reminders.

## Business Context
- Manual booking and high no-show rates reduce revenue for small/medium salons.
- StyleSync offers 24/7 booking, AI-assisted availability, and automated reminders to improve utilization and retention.
- Target markets: USA ($46B) and Europe (€35B). Mobile-first, GDPR-ready.

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: NestJS (TypeScript)
- **Database**: PostgreSQL
- **Package Manager**: pnpm (workspace monorepo)
- **Node.js**: >= 24.13.0 (see `.nvmrc`)

## Monorepo Structure
```
style-sync/
├── client/           # React app (TypeScript)
│   ├── public/
│   └── src/
├── server/           # NestJS app (TypeScript)
│   └── src/
├── docker/           # Database containers
├── docs/             # Setup and documentation
├── package.json      # Root scripts
└── README.md
```

## Quick Start

### Prerequisites

- **Node.js** >= 24.13.0 (use `nvm install && nvm use` to auto-install from `.nvmrc`)
- **pnpm** >= 9.x (`npm install -g pnpm`)
- **Docker** and **Docker Compose**

### Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd style-sync

# 2. Install dependencies (from project root)
pnpm install

# 3. Start database
docker compose -f docker/docker-compose.yml up -d

# 4. Configure backend
cd server
cp env.template .env  # Edit with your settings

# 5. Setup database
pnpm prisma:generate  # Generate Prisma Client
pnpm prisma:migrate   # Run migrations
pnpm prisma:seed      # Seed development data

# 6. Start development servers
cd ..
pnpm dev              # Starts both client & server in parallel
```

**📖 Detailed Setup**: See [`docs/backend/setup.md`](./docs/backend/setup.md) and [`docs/frontend/setup.md`](./docs/frontend/setup.md)

**📖 Contributing**: See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for commit conventions and development workflow

**📚 For project architecture overview, see [`docs/projectArchitecture.md`](./docs/projectArchitecture.md)**

Access during development:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5433

## Available Commands

### From Project Root

```bash
pnpm install          # Install all dependencies
pnpm dev              # Start both client & server
pnpm dev:client       # Start client only
pnpm dev:server       # Start server only
pnpm build            # Build all workspaces
pnpm build:client     # Build client only
pnpm build:server     # Build server only
pnpm lint             # Lint all workspaces
pnpm lint:fix         # Lint and fix all workspaces
pnpm test             # Test all workspaces
```

### Workspace-Specific

```bash
cd client && pnpm <command>     # Client commands
cd server && pnpm <command>     # Server commands
```

## Highlight (Backend)
- Customer-based context
- Rate limit protection
- Customer branding, including images management (cloud-based migration)

## Roadmap

Canonical sequencing lives in [`docs/roadmap.md`](docs/roadmap.md) (Portuguese). GitHub Issues remain the source of truth for each task.

Current phases:

1. Login flow epic ([#10](https://github.com/rimancete/style-sync/issues/10)) — API/session foundation ([#11](https://github.com/rimancete/style-sync/issues/11)) then Login API integration ([#12](https://github.com/rimancete/style-sync/issues/12))
2. Register, tenant/branding, booking funnel, confirm/cancel by token, my bookings
3. Backend follow-ups as needed (email, public catalog, profile update)

---
Made with ❤️ for salon owners, stylists, and clients.
