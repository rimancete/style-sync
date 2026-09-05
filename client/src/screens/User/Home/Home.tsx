import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { api } from '~/api';
import { useAuthStore } from '~/store/authStore';

export function UserHomeScreen() {
  const { t } = useTranslation();
  const { navigate } = useRouter();
  const { data: customers } = api.customers.mine();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t('home.user.title')}</h1>
      <p className="text-muted-foreground mt-2">{t('home.user.subtitle')}</p>
      {customers && customers.length > 0 ? (
        <ul className="mt-4 list-disc pl-5">
          {customers.map((customer) => (
            <li key={customer.id}>{customer.name}</li>
          ))}
        </ul>
      ) : null}
      <button
        className="bg-red-500 text-white px-4 py-2 rounded-md"
        onClick={() => {
          useAuthStore.getState().clearAuth();
          navigate({ to: '/login' });
        }}
      >
        {t('actions.logout')}
      </button>
    </div>
  );
}
