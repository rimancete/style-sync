# Session — Smooth Tests

Manual validation of the API transport layer and session lifecycle (Issue #11).
Run against the **real** NestJS API. Do **not** set `VITE_ENABLE_MOCKS`.

Session persist key (from `VITE_AUTH_STORAGE_KEY`): **`StyleSync_Auth_Dev`**.
Clear leftover `auth-storage` / `theme-storage` keys once if you logged in before this change.

The access JWT lasts `JWT_EXPIRES_IN` (1d in local `server/.env`). Client and server
sharing a repo does not expire it sooner. Do **not** mash characters in the token
string. Rewrite `exp` in the payload (snippet below) and **reload** so Zustand
rehydrates. Editing localStorage while the app is running does not update memory.

## Setup

1. `docker compose -f docker/docker-compose.yml up -d`
2. In `server/`: `pnpm prisma:migrate` and `pnpm prisma:seed` (if the database is empty)
3. From the repo root (`nvm use`): `pnpm dev`, or two terminals with `pnpm dev:server` and `pnpm dev:client`
4. Confirm the client has **no** `VITE_ENABLE_MOCKS=true` in `client/.env`
5. Seed users (password `123456`): `admin@stylesync.com`, `client@test.com`, `staff@stylesync.com`

## Expire the access token (scenarios 4, 5, 6, 8)

Paste in DevTools → Console after a successful login. Keep `refreshToken` intact
unless the scenario says otherwise.

```js
const key = 'StyleSync_Auth_Dev';
const bag = JSON.parse(localStorage.getItem(key));
const [h, p, s] = bag.state.token.split('.');
const payload = JSON.parse(
  atob(p.replace(/-/g, '+').replace(/_/g, '/'))
);
payload.exp = Math.floor(Date.now() / 1000) - 60;
const body = btoa(JSON.stringify(payload))
  .replace(/=+$/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');
bag.state.token = `${h}.${body}.${s}`;
localStorage.setItem(key, JSON.stringify(bag));
location.reload();
```

The signature no longer matches; Nest treats that as **401**, same as a clock-expired
token. After reload, Home calls `GET /api/customers/my-customers` so there is an
authenticated request to observe.

## Scenarios

### 1. Base URL and no MSW

- Open `/login`
- In DevTools → Network, submit the form with a seed user
- **Expect:** `POST http://localhost:3001/api/auth/login`
- **Expect:** the MSW worker is not registered (Application → Service Workers, or no `[MSW]` logs)

### 2. Session matches the real contract

- Log in with `client@test.com` / `123456`
- Inspect `localStorage.StyleSync_Auth_Dev`
- **Expect:** `token`, `refreshToken`, `userId`, `userName`, `phone`, `customers`, `defaultCustomerId`
- **Expect:** `role` is `CLIENT` (decoded from the JWT, not from the response body)
- **Expect:** `isAuthenticated` is `true`

### 3. Invalid credentials stay on login

- Submit the form with a wrong password
- **Expect:** inline alert with the API error (no toast)
- **Expect:** no `POST /api/auth/refresh`
- **Expect:** session remains empty (`isAuthenticated` false)

### 4. Transparent refresh

- Log in successfully
- Run the expire snippet (reload included)
- **Expect:** `POST /api/auth/refresh` with `Authorization: Bearer <refreshToken>`
- **Expect:** `GET /api/customers/my-customers` succeeds with the new access token
- **Expect:** `StyleSync_Auth_Dev` now has a new `token` / `refreshToken`

### 5. Single-flight

This is **not** a second copy of scenario 4. 4 asks “does refresh happen?”. 5 asks
“if several authenticated calls 401 at the same time, do they share **one**
`POST /auth/refresh`?”

Home only fires `GET /api/customers/my-customers`, so the Network tab after the
expire snippet looks the same as scenario 4 (one refresh). There is no screen
yet that bursts multiple queries.

**Pass criterion for this slice:** the unit test
`request` → `deduplicates concurrent 401s into a single refresh call`
(`client/src/hooks/utils/request.test.ts`). Revisit the UI check when the
catalog/booking screens issue several queries on mount.

### 6. Dead session

- Run the expire snippet, but also set `bag.state.refreshToken` to `'dead'` (or delete it) before `setItem` / reload
- **Expect:** session cleared, redirect to `/login`

### 7. Legacy storage migration

- Sign out (or clear site data)
- In the console:

  ```js
  localStorage.setItem(
    'StyleSync_Auth_Dev',
    JSON.stringify({
      state: {
        user: { id: '1', email: 'old@test.com', name: 'Old', role: 'admin' },
        token: 'legacy-token',
        isAuthenticated: true,
      },
      version: 0,
    })
  );
  ```

- Reload
- **Expect:** user is logged out, no runtime error in the console

### 8. Boot with an expired access token

- Log in, then run the expire snippet
- **Expect:** the login screen does not flash
- **Expect:** session is renewed (`POST /api/auth/refresh`) before `GET /api/customers/my-customers`

### 9. Toast (mocks only)

Login uses `showError: false`, so a failed login must **not** toast. `notify` is
wired only in `useMutation` (`showError` default `true`). `useQuery` never
toasts — including `GET /api/customers/my-customers`.

With `VITE_ENABLE_MOCKS=true`, queries that pass `mockData` **short-circuit** and
never hit MSW. Changing an MSW GET handler therefore cannot produce a toast.

There is no mutation screen besides login yet (register form is not wired;
booking create is unused). Manual toast is deferred to the register issue (#12).

**Pass criterion for this slice:** do not fail #11 on this check. Restore
`VITE_ENABLE_MOCKS=false` after trying it. Permanent UI coverage lands with the
first real mutation consumer.

## Result

| # | Scenario                         | Pass |
| - | -------------------------------- | ---- |
| 1 | Base URL and no MSW              |  X   |
| 2 | Session matches the real contract |  X  |
| 3 | Invalid credentials              |  X   |
| 4 | Transparent refresh              |  X   |
| 5 | Single-flight                    |  X   | deduplicates concurrent 401s into a single refresh call in request.test.ts
| 6 | Dead session                     |  X   |
| 7 | Legacy storage migration         |  X   |
| 8 | Boot with expired access token   |  X   |
| 9 | Toast (mocks only)               |      | postponed to #12
