import type { ReactNode } from 'react';

import {
  Navigate,
  useLocation,
} from 'react-router-dom';

import { useAuth } from './AuthContext';

import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRole: UserRole;
}

function getRoleRoute(
  role: UserRole,
): string {
  switch (role) {
    case 'fiscalizador':
      return '/fiscalizador';

    case 'empresa_evaluada':
      return '/empresa_evaluada';

    default:
      return '/';
  }
}

export function ProtectedRoute({
  children,
  allowedRole,
}: ProtectedRouteProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return (
      <Navigate
        to="/"
        replace
        state={{
          from: location.pathname,
        }}
      />
    );
  }

  if (user.role !== allowedRole) {
    return (
      <Navigate
        to={getRoleRoute(user.role)}
        replace
      />
    );
  }

  return children;
}