import type { ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useLogout } from '~/hooks/useLogout';
import { useAuthStore, type CustomerSummary } from '~/store/authStore';
import { ADMIN_HOME_PATH } from '~/utils/session-paths.util';

import { AppShell } from './AppShell';
import { CustomerSwitcher } from './CustomerSwitcher';
import type { NavItem } from './types';

type AdminShellProps = {
  children: ReactNode;
};

/** Always on the system theme: switching company only changes the data scope. */
export function AdminShell({ children }: AdminShellProps) {
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  const logout = useLogout();
  const customers = useAuthStore((state) => state.customers);
  const activeCustomerId = useAuthStore((state) => state.activeCustomerId);
  const setActiveCustomer = useAuthStore((state) => state.setActiveCustomer);

  const navItems: NavItem[] = [
    { href: ADMIN_HOME_PATH, label: t('navigation.dashboard'), icon: 'LayoutGrid', exact: true },
    { href: `${ADMIN_HOME_PATH}/bookings`, label: t('navigation.bookings'), icon: 'Calendar' },
    { href: `${ADMIN_HOME_PATH}/club`, label: t('navigation.club'), icon: 'Star' },
    { href: `${ADMIN_HOME_PATH}/plan`, label: t('navigation.plan'), icon: 'CreditCard' },
    { href: `${ADMIN_HOME_PATH}/profile`, label: t('navigation.profile'), icon: 'User' },
  ];

  function switchCompany(customer: CustomerSummary) {
    setActiveCustomer(customer.id);
    void queryClient.invalidateQueries({ queryKey: [customer.id] });
  }

  return (
    <AppShell
      brand={<span className="text-sm font-medium">{t('app.name')}</span>}
      navItems={navItems}
      onLogout={logout}
      switcher={
        <CustomerSwitcher
          label={t('shell.switchCompany')}
          customers={customers}
          activeCustomerId={activeCustomerId}
          onChange={switchCompany}
        />
      }
    >
      {children}
    </AppShell>
  );
}
