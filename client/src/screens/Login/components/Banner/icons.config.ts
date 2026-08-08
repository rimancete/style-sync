import type { IconGroupItem } from './components/IconGroup';

export const ICONS_FIRST_GROUP: IconGroupItem[] = [
  {
    src: '/login-icon-g1-schedule.svg',
    className: 'absolute size-56 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: 0,
    layer: 'first',
    centered: true,
  },
  {
    src: '/login-icon-g1-clock.svg',
    className:
      'absolute left-0 top-0 size-20 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: -12,
    layer: 'second',
  },
  {
    src: '/login-icon-g1-check.svg',
    className:
      'absolute bottom-[-14px] right-[-40px] z-20 size-20 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: 12,
    layer: 'second',
  },
];

export const ICONS_SECOND_GROUP: IconGroupItem[] = [
  {
    src: '/login-icon-g2-thumbs.svg',
    className: 'absolute size-56 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: 0,
    layer: 'first',
    centered: true,
  },
  {
    src: '/login-icon-g2-star.svg',
    className:
      'absolute left-0 top-0 size-20 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: -8,
    layer: 'second',
  },
  {
    src: '/login-icon-g2-sparkles.svg',
    className:
      'absolute bottom-[-14px] right-[-40px] z-20 size-20 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: 10,
    layer: 'second',
  },
];

export const ICONS_THIRD_GROUP: IconGroupItem[] = [
  {
    src: '/login-icon-g3-sync.svg',
    className: 'absolute size-56 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: 0,
    layer: 'first',
    centered: true,
  },
  {
    src: '/login-icon-g3-calendar-check.svg',
    className:
      'absolute left-0 top-0 size-20 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: -10,
    layer: 'second',
  },
  {
    src: '/login-icon-g3-plus.svg',
    className:
      'absolute bottom-[-14px] right-[-40px] z-20 size-20 drop-shadow-2xl transition-transform duration-500 ease-out',
    rotationDeg: 8,
    layer: 'second',
  },
];

export const ICON_GROUPS = [ICONS_FIRST_GROUP, ICONS_SECOND_GROUP, ICONS_THIRD_GROUP] as const;
