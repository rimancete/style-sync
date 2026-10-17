# Register smooth tests

Manual checks for Issue #15 against the real API. Leave `VITE_ENABLE_MOCKS` unset.

## Preparation

1. `docker compose -f docker/docker-compose.yml up -d`
2. In `server/`: `pnpm prisma:generate && pnpm prisma:migrate && pnpm prisma:seed`
3. From the repo root: `pnpm dev`
4. Seed slugs: `acme` (Acme Barbershop) and `elite-beauty` (Elite Beauty Salon). Seed password for existing users is `123456`.
5. Open the app at `http://localhost:3000`. Confirm the browser network calls `http://localhost:3001`.

Use a fresh email for the success case, for example `register.manual@example.com`.

## Scenarios

1. **Success.** Visit `/salon/acme/register`. Fill name, the fresh email, an optional phone, matching passwords of at least 6 characters, and accept the terms. Submit. The request body contains `name`, `email`, `password`, and `phone` only when the phone field has a value. It does not contain `confirmPassword`, `acceptedTerms`, or `confirmLink`. The response is `201`. The user home ("My Bookings") opens and a later reload stays signed in.
2. **Password mismatch.** Same form with two different passwords and terms accepted. Submit. No POST. The confirm-password field shows the translated mismatch message.
3. **Terms unchecked.** Matching passwords, terms left unchecked. Submit. No POST. The terms field shows the translated message.
4. **422.** The form blocks an invalid email before POST, so this status is not produced by a normal submit. The screen test `maps a 422 email error onto the field` locks the mapping: `errors.email` appears on the email field, and no toast is shown.
5. **428 cancel.** Visit `/salon/acme/register` and submit `client@elitebeauty.com` (the account exists and is linked to Elite Beauty, not Acme), with any name, phone, matching passwords, and terms accepted. A dialog opens. Its text does not say the password was checked against the existing account. No toast appears. Cancel. No second POST. The form stays on the page.
6. **428 confirm.** Repeat the previous submit and choose "Link account". The second POST sends the same fields plus `confirmLink: true` and returns `201`. The session opens on the user home.
7. **409.** Visit `/salon/acme/register` and submit `client@test.com` (already linked to Acme). The translated alert is shown, no toast, and the form stays on the page.
8. **400.** Visit `/salon/missing-salon/register` and submit a fresh email. The translated salon-unavailable alert is shown and the form stays on the page.
9. **Already authenticated.** Sign in, then open `/salon/acme/register`. The app redirects to `/`.
10. **Login has no register link.** Sign out and open `/login`. The page has no link to `/register` or `/salon/:slug/register`.
