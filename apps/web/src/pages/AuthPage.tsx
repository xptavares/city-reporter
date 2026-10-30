import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../components/LanguageSwitcher';

/** Shared frame for the login and sign-up screens. */
export function AuthPage({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-full flex-col bg-navy px-4 py-6 text-white">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <div className="mx-auto mt-8 w-full max-w-sm">
        <div className="mb-6">
          <span className="mb-3 block h-3 w-10 rounded-sm bg-tactile" aria-hidden="true" />
          <p className="text-3xl font-bold tracking-tight">{t('app.name')}</p>
          <p className="mt-2 text-white/75">{t('app.tagline')}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-xl">
          <h1 className="mb-4 text-xl font-bold text-navy">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}

export const inputClass =
  'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-brand-600 focus:ring-2 focus:ring-brand-600/30 focus:outline-none';
export const primaryButton =
  'w-full rounded-lg bg-brand-600 px-4 py-2.5 font-semibold text-white hover:bg-brand-700 focus:ring-2 focus:ring-brand-600 focus:ring-offset-2 focus:outline-none disabled:opacity-60';
