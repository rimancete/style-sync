# Style Sync Client

Modern, production-ready React application for the Style Sync barbershop booking system.

## Tech Stack

### Core

- **React 19.2** - Latest React with concurrent features
- **TypeScript 5.9** - Strict type safety
- **Vite 6.4** - Fast build tool and dev server

### Routing & State

- **TanStack Router 1.150** - Type-safe file-based routing
- **Zustand 5.0** - Lightweight state management
- **constate 3.3** - React Context utilities for page-level state
- **TanStack Query 5.90** - Server state management with caching

### UI & Styling

- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Radix UI** - Unstyled, accessible component primitives
- **shadcn/ui** - Beautiful components built on Radix + Tailwind
- **Custom SVG Icons** - Lightweight icon system without external deps

### Forms & Validation

- **React Hook Form 7.71** - Performant form state management
- **Zod 3.25** - TypeScript-first schema validation

### Internationalization

- **i18next 24.2** - Translations for en-US and pt-BR
- **react-i18next 15.7** - React integration

### Testing

- **Vitest 3.2** - Fast unit testing framework
- **Testing Library 16.3** - User-centric testing utilities
- **Playwright 1.57** - End-to-end testing
- **MSW 2.12** - API mocking for tests

### Code Quality

- **ESLint 9.39** - Linting with TypeScript rules
- **Prettier 3.8** - Code formatting
- **Husky 9.1** - Git hooks for pre-commit checks
- **lint-staged 15.5** - Run linters on staged files
- **Commitlint 19.8** - Enforce conventional commit messages

## Project Structure

```
client/
├── src/
│   ├── @types/          # Global type definitions
│   ├── api/             # API hooks organized by domain
│   │   ├── auth/        # Authentication endpoints
│   │   ├── branches/    # Branch management
│   │   ├── services/    # Service listings
│   │   ├── professionals/ # Professional listings
│   │   ├── bookings/    # Booking management
│   │   ├── theme/       # Theme configuration from API
│   │   └── api.ts       # Centralized API exports
│   ├── components/
│   │   ├── ui/          # shadcn/ui components
│   │   ├── Icons/       # Custom SVG icon system
│   │   └── Layout/      # Layout components
│   ├── hooks/
│   │   ├── Context.ts   # constate-based local state
│   │   ├── useQuery/    # Custom TanStack Query wrapper
│   │   └── useMutation/ # Custom mutation wrapper
│   ├── i18n/
│   │   ├── locales/     # Translation files (en, pt)
│   │   └── config.ts    # i18next configuration
│   ├── routes/          # TanStack Router file-based routes
│   │   ├── __root.tsx   # Root layout
│   │   ├── index.tsx    # Home page
│   │   ├── login.tsx    # Login page
│   │   └── register.tsx # Register page
│   ├── store/           # Zustand global stores
│   ├── screens/         # Screens

│   │   ├── authStore.ts # Authentication state
│   │   ├── themeStore.ts # Theme configuration
│   │   └── bookingStore.ts # Booking state
│   ├── utils/           # Utility functions
│   ├── lib/             # Shared libraries (cn helper, etc.)
│   ├── test/            # Test setup and utilities
│   └── main.tsx         # Application entry point
├── public/              # Static assets
├── dist/                # Production build output
└── node_modules/        # Dependencies
```

## Getting Started

### Prerequisites

- **Node.js**: v24.13.0 (specified in `.nvmrc`)
- **pnpm**: 10.26.1+ (package manager)

### Installation

**From project root** (recommended for monorepo):

```bash
# Use correct Node version
nvm use

# Install all workspace dependencies
pnpm install
```

**From client directory only**:

```bash
cd client
pnpm install
```

### Development

**From client directory**:

```bash
cd client
pnpm dev          # Start dev server (http://localhost:3000)
pnpm type-check   # Type checking
pnpm lint         # Lint code
pnpm format       # Format code
```

**From project root**:

```bash
pnpm dev:client   # Start client only
pnpm dev          # Start both client & server in parallel
pnpm build:client # Build client
```

