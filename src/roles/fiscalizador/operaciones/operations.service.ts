import { supabase } from '../../../services/supabase';

import type {
  Operation,
  OperationFormValues,
  OperationRow,
} from './operations.types';

/* =========================================================
   CONFIGURACIÓN
   ========================================================= */

const demoMode =
  import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Columnas y relaciones que necesita el módulo.
 *
 * Se incluye:
 * - code: columna original obligatoria.
 * - internal_code: columna nueva usada por la interfaz.
 * - companies: relación con la empresa.
 * - obligation_assignments: obligaciones asociadas.
 */
const OPERATION_SELECT = `
  id,
  company_id,
  code,
  name,
  internal_code,
  operation_type,
  stage,
  region,
  province,
  district,
  address,
  latitude,
  longitude,
  responsible_name,
  responsible_email,
  responsible_phone,
  description,
  status,
  active,
  current_compliance,
  current_risk,
  created_at,
  updated_at,
  companies (
    legal_name
  ),
  obligation_assignments (
    count
  )
`;

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

/**
 * Obtiene el nombre de la empresa asociada.
 */
function getCompanyName(
  companies: OperationRow['companies'],
): string {
  if (!companies) {
    return 'Empresa no disponible';
  }

  if (Array.isArray(companies)) {
    return (
      companies[0]?.legal_name ??
      'Empresa no disponible'
    );
  }

  return (
    companies.legal_name ??
    'Empresa no disponible'
  );
}

/**
 * Obtiene la cantidad de obligaciones asignadas.
 */
function getObligationsCount(
  assignments:
    | OperationRow['obligation_assignments']
    | undefined,
): number {
  if (
    !assignments ||
    assignments.length === 0
  ) {
    return 0;
  }

  return Number(
    assignments[0]?.count ?? 0,
  );
}

/**
 * Convierte una fila de Supabase al modelo
 * utilizado por el frontend.
 */
function mapOperation(
  row: OperationRow,
): Operation {
  return {
    id: row.id,

    companyId: row.company_id,

    companyName:
      getCompanyName(row.companies),

    name: row.name,

    /*
     * Se usa primero internal_code.
     * Si está vacío, se utiliza code como respaldo.
     */
    internalCode:
      row.internal_code ??
      row.code ??
      undefined,

    operationType:
      row.operation_type ?? undefined,

    stage:
      row.stage ?? undefined,

    region:
      row.region ?? undefined,

    province:
      row.province ?? undefined,

    district:
      row.district ?? undefined,

    address:
      row.address ?? undefined,

    latitude:
      row.latitude !== null &&
      row.latitude !== undefined
        ? Number(row.latitude)
        : undefined,

    longitude:
      row.longitude !== null &&
      row.longitude !== undefined
        ? Number(row.longitude)
        : undefined,

    responsibleName:
      row.responsible_name ?? undefined,

    responsibleEmail:
      row.responsible_email ?? undefined,

    responsiblePhone:
      row.responsible_phone ?? undefined,

    description:
      row.description ?? undefined,

    status:
      row.status ?? 'Registrada',

    active:
      row.active,

    currentCompliance:
      Number(
        row.current_compliance ?? 0,
      ),

    currentRisk:
      row.current_risk ?? 'Bajo',

    obligationsCount:
      getObligationsCount(
        row.obligation_assignments,
      ),

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at ??
      row.created_at,
  };
}

/**
 * Convierte los datos del formulario al formato
 * utilizado por la tabla mining_operations.
 */
function mapOperationInput(
  input: OperationFormValues,
) {
  const normalizedCode =
    input.internalCode
      .trim()
      .toUpperCase();

  return {
    company_id:
      input.companyId,

    /*
     * La columna code es original y NOT NULL.
     * Por eso siempre debe enviarse.
     */
    code:
      normalizedCode,

    /*
     * La interfaz trabaja principalmente
     * con internal_code.
     */
    internal_code:
      normalizedCode,

    name:
      input.name.trim(),

    operation_type:
      input.operationType || null,

    stage:
      input.stage || null,

    region:
      input.region.trim() || null,

    province:
      input.province.trim() || null,

    district:
      input.district.trim() || null,

    address:
      input.address.trim() || null,

    latitude:
      input.latitude.trim()
        ? Number(input.latitude)
        : null,

    longitude:
      input.longitude.trim()
        ? Number(input.longitude)
        : null,

    responsible_name:
      input.responsibleName.trim() ||
      null,

    responsible_email:
      input.responsibleEmail.trim() ||
      null,

    responsible_phone:
      input.responsiblePhone.trim() ||
      null,

    description:
      input.description.trim() || null,
  };
}

