import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { registerSchema } from '@city-reporter/shared';
import { ApiError, api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AuthPage, inputClass, primaryButton } from './AuthPage';

type Field = 'name' | 'email' | 'password';

export function SignUpPage() {
  const { t } = useTranslation();
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [invalid, setInvalid] = useState<Set<Field>>(new Set());

  const register = useMutation({
    mutationFn: api.register,
    onSuccess: (auth) => {
      signIn(auth);
      navigate('/', { replace: true });
    },
  });

  if (user) return <Navigate to="/" replace />;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    // Same zod schema the API uses, so client and server agree on what's valid.
    const parsed = registerSchema.safeParse(form);
    if (!parsed.success) {
      setInvalid(new Set(parsed.error.issues.map((issue) => issue.path[0] as Field)));
      return;
    }
    setInvalid(new Set());
    register.mutate(parsed.data);
  };

  const field = (name: Field, type: string, autoComplete: string) => (
    <label className="block text-sm font-medium">
      {t(`auth.${name}`)}
      <input
        type={type}
        autoComplete={autoComplete}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        aria-invalid={invalid.has(name)}
        aria-describedby={invalid.has(name) ? `${name}-error` : undefined}
        className={`${inputClass} ${invalid.has(name) ? 'border-red-500' : ''}`}
      />
      {invalid.has(name) && (
        <span id={`${name}-error`} className="mt-1 block text-sm font-normal text-red-700">
          {t(`validation.${name}`)}
        </span>
      )}
    </label>
  );

  const emailTaken = register.error instanceof ApiError && register.error.status === 409;

  return (
    <AuthPage title={t('auth.signupTitle')}>
      <form onSubmit={submit} className="space-y-4" noValidate>
        {field('name', 'text', 'name')}
        {field('email', 'email', 'email')}
        {field('password', 'password', 'new-password')}
        {register.isError && (
          <p role="alert" className="text-sm text-red-700">
            {emailTaken ? t('auth.emailTaken') : t('common.error')}
          </p>
        )}
        <p className="text-xs text-slate-500">{t('auth.whyAccount')}</p>
        <button type="submit" disabled={register.isPending} className={primaryButton}>
          {t('auth.signup')}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600">
        {t('auth.haveAccount')}{' '}
        <Link to="/login" className="font-semibold text-brand-700 underline">
          {t('auth.login')}
        </Link>
      </p>
    </AuthPage>
  );
}
