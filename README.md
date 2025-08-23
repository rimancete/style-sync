# StyleSync - Salon Booking System

StyleSync is a fullstack SaaS solution for modern salons to enable online booking, smart scheduling, and automated reminders.

## Business Context
- Manual booking and high no-show rates reduce revenue for small/medium salons.
- StyleSync offers 24/7 booking, AI-assisted availability, and automated reminders to improve utilization and retention.
- Target markets: USA ($46B) and Europe (€35B). Mobile-first, GDPR-ready.

## Tech Stack
- Frontend: React + TypeScript
- Backend: NestJS (TypeScript)
- Database: PostgreSQL (configure in `server/.env`)

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

```bash
# 1. Install dependencies
npm run install:all

# 2. Set up development environment
# See docs/SETUP.md for detailed instructions

# 3. Start development servers
npm run start:dev
```

**📚 For complete setup instructions, see [`docs/SETUP.md`](./docs/SETUP.md)**

Access during development:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Database: localhost:5433

## Root Scripts
- `install:all`: install dependencies for client and server
- `start:dev`: run both apps concurrently
- `build:all`: build both applications

## Roadmap (Frontend-first)
- ✅ Docker Compose for local PostgreSQL (project-scoped)
- 🔄 Add Prisma schema and migrations in `server/`
- Booking flow UI: service selection → availability → calendar → confirmation
- Client portal with authentication placeholder
- Admin dashboard pages (occupancy, revenue, clients, marketing)
- Integrate reminders (email/SMS) and Stripe for payments

---
Made with ❤️ for salon owners, stylists, and clients.
