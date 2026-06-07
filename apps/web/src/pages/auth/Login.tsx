import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  loginSchema,
  adminLoginSchema,
  type LoginInput,
  type AdminLoginInput,
} from '@gupta/shared';
import { useAuth } from '@/auth/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Logo } from '@/components/Logo';
import { Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/cn';

type LoginMode = 'team' | 'admin';

export default function LoginPage() {
  const { login, adminLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<LoginMode>('team');
  const [loading, setLoading] = useState(false);

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const teamForm = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const adminForm = useForm<AdminLoginInput>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { id: '', password: '' },
  });

  const onTeamSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onAdminSubmit = async (data: AdminLoginInput) => {
    setLoading(true);
    try {
      await adminLogin(data.id, data.password);
      navigate('/admin/team', { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Admin login failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col items-center gap-3 lg:hidden">
        <Logo size="lg" />
        <p className="text-sm text-muted">Sign in to continue</p>
      </div>

      <div className="mb-6 flex rounded-xl border border-border bg-surface p-1">
        <button
          type="button"
          onClick={() => setMode('team')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition',
            mode === 'team' ? 'bg-brand-gradient text-white shadow-soft' : 'text-muted hover:text-gray-800',
          )}
        >
          <Users className="h-4 w-4" />
          Team Login
        </button>
        <button
          type="button"
          onClick={() => setMode('admin')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition',
            mode === 'admin' ? 'bg-brand-gradient text-white shadow-soft' : 'text-muted hover:text-gray-800',
          )}
        >
          <Shield className="h-4 w-4" />
          Admin Login
        </button>
      </div>

      {mode === 'team' ? (
        <>
          <h2 className="text-2xl font-bold text-gray-900">Team sign in</h2>
          <p className="mt-1 text-sm text-muted">
            For data operators and accountants. Credentials are created by your admin.
          </p>
          <form onSubmit={teamForm.handleSubmit(onTeamSubmit)} className="mt-8 space-y-5">
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              error={teamForm.formState.errors.email?.message}
              {...teamForm.register('email')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={teamForm.formState.errors.password?.message}
              {...teamForm.register('password')}
            />
            <Button type="submit" loading={loading} className="w-full">
              Sign in
            </Button>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold text-gray-900">Admin sign in</h2>
          <p className="mt-1 text-sm text-muted">
            Manage team accounts and roles. Uses admin ID configured on the API server.
          </p>
          <form onSubmit={adminForm.handleSubmit(onAdminSubmit)} className="mt-8 space-y-5">
            <Input
              label="Admin ID"
              autoComplete="username"
              error={adminForm.formState.errors.id?.message}
              {...adminForm.register('id')}
            />
            <Input
              label="Password"
              type="password"
              autoComplete="current-password"
              error={adminForm.formState.errors.password?.message}
              {...adminForm.register('password')}
            />
            <Button type="submit" loading={loading} className="w-full">
              Admin sign in
            </Button>
          </form>
        </>
      )}
    </div>
  );
}
