import { supabase } from '../../../services/supabase';

import type {
  SystemConfiguration,
  SystemConfigurationForm,
  SystemConfigurationRow,
  SystemConfigurationValue,
} from './configuration.types';

const CONFIGURATION_KEY = 'general';

const CONFIGURATION_SELECT = `
  id,
  key,
  value,
  updated_by,
  updated_at
`;

function toStringValue(
  value: unknown,
  fallback = '',
): string {
  return typeof value === 'string'
    ? value
    : fallback;
}

function toNumberValue(
  value: unknown,
  fallback: number,
): number {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function toBooleanValue(
  value: unknown,
  fallback: boolean,
): boolean {
  return typeof value === 'boolean'
    ? value
    : fallback;
}

function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (error.code === '42501') {
    return 'No tienes permisos para modificar la configuración.';
  }

  if (error.code === '23502') {
    return 'Falta completar un dato obligatorio.';
  }

  if (error.code === '23503') {
    return 'No se pudo relacionar la configuración con el usuario.';
  }

  if (error.code === '23505') {
    return 'Ya existe una configuración con la misma clave.';
  }

  if (error.code === 'PGRST116') {
    return 'No se encontró la configuración general.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

function mapConfiguration(
  row: SystemConfigurationRow,
): SystemConfiguration {
  const value: SystemConfigurationValue =
    row.value ?? {};

  return {
    id: row.id,
    key: row.key,

    systemName: toStringValue(
      value.systemName,
      'FiscalizaIA Minera',
    ),

    supportEmail: toStringValue(
      value.supportEmail,
      'soporte@fiscalizaia.pe',
    ),

    defaultDueDays: toNumberValue(
      value.defaultDueDays,
      15,
    ),

    realtimeEnabled: toBooleanValue(
      value.realtimeEnabled,
      true,
    ),

    notificationsEnabled: toBooleanValue(
      value.notificationsEnabled,
      true,
    ),

    aiAutoAnalysis: toBooleanValue(
      value.aiAutoAnalysis,
      false,
    ),

    aiMinConfidence: toNumberValue(
      value.aiMinConfidence,
      70,
    ),

    updatedBy:
      row.updated_by ?? undefined,

    updatedAt:
      row.updated_at,
  };
}

function validateConfiguration(
  values: SystemConfigurationForm,
): void {
  if (!values.systemName.trim()) {
    throw new Error(
      'El nombre del sistema es obligatorio.',
    );
  }

  if (
    values.defaultDueDays < 1 ||
    values.defaultDueDays > 365
  ) {
    throw new Error(
      'El plazo predeterminado debe estar entre 1 y 365 días.',
    );
  }

  if (
    values.aiMinConfidence < 0 ||
    values.aiMinConfidence > 100
  ) {
    throw new Error(
      'La confianza mínima de IA debe estar entre 0 y 100.',
    );
  }

  const supportEmail =
    values.supportEmail.trim();

  if (
    supportEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      supportEmail,
    )
  ) {
    throw new Error(
      'Ingresa un correo de soporte válido.',
    );
  }
}

export async function getSystemConfiguration():
Promise<SystemConfiguration> {
  const { data, error } = await supabase
    .from('system_settings')
    .select(CONFIGURATION_SELECT)
    .eq('key', CONFIGURATION_KEY)
    .maybeSingle();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cargar la configuración',
      ),
    );
  }

  if (!data) {
    throw new Error(
      'No existe la configuración general en el sistema.',
    );
  }

  return mapConfiguration(
    data as SystemConfigurationRow,
  );
}

export async function saveSystemConfiguration(
  values: SystemConfigurationForm,
): Promise<SystemConfiguration> {
  validateConfiguration(values);

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (
    userError ||
    !userData.user
  ) {
    throw new Error(
      'No se pudo identificar al fiscalizador.',
    );
  }

  const payload = {
    key: CONFIGURATION_KEY,

    value: {
      systemName:
        values.systemName.trim(),

      supportEmail:
        values.supportEmail.trim(),

      defaultDueDays:
        values.defaultDueDays,

      realtimeEnabled:
        values.realtimeEnabled,

      notificationsEnabled:
        values.notificationsEnabled,

      aiAutoAnalysis:
        values.aiAutoAnalysis,

      aiMinConfidence:
        values.aiMinConfidence,
    },

    updated_by:
      userData.user.id,

    updated_at:
      new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('system_settings')
    .upsert(payload, {
      onConflict: 'key',
    })
    .select(CONFIGURATION_SELECT)
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo guardar la configuración',
      ),
    );
  }

  return mapConfiguration(
    data as SystemConfigurationRow,
  );
}