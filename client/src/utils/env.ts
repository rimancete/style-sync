/**
 * Single entry point for environment variables.
 *
 * No other module should read `import.meta.env` directly — centralising it here
 * keeps defaults in one place and makes the values trivial to stub in tests.
 */

const DEFAULT_API_URL = 'http://localhost:3001';
const DEFAULT_AUTH_STORAGE_KEY = 'StyleSync_Auth_Dev';
const DEFAULT_THEME_STORAGE_KEY = 'StyleSync_Theme_Dev';
const DEFAULT_I18N_STORAGE_KEY = 'StyleSync_I18n_Dev';

export function getApiUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || DEFAULT_API_URL;
}

export function isMocksEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MOCKS === 'true';
}

export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

export function getAuthStorageKey(): string {
  return import.meta.env.VITE_AUTH_STORAGE_KEY || DEFAULT_AUTH_STORAGE_KEY;
}

export function getThemeStorageKey(): string {
  return import.meta.env.VITE_THEME_STORAGE_KEY || DEFAULT_THEME_STORAGE_KEY;
}

export function getI18nStorageKey(): string {
  return import.meta.env.VITE_I18N_STORAGE_KEY || DEFAULT_I18N_STORAGE_KEY;
}
