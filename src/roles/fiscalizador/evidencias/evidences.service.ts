import { supabase } from '../../../services/supabase';

import type {
  EvidenceAiResult,
  EvidenceAiStatus,
  EvidenceAssignmentOption,
  EvidenceDocument,
  EvidenceDocumentRow,
  EvidenceReviewFormValues,
} from './evidences.types';

const EVIDENCE_BUCKET = 'evidences';

const demoMode =
  import.meta.env.VITE_DEMO_MODE === 'true';

/* =========================================================
   CONSULTA PRINCIPAL
   ========================================================= */

const EVIDENCE_SELECT = `
  id,
  operation_id,
  assignment_id,
  file_name,
  storage_path,
  version,
  replaces_evidence_id,
  status,
  uploaded_by,
  uploaded_at,
  review_comment,
  reviewed_by,
  reviewed_at,
  ai_status,
  ai_result,
  ai_confidence,
  updated_at,

  mining_operations!evidence_documents_operation_id_fkey (
    id,
    name,
    code,
    internal_code,
    company_id
  ),

  obligation_assignments!evidence_documents_assignment_id_fkey (
    id,
    catalog_id,
    company_id,

    obligation_catalog!obligation_assignments_catalog_id_fkey (
      id,
      code,
      title,
      category,
      criticality,
      required_evidence
    ),

    companies!obligation_assignments_company_id_fkey (
      id,
      legal_name
    )
  )
`;

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function firstRelation<T>(
  relation: T | T[] | null | undefined,
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
  if (error.code === '23503') {
    return (
      'La operación o asignación vinculada ya no existe.'
    );
  }

  if (error.code === '23514') {
  return error.message
    ? `La base de datos rechazó el cambio: ${error.message}`
    : 'La base de datos rechazó el cambio por una restricción.';
}

  if (error.code === '42501') {
    return (
      'No tienes permisos para realizar esta acción.'
    );
  }

  if (error.code === 'PGRST116') {
    return (
      'La evidencia solicitada no fue encontrada.'
    );
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

function parseConfidence(
  value: number | string | null,
): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsedValue =
    typeof value === 'number'
      ? value
      : Number(value);

  return Number.isFinite(parsedValue)
    ? parsedValue
    : undefined;
}

function parseAiResult(
  value: EvidenceAiResult | null,
): EvidenceAiResult | undefined {
  if (!value) {
    return undefined;
  }

  return value;
}

/* =========================================================
   MAPEO DE EVIDENCIA
   ========================================================= */

function mapEvidence(
  row: EvidenceDocumentRow,
): EvidenceDocument {
  const operation =
    firstRelation(row.mining_operations);

  const assignment =
    firstRelation(
      row.obligation_assignments,
    );

  const catalog =
    firstRelation(
      assignment?.obligation_catalog,
    );

  const company =
    firstRelation(
      assignment?.companies,
    );

  return {
    id: row.id,

    operationId:
      row.operation_id,

    operationName:
      operation?.name ??
      'Operación no disponible',

    operationCode:
      operation?.internal_code ??
      operation?.code ??
      undefined,

    assignmentId:
      row.assignment_id,

    catalogId:
      assignment?.catalog_id ??
      catalog?.id ??
      '',

    obligationCode:
      catalog?.code ??
      'Sin código',

    obligationTitle:
      catalog?.title ??
      'Obligación no disponible',

    obligationCategory:
      catalog?.category ??
      'Sin categoría',

    obligationCriticality:
      catalog?.criticality ??
      'Media',

    requiredEvidence:
      catalog?.required_evidence ??
      'No registrada',

    companyId:
      assignment?.company_id ??
      operation?.company_id ??
      undefined,

    companyName:
      company?.legal_name ??
      'Empresa no disponible',

    fileName:
      row.file_name,

    storagePath:
      row.storage_path,

    version:
      row.version,

    replacesEvidenceId:
      row.replaces_evidence_id ??
      undefined,

    status:
      row.status,

    uploadedBy:
      row.uploaded_by ??
      undefined,

    uploadedAt:
      row.uploaded_at,

    reviewComment:
      row.review_comment ??
      undefined,

    reviewedBy:
      row.reviewed_by ??
      undefined,

    reviewedAt:
      row.reviewed_at ??
      undefined,

    aiStatus:
      row.ai_status ??
      'Pendiente',

    aiResult:
      parseAiResult(
        row.ai_result,
      ),

    aiConfidence:
      parseConfidence(
        row.ai_confidence,
      ),

    updatedAt:
      row.updated_at ??
      undefined,
  };
}

/* =========================================================
   LISTAR EVIDENCIAS
   ========================================================= */

export async function listEvidences():
Promise<EvidenceDocument[]> {
  if (demoMode) {
    return [];
  }

  const { data, error } =
    await supabase
      .from('evidence_documents')
      .select(EVIDENCE_SELECT)
      .order('uploaded_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las evidencias',
      ),
    );
  }

  return (
    (data ?? []) as unknown as EvidenceDocumentRow[]
  ).map(mapEvidence);
}

