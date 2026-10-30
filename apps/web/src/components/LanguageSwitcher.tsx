import { useTranslation } from 'react-i18next';
import { LANGUAGES } from '../i18n';

export function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <label className={className}>
      <span className="sr-only">{t('nav.language')}</span>
      <select
        value={i18n.resolvedLanguage}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="rounded-md border border-white/20 bg-white/10 px-2 py-1 text-sm text-inherit focus:ring-2 focus:ring-tactile focus:outline-none [&>option]:text-slate-900"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </label>
  );
}
