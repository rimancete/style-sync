import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { ThemeMode } from '~/lib/theme/brandingToCssVars';
import { getSystemThemeMode, resolveThemeMode } from '~/lib/theme/themeMode';
import { getThemeStorageKey } from '~/utils/env';

type PersistedThemeState = {
  /** `null` until the user picks a mode, so the operating system keeps deciding. */
  preference: ThemeMode | null;
};

type ThemeState = PersistedThemeState & {
  systemMode: ThemeMode;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
  setSystemMode: (systemMode: ThemeMode) => void;
};

/**
 * v0 persisted `{ mode, config }` with `mode` defaulting to light even when the
 * user never chose it, so it is not a real preference and is dropped. The
 * inline script in `index.html` reads `state.preference` from this shape.
 */
const THEME_SCHEMA_VERSION = 1;

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => {
      const systemMode = getSystemThemeMode();

      return {
        preference: null,
        systemMode,
        mode: systemMode,
        setMode: (mode) => set({ preference: mode, mode }),
        toggleMode: () => get().setMode(get().mode === 'light' ? 'dark' : 'light'),
        setSystemMode: (nextSystemMode) =>
          set((state) => ({
            systemMode: nextSystemMode,
            mode: resolveThemeMode(state.preference, nextSystemMode),
          })),
      };
    },
    {
      name: getThemeStorageKey(),
      version: THEME_SCHEMA_VERSION,
      migrate: (): PersistedThemeState => ({ preference: null }),
      partialize: (state): PersistedThemeState => ({ preference: state.preference }),
      merge: (persisted, current) => {
        const preference = (persisted as Partial<PersistedThemeState> | undefined)?.preference;
        const safePreference = preference === 'light' || preference === 'dark' ? preference : null;

        return {
          ...current,
          preference: safePreference,
          mode: resolveThemeMode(safePreference, current.systemMode),
        };
      },
    }
  )
);