/* =========================================================
   OBTENER UNA EVIDENCIA
   ========================================================= */

export async function getEvidenceById(
  evidenceId: string,
): Promise<EvidenceDocument> {
  const { data, error } =
    await supabase
      .from('evidence_documents')
      .select(EVIDENCE_SELECT)
      .eq('id', evidenceId)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cargar la evidencia',
      ),
    );
  }

  return mapEvidence(
    data as unknown as EvidenceDocumentRow,
  );
}

/* =========================================================
   CREAR URL FIRMADA
   ========================================================= */

export async function createEvidenceSignedUrl(
  storagePath: string,
  expiresInSeconds = 300,
): Promise<string> {
  if (!storagePath.trim()) {
    throw new Error(
      'La evidencia no tiene una ruta de almacenamiento válida.',
    );
  }

  const { data, error } =
    await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(
        storagePath,
        expiresInSeconds,
      );

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo abrir el archivo',
      ),
    );
  }

  if (!data.signedUrl) {
    throw new Error(
      'Supabase no generó un enlace válido para el archivo.',
    );
  }

  return data.signedUrl;
}

/* =========================================================
   ABRIR EVIDENCIA
   ========================================================= */

export async function openEvidenceFile(
  evidence: EvidenceDocument,
): Promise<void> {
  const signedUrl =
    await createEvidenceSignedUrl(
      evidence.storagePath,
    );

  const newWindow =
    window.open(
      signedUrl,
      '_blank',
      'noopener,noreferrer',
    );

  if (!newWindow) {
    throw new Error(
      'El navegador bloqueó la apertura del archivo. Habilita las ventanas emergentes.',
    );
  }
}

/* =========================================================
   DESCARGAR EVIDENCIA
   ========================================================= */

export async function downloadEvidenceFile(
  evidence: EvidenceDocument,
): Promise<void> {
  const { data, error } =
    await supabase.storage
      .from(EVIDENCE_BUCKET)
      .download(
        evidence.storagePath,
      );

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo descargar el archivo',
      ),
    );
  }

  const objectUrl =
    URL.createObjectURL(data);

  const anchor =
    document.createElement('a');

  anchor.href = objectUrl;
  anchor.download =
    evidence.fileName ||
    'evidencia';

  document.body.appendChild(
    anchor,
  );

  anchor.click();
  anchor.remove();

  URL.revokeObjectURL(
    objectUrl,
  );
}

/* =========================================================
   INICIAR REVISIÓN
   ========================================================= */

export async function startEvidenceReview(
  evidenceId: string,
): Promise<EvidenceDocument> {
  if (demoMode) {
    throw new Error(
      'La revisión no está disponible en modo demostrativo.',
    );
  }

  const { data: userData } =
    await supabase.auth.getUser();

  const reviewerId =
    userData.user?.id;

  if (!reviewerId) {
    throw new Error(
      'No se pudo identificar al fiscalizador autenticado.',
    );
  }

  const { data, error } =
    await supabase
      .from('evidence_documents')
      .update({
        status:
          'En revisión',

        reviewed_by:
          reviewerId,

        reviewed_at:
          new Date().toISOString(),
      })
      .eq('id', evidenceId)
      .select(EVIDENCE_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo iniciar la revisión',
      ),
    );
  }

  return mapEvidence(
    data as unknown as EvidenceDocumentRow,
  );
}

/* =========================================================
   REGISTRAR RESULTADO DE REVISIÓN
   ========================================================= */