/**
 * Traduce los errores comunes de Supabase
 * a mensajes entendibles para el usuario.
 */
function getOperationErrorMessage(
  error: {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  },
  fallback: string,
): string {
  if (error.code === '23505') {
    return (
      'Ya existe una operación con ese código ' +
      'para la empresa seleccionada.'
    );
  }

  if (error.code === '23503') {
    return (
      'La empresa seleccionada no existe o ' +
      'ya no está disponible.'
    );
  }

  if (error.code === '23502') {
    return (
      'Falta completar un campo obligatorio ' +
      'de la operación.'
    );
  }

  if (error.code === '42501') {
    return (
      'No tienes permisos para realizar esta operación.'
    );
  }

  if (error.code === 'PGRST116') {
    return 'No se encontró la operación solicitada.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

/* =========================================================
   LISTADO DE OPERACIONES
   ========================================================= */

/**
 * Obtiene todas las operaciones visibles
 * para el usuario autenticado.
 */
export async function listOperations():
Promise<Operation[]> {
  if (demoMode) {
    return [];
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .select(OPERATION_SELECT)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudieron cargar las operaciones',
      ),
    );
  }

  return (
    (data ?? []) as unknown as OperationRow[]
  ).map(mapOperation);
}

/* =========================================================
   DETALLE DE UNA OPERACIÓN
   ========================================================= */

/**
 * Obtiene una operación mediante su UUID.
 */
export async function getOperationById(
  operationId: string,
): Promise<Operation> {
  if (demoMode) {
    throw new Error(
      'La operación no está disponible en modo demostración.',
    );
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .select(OPERATION_SELECT)
      .eq('id', operationId)
      .single();

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudo obtener la operación',
      ),
    );
  }

  return mapOperation(
    data as unknown as OperationRow,
  );
}

/* =========================================================
   REGISTRO DE OPERACIÓN
   ========================================================= */

/**
 * Registra una operación vinculada a una empresa.
 */
export async function createOperation(
  input: OperationFormValues,
): Promise<Operation> {
  const normalizedCode =
    input.internalCode
      .trim()
      .toUpperCase();

  if (!normalizedCode) {
    throw new Error(
      'El código interno de la operación es obligatorio.',
    );
  }

  if (demoMode) {
    const now =
      new Date().toISOString();

    return {
      id: crypto.randomUUID(),

      companyId:
        input.companyId,

      companyName:
        'Empresa demostrativa',

      name:
        input.name.trim(),

      internalCode:
        normalizedCode,

      operationType:
        input.operationType || undefined,

      stage:
        input.stage || undefined,

      region:
        input.region.trim() ||
        undefined,

      province:
        input.province.trim() ||
        undefined,

      district:
        input.district.trim() ||
        undefined,

      address:
        input.address.trim() ||
        undefined,

      latitude:
        input.latitude.trim()
          ? Number(input.latitude)
          : undefined,

      longitude:
        input.longitude.trim()
          ? Number(input.longitude)
          : undefined,

      responsibleName:
        input.responsibleName.trim() ||
        undefined,

      responsibleEmail:
        input.responsibleEmail.trim() ||
        undefined,

      responsiblePhone:
        input.responsiblePhone.trim() ||
        undefined,

      description:
        input.description.trim() ||
        undefined,

      status:
        'Registrada',

      active:
        true,

      currentCompliance:
        0,

      currentRisk:
        'Bajo',

      obligationsCount:
        0,

      createdAt:
        now,

      updatedAt:
        now,
    };
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .insert({
        ...mapOperationInput(input),

        status:
          'Registrada',

        active:
          true,

        current_compliance:
          0,

        current_risk:
          'Bajo',

      })
      .select(OPERATION_SELECT)
      .single();

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudo registrar la operación',
      ),
    );
  }

  return mapOperation(
    data as unknown as OperationRow,
  );
}

/* =========================================================
   ACTUALIZACIÓN DE OPERACIÓN
   ========================================================= */

/**
 * Actualiza los datos principales de una operación.
 */
