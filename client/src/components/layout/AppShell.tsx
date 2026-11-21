import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Icon } from '~/components/Icon';
import { ThemeModeToggle } from '~/components/theme-mode-toggle';
import { Button } from '~/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '~/components/ui/sheet';

import { NavLinks } from './NavLinks';
import type { NavItem } from './types';

type AppShellProps = {
  brand: ReactNode;
  navItems: NavItem[];
  /** Salon or company picker, rendered in the header. */
  switcher?: ReactNode;
  onLogout: () => void;
  children: ReactNode;
};

/** Private-area layout from the design system: sidebar, header and a card container. */
export function AppShell({ brand, navItems, switcher, onLogout, children }: AppShellProps) {
  const { t } = useTranslation('common');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="hidden w-60 shrink-0 border-r bg-card/60 p-4 sm:block">
        <div className="mb-6 flex h-10 items-center">{brand}</div>
        <nav aria-label={t('shell.navigation')}>
          <NavLinks items={navItems} />
        </nav>
      </aside>

      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent closeLabel={t('shell.closeMenu')}>
          <SheetTitle className="flex h-10 items-center">{brand}</SheetTitle>
          <SheetDescription>{t('shell.navigation')}</SheetDescription>
          <nav aria-label={t('shell.navigation')}>
            <NavLinks items={navItems} onNavigate={() => setIsMenuOpen(false)} />
          </nav>
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-full max-w-[1280px] items-center gap-3 px-5 sm:px-8 lg:px-10">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label={t('shell.openMenu')}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(true)}
            >
              <Icon name="Menu" className="h-5 w-5" />
            </Button>
            <div className="flex min-w-0 items-center sm:hidden">{brand}</div>

            <div className="ml-auto flex items-center gap-2">
              {switcher}
              <ThemeModeToggle />
              <Button type="button" variant="ghost" size="sm" onClick={onLogout}>
                <Icon name="LogOut" className="h-4 w-4" />
                <span className="hidden sm:inline">{t('actions.logout')}</span>
                <span className="sr-only sm:hidden">{t('actions.logout')}</span>
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 py-8 sm:px-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  );
}
