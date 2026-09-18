# Login — manual validation (Issue #12)

Run these against the **real API**. Do not set `VITE_ENABLE_MOCKS`.

Seed users (password for all: `123456`):

- `admin@stylesync.com` — `ADMIN`
- `client@test.com` — `CLIENT`
- `staff@stylesync.com` — `STAFF`

## Preparation

1. `docker compose -f docker/docker-compose.yml up -d`
2. In `server/`: migrate + seed (`pnpm prisma:migrate` / `pnpm prisma:seed` as documented in `.spec-kit/references.md`)
3. From the repo root: `pnpm dev`
4. Client: http://localhost:3000 — confirm mocks are off

## Scenarios

1. **ADMIN** — log in with `admin@stylesync.com` / `123456`. Session persists after refresh. Admin Home (`Dashboard`) is shown.
2. **CLIENT** — log in with `client@test.com` / `123456`. User Home (`My Bookings`) is shown.
3. **STAFF** — log in with `staff@stylesync.com` / `123456`. User Home is shown (no staff area yet).
4. **Invalid credentials** — wrong password. Inline alert is translated (`Login failed…` / PT equivalent). Stay on `/login`. Network tab: no `/api/auth/refresh`.
5. **422 by field** — if the API returns `errors.email`, the message appears on the email field, not only in the alert.
6. **Already authenticated** — with a session, visit `/login`. Redirects to `/` (role home).
7. **Admin guard** — as `CLIENT`, visit `/admin/bookings`. Redirects to User Home.
8. **Return URL** — as a visitor, open a protected route (e.g. `/admin/bookings`), then log in as `ADMIN`. Land on the original internal path.
9. **Malicious redirect** — `/login?redirect=https://example.com` or `?redirect=javascript:alert(1)`, then log in. Ignore the query; use the role home.
10. **Password toggle** — icon on the right reveals the value (`type="text"`); a second click hides it. Submit still sends the password. Toggle is disabled while signing in.

## Sign-off

- [ ] All 10 scenarios passed against the real API
