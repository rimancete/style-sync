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
- [x] shadcn primitives used by Login and Register (`button`, `input`, `label`, `form`, `alert`, `checkbox`, `alert-dialog`)
- [x] `FormElements.Input` wrapper (RHF Controller + shadcn Form a11y)
- [x] Toast primitives (`toast`, `toaster`) + `notify` helper

## 3. Screens & Features
- [x] Login Screen (modular layout refactor — Issue #6)
  - [x] Banner (lg+, rotating slides, throttled parallax)
  - [x] LoginFormView + ViewTransition
  - [x] Mobile decorative SVGs
  - [x] `/` → `/login` redirect when unauthenticated
  - [x] Password visibility toggle (`endIcon` + Eye / EyeOff)
  - [x] Neutral `/login` for ADMIN/STAFF; salon `/salon/:slug/login` for CLIENT (Issue #19)
- [x] Registration Screen (Issue #15)
  - [x] `/salon/:slug/register` with the login card shell and a register-specific banner
  - [x] RHF + Zod, inline alert, 428 link dialog
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
- [x] Transport (`request` + `errorTreatment`) and session foundation (Issue #11)
- [x] Auth login mutation writes the real `AuthResponse` contract (UX polish is #12)
- [x] Login UX: status-mapped errors, safe `search.redirect`, ADMIN layout guard (Issue #12)
- [x] Session probe: `GET /api/customers/my-customers` on authenticated Home
- [x] Auth register (`POST /api/salon/:slug/auth/register`, Issue #15)
- [ ] Branches (List/Get)
- [ ] Services (List/Get)
- [ ] Professionals (List/Get)
- [ ] Bookings (List/Create)
- [x] Theme (salon branding via `GET /api/customers/branding/:slug`, Issue #19)

## 5. Current Focus

Sequencing of upcoming work is in [`docs/roadmap.md`](../roadmap.md). Current slice: [#19](https://github.com/rimancete/style-sync/issues/19) Tenant context & branding on branch `19-tenant-context-branding`. Client routes, shells, and branding are implemented locally; waiting on smooth-test sign-off.
