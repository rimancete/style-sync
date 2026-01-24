# Frontend Architecture

This document outlines the architectural decisions, patterns, and guidelines for the StyleSync frontend.

## 1. Overview

StyleSync's frontend is a modern, production-ready React application built with **Vite**, **TypeScript**, and **React 19**. It follows a multi-tenant (customer-scoped) architecture where a single codebase serves multiple clients, with themes and configurations fetched dynamically from a backend API.

## 2. Core Principles

- **Simplicity over Complexity**: Favor native APIs (like `fetch`) and battle-tested libraries (`react-hook-form`, `zustand`) over over-engineered solutions.
- **Type Safety**: Strict TypeScript mode is enabled to catch errors at compile-time.
- **Maintainability**: Folder structure is organized by domain and responsibility.
- **Performance**: Efficient state management and code-splitting ensure a fast user experience.
- **Internationalization**: Built-in support for English (USA) and Portuguese (Brazil).

## 3. Technology Stack

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite 6](https://vitejs.dev/)
- **Language**: [TypeScript 5](https://www.typescriptlang.org/)
- **Routing**: [TanStack Router](https://tanstack.com/router)
- **State Management**:
  - **Global**: [Zustand](https://github.com/pmndrs/zustand) (Auth, Theme, Global Settings)
  - **Page-level**: [Constate](https://github.com/diegohaz/constate) + React Context (Local state isolation)
- **Data Fetching**: [TanStack Query (v5)](https://tanstack.com/query) with native `fetch`
- **Form Management**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Testing**: [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- **API Mocking**: [MSW (Mock Service Worker)](https://mswjs.io/)

## 4. Key Architectural Decisions

### 4.1. Hybrid State Management
Instead of a single "God store" (like a massive Redux store), we use a hybrid approach:
- **Zustand** handles truly global state that needs to persist across the entire application lifetime (e.g., authentication tokens, theme configurations).
- **Constate** (React Context wrapper) handles complex page-level state. This prevents global store pollution and ensures that state is automatically cleaned up when the user navigates away from a page.
- **TanStack Query** handles all server-side state (caching, synchronization, and fetching).

### 4.2. API Client Strategy
We avoid heavy libraries like Axios in favor of the native `fetch` API. We use custom hook wrappers around TanStack Query to provide:
- Automatic inclusion of authentication tokens.
- Consistent error handling.
- Built-in support for development-time mocking.
- Centralized endpoint management.

### 4.3. Custom Icon System
To maintain full control over the design system and reduce bundle size, we use a custom SVG-based icon system instead of libraries like `lucide-react`. Each icon is a React component that wraps a centralized `IconProvider` for consistent styling.

### 4.4. Design System Source
StyleSync is multi-tenant. The design system (colors, typography) is fetched from the backend API based on the customer URL. We use a "fallback-first" approach:
1. Hardcoded default theme in Tailwind config for initial load/API failure.
2. Dynamic CSS variables applied via `themeStore` once fetched from the API.

## 5. Folder Structure

```text
client/src/
├── @types/          # Global type definitions
├── api/             # Domain-specific API hooks (Auth, Branches, etc.)
├── components/      # UI components (shadcn/ui, Layout, Icons)
├── hooks/           # Custom React hooks (including Context/Constate patterns)
├── i18n/            # Internationalization (locales and config)
├── lib/             # Utility libraries (cn, etc.)
├── mocks/           # MSW handlers and mock data
├── routes/          # TanStack Router routes (file-based)
├── screens/         # Page-level components
├── store/           # Zustand stores
└── utils/           # Helper functions
```

## 6. Coding Standards

- **Functional Components**: Use functional components with hooks.
- **Naming**: PascalCase for components/types, camelCase for functions/variables.
- **Imports**: Use path aliases (e.g., `~/components/...`) for cleaner imports.
- **Testing**: Every new feature should include unit or integration tests using Vitest.
