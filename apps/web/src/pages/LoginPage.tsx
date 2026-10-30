import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AuthPage, inputClass, primaryButton } from './AuthPage';

export function LoginPage() {
  const { t } = useTranslation();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  // Return to the page that required login, including its query (e.g. ?report=… deep links).
  const fromLocation = (useLocation().state as { from?: { pathname: string; search: string } } | null)
    ?.from;
  const from = fromLocation ? fromLocation.pathname + fromLocation.search : '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const login = useMutation({
    mutationFn: api.login,
    onSuccess: (auth) => {
      signIn(auth);
      navigate(from, { replace: true });
    },
  });

  // Also reached right after signIn(), so it must point to the same place as navigate().
  if (user) return <Navigate to={from} replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    login.mutate({ email, password });
  };

  return (
    <AuthPage title={t('auth.loginTitle')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        <label className="block text-sm font-medium">
          {t('auth.email')}
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="block text-sm font-medium">
          {t('auth.password')}
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </label>
        {login.isError && (
          <p role="alert" className="text-sm text-red-700">
            {t('auth.invalidCredentials')}
          </p>
        )}
        <button type="submit" disabled={login.isPending} className={primaryButton}>
          {t('auth.login')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        {t('auth.noAccount')}{' '}
        <Link to="/signup" className="font-semibold text-brand-700 underline">
          {t('auth.signup')}
        </Link>
      </p>
    </AuthPage>
  );
}
