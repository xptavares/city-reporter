import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import { en } from './locales/en';
import { pt } from './locales/pt';
import { es } from './locales/es';

export const LANGUAGES = [
  { code: 'pt', label: 'Português' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, pt: { translation: pt }, es: { translation: es } },
    fallbackLng: 'en',
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true, // pt-BR → pt, es-AR → es
    interpolation: { escapeValue: false }, // React already escapes
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
