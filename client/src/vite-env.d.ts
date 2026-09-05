/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_CUSTOMER_SUBDOMAIN: string;
  readonly VITE_APP_ENV: string;
  readonly VITE_ENABLE_MOCKS: string;
  readonly VITE_AUTH_STORAGE_KEY: string;
  readonly VITE_THEME_STORAGE_KEY: string;
  readonly VITE_I18N_STORAGE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
