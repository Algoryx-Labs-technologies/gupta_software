import { createContext, useContext, useCallback, useMemo, type ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasPermission, type Permission, type Role } from '@gupta/shared';
import { authApi } from '@/api/auth';
import { setAccessToken } from '@/api/axios';
import type { AuthUser } from '@gupta/shared';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  adminLogin: (id: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authApi.me,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: !!localStorage.getItem('accessToken'),
  });

  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  const adminLoginMutation = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      authApi.adminLogin(id, password),
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      queryClient.setQueryData(['auth', 'me'], data.user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      setAccessToken(null);
      queryClient.clear();
    },
  });

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
    },
    [loginMutation],
  );

  const adminLogin = useCallback(
    async (id: string, password: string) => {
      await adminLoginMutation.mutateAsync({ id, password });
    },
    [adminLoginMutation],
  );

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const can = useCallback(
    (permission: Permission) => {
      if (!user) return false;
      return hasPermission(user.role as Role, permission);
    },
    [user],
  );

  const value = useMemo(
    () => ({
      user: user ?? null,
      isLoading,
      isAuthenticated: !!user,
      login,
      adminLogin,
      logout,
      can,
    }),
    [user, isLoading, login, adminLogin, logout, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function useCan(permission: Permission) {
  const { can } = useAuth();
  return can(permission);
}
