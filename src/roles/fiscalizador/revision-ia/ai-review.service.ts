import { supabase } from '../../../services/supabase';

import type {
  AiAnalysis,
  AiAnalysisRow,
  AiCandidateEvidence,
  AiHumanReviewForm,
  AnalyzeEvidenceResponse,
  EvidenceAiStatus,
  ObligationCriticality,
} from './aiReview.types';

const EVIDENCE_BUCKET = 'evidences';

const ANALYSIS_SELECT = `
  id,
  evidence_id,
  model,
  processing_status,
  compliance_status,
  risk_level,
  document_summary,
  document_type,
  missing_information,
  inconsistencies,
  breaches,
  observations,
  recommendations,
  confidence,
  human_status,
  human_review_comment,
  reviewed_by,
  reviewed_at,
  error_message,
  prompt_version,
  created_at,
  updated_at,

  evidence_documents!ai_analyses_evidence_id_fkey (
    id,
    file_name,
    storage_path,
    version,
    status,
    ai_status,
    uploaded_at,
    operation_id,
    assignment_id,

    mining_operations!evidence_documents_operation_id_fkey (
      id,
      name,
      code,
      internal_code,
      company_id
    ),

    obligation_assignments!evidence_documents_assignment_id_fkey (
      id,
      company_id,

      obligation_catalog!obligation_assignments_catalog_id_fkey (
        code,
        title,
        description,
        category,
        criticality,
        required_evidence
      ),

      companies!obligation_assignments_company_id_fkey (
        id,
        legal_name
      )
    )
  )
`;

function firstRelation<T>(
  relation: T | T[] | null | undefined,
): T | null {
  if (!relation) {
    return null;
  }

  return Array.isArray(relation)
    ? relation[0] ?? null
    : relation;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseConfidence(
  value: number | string | null,
): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsed =
    typeof value === 'number'
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : undefined;
}

function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (error.code === '42501') {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (error.code === '23503') {
    return 'La evidencia o el usuario relacionado ya no existe.';
  }

  if (error.code === '23514') {
    return 'El estado seleccionado no está permitido.';
  }

  if (error.code === 'PGRST116') {
    return 'El análisis solicitado no fue encontrado.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

function mapAnalysis(row: AiAnalysisRow): AiAnalysis {
  const evidence = firstRelation(row.evidence_documents);
  const operation = firstRelation(
    evidence?.mining_operations,
  );
  const assignment = firstRelation(
    evidence?.obligation_assignments,
  );
  const obligation = firstRelation(
    assignment?.obligation_catalog,
  );
  const company = firstRelation(
    assignment?.companies,
  );

  return {
    id: row.id,
    evidenceId: row.evidence_id,

    model: row.model,
    processingStatus: row.processing_status,

    complianceStatus: row.compliance_status,
    riskLevel: row.risk_level,

    documentSummary:
      row.document_summary ?? undefined,

    documentType:
      row.document_type ?? undefined,

    missingInformation:
      toStringArray(row.missing_information),

    inconsistencies:
      toStringArray(row.inconsistencies),

    breaches:
      toStringArray(row.breaches),

    observations:
      toStringArray(row.observations),

    recommendations:
      toStringArray(row.recommendations),

    confidence:
      parseConfidence(row.confidence),

    humanStatus: row.human_status,

    humanReviewComment:
      row.human_review_comment ?? undefined,

    reviewedBy:
      row.reviewed_by ?? undefined,

    reviewedAt:
      row.reviewed_at ?? undefined,

    errorMessage:
      row.error_message ?? undefined,

    promptVersion:
      row.prompt_version ?? undefined,

    createdAt: row.created_at,
    updatedAt: row.updated_at,

    fileName:
      evidence?.file_name ??
      'Archivo no disponible',

    storagePath:
      evidence?.storage_path ?? '',

    evidenceVersion:
      evidence?.version ?? 1,

    evidenceStatus:
      evidence?.status ?? 'Pendiente',

    evidenceAiStatus:
      evidence?.ai_status ?? 'Pendiente',

    uploadedAt:
      evidence?.uploaded_at ??
      row.created_at,

    operationId:
      evidence?.operation_id ?? '',

    operationName:
      operation?.name ??
      'Operación no disponible',

    operationCode:
      operation?.internal_code ??
      operation?.code ??
      undefined,

    assignmentId:
      evidence?.assignment_id ?? '',

    companyId:
      assignment?.company_id ??
      operation?.company_id ??
      undefined,

    companyName:
      company?.legal_name ??
      'Empresa no disponible',

    obligationCode:
      obligation?.code ??
      'Sin código',

    obligationTitle:
      obligation?.title ??
      'Obligación no disponible',

    obligationDescription:
      obligation?.description ?? undefined,

    obligationCategory:
      obligation?.category ??
      'Sin categoría',

    obligationCriticality:
      obligation?.criticality ??
      'Media',

    requiredEvidence:
      obligation?.required_evidence ??
      'No registrada',
  };
}

export async function listAiAnalyses():
Promise<AiAnalysis[]> {
  const { data, error } =
    await supabase
      .from('ai_analyses')
      .select(ANALYSIS_SELECT)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar los análisis',
      ),
    );
  }

  return (
    (data ?? []) as unknown as AiAnalysisRow[]
  ).map(mapAnalysis);
}

