import {
  supabase,
} from '../../services/supabase';

import type {
  CurrentProfile,
  CurrentProfileRow,
} from './profile.types';

const PROFILE_SELECT = `
  id,
  display_name,
  role,
  company_id
`;

export const PROFILE_UPDATED_EVENT =
  'fiscalizaia-profile-updated';

function mapProfile(
  row: CurrentProfileRow,
): CurrentProfile {
  return {
    id:
      row.id,

    displayName:
      row.display_name?.trim() ||
      'Usuario',

    role:
      row.role ?? undefined,

    companyId:
      row.company_id ?? undefined,
  };
}

function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (error.code === '42501') {
    return 'No tienes permisos para modificar tu perfil.';
  }

  if (error.code === '23502') {
    return 'Falta completar un dato obligatorio.';
  }

  if (error.code === 'PGRST116') {
    return 'No se encontró el perfil del usuario.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}


/* =========================================================
   OBTENER PERFIL ACTUAL
========================================================= */

export async function getCurrentProfile():
Promise<CurrentProfile> {
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (
    authError ||
    !authData.user
  ) {
    throw new Error(
      'No existe un usuario autenticado.',
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .select(PROFILE_SELECT)
    .eq(
      'id',
      authData.user.id,
    )
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cargar el perfil',
      ),
    );
  }

  return mapProfile(
    data as CurrentProfileRow,
  );
}


/* =========================================================
   ACTUALIZAR NOMBRE
========================================================= */

export async function updateCurrentDisplayName(
  displayName: string,
): Promise<CurrentProfile> {
  const cleanName =
    displayName.trim();

  if (!cleanName) {
    throw new Error(
      'El nombre no puede estar vacío.',
    );
  }

  if (cleanName.length < 2) {
    throw new Error(
      'El nombre debe contener al menos 2 caracteres.',
    );
  }

  if (cleanName.length > 80) {
    throw new Error(
      'El nombre no puede superar los 80 caracteres.',
    );
  }

  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser();

  if (
    authError ||
    !authData.user
  ) {
    throw new Error(
      'No existe un usuario autenticado.',
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .update({
      display_name:
        cleanName,
    })
    .eq(
      'id',
      authData.user.id,
    )
    .select(PROFILE_SELECT)
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo actualizar el nombre',
      ),
    );
  }

  const profile =
    mapProfile(
      data as CurrentProfileRow,
    );

  /*
   * IMPORTANTE:
   * notifica inmediatamente a todas
   * las instancias de useCurrentProfile()
   * abiertas dentro de esta aplicación.
   */
  window.dispatchEvent(
    new CustomEvent(
      PROFILE_UPDATED_EVENT,
      {
        detail: profile,
      },
    ),
  );

  return profile;
}