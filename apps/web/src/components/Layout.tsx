import { NavLink, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { LanguageSwitcher } from './LanguageSwitcher';

const navLink = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-white/15 text-white' : 'text-white/75 hover:text-white'}`;

export function Layout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 bg-navy px-3 text-white sm:px-4">
        <span className="mr-2 flex items-center gap-2 font-bold tracking-tight">
          <span className="h-3 w-6 rounded-sm bg-tactile" aria-hidden="true" />
          <span className="hidden sm:inline">{t('app.name')}</span>
        </span>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={navLink}>
            {t('nav.map')}
          </NavLink>
          {user?.role === 'agent' && (
            <NavLink to="/agent/reports" className={navLink}>
              {t('nav.reports')}
            </NavLink>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
          <span className="hidden text-sm text-white/75 md:inline">{user?.name}</span>
          <button
            onClick={signOut}
            className="rounded-md px-2 py-1.5 text-sm text-white/75 hover:text-white"
          >
            {t('nav.logout')}
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