export async function updateOperation(
  operationId: string,
  input: OperationFormValues,
): Promise<Operation> {
  const normalizedCode =
    input.internalCode
      .trim()
      .toUpperCase();

  if (!normalizedCode) {
    throw new Error(
      'El código interno de la operación es obligatorio.',
    );
  }

  if (demoMode) {
    const now =
      new Date().toISOString();

    return {
      id:
        operationId,

      companyId:
        input.companyId,

      companyName:
        'Empresa demostrativa',

      name:
        input.name.trim(),

      internalCode:
        normalizedCode,

      operationType:
        input.operationType ||
        undefined,

      stage:
        input.stage ||
        undefined,

      region:
        input.region.trim() ||
        undefined,

      province:
        input.province.trim() ||
        undefined,

      district:
        input.district.trim() ||
        undefined,

      address:
        input.address.trim() ||
        undefined,

      latitude:
        input.latitude.trim()
          ? Number(input.latitude)
          : undefined,

      longitude:
        input.longitude.trim()
          ? Number(input.longitude)
          : undefined,

      responsibleName:
        input.responsibleName.trim() ||
        undefined,

      responsibleEmail:
        input.responsibleEmail.trim() ||
        undefined,

      responsiblePhone:
        input.responsiblePhone.trim() ||
        undefined,

      description:
        input.description.trim() ||
        undefined,

      status:
        'Registrada',

      active:
        true,

      currentCompliance:
        0,

      currentRisk:
        'Bajo',

      obligationsCount:
        0,

      createdAt:
        now,

      updatedAt:
        now,
    };
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .update(
        mapOperationInput(input),
      )
      .eq('id', operationId)
      .select(OPERATION_SELECT)
      .single();

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudo actualizar la operación',
      ),
    );
  }

  return mapOperation(
    data as unknown as OperationRow,
  );
}

/* =========================================================
   ACTIVAR O DESACTIVAR OPERACIÓN
   ========================================================= */

/**
 * Activa o desactiva una operación.
 *
 * No se elimina físicamente el registro.
 */
export async function changeOperationActivity(
  operationId: string,
  active: boolean,
): Promise<Operation | null> {
  if (demoMode) {
    return null;
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .update({
        active,
      })
      .eq('id', operationId)
      .select(OPERATION_SELECT)
      .single();

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudo cambiar la actividad de la operación',
      ),
    );
  }

  return mapOperation(
    data as unknown as OperationRow,
  );
}

/**
 * Alias utilizado por useOperations.ts y
 * OperationsPage.tsx.
 */
export async function changeOperationStatus(
  operationId: string,
  active: boolean,
): Promise<Operation | null> {
  return changeOperationActivity(
    operationId,
    active,
  );
}

/* =========================================================
   ESTADO DE EVALUACIÓN
   ========================================================= */

/**
 * Actualiza el estado del proceso de evaluación.
 *
 * Ejemplos:
 * - Registrada
 * - En evaluación
 * - Observada
 * - Validada
 */
export async function updateOperationEvaluationStatus(
  operationId: string,
  status: Operation['status'],
): Promise<Operation | null> {
  if (demoMode) {
    return null;
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .update({
        status,
      })
      .eq('id', operationId)
      .select(OPERATION_SELECT)
      .single();

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudo actualizar el estado de evaluación',
      ),
    );
  }

  return mapOperation(
    data as unknown as OperationRow,
  );
}

/* =========================================================
   CUMPLIMIENTO Y RIESGO
   ========================================================= */

/**
 * Actualiza el porcentaje de cumplimiento y
 * el nivel de riesgo de una operación.
 *
 * Esta función será utilizada posteriormente
 * por Evaluaciones, Revisión IA y Resultados.
 */
export async function updateOperationAssessment(
  operationId: string,
  currentCompliance: number,
  currentRisk: Operation['currentRisk'],
): Promise<Operation | null> {
  if (demoMode) {
    return null;
  }

  const normalizedCompliance =
    Math.min(
      Math.max(
        currentCompliance,
        0,
      ),
      100,
    );

  const { data, error } =
    await supabase
      .from('mining_operations')
      .update({
        current_compliance:
          normalizedCompliance,

        current_risk:
          currentRisk,
      })
      .eq('id', operationId)
      .select(OPERATION_SELECT)
      .single();

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudo actualizar el cumplimiento y riesgo',
      ),
    );
  }

  return mapOperation(
    data as unknown as OperationRow,
  );
}

/* =========================================================
   PERFIL COMPLETO
   ========================================================= */

/**
 * Marca si la ficha de la operación está completa.
 */
export async function updateOperationProfileStatus(
  operationId: string,
  isProfileComplete: boolean,
): Promise<Operation | null> {
  if (demoMode) {
    return null;
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .update({
        is_profile_complete:
          isProfileComplete,
      })
      .eq('id', operationId)
      .select(OPERATION_SELECT)
      .single();

  if (error) {
    throw new Error(
      getOperationErrorMessage(
        error,
        'No se pudo actualizar el estado del perfil',
      ),
    );
  }

  return mapOperation(
    data as unknown as OperationRow,
  );
}