import { useTranslation } from 'react-i18next';

import { Icon } from '~/components/Icon';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { useThemeStore } from '~/store/themeStore';

type ThemeModeToggleProps = {
  className?: string;
};

export function ThemeModeToggle({ className }: ThemeModeToggleProps) {
  const { t } = useTranslation('common');
  const mode = useThemeStore((state) => state.mode);
  const toggleMode = useThemeStore((state) => state.toggleMode);
  const isDark = mode === 'dark';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('shrink-0', className)}
      aria-label={t('theme.darkMode')}
      aria-pressed={isDark}
      onClick={toggleMode}
    >
      <Icon name={isDark ? 'Moon' : 'Sun'} className="h-5 w-5" />
    </Button>
  );
}
