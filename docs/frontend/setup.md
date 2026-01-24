# Frontend Setup Guide

This guide will help you get the StyleSync frontend up and running.

## 1. Prerequisites

- **Node.js**: >= 20.x
- **pnpm**: >= 9.x
- **Backend**: Ensure the NestJS backend is running if you want to test with real data.

## 2. Installation

Navigate to the `client/` directory and install dependencies:

```bash
cd client
pnpm install
```

## 3. Environment Configuration

Create a `.env` file in the `client/` directory (you can copy from `.env.example` if it exists):

```env
VITE_API_URL=http://localhost:3000
VITE_ENABLE_MOCKS=true
```

## 4. Development

Start the Vite development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`.

## 5. Key Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Starts development server |
| `pnpm build` | Builds for production |
| `pnpm preview` | Previews the production build |
| `pnpm test` | Runs unit/integration tests with Vitest |
| `pnpm test:ui` | Starts Vitest UI |
| `pnpm lint` | Checks for linting errors |
| `pnpm format` | Formats code with Prettier |

## 6. Development Workflow

1. **Routing**: Add new routes in `src/routes/`. TanStack Router will automatically generate types.
2. **State**: Use Zustand for global state (`src/store/`) and Constate for page-level state.
3. **API**: Create new hooks in `src/api/` using the `useQuery` or `useMutation` wrappers.
4. **Icons**: Add new SVGs to `src/components/Icons/ListIcons/` and export them via `Icon.tsx`.
5. **UI**: Add new shadcn/ui components using `npx shadcn@latest add <component>`.
