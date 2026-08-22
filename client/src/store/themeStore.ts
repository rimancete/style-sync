import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { getThemeStorageKey } from '~/utils/env';

type ThemeMode = 'light' | 'dark';

interface ThemeConfig {
  colors?: Record<string, string>;
  fonts?: Record<string, string>;
  spacing?: Record<string, string>;
}

interface ThemeState {
  mode: ThemeMode;
  config: ThemeConfig | null;
  setMode: (mode: ThemeMode) => void;
  setConfig: (config: ThemeConfig) => void;
  toggleMode: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      mode: 'light',
      config: null,
      setMode: (mode) => {
        set({ mode });
        document.documentElement.classList.toggle('dark', mode === 'dark');
      },
      setConfig: (config) => set({ config }),
      toggleMode: () => {
        const newMode = get().mode === 'light' ? 'dark' : 'light';
        get().setMode(newMode);
      },
    }),
    {
      name: getThemeStorageKey(),
    }
  )
);
