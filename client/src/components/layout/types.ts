import type { Icon } from '~/components/Icon';

export type NavItem = {
  href: string;
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  /** Only highlight on an exact match, for items whose path prefixes others. */
  exact?: boolean;
};
