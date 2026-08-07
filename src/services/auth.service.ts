import type {
  SessionUser,
  UserRole,
} from '../types';

import { supabase } from './supabase';

const demoMode =
  import.meta.env.VITE_DEMO_MODE === 'true';

const DEMO_USERS: Record<UserRole, SessionUser> = {
  fiscalizador: {
    id: 'demo-fiscalizador',
    name: 'María Torres',
    email: 'fiscalizador@fiscalizaia.pe',
    role: 'fiscalizador',
  },

  empresa_evaluada: {
    id: 'demo-empresa',
    name: 'Ana Quispe',
    email: 'empresa@fiscalizaia.pe',
    role: 'empresa_evaluada',
    companyId: 'cmp-001',
    companyName: 'Minera Andina del Sur',
  },
};

export async function signIn(
  email: string,
  password: string,
  role: UserRole,
): Promise<SessionUser> {
  if (demoMode) {
    return DEMO_USERS[role];
  }

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (error) {
    throw error;
  }

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      company_id,
      companies (
        legal_name
      )
    `)
    .eq('id', data.user.id)
    .single();

  if (profileError) {
    await supabase.auth.signOut();
    throw profileError;
  }

  if (!profile) {
    await supabase.auth.signOut();

    throw new Error(
      'No se encontró el perfil asociado al usuario.',
    );
  }

  if (profile.role !== role) {
    await supabase.auth.signOut();

    throw new Error(
      'El usuario no pertenece al rol seleccionado.',
    );
  }

  const company = Array.isArray(profile.companies)
    ? profile.companies[0]
    : profile.companies;

  return {
    id: profile.id,
    name: profile.full_name,
    email: data.user.email ?? email,
    role: profile.role as UserRole,
    companyId:
      profile.company_id ?? undefined,
    companyName:
      company?.legal_name ?? undefined,
  };
}

export async function signOut(): Promise<void> {
  if (demoMode) {
    return;
  }

  const { error } =
    await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}