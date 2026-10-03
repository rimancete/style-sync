import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMockAuthResponse } from '~/mocks/auth';
import { server } from '~/mocks/server';
import { routeTree } from '~/routeTree.gen';
import { useAuthStore } from '~/store/authStore';
import { createTestQueryClient, render, screen, waitFor } from '~/test/utils';

import '~/i18n/config';

const API_ORIGIN = 'http://localhost:3001';
const VALID_PASSWORD = '123456';

function resetSession() {
  useAuthStore.getState().clearAuth();
  useAuthStore.persist.clearStorage();
  window.localStorage.clear();
}

async function renderApp(initialPath: string) {
  const queryClient = createTestQueryClient();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
}

function passwordInput(): HTMLInputElement {
  return document.querySelector('input[autocomplete="current-password"]') as HTMLInputElement;
}

async function waitForLoginForm() {
  await screen.findByRole('heading', { name: 'Sign In' });
}

async function submitLogin(email: string, password = VALID_PASSWORD) {
  await waitForLoginForm();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(passwordInput(), password);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  return user;
}

describe('Login screen', () => {
  beforeEach(() => {
    resetSession();
  });

  afterEach(() => {
    server.resetHandlers();
    resetSession();
  });

  it('sends ADMIN to the admin home after a successful login', async () => {
    await renderApp('/login');
    await submitLogin('admin@stylesync.com');

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe('ADMIN');
  });

  it('sends CLIENT to the user home after a successful login', async () => {
    await renderApp('/login');
    await submitLogin('client@test.com');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(useAuthStore.getState().role).toBe('CLIENT');
  });

  it('sends STAFF to the user home after a successful login', async () => {
    await renderApp('/login');
    await submitLogin('staff@stylesync.com');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(useAuthStore.getState().role).toBe('STAFF');
  });

  it('shows a translated inline alert on 401 and does not call refresh', async () => {
    let refreshCalls = 0;
    server.use(
      http.post(`${API_ORIGIN}/api/auth/refresh`, () => {
        refreshCalls += 1;
        return HttpResponse.json(
          { status: 401, message: 'Invalid refresh token' },
          { status: 401 }
        );
      })
    );

    await renderApp('/login');
    await submitLogin('nobody@stylesync.com');

    expect(
      await screen.findByText('Login failed. Please check your credentials')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(refreshCalls).toBe(0);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('maps 422 email errors onto the field instead of only the alert', async () => {
    server.use(
      http.post(`${API_ORIGIN}/api/auth/login`, () => {
        return HttpResponse.json(
          {
            status: 422,
            message: 'Validation failed',
            errors: { email: ['email must be an email'] },
          },
          { status: 422 }
        );
      })
    );

    await renderApp('/login');
    await submitLogin('valid@stylesync.com');

    expect(await screen.findByText('email must be an email')).toBeInTheDocument();
    expect(
      screen.queryByText('Login failed. Please check your credentials')
    ).not.toBeInTheDocument();
  });

  it('redirects an authenticated visitor away from /login', async () => {
    useAuthStore
      .getState()
      .setSession(createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' }));

    await renderApp('/login');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
  });

  it('sends an authenticated CLIENT away from /admin/bookings to the user home', async () => {
    useAuthStore
      .getState()
      .setSession(createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' }));

    await renderApp('/admin/bookings');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(screen.queryByText('Coming soon')).not.toBeInTheDocument();
  });

  it('returns a visitor to the original internal path after login', async () => {
    await renderApp('/admin/bookings');
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    });

    await submitLogin('admin@stylesync.com');

    expect(await screen.findByText('Coming soon')).toBeInTheDocument();
  });

  it('ignores a malicious redirect and uses the role home', async () => {
    await renderApp('/login?redirect=javascript:alert(1)');
    await submitLogin('client@test.com');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
  });

  it('toggles password visibility without changing the submitted value', async () => {
    await renderApp('/login');
    await waitForLoginForm();

    const user = userEvent.setup();
    const input = passwordInput();
    await user.type(input, VALID_PASSWORD);

    expect(input).toHaveAttribute('type', 'password');

    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(input).toHaveAttribute('type', 'text');
    expect(screen.getByRole('button', { name: 'Hide password' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(input).toHaveAttribute('type', 'password');

    await user.type(screen.getByLabelText(/email/i), 'client@test.com');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
  });
});
