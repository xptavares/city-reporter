import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthResponse, User } from '@city-reporter/shared';
import { api, setUnauthorizedHandler } from '../api/client';
import { getToken, setToken } from './token';

type AuthState = {
  user: User | null;
  /** True while a stored token is being checked against /auth/me. */
  loading: boolean;
  signIn: (auth: AuthResponse) => void;
  signOut: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [hasToken, setHasToken] = useState(() => getToken() !== null);

  const me = useQuery({ queryKey: ['me'], queryFn: api.me, enabled: hasToken, retry: false });

  const signOut = useCallback(() => {
    setToken(null);
    setHasToken(false);
    queryClient.clear();
  }, [queryClient]);

  const signIn = useCallback(
    ({ token, user }: AuthResponse) => {
      queryClient.clear();
      setToken(token);
      queryClient.setQueryData(['me'], user);
      setHasToken(true);
    },
    [queryClient],
  );

  useEffect(() => setUnauthorizedHandler(signOut), [signOut]);

  const value = useMemo<AuthState>(
    () => ({
      user: hasToken ? (me.data ?? null) : null,
      loading: hasToken && me.isPending,
      signIn,
      signOut,
    }),
    [hasToken, me.data, me.isPending, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
