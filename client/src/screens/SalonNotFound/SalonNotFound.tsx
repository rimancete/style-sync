import { useTranslation } from 'react-i18next';

import { ThemeModeToggle } from '~/components/theme-mode-toggle';
import { Panel, PanelDescription, PanelHeader, PanelTitle } from '~/components/ui/panel';

/** Rendered on the system theme: an unknown slug has no branding to show. */
export function SalonNotFoundScreen() {
  const { t } = useTranslation('common');

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-5">
      <ThemeModeToggle className="absolute right-4 top-4" />
      <Panel className="w-full max-w-md text-center">
        <PanelHeader>
          <PanelTitle as="h1">{t('salonNotFound.title')}</PanelTitle>
          <PanelDescription>{t('salonNotFound.description')}</PanelDescription>
        </PanelHeader>
      </Panel>
    </div>
  );
}
