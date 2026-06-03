import { Navigate } from 'react-router-dom';
import { type Permission } from '@gupta/shared';
import { useCan } from './AuthContext';

export function RoleGuard({
  permission,
  children,
  fallback = <Navigate to="/dashboard" replace />,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allowed = useCan(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}

export function Can({
  permission,
  children,
  fallback = null,
}: {
  permission: Permission;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const allowed = useCan(permission);
  if (!allowed) return <>{fallback}</>;
  return <>{children}</>;
}
