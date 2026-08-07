import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type {
  SessionUser,
  UserRole,
} from '../types';

import {
  signIn as signInService,
  signOut as signOutService,
} from '../services/auth.service';

interface AuthValue {
  user: SessionUser | null;
  loading: boolean;

  signIn: (
    email: string,
    password: string,
    role: UserRole,
  ) => Promise<void>;

  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

const VALID_ROLES: UserRole[] = [
  'fiscalizador',
  'empresa_evaluada',
];

function getStoredUser(): SessionUser | null {
  try {
    const storedSession = localStorage.getItem(
      'fiscalizaia-session',
    );

    if (!storedSession) {
      return null;
    }

    const parsedSession = JSON.parse(
      storedSession,
    ) as SessionUser;

    if (
      !parsedSession ||
      !VALID_ROLES.includes(parsedSession.role)
    ) {
      localStorage.removeItem(
        'fiscalizaia-session',
      );

      return null;
    }

    return parsedSession;
  } catch {
    localStorage.removeItem(
      'fiscalizaia-session',
    );

    return null;
  }
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] =
    useState<SessionUser | null>(
      getStoredUser,
    );

  const [loading, setLoading] =
    useState(false);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,

      signIn: async (
        email,
        password,
        role,
      ) => {
        setLoading(true);

        try {
          const session =
            await signInService(
              email,
              password,
              role,
            );

          if (
            !VALID_ROLES.includes(
              session.role,
            )
          ) {
            throw new Error(
              'El rol recibido no es válido.',
            );
          }

          setUser(session);

          localStorage.setItem(
            'fiscalizaia-session',
            JSON.stringify(session),
          );
        } finally {
          setLoading(false);
        }
      },

      signOut: async () => {
        try {
          await signOutService();
        } finally {
          setUser(null);

          localStorage.removeItem(
            'fiscalizaia-session',
          );
        }
      },
    }),
    [user, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth debe utilizarse dentro de AuthProvider.',
    );
  }

  return context;
}