### Building

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run unit tests
pnpm test

# Run tests with UI
pnpm test:ui

# Run E2E tests
pnpm test:e2e
```

## Documentation

For more detailed information, please refer to the following documentation in the `docs/frontend/` directory:

- [Architecture Overview](../../docs/frontend/architecture.md) - Deep dive into design decisions and patterns.
- [Technical Specifications](../../docs/frontend/technical.md) - API contracts and implementation details.
- [Setup Guide](../../docs/frontend/setup.md) - Detailed development environment setup.
- [Implementation Status](../../docs/frontend/status.md) - Current progress and roadmap.
- [Implementation History](../../docs/frontend/implementationHistory.md) - Chronological log of milestones.

## Architecture Patterns

### API Client Pattern

Centralized API with domain-organized hooks:

```typescript
import { api } from 'api';

// Usage in components
const { data: branches } = api.branches.list();
const { mutate: login } = api.auth.login();
```

### State Management Strategy

**Zustand** for global state:

- Authentication (user, token)
- Theme configuration
- Booking selections

**constate + Context** for page-level state:

- Filters and search
- Multi-step forms
- Complex page interactions

### Custom Hook Wrappers

Custom `useQuery` and `useMutation` hooks wrap TanStack Query with:

- Automatic token injection
- Mock data support for development
- Consistent error handling

### Icon System

Custom SVG icons instead of icon libraries:

```typescript
import { Icon } from 'components/Icons';

<Icon name="Check" className="text-primary" />
```

## Key Features

✅ **Modern Stack** - Latest stable versions of React, TypeScript, and tooling  
✅ **Type-Safe Routing** - File-based routing with full TypeScript support  
✅ **API-First Design** - Theme configuration fetched from backend  
✅ **Mock-Ready** - Built-in mock data support for development  
✅ **Internationalized** - English and Portuguese translations  
✅ **Accessible** - Built on Radix UI primitives  
✅ **Developer Experience** - Fast HMR, type checking, linting, formatting  
✅ **Production Ready** - Optimized builds with code splitting

## Configuration Files

- `vite.config.ts` - Vite configuration with path aliases
- `tsconfig.json` - TypeScript compiler options (strict mode)
- `tailwind.config.js` - Tailwind CSS configuration
- `components.json` - shadcn/ui configuration
- `eslint.config.js` - ESLint rules
- `.prettierrc` - Prettier formatting rules
- `commitlint.config.js` - Commit message conventions
- `vitest.config.ts` - Vitest test runner configuration

## Environment Variables

Create a `.env` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:4000
VITE_CUSTOMER_SUBDOMAIN=
VITE_APP_ENV=development
```

## Git Workflow

Commits must follow conventional commit format:

```
feat(component): add new feature
fix(api): resolve authentication bug
docs(readme): update installation steps
```

Pre-commit hooks will:

1. Run ESLint and fix issues
2. Format code with Prettier
3. Validate commit message format

## Next Steps

1. ✅ Initialize shadcn/ui components (button, input, dialog, etc.)
2. ✅ Set up Husky git hooks from repository root
3. ✅ Configure Vitest and create test utilities
4. ✅ Build booking flow modal components
5. ✅ Create comprehensive documentation

## Available Scripts

| Script            | Description               |
| ----------------- | ------------------------- |
| `pnpm dev`        | Start development server  |
| `pnpm build`      | Build for production      |
| `pnpm preview`    | Preview production build  |
| `pnpm test`       | Run unit tests            |
| `pnpm test:ui`    | Run tests with UI         |
| `pnpm test:e2e`   | Run E2E tests             |
| `pnpm lint`       | Lint code                 |
| `pnpm lint:fix`   | Lint and fix issues       |
| `pnpm format`     | Format code with Prettier |
| `pnpm type-check` | Check TypeScript types    |

## Learn More

- [React Documentation](https://react.dev)
- [Vite Documentation](https://vite.dev)
- [TanStack Router](https://tanstack.com/router)
- [TanStack Query](https://tanstack.com/query)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [Zustand](https://github.com/pmndrs/zustand)