export async function listCandidateEvidences():
Promise<AiCandidateEvidence[]> {
  const { data, error } =
    await supabase
      .from('evidence_documents')
      .select(`
        id,
        file_name,
        storage_path,
        version,
        status,
        ai_status,
        uploaded_at,
        operation_id,
        assignment_id,

        mining_operations!evidence_documents_operation_id_fkey (
          id,
          name,
          code,
          internal_code,
          company_id
        ),

        obligation_assignments!evidence_documents_assignment_id_fkey (
          id,
          company_id,

          obligation_catalog!obligation_assignments_catalog_id_fkey (
            code,
            title,
            description,
            category,
            criticality,
            required_evidence
          ),

          companies!obligation_assignments_company_id_fkey (
            id,
            legal_name
          )
        )
      `)
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

  const analyses = await listAiAnalyses();

  return (data ?? []).map((row) => {
    const operation = firstRelation(
      row.mining_operations,
    );

    const assignment = firstRelation(
      row.obligation_assignments,
    );

    const obligation = firstRelation(
      assignment?.obligation_catalog,
    );

    const company = firstRelation(
      assignment?.companies,
    );

    const latestAnalysis = analyses.find(
      (analysis) =>
        analysis.evidenceId === row.id,
    );

    return {
      id: row.id,

      fileName: row.file_name,
      storagePath: row.storage_path,
      version: row.version,
      status: row.status,

      aiStatus:
        (row.ai_status ??
          'Pendiente') as EvidenceAiStatus,

      uploadedAt: row.uploaded_at,

      operationId: row.operation_id,

      operationName:
        operation?.name ??
        'Operación no disponible',

      operationCode:
        operation?.internal_code ??
        operation?.code ??
        undefined,

      assignmentId:
        row.assignment_id,

      companyId:
        assignment?.company_id ??
        operation?.company_id ??
        undefined,

      companyName:
        company?.legal_name ??
        'Empresa no disponible',

      obligationCode:
        obligation?.code ??
        'Sin código',

      obligationTitle:
        obligation?.title ??
        'Obligación no disponible',

      obligationDescription:
        obligation?.description ??
        undefined,

      obligationCategory:
        obligation?.category ??
        'Sin categoría',

      obligationCriticality:
        (obligation?.criticality ??
          'Media') as ObligationCriticality,

      requiredEvidence:
        obligation?.required_evidence ??
        'No registrada',

      latestAnalysisId:
        latestAnalysis?.id,

      latestProcessingStatus:
        latestAnalysis?.processingStatus,
    };
  });
}

export async function invokeEvidenceAnalysis(
  evidenceId: string,
): Promise<AnalyzeEvidenceResponse> {
  const {
    data: sessionData,
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw new Error(
      `No se pudo obtener la sesión: ${sessionError.message}`,
    );
  }

  if (!sessionData.session) {
    throw new Error(
      'Debes iniciar sesión para ejecutar el análisis.',
    );
  }

  const { data, error } =
    await supabase.functions.invoke<
      AnalyzeEvidenceResponse
    >('analyze-evidence', {
      body: {
        evidenceId,
      },
    });

  if (error) {
    throw new Error(
      `No se pudo ejecutar Gemini: ${error.message}`,
    );
  }

  if (!data?.success) {
    throw new Error(
      data?.error ??
      'Google AI Studio no devolvió un resultado válido.',
    );
  }

  return data;
}

export async function validateAiAnalysis(
  analysisId: string,
  values: AiHumanReviewForm,
): Promise<AiAnalysis> {
  const comment =
    values.reviewComment.trim();

  if (
    (
      values.humanStatus === 'Observado' ||
      values.humanStatus === 'Rechazado'
    ) &&
    !comment
  ) {
    throw new Error(
      'Debes registrar un comentario para este estado.',
    );
  }

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

  const { data, error } =
    await supabase
      .from('ai_analyses')
      .update({
        human_status:
          values.humanStatus,

        human_review_comment:
          comment || null,

        reviewed_by:
          userData.user.id,

        reviewed_at:
          new Date().toISOString(),
      })
      .eq('id', analysisId)
      .select(ANALYSIS_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo validar el análisis',
      ),
    );
  }

  return mapAnalysis(
    data as unknown as AiAnalysisRow,
  );
}

export async function createEvidenceSignedUrl(
  storagePath: string,
): Promise<string> {
  if (!storagePath) {
    throw new Error(
      'El archivo no tiene una ruta válida.',
    );
  }

  const { data, error } =
    await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(
        storagePath,
        300,
      );

  if (error) {
    throw new Error(
      `No se pudo abrir el archivo: ${error.message}`,
    );
  }

  return data.signedUrl;
}

export async function openAiEvidenceFile(
  storagePath: string,
): Promise<void> {
  const signedUrl =
    await createEvidenceSignedUrl(
      storagePath,
    );

  const openedWindow = window.open(
    signedUrl,
    '_blank',
    'noopener,noreferrer',
  );

  if (!openedWindow) {
    throw new Error(
      'El navegador bloqueó la apertura del archivo.',
    );
  }
}