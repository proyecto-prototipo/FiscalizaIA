import { supabase } from '../../../services/supabase';

import type {
  AssignmentFormValues,
  AssignmentRow,
  CatalogFormValues,
  CatalogRow,
  ObligationAssignment,
  ObligationCatalog,
  OperationOption,
} from './obligations.types';

const demoMode =
  import.meta.env.VITE_DEMO_MODE === 'true';

/* =========================================================
   SELECT DE ASIGNACIONES
   ========================================================= */

const ASSIGNMENT_SELECT = `
  id,
  operation_id,
  catalog_id,
  due_date,
  status,
  assigned_by,
  created_at,
  obligation_id,
  company_id,
  assigned_at,
  notes,
  updated_at,

  obligation_catalog!obligation_assignments_catalog_id_fkey (
    code,
    title,
    description,
    category,
    criticality,
    required_evidence
  ),

  mining_operations!obligation_assignments_operation_id_fkey (
    name,
    code,
    internal_code,
    company_id
  ),

  companies!obligation_assignments_company_id_fkey (
    legal_name
  )
`;

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function firstRelation<T>(
  relation: T | T[] | null,
): T | null {
  if (!relation) {
    return null;
  }

  if (Array.isArray(relation)) {
    return relation[0] ?? null;
  }

  return relation;
}

