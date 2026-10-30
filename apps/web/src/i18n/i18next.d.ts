import 'i18next';
import type { en } from './locales/en';

// Type-checked translation keys: t('nav.mapp') is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    resources: { translation: typeof en };
  }
}
