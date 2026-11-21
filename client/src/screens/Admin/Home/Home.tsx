import { useTranslation } from 'react-i18next';

import { api } from '~/api';
import {
  Panel,
  PanelContent,
  PanelDescription,
  PanelHeader,
  PanelTitle,
} from '~/components/ui/panel';

export function AdminHomeScreen() {
  const { t } = useTranslation();
  const { data: customers } = api.customers.mine();

  return (
    <Panel>
      <PanelHeader>
        <PanelTitle as="h1">{t('home.admin.title')}</PanelTitle>
        <PanelDescription>{t('home.admin.subtitle')}</PanelDescription>
      </PanelHeader>
      {customers && customers.length > 0 ? (
        <PanelContent>
          <ul className="list-disc pl-5">
            {customers.map((customer) => (
              <li key={customer.id}>{customer.name}</li>
            ))}
          </ul>
        </PanelContent>
      ) : null}
    </Panel>
  );
}
