import { beforeEach, describe, expect, it } from 'vitest';

import { resolveThemeMode } from '~/lib/theme/themeMode';
import { getThemeStorageKey } from '~/utils/env';

import { useThemeStore } from './themeStore';

function readPersisted(): unknown {
  return JSON.parse(localStorage.getItem(getThemeStorageKey()) ?? 'null');
}

describe('resolveThemeMode', () => {
  it('follows the operating system when the user has not chosen', () => {
    expect(resolveThemeMode(null, 'dark')).toBe('dark');
    expect(resolveThemeMode(null, 'light')).toBe('light');
  });

  it('lets the user choice win over the operating system', () => {
    expect(resolveThemeMode('light', 'dark')).toBe('light');
    expect(resolveThemeMode('dark', 'light')).toBe('dark');
  });
});

describe('useThemeStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useThemeStore.setState({ preference: null, systemMode: 'light', mode: 'light' });
  });

  it('follows system changes while there is no preference', () => {
    useThemeStore.getState().setSystemMode('dark');

    expect(useThemeStore.getState().mode).toBe('dark');
  });

  it('persists only the explicit choice', () => {
    useThemeStore.getState().toggleMode();

    expect(useThemeStore.getState().mode).toBe('dark');
    expect(readPersisted()).toEqual({ state: { preference: 'dark' }, version: 1 });
  });

  it('keeps the explicit choice when the system changes', () => {
    useThemeStore.getState().setMode('light');
    useThemeStore.getState().setSystemMode('dark');

    expect(useThemeStore.getState().mode).toBe('light');
  });

  it('drops the legacy v0 mode that was never a real choice', async () => {
    localStorage.setItem(
      getThemeStorageKey(),
      JSON.stringify({ state: { mode: 'dark', config: null }, version: 0 })
    );
    useThemeStore.getState().setSystemMode('light');

    await useThemeStore.persist.rehydrate();

    expect(useThemeStore.getState().preference).toBeNull();
    expect(useThemeStore.getState().mode).toBe('light');
  });
});
