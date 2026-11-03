import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { getHomePath, toRoleKey, type RoleKey } from '../config/navigation';

export default function RequireRole({ roles, children }: { roles: RoleKey[]; children: ReactNode }) {
  const { user } = useAuth();
  const role = toRoleKey(user?.role);
  if (!role) return <Navigate to="/login" replace />;
  if (!roles.includes(role)) return <Navigate to={getHomePath(role)} replace />;
  return <>{children}</>;
}

export function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={getHomePath(toRoleKey(user?.role))} replace />;
}