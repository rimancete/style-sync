import { useTranslation } from 'react-i18next';

import { ThemeModeToggle } from '~/components/theme-mode-toggle';
import { Card, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';

/** Rendered on the system theme: an unknown slug has no branding to show. */
export function SalonNotFoundScreen() {
  const { t } = useTranslation('common');

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-5">
      <ThemeModeToggle className="absolute right-4 top-4" />
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle as="h1">{t('salonNotFound.title')}</CardTitle>
          <CardDescription>{t('salonNotFound.description')}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
