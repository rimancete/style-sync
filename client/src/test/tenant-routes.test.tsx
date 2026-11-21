import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { createMockAuthResponse, MOCK_ACME, MOCK_ELITE } from '~/mocks/auth';
import { server } from '~/mocks/server';
import { useAuthStore } from '~/store/authStore';
import { renderApp } from '~/test/renderApp';
import { screen } from '~/test/utils';

import '~/i18n/config';

const API_ORIGIN = 'http://localhost:3001';
const VALID_PASSWORD = '123456';

function resetSession() {
  useAuthStore.getState().clearAuth();
  useAuthStore.persist.clearStorage();
  window.localStorage.clear();
}

function passwordInput(): HTMLInputElement {
  return document.querySelector('input[autocomplete="current-password"]') as HTMLInputElement;
}

async function submitLogin(email: string) {
  await screen.findByRole('heading', { name: 'Sign In' });
  const user = userEvent.setup();
  await user.type(screen.getByLabelText(/email/i), email);
  await user.type(passwordInput(), VALID_PASSWORD);
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  return user;
}

describe('Tenant routes', () => {
  beforeEach(() => {
    resetSession();
  });

  afterEach(() => {
    server.resetHandlers();
    resetSession();
  });

  it('shows the salon login with the Acme document title', async () => {
    await renderApp('/salon/acme/login');

    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(document.title).toBe('Acme Barbershop - Professional Haircuts');
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute(
      'href',
      '/salon/acme/register'
    );
  });

  it('shows a neutral not-found page for an unknown slug', async () => {
    await renderApp('/salon/missing/login');

    expect(await screen.findByRole('heading', { name: 'Salon not found' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign In' })).not.toBeInTheDocument();
  });

  it('shows a not-found page for an inactive salon', async () => {
    server.use(
      http.get(`${API_ORIGIN}/api/customers/branding/:slug`, () => {
        return HttpResponse.json(
          { status: 404, message: 'Customer not found or inactive' },
          { status: 404 }
        );
      })
    );

    await renderApp('/salon/closed/register');

    expect(await screen.findByRole('heading', { name: 'Salon not found' })).toBeInTheDocument();
  });

  it('sends a CLIENT to the salon home after a salon login', async () => {
    await renderApp('/salon/acme/login');
    await submitLogin('client@test.com');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(useAuthStore.getState().activeCustomerSlug).toBe('acme');
    expect(screen.queryByLabelText('Switch salon')).not.toBeInTheDocument();
  });

  it('rejects a CLIENT with no link to that salon', async () => {
    await renderApp('/salon/elite-beauty/login');
    await submitLogin('client@test.com');

    expect(
      await screen.findByText('This account cannot sign in through this salon link.')
    ).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('links register back to the salon login', async () => {
    await renderApp('/salon/acme/register');

    expect(await screen.findByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/salon/acme/login'
    );
  });

  it('shows the salon switcher for a CLIENT with several links', async () => {
    await renderApp('/salon/elite-beauty/login');
    await submitLogin('client2@multi.com');

    expect(await screen.findByLabelText('Switch salon')).toBeInTheDocument();
    expect(useAuthStore.getState().activeCustomerSlug).toBe('elite-beauty');
  });

  it('keeps the subroute when a CLIENT switches salons', async () => {
    useAuthStore.getState().setSession(
      createMockAuthResponse({
        email: 'client2@multi.com',
        role: 'CLIENT',
        customers: [MOCK_ACME, MOCK_ELITE],
        defaultCustomerId: MOCK_ACME.id,
      })
    );

    const { router } = await renderApp('/salon/acme/user');
    expect(await screen.findByLabelText('Switch salon')).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Switch salon'));
    await user.click(await screen.findByRole('option', { name: 'Elite Beauty Salon' }));

    expect(router.state.location.pathname).toBe('/salon/elite-beauty/user');
    expect(useAuthStore.getState().activeCustomerSlug).toBe('elite-beauty');
  });

  it('redirects an unlinked CLIENT to the active salon without showing the other', async () => {
    useAuthStore.getState().setSession(
      createMockAuthResponse({
        email: 'client@test.com',
        role: 'CLIENT',
        customers: [MOCK_ACME],
      })
    );

    const { router } = await renderApp('/salon/elite-beauty/user');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/salon/acme/user');
  });

  it('sends a logged-out visitor from a protected salon route to salon login', async () => {
    const { router } = await renderApp('/salon/acme/user');

    expect(await screen.findByRole('heading', { name: 'Sign In' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/salon/acme/login');
  });

  it('returns that visitor to the original salon route after login', async () => {
    await renderApp('/salon/acme/user');
    await submitLogin('client@test.com');

    expect(await screen.findByRole('heading', { name: 'My Bookings' })).toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('redirects a CLIENT from / and /user to the active salon', async () => {
    useAuthStore.getState().setSession(
      createMockAuthResponse({
        email: 'client@test.com',
        role: 'CLIENT',
        customers: [MOCK_ACME],
      })
    );

    const home = await renderApp('/');
    expect(home.router.state.location.pathname).toBe('/salon/acme');
    home.unmount();

    const user = await renderApp('/user');
    expect(user.router.state.location.pathname).toBe('/salon/acme/user');
  });

  it('lets an ADMIN pick a company and then switch in the header', async () => {
    await renderApp('/login');
    await submitLogin('admin@stylesync.com');

    expect(await screen.findByRole('heading', { name: 'Choose a company' })).toBeInTheDocument();

    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Acme Barbershop' }));

    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(useAuthStore.getState().activeCustomerSlug).toBe('acme');
    expect(screen.getByLabelText('Switch company')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Switch company'));
    await user.click(await screen.findByRole('option', { name: 'Elite Beauty Salon' }));

    expect(useAuthStore.getState().activeCustomerSlug).toBe('elite-beauty');
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });
});
