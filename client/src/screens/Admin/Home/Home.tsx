import { useTranslation } from 'react-i18next';

import { api } from '~/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

export function AdminHomeScreen() {
  const { t } = useTranslation();
  const { data: customers } = api.customers.mine();

  return (
    <Card>
      <CardHeader>
        <CardTitle as="h1">{t('home.admin.title')}</CardTitle>
        <CardDescription>{t('home.admin.subtitle')}</CardDescription>
      </CardHeader>
      {customers && customers.length > 0 ? (
        <CardContent>
          <ul className="list-disc pl-5">
            {customers.map((customer) => (
              <li key={customer.id}>{customer.name}</li>
            ))}
          </ul>
        </CardContent>
      ) : null}
    </Card>
  );
}
