import { QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { Toaster } from '~/components/ui/toaster';
import { createMockAuthResponse } from '~/mocks/auth';
import { server } from '~/mocks/server';
import { routeTree } from '~/routeTree.gen';
import { useAuthStore } from '~/store/authStore';
import { createTestQueryClient, render, screen, waitFor } from '~/test/utils';

import '~/i18n/config';

const API_ORIGIN = 'http://localhost:3001';
const REGISTER_PATH = '/salon/stylesync/register';
const VALID_PASSWORD = '123456';

type RegisterBody = {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  confirmLink?: boolean;
};

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
      <Toaster />
    </QueryClientProvider>
  );

  await waitFor(() => {
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
}

async function waitForRegisterForm() {
  await screen.findByRole('heading', { name: 'Create Account' });
}

async function submitRegister(options?: {
  phone?: string;
  confirmPassword?: string;
  acceptTerms?: boolean;
}) {
  await waitForRegisterForm();
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/full name/i), 'Ada Lovelace');
  await user.type(screen.getByLabelText(/^email/i), 'ada@example.com');

  if (options?.phone) {
    await user.type(screen.getByLabelText(/phone number/i), options.phone);
  }

  await user.type(screen.getByLabelText(/^password/i), VALID_PASSWORD);
  await user.type(
    screen.getByLabelText(/confirm password/i),
    options?.confirmPassword ?? VALID_PASSWORD
  );

  if (options?.acceptTerms !== false) {
    await user.click(screen.getByRole('checkbox'));
  }

  await user.click(screen.getByRole('button', { name: /create account/i }));
  return user;
}

describe('Register screen', () => {
  beforeEach(() => {
    resetSession();
  });

  afterEach(() => {
    server.resetHandlers();
    resetSession();
  });

  it('registers a new client and stores the session', async () => {
    let body: RegisterBody | undefined;
    let url = '';

    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, async ({ request }) => {
        url = request.url;
        body = (await request.json()) as RegisterBody;

        return HttpResponse.json(
          {
            data: createMockAuthResponse({
              email: 'ada@example.com',
              role: 'CLIENT',
              userName: 'Ada Lovelace',
            }),
          },
          { status: 201 }
        );
      })
    );

    await renderApp(REGISTER_PATH);
    await submitRegister({ phone: '+15550001111' });

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(url).toBe(`${API_ORIGIN}/api/salon/stylesync/auth/register`);
    expect(body).toEqual({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: VALID_PASSWORD,
      phone: '+15550001111',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().role).toBe('CLIENT');
  });

  it('omits phone when the field is blank', async () => {
    let body: RegisterBody | undefined;

    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, async ({ request }) => {
        body = (await request.json()) as RegisterBody;
        return HttpResponse.json(
          {
            data: createMockAuthResponse({
              email: 'ada@example.com',
              role: 'CLIENT',
            }),
          },
          { status: 201 }
        );
      })
    );

    await renderApp(REGISTER_PATH);
    await submitRegister();

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(body).not.toHaveProperty('phone');
    expect(body).not.toHaveProperty('confirmLink');
  });

  it('blocks submit when the passwords do not match', async () => {
    let calls = 0;
    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, () => {
        calls += 1;
        return HttpResponse.json({ status: 500, message: 'unexpected' }, { status: 500 });
      })
    );

    await renderApp(REGISTER_PATH);
    await submitRegister({ confirmPassword: '654321' });

    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument();
    expect(calls).toBe(0);
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('blocks submit when the terms are not accepted', async () => {
    let calls = 0;
    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, () => {
        calls += 1;
        return HttpResponse.json({ status: 500, message: 'unexpected' }, { status: 500 });
      })
    );

    await renderApp(REGISTER_PATH);
    await submitRegister({ acceptTerms: false });

    expect(await screen.findByText('You must accept the terms to continue')).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it('maps a 422 email error onto the field', async () => {
    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, () => {
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

    await renderApp(REGISTER_PATH);
    await submitRegister();

    expect(await screen.findByText('email must be an email')).toBeInTheDocument();
    expect(screen.queryByText('Please check the highlighted fields')).not.toBeInTheDocument();
    expect(screen.queryByText('An error occurred')).not.toBeInTheDocument();
  });

  it('opens the link dialog on 428 and does not post again when cancelled', async () => {
    let calls = 0;
    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, () => {
        calls += 1;
        return HttpResponse.json({ status: 428, message: 'User already exists' }, { status: 428 });
      })
    );

    await renderApp(REGISTER_PATH);
    const user = await submitRegister();

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveClass('z-[60]');
    expect(dialog.previousElementSibling).toHaveClass('z-50');
    expect(screen.getByText(/password you typed is not checked/i)).toBeInTheDocument();
    expect(screen.queryByText('An error occurred')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    });
    expect(calls).toBe(1);
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('links an existing account when the dialog is confirmed', async () => {
    const bodies: RegisterBody[] = [];

    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, async ({ request }) => {
        const body = (await request.json()) as RegisterBody;
        bodies.push(body);

        if (!body.confirmLink) {
          return HttpResponse.json(
            { status: 428, message: 'User already exists' },
            { status: 428 }
          );
        }

        return HttpResponse.json(
          {
            data: createMockAuthResponse({
              email: 'ada@example.com',
              role: 'CLIENT',
              userName: 'Ada Lovelace',
            }),
          },
          { status: 201 }
        );
      })
    );

    await renderApp(REGISTER_PATH);
    const user = await submitRegister();

    expect(await screen.findByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Link account' }));

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(bodies).toHaveLength(2);
    expect(bodies[1]?.confirmLink).toBe(true);
    expect(useAuthStore.getState().role).toBe('CLIENT');
  });

  it('shows a translated alert on 409 and stays on the screen', async () => {
    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, () => {
        return HttpResponse.json(
          { status: 409, message: 'Already registered with this customer' },
          { status: 409 }
        );
      })
    );

    await renderApp(REGISTER_PATH);
    await submitRegister();

    expect(
      await screen.findByText('This email is already registered with this salon')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('shows a translated alert on 400', async () => {
    server.use(
      http.post(`${API_ORIGIN}/api/salon/:slug/auth/register`, () => {
        return HttpResponse.json(
          { status: 400, message: 'Customer not found or inactive' },
          { status: 400 }
        );
      })
    );

    await renderApp(REGISTER_PATH);
    await submitRegister();

    expect(await screen.findByText('This salon is unavailable')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('redirects an authenticated visitor to the home route', async () => {
    useAuthStore
      .getState()
      .setSession(createMockAuthResponse({ email: 'client@test.com', role: 'CLIENT' }));

    await renderApp(REGISTER_PATH);

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
  });
});
