import type { ThemeMode } from './brandingToCssVars';

export const DARK_MODE_CLASS = 'dark';
export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

/** The user's explicit choice wins; without one the operating system decides. */
export function resolveThemeMode(preference: ThemeMode | null, systemMode: ThemeMode): ThemeMode {
  return preference ?? systemMode;
}

export function getSystemThemeMode(): ThemeMode {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'light';
  }

  return window.matchMedia(PREFERS_DARK_QUERY).matches ? 'dark' : 'light';
}

export function applyThemeModeClass(mode: ThemeMode): void {
  document.documentElement.classList.toggle(DARK_MODE_CLASS, mode === 'dark');
}
