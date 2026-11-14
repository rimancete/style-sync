import { useRouter } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

import { ThemeModeToggle } from '~/components/theme-mode-toggle';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { useAuthStore } from '~/store/authStore';
import { resolvePostLoginPath } from '~/utils/session-paths.util';

type SelectCompanyScreenProps = {
  redirect?: string;
};

export function SelectCompanyScreen({ redirect }: SelectCompanyScreenProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const customers = useAuthStore((state) => state.customers);
  const setActiveCustomer = useAuthStore((state) => state.setActiveCustomer);

  function selectCompany(customerId: string) {
    setActiveCustomer(customerId);
    void router.navigate({ href: resolvePostLoginPath(useAuthStore.getState(), redirect) });
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-5">
      <ThemeModeToggle className="absolute right-4 top-4" />
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle as="h1">{t('selectCompany.title')}</CardTitle>
          <CardDescription>{t('selectCompany.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {customers.map((customer) => (
              <li key={customer.id}>
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 w-full justify-start rounded-xl"
                  onClick={() => selectCompany(customer.id)}
                >
                  {customer.name}
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
