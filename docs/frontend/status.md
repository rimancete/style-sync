# Frontend Implementation Status

This document tracks the progress of the frontend implementation.

## 1. Project Foundation
- [x] Vite + React 19 + TypeScript 5 Setup
- [x] Tailwind CSS + shadcn/ui Integration
- [x] TanStack Router (File-based routing)
- [x] State Management (Zustand + Constate)
- [x] API Client (Fetch + TanStack Query + Mocks)
- [x] Internationalization (i18next)
- [x] Testing Framework (Vitest + MSW)
- [x] Code Quality (ESLint + type-aware rules, Prettier as ESLint errors, Husky, vite-plugin-checker runtime lint)

## 2. Core Components
- [x] Layout (Header, Footer, Sidebar)
- [x] UI Library (Button, Input, Card, Modal, etc.)
- [x] Icon System (Custom SVG)
- [x] Form Components (Controlled with React Hook Form)
- [x] shadcn primitives used by Login (`button`, `input`, `label`, `form`, `alert`)
- [x] `FormElements.Input` wrapper (RHF Controller + shadcn Form a11y)

## 3. Screens & Features
- [x] Login Screen (modular layout refactor — Issue #6)
  - [x] Banner (lg+, rotating slides, throttled parallax)
  - [x] LoginFormView + ViewTransition
  - [x] Mobile decorative SVGs
  - [x] `/` → `/login` redirect when unauthenticated
- [ ] Registration Screen
- [ ] Home Page
- [ ] Booking Flow
  - [ ] Branch Selection
  - [ ] Service Selection
  - [ ] Professional Selection
  - [ ] Date/Time Picker
  - [ ] Confirmation
- [ ] User Profile
- [ ] Booking History

## 4. API Integration
- [ ] Auth (Login/Register)
- [ ] Branches (List/Get)
- [ ] Services (List/Get)
- [ ] Professionals (List/Get)
- [ ] Bookings (List/Create)
- [ ] Theme (Get dynamic config)

## 5. Current Focus
- Login screen structure and presentation (Issue #6) complete locally
- Integrate Login/Register with live API next
- Improve test coverage
- Update documentation
