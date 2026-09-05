import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  getApiUrl,
  getAuthStorageKey,
  getI18nStorageKey,
  getThemeStorageKey,
  isMocksEnabled,
} from './env';

describe('env', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('defaults the API URL to the local Nest server', () => {
    expect(getApiUrl()).toBe('http://localhost:3001');
  });

  it('reads VITE_API_BASE_URL when set', () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.example.com');

    expect(getApiUrl()).toBe('http://api.example.com');
  });

  it('keeps mocks off unless VITE_ENABLE_MOCKS is the string true', () => {
    expect(isMocksEnabled()).toBe(false);

    vi.stubEnv('VITE_ENABLE_MOCKS', 'false');
    expect(isMocksEnabled()).toBe(false);

    vi.stubEnv('VITE_ENABLE_MOCKS', 'true');
    expect(isMocksEnabled()).toBe(true);
  });

  it('defaults storage keys to StyleSync Dev identifiers', () => {
    expect(getAuthStorageKey()).toBe('StyleSync_Auth_Dev');
    expect(getThemeStorageKey()).toBe('StyleSync_Theme_Dev');
    expect(getI18nStorageKey()).toBe('StyleSync_I18n_Dev');
  });

  it('reads storage key overrides from the environment', () => {
    vi.stubEnv('VITE_AUTH_STORAGE_KEY', 'StyleSync_Auth_Staging');
    vi.stubEnv('VITE_THEME_STORAGE_KEY', 'StyleSync_Theme_Staging');
    vi.stubEnv('VITE_I18N_STORAGE_KEY', 'StyleSync_I18n_Staging');

    expect(getAuthStorageKey()).toBe('StyleSync_Auth_Staging');
    expect(getThemeStorageKey()).toBe('StyleSync_Theme_Staging');
    expect(getI18nStorageKey()).toBe('StyleSync_I18n_Staging');
  });
});