function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (error.code === '23505') {
    return (
      'Esta obligación ya fue asignada a la ' +
      'operación seleccionada.'
    );
  }

  if (error.code === '23503') {
    return (
      'La obligación, operación o empresa ' +
      'seleccionada ya no existe.'
    );
  }

  if (error.code === '23502') {
    return (
      'Falta completar un campo obligatorio.'
    );
  }

  if (error.code === '23514') {
    return (
      'Uno de los valores enviados no está permitido.'
    );
  }

  if (error.code === '42501') {
    return (
      'No tienes permisos para realizar esta acción.'
    );
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

/* =========================================================
   MAPEO DEL CATÁLOGO
   ========================================================= */

function mapCatalog(
  row: CatalogRow,
): ObligationCatalog {
  return {
    id: row.id,
    code: row.code,
    title: row.title,

    description:
      row.description ?? undefined,

    category:
      row.category,

    criticality:
      row.criticality,

    requiredEvidence:
      row.required_evidence,

    active:
      row.active,

    createdAt:
      row.created_at,
  };
}

/* =========================================================
   MAPEO DE ASIGNACIONES
   ========================================================= */

function mapAssignment(
  row: AssignmentRow,
): ObligationAssignment {
  const catalog =
    firstRelation(
      row.obligation_catalog,
    );

  const operation =
    firstRelation(
      row.mining_operations,
    );

  const company =
    firstRelation(
      row.companies,
    );

  return {
    id: row.id,

    catalogId:
      row.catalog_id,

    catalogCode:
      catalog?.code ??
      'Sin código',

    catalogTitle:
      catalog?.title ??
      'Obligación no disponible',

    catalogDescription:
      catalog?.description ??
      undefined,

    category:
      catalog?.category ??
      'Sin categoría',

    criticality:
      catalog?.criticality ??
      'Media',

    requiredEvidence:
      catalog?.required_evidence ??
      'No registrada',

    operationId:
      row.operation_id,

    operationName:
      operation?.name ??
      'Operación no disponible',

    operationCode:
      operation?.internal_code ??
      operation?.code ??
      undefined,

    companyId:
      row.company_id ??
      operation?.company_id ??
      undefined,

    companyName:
      company?.legal_name ??
      'Empresa no disponible',

    assignedBy:
      row.assigned_by ??
      undefined,

    assignedAt:
      row.assigned_at ??
      row.created_at,

    dueDate:
      row.due_date ??
      undefined,

    status:
      row.status ??
      'Pendiente',

    notes:
      row.notes ??
      undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at ??
      undefined,
  };
}

/* =========================================================
   LISTAR CATÁLOGO
   ========================================================= */

export async function listCatalog():
Promise<ObligationCatalog[]> {
  if (demoMode) {
    return [];
  }

  const { data, error } =
    await supabase
      .from('obligation_catalog')
      .select(`
        id,
        code,
        title,
        description,
        category,
        criticality,
        required_evidence,
        active,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cargar el catálogo',
      ),
    );
  }

  return (
    (data ?? []) as CatalogRow[]
  ).map(mapCatalog);
}

/* =========================================================
   LISTAR ASIGNACIONES
   ========================================================= */

export async function listAssignments():
Promise<ObligationAssignment[]> {
  if (demoMode) {
    return [];
  }

  const { data, error } =
    await supabase
      .from('obligation_assignments')
      .select(ASSIGNMENT_SELECT)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las asignaciones',
      ),
    );
  }

  return (
    (data ?? []) as unknown as AssignmentRow[]
  ).map(mapAssignment);
}

/* =========================================================
   LISTAR OPERACIONES DISPONIBLES
   ========================================================= */

export async function listOperationOptions():
Promise<OperationOption[]> {
  if (demoMode) {
    return [];
  }

  const { data, error } =
    await supabase
      .from('mining_operations')
      .select(`
        id,
        company_id,
        name,
        code,
        internal_code,
        active,
        companies (
          legal_name
        )
      `)
      .eq('active', true)
      .order('name');

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las operaciones',
      ),
    );
  }

  return (data ?? []).map((row) => {
    const companyRelation =
      row.companies;

    const company =
      Array.isArray(companyRelation)
        ? companyRelation[0]
        : companyRelation;

    return {
      id: row.id,

      companyId:
        row.company_id,

      companyName:
        company?.legal_name ??
        'Empresa no disponible',

      name:
        row.name,

      internalCode:
        row.internal_code ??
        row.code ??
        undefined,
    };
  });
}

/* =========================================================
   CREAR OBLIGACIÓN EN CATÁLOGO
   ========================================================= */

export async function createCatalogItem(
  input: CatalogFormValues,
): Promise<ObligationCatalog> {
  const normalizedCode =
    input.code
      .trim()
      .toUpperCase();

  if (!normalizedCode) {
    throw new Error(
      'El código de la obligación es obligatorio.',
    );
  }

  if (!input.title.trim()) {
    throw new Error(
      'El nombre de la obligación es obligatorio.',
    );
  }

  if (!input.category.trim()) {
    throw new Error(
      'La categoría es obligatoria.',
    );
  }

  if (!input.requiredEvidence.trim()) {
    throw new Error(
      'La evidencia requerida es obligatoria.',
    );
  }

  if (demoMode) {
    const now =
      new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      code: normalizedCode,
      title: input.title.trim(),
      description:
        input.description.trim() ||
        undefined,
      category:
        input.category.trim(),
      criticality:
        input.criticality,
      requiredEvidence:
        input.requiredEvidence.trim(),
      active: true,
      createdAt: now,
    };
  }

  const { data, error } =
    await supabase
      .from('obligation_catalog')
      .insert({
        code:
          normalizedCode,

        title:
          input.title.trim(),

        description:
          input.description.trim() ||
          null,

        category:
          input.category.trim(),

        criticality:
          input.criticality,

        required_evidence:
          input.requiredEvidence.trim(),

        active:
          true,
      })
      .select(`
        id,
        code,
        title,
        description,
        category,
        criticality,
        required_evidence,
        active,
        created_at
      `)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo registrar la obligación',
      ),
    );
  }

  return mapCatalog(
    data as CatalogRow,
  );
}

/* =========================================================
   CREAR ASIGNACIÓN
   ========================================================= */

export async function createAssignment(
  input: AssignmentFormValues,
  operations: OperationOption[],
): Promise<ObligationAssignment> {
  const selectedOperation =
    operations.find(
      (operation) =>
        operation.id === input.operationId,
    );

  if (!selectedOperation) {
    throw new Error(
      'Selecciona una operación válida.',
    );
  }

  if (!input.catalogId) {
    throw new Error(
      'Selecciona una obligación válida.',
    );
  }

  if (demoMode) {
    const now =
      new Date().toISOString();

    return {
      id: crypto.randomUUID(),

      catalogId:
        input.catalogId,

      catalogCode:
        'OBL-DEMO',

      catalogTitle:
        'Obligación demostrativa',

      category:
        'Demostración',

      criticality:
        'Media',

      requiredEvidence:
        'Documento demostrativo',

      operationId:
        selectedOperation.id,

      operationName:
        selectedOperation.name,

      operationCode:
        selectedOperation.internalCode,

      companyId:
        selectedOperation.companyId,

      companyName:
        selectedOperation.companyName,

      assignedAt:
        now,

      dueDate:
        input.dueDate || undefined,

      status:
        input.status,

      notes:
        input.notes.trim() || undefined,

      createdAt:
        now,

      updatedAt:
        now,
    };
  }

  const { data: userData } =
    await supabase.auth.getUser();

  const { data, error } =
    await supabase
      .from('obligation_assignments')
      .insert({
        /*
         * Relación principal con el catálogo real.
         */
        catalog_id:
          input.catalogId,

        /*
         * Relación con la operación minera.
         */
        operation_id:
          input.operationId,

        /*
         * Se obtiene automáticamente desde la operación.
         */
        company_id:
          selectedOperation.companyId,

        /*
         * Usuario fiscalizador autenticado.
         */
        assigned_by:
          userData.user?.id ?? null,

        assigned_at:
          new Date().toISOString(),

        due_date:
          input.dueDate || null,

        status:
          input.status,

        notes:
          input.notes.trim() || null,

        /*
         * Esta columna pertenece a la tabla antigua
         * public.obligations y queda vacía.
         */
        obligation_id:
          null,
      })
      .select(ASSIGNMENT_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo asignar la obligación',
      ),
    );
  }

  return mapAssignment(
    data as unknown as AssignmentRow,
  );
}

/* =========================================================
   ACTUALIZAR ASIGNACIÓN
   ========================================================= */

export async function updateAssignment(
  assignmentId: string,
  input: AssignmentFormValues,
  operations: OperationOption[],
): Promise<ObligationAssignment> {
  const selectedOperation =
    operations.find(
      (operation) =>
        operation.id === input.operationId,
    );

  if (!selectedOperation) {
    throw new Error(
      'Selecciona una operación válida.',
    );
  }

  if (!input.catalogId) {
    throw new Error(
      'Selecciona una obligación válida.',
    );
  }

  if (demoMode) {
    const now =
      new Date().toISOString();

    return {
      id: assignmentId,

      catalogId:
        input.catalogId,

      catalogCode:
        'OBL-DEMO',

      catalogTitle:
        'Obligación demostrativa',

      category:
        'Demostración',

      criticality:
        'Media',

      requiredEvidence:
        'Documento demostrativo',

      operationId:
        selectedOperation.id,

      operationName:
        selectedOperation.name,

      operationCode:
        selectedOperation.internalCode,

      companyId:
        selectedOperation.companyId,

      companyName:
        selectedOperation.companyName,

      dueDate:
        input.dueDate || undefined,

      status:
        input.status,

      notes:
        input.notes.trim() || undefined,

      createdAt:
        now,

      updatedAt:
        now,
    };
  }

  const { data, error } =
    await supabase
      .from('obligation_assignments')
      .update({
        catalog_id:
          input.catalogId,

        operation_id:
          input.operationId,

        company_id:
          selectedOperation.companyId,

        due_date:
          input.dueDate || null,

        status:
          input.status,

        notes:
          input.notes.trim() || null,
      })
      .eq('id', assignmentId)
      .select(ASSIGNMENT_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo actualizar la asignación',
      ),
    );
  }

  return mapAssignment(
    data as unknown as AssignmentRow,
  );
}

/* =========================================================
   CAMBIAR ESTADO
   ========================================================= */

export async function changeAssignmentStatus(
  assignmentId: string,
  status: ObligationAssignment['status'],
): Promise<ObligationAssignment | null> {
  if (demoMode) {
    return null;
  }

  const { data, error } =
    await supabase
      .from('obligation_assignments')
      .update({
        status,
      })
      .eq('id', assignmentId)
      .select(ASSIGNMENT_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cambiar el estado',
      ),
    );
  }

  return mapAssignment(
    data as unknown as AssignmentRow,
  );
}