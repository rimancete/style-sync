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
├── package.json      # Root scripts
└── README.md
```

## Development Setup
```bash
npm run install:all    # Install client and server deps
npm run start:dev      # Start client and server in parallel
```

Access during development:
- Frontend: http://localhost:3000
- Backend: http://localhost:3000/api

## Root Scripts
- `install:all`: install dependencies for client and server
- `start:dev`: run both apps concurrently
- `build:all`: build both applications

## Environment
Create `server/.env` with your database settings (PostgreSQL). Example:
```
DATABASE_URL=postgresql://user:password@localhost:5432/stylesync
NODE_ENV=development
```

## Roadmap (Frontend-first)
- Booking flow UI: service selection → availability → calendar → confirmation
- Client portal with authentication placeholder
- Admin dashboard pages (occupancy, revenue, clients, marketing)
- Integrate reminders (email/SMS) and Stripe for payments
- Add Prisma schema and migrations in `server/`
- Docker Compose for local PostgreSQL

---
Made with ❤️ for salon owners, stylists, and clients.
