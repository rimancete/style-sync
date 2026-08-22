# Frontend Implementation History

A chronological log of significant implementation milestones for the StyleSync frontend.

## 2026-01-17: Initial Architecture & Setup
- **Migration to Vite**: Migrated from Create React App to Vite 6 for faster builds and modern features.
- **React 19 Upgrade**: Updated to the latest stable version of React 19.
- **TanStack Ecosystem**: Integrated TanStack Router, TanStack Query, and TanStack Form (note: switched to React Hook Form for better ecosystem support).
- **State Management**: Established hybrid approach using Zustand (Global) and Constate (Local).
- **Theming System**: Implemented dynamic CSS-variable based theming fetched from API.
- **Icon System**: Created a custom SVG-based icon provider system.
- **API Pattern**: Built a consistent API client pattern using native `fetch` and TanStack Query wrappers.
- **Testing Infrastructure**: Configured Vitest and MSW for unit and integration testing.
- **Initial Screens**: Implemented Login, Registration, and Home page shells.

## 2026-07-25: Login Screen Layout & Structure Refactor (Issue #6)
- **Modular Login**: Decomposed monolithic `Login.tsx` into Banner, LoginViews (`LoginFormView`, `ViewTransition`), `LoginViewAlert`, `constants.ts`, and `types.ts`, following the team's composition pattern.
- **shadcn Form stack**: Added `button`, `input`, `label`, `form`, `alert` under `components/ui/` and `FormElements.Input` with RHF Controller + a11y wiring (`id`, `htmlFor`, `aria-describedby`).
- **Motion**: Added `framer-motion`; Banner uses 6s rotating slides, throttled mouse parallax (transform-only), and `ViewTransition` for right-panel enter/exit.
- **Assets**: Created StyleSync decorative SVGs (top/bottom topography plus salon/booking icon groups).
- **i18n / routing fixes**: Password `minLength` interpolates `{ count: 6 }`; `login.signingIn` for loading; unauthenticated `/` navigates to `/login`.
- **Auth APIs unchanged**: `useLogin` and `authStore` left intact.

## 2026-08-15: API and session foundation (Issue #11)
- **Transport**: `request()` is the only `fetch` call; `errorTreatment()` unwraps `{ data }`, returns `null` on 204, and attaches `status`/`errors` on failures (including 428).
- **Env**: `utils/env.ts` is the only reader of `import.meta.env`. Default API URL is `http://localhost:3001`. MSW and `mockData` sit behind `VITE_ENABLE_MOCKS` (off by default). Persist keys come from `VITE_AUTH_STORAGE_KEY` / `VITE_THEME_STORAGE_KEY` / `VITE_I18N_STORAGE_KEY` (defaults `StyleSync_*_Dev`).
- **Session**: `authStore` matches `AuthResponseDto` (`token`, `refreshToken`, `userId`, `userName`, `phone`, `customers`, `defaultCustomerId`). `role` and `email` come from `jwt-decode`. Persist schema version 2 discards the old `{ user, token }` shape.
- **Refresh**: single-flight retry on 401 inside `request`; `restoreSession` waits for persist hydration, then runs in `__root` before the first paint so an expired access token does not flash login. Home probes the session with `GET /api/customers/my-customers`.
- **Notify**: shadcn toast primitives + `notify.error` / `notify.success`. Login keeps `showError: false` (inline alert).
- **Facades**: `useQuery` / `useMutation` no longer contain network logic; query keys are prefixed with the active customer id.
- **Manual checks**: `docs/frontend/session-smooth-tests.md` (2026-08-22: scenarios 1–4 and 6–8 against the real API; 5 via the single-flight unit test; 9 deferred to #12).
