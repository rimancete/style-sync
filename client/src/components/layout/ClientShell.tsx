import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation, useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import type { CustomerBranding } from '~/api/customers/types';
import { useLogout } from '~/hooks/useLogout';
import { useAuthStore, type CustomerSummary } from '~/store/authStore';
import { useThemeStore } from '~/store/themeStore';
import { replaceSalonSlug, salonPath } from '~/utils/session-paths.util';

import { AppShell } from './AppShell';
import { CustomerSwitcher } from './CustomerSwitcher';
import type { NavItem } from './types';

type ClientShellProps = {
  salon: CustomerBranding;
  children: ReactNode;
};

export function ClientShell({ salon, children }: ClientShellProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = useLocation({ select: (location) => location.pathname });
  const logout = useLogout();
  const customers = useAuthStore((state) => state.customers);
  const activeCustomerId = useAuthStore((state) => state.activeCustomerId);

  const navItems: NavItem[] = [
    {
      href: salonPath(salon.urlSlug),
      label: t('navigation.home'),
      icon: 'LayoutGrid',
      exact: true,
    },
    {
      href: salonPath(salon.urlSlug, '/user'),
      label: t('navigation.bookings'),
      icon: 'Calendar',
      exact: true,
    },
    {
      href: salonPath(salon.urlSlug, '/user/profile'),
      label: t('navigation.profile'),
      icon: 'User',
    },
  ];

  function switchSalon(customer: CustomerSummary) {
    void queryClient.invalidateQueries({ queryKey: [customer.id] });
    void router.navigate({ href: replaceSalonSlug(pathname, customer.urlSlug) });
  }

  return (
    <AppShell
      brand={<SalonLogo salon={salon} />}
      navItems={navItems}
      onLogout={logout}
      switcher={
        <CustomerSwitcher
          label={t('shell.switchSalon')}
          customers={customers}
          activeCustomerId={activeCustomerId}
          onChange={switchSalon}
        />
      }
    >
      {children}
    </AppShell>
  );
}

function SalonLogo({ salon }: { salon: CustomerBranding }) {
  const mode = useThemeStore((state) => state.mode);
  const palette = salon.branding.theme[mode];

  if (!palette.logoUrl) {
    return <span className="truncate text-sm font-medium">{salon.name}</span>;
  }

  return <img src={palette.logoUrl} alt={palette.logoAlt} className="h-8 w-auto max-w-[10rem]" />;
}
