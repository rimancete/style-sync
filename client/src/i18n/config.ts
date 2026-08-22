import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import { getI18nStorageKey } from '~/utils/env';

// Import translations
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import ptCommon from './locales/pt/common.json';
import ptAuth from './locales/pt/auth.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
      },
      pt: {
        common: ptCommon,
        auth: ptAuth,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: getI18nStorageKey(),
    },
  });

export default i18n;
