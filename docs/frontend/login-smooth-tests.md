# Login Screen Smooth Tests (Issue #6)

Manual verification playbook. Run against `pnpm --filter style-sync-client dev` (http://localhost:3000).

## Setup

1. Ensure you are logged out (clear `auth-storage` in localStorage if needed).
2. Open `/login`.

## Checklist

### Desktop Banner (≥ 1024px)

- [ ] Left Banner is visible with primary gradient and rounded corners.
- [ ] Brand label "StyleSync" appears on the Banner.
- [ ] Rotating phrases change about every 6 seconds.
- [ ] Icon groups react to mouse movement (parallax) without visible jank.
- [ ] Right panel form remains fully usable while Banner animates.

### Mobile (&lt; 1024px)

- [ ] Banner is hidden.
- [ ] Decorative SVGs appear at the top and bottom of the screen.
- [ ] Form remains centered and usable.

### Form validation & a11y

- [ ] Submit with password shorter than 6 chars shows fully translated min-length message (no literal `{{count}}`).
- [ ] Invalid email shows translated invalid-email message.
- [ ] Each input has an associated label (`htmlFor` / `id`).
- [ ] Error messages are linked via `aria-describedby` (inspect in DevTools).
- [ ] Form is fully operable by keyboard (Tab / Enter).

### Loading & auth

- [ ] While submitting, submit button shows translated "Signing in..." / "Entrando..." and is disabled.
- [ ] Server/login failure shows destructive alert with translated fallback when needed.

### Routing

- [ ] Visiting `/` while logged out redirects to `/login` (does not render Login inline on `/`).
- [ ] Successful login still navigates to `/` (existing `useLogin` behavior).

### View transition

- [ ] `ViewTransition` wraps the form (opacity + slight Y slide on mount). Future view swaps should animate similarly when added.
