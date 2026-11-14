# Tenant context & branding — smooth tests (Issue #19)

Use the seeded API (`pnpm prisma:seed` in `server/`) with mocks off. Default password is `123456`.

## Public salon

1. Open `/salon/acme/login` — design-system colors, Acme document title, light/dark toggle present.
2. Open `/salon/elite-beauty/login` — pink primary (`#B92777`) with white label text.
3. Open `/salon/no-such-salon/login` and `/salon/no-such-salon/register` — “Salon not found”, no form.
4. From Acme login, Sign up → `/salon/acme/register`; Sign in on register → `/salon/acme/login`.

## CLIENT login

5. `client@test.com` on `/salon/acme/login` → client home, Acme theme, no salon switcher.
6. `client@test.com` on `/salon/elite-beauty/login` → inline error, still logged out.
7. `client@test.com` on `/login` → error to use the salon link.
8. `client2@multi.com` on `/salon/elite-beauty/login` → Elite theme and salon switcher.
9. With Elite active, switch to Acme in the header — theme, title, and data follow Acme; URL slug changes without a full reload (`/salon/acme/user` from `/salon/elite-beauty/user`).
10. Logged in as `client@test.com`, visit `/salon/elite-beauty/user` → redirect to `/salon/acme/user`.
11. Logged out, visit `/salon/acme/user` → `/salon/acme/login`; after login, return to `/salon/acme/user`.
12. Logged in as CLIENT, visit `/` and `/user` → equivalent paths under the active slug.

## ADMIN / STAFF

13. `admin@acme.com` on `/login` → `/admin` with Acme scoped, no company switcher.
14. `admin@stylesync.com` on `/login` → choose company, then admin shell.
15. With Acme active, switch to Elite in the header — data scope changes, theme stays the design system.
16. STAFF `staff@stylesync.com` on `/login` → admin shell.

## Mode

17. Clear site data, set the OS to dark, open `/salon/elite-beauty/login` — Elite dark palette, no light flash.
18. Toggle dark on `/salon/acme/login`, reload — dark stays. Switch salon as `client2@multi.com` — Elite dark palette.
19. Toggle in the admin header — design-system light/dark.

## Shell

20. Client home shows sidebar, header (logo, toggle, logout), content card. On a narrow viewport the sidebar is a menu sheet.
21. Admin `/admin` shows nav to bookings, club, plan, and profile.
