import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useTranslation } from 'react-i18next';
import type { Role } from '@city-reporter/shared';
import { useAuth } from '../auth/AuthContext';

/** Renders children only for logged-in users (optionally with a given role). */
export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <p className="p-6 text-slate-500">{t('common.loading')}</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}