export async function reviewEvidence(
  evidenceId: string,
  values: EvidenceReviewFormValues,
): Promise<EvidenceDocument> {
  const comment =
    values.reviewComment.trim();

  if (
    (
      values.status === 'Observada' ||
      values.status === 'Rechazada'
    ) &&
    !comment
  ) {
    throw new Error(
      'Debes ingresar una observación para este estado.',
    );
  }

  if (
    values.status === 'Pendiente' ||
    values.status === 'En revisión'
  ) {
    throw new Error(
      'Selecciona Aprobada, Observada o Rechazada para completar la revisión.',
    );
  }

  if (demoMode) {
    throw new Error(
      'La revisión no está disponible en modo demostrativo.',
    );
  }

  const { data: userData } =
    await supabase.auth.getUser();

  const reviewerId =
    userData.user?.id;

  if (!reviewerId) {
    throw new Error(
      'No se pudo identificar al fiscalizador autenticado.',
    );
  }

  const { data, error } =
    await supabase
      .from('evidence_documents')
      .update({
        status:
          values.status,

        review_comment:
          comment || null,

        reviewed_by:
          reviewerId,

        reviewed_at:
          new Date().toISOString(),
      })
      .eq('id', evidenceId)
      .select(EVIDENCE_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo guardar la revisión',
      ),
    );
  }

  return mapEvidence(
    data as unknown as EvidenceDocumentRow,
  );
}

/* =========================================================
   ACTUALIZAR ESTADO DE IA
   ========================================================= */

export async function updateEvidenceAiStatus(
  evidenceId: string,
  aiStatus: EvidenceAiStatus,
): Promise<EvidenceDocument> {
  const { data, error } =
    await supabase
      .from('evidence_documents')
      .update({
        ai_status:
          aiStatus,
      })
      .eq('id', evidenceId)
      .select(EVIDENCE_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo actualizar el estado de la IA',
      ),
    );
  }

  return mapEvidence(
    data as unknown as EvidenceDocumentRow,
  );
}

/* =========================================================
   GUARDAR RESULTADO DE IA
   ========================================================= */

export async function saveEvidenceAiResult(
  evidenceId: string,
  result: EvidenceAiResult,
  confidence?: number,
): Promise<EvidenceDocument> {
  if (
    confidence !== undefined &&
    (
      confidence < 0 ||
      confidence > 100
    )
  ) {
    throw new Error(
      'La confianza de la IA debe estar entre 0 y 100.',
    );
  }

  const { data, error } =
    await supabase
      .from('evidence_documents')
      .update({
        ai_status:
          'Completado',

        ai_result:
          result,

        ai_confidence:
          confidence ?? null,
      })
      .eq('id', evidenceId)
      .select(EVIDENCE_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo guardar el análisis de IA',
      ),
    );
  }

  return mapEvidence(
    data as unknown as EvidenceDocumentRow,
  );
}

/* =========================================================
   REGISTRAR ERROR DE IA
   ========================================================= */

export async function markEvidenceAiError(
  evidenceId: string,
  errorMessage: string,
): Promise<EvidenceDocument> {
  const result: EvidenceAiResult = {
    summary:
      'No se pudo completar el análisis automático.',

    rawResponse:
      errorMessage,
  };

  const { data, error } =
    await supabase
      .from('evidence_documents')
      .update({
        ai_status:
          'Error',

        ai_result:
          result,

        ai_confidence:
          null,
      })
      .eq('id', evidenceId)
      .select(EVIDENCE_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo registrar el error de IA',
      ),
    );
  }

  return mapEvidence(
    data as unknown as EvidenceDocumentRow,
  );
}

/* =========================================================
   OPCIONES DE ASIGNACIONES
   ========================================================= */

export async function listEvidenceAssignmentOptions():
Promise<EvidenceAssignmentOption[]> {
  const { data, error } =
    await supabase
      .from('obligation_assignments')
      .select(`
        id,
        operation_id,
        company_id,

        obligation_catalog!obligation_assignments_catalog_id_fkey (
          code,
          title
        ),

        mining_operations!obligation_assignments_operation_id_fkey (
          name
        ),

        companies!obligation_assignments_company_id_fkey (
          legal_name
        )
      `)
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

  return (data ?? []).map(
    (row) => {
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
        id:
          row.id,

        operationId:
          row.operation_id,

        companyId:
          row.company_id ??
          undefined,

        obligationCode:
          catalog?.code ??
          'Sin código',

        obligationTitle:
          catalog?.title ??
          'Obligación no disponible',

        operationName:
          operation?.name ??
          'Operación no disponible',

        companyName:
          company?.legal_name ??
          'Empresa no disponible',
      };
    },
  );
}