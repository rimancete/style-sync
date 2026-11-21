import type { MouseEvent } from 'react';
import { useLocation, useRouter } from '@tanstack/react-router';

import { Icon } from '~/components/Icon';
import { cn } from '~/lib/utils';

import type { NavItem } from './types';

type NavLinksProps = {
  items: NavItem[];
  onNavigate?: () => void;
};

export function NavLinks({ items, onNavigate }: NavLinksProps) {
  const router = useRouter();
  const pathname = useLocation({ select: (location) => location.pathname });

  function handleClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) {
      return;
    }

    event.preventDefault();
    onNavigate?.();
    void router.navigate({ href });
  }

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const isActive = isActivePath(pathname, item);

        return (
          <li key={item.href}>
            <a
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={(event) => handleClick(event, item.href)}
              className={cn(
                'flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon name={item.icon} className="h-4 w-4" />
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function isActivePath(pathname: string, { href, exact }: NavItem): boolean {
  const normalised = pathname.replace(/\/$/, '') || '/';

  return exact ? normalised === href : normalised === href || normalised.startsWith(`${href}/`);
}
