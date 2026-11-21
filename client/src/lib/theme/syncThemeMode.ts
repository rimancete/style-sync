import { useThemeStore } from '~/store/themeStore';

import { applyThemeModeClass, PREFERS_DARK_QUERY } from './themeMode';

/**
 * Keeps the `dark` class on `<html>` in step with the theme store and follows
 * operating-system changes while the user has no explicit preference.
 * Returns a cleanup that removes both listeners.
 */
export function syncThemeMode(): () => void {
  applyThemeModeClass(useThemeStore.getState().mode);

  const unsubscribeStore = useThemeStore.subscribe((state, previous) => {
    if (state.mode !== previous.mode) {
      applyThemeModeClass(state.mode);
    }
  });

  if (typeof window.matchMedia !== 'function') {
    return unsubscribeStore;
  }

  const mediaQuery = window.matchMedia(PREFERS_DARK_QUERY);
  const handleSystemChange = (event: MediaQueryListEvent) => {
    useThemeStore.getState().setSystemMode(event.matches ? 'dark' : 'light');
  };
  mediaQuery.addEventListener('change', handleSystemChange);

  return () => {
    unsubscribeStore();
    mediaQuery.removeEventListener('change', handleSystemChange);
  };
}
