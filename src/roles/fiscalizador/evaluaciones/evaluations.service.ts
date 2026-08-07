import { supabase } from '../../../services/supabase';

import type {
  EvaluationAiOption,
  EvaluationAiRow,
  EvaluationAssignmentRow,
  EvaluationEvidenceOption,
  EvaluationEvidenceRow,
  EvaluationFormValues,
  EvaluationItem,
  EvaluationRecord,
  EvaluationRow,
} from './evaluations.types';

const EVIDENCE_BUCKET = 'evidences';

const ASSIGNMENT_SELECT = `
  id,
  company_id,
  operation_id,
  catalog_id,
  due_date,
  status,

  mining_operations!obligation_assignments_operation_id_fkey (
    id,
    name,
    code,
    internal_code,
    company_id
  ),

  obligation_catalog!obligation_assignments_catalog_id_fkey (
    id,
    code,
    title,
    description,
    category,
    criticality,
    required_evidence,
    active
  ),

  companies!obligation_assignments_company_id_fkey (
    id,
    legal_name
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

function parseNumber(
  value: number | string | null | undefined,
  fallback = 0,
): number {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const parsed =
    typeof value === 'number'
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? parsed
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
    return 'No tienes permisos para realizar esta acción.';
  }

  if (error.code === '23503') {
    return 'Una de las relaciones seleccionadas ya no existe.';
  }

  if (error.code === '23505') {
    return 'La obligación ya tiene una evaluación registrada.';
  }

  if (error.code === '23514') {
    return 'El cumplimiento, riesgo o puntaje ingresado no está permitido.';
  }

  if (error.code === '23502') {
    return 'Falta completar información obligatoria.';
  }

  if (error.code === 'PGRST116') {
    return 'La evaluación solicitada no fue encontrada.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

function mapEvaluation(
  row: EvaluationRow,
): EvaluationRecord {
  return {
    id: row.id,
    assignmentId: row.assignment_id,

    evidenceId:
      row.evidence_id ?? undefined,

    aiAnalysisId:
      row.ai_analysis_id ?? undefined,

    complianceStatus:
      row.compliance_status,

    riskLevel:
      row.risk_level,

    score:
      parseNumber(row.score),

    validated:
      row.validated,

    validatedBy:
      row.validated_by ?? undefined,

    validatedAt:
      row.validated_at ?? undefined,

    evaluationComment:
      row.evaluation_comment ??
      undefined,

    correctiveAction:
      row.corrective_action ??
      undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function mapEvidence(
  row: EvaluationEvidenceRow,
): EvaluationEvidenceOption {
  return {
    id: row.id,
    assignmentId:
      row.assignment_id,

    fileName:
      row.file_name,

    storagePath:
      row.storage_path,

    version:
      row.version,

    status:
      row.status,

    aiStatus:
      row.ai_status ?? 'Pendiente',

    uploadedAt:
      row.uploaded_at,
  };
}

function mapAiAnalysis(
  row: EvaluationAiRow,
): EvaluationAiOption {
  return {
    id: row.id,
    evidenceId:
      row.evidence_id,

    model:
      row.model,

    complianceStatus:
      row.compliance_status,

    riskLevel:
      row.risk_level,

    confidence:
      row.confidence === null
        ? undefined
        : parseNumber(
            row.confidence,
          ),

    processingStatus:
      row.processing_status,

    humanStatus:
      row.human_status,

    documentSummary:
      row.document_summary ??
      undefined,

    createdAt:
      row.created_at,
  };
}

async function listAssignments():
Promise<EvaluationAssignmentRow[]> {
  const { data, error } =
    await supabase
      .from(
        'obligation_assignments',
      )
      .select(
        ASSIGNMENT_SELECT,
      )
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las obligaciones asignadas',
      ),
    );
  }

  return (
    data ?? []
  ) as unknown as
    EvaluationAssignmentRow[];
}

async function listEvaluationRecords():
Promise<EvaluationRecord[]> {
  const { data, error } =
    await supabase
      .from('evaluations')
      .select(`
        id,
        assignment_id,
        evidence_id,
        ai_analysis_id,
        compliance_status,
        risk_level,
        score,
        validated,
        validated_by,
        validated_at,
        evaluation_comment,
        corrective_action,
        created_at,
        updated_at
      `)
      .order('updated_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las evaluaciones',
      ),
    );
  }

  return (
    (data ?? []) as
      EvaluationRow[]
  ).map(mapEvaluation);
}

async function listEvidenceRecords():
Promise<EvaluationEvidenceOption[]> {
  const { data, error } =
    await supabase
      .from(
        'evidence_documents',
      )
      .select(`
        id,
        assignment_id,
        file_name,
        storage_path,
        version,
        status,
        ai_status,
        uploaded_at
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

  return (
    (data ?? []) as
      EvaluationEvidenceRow[]
  ).map(mapEvidence);
}

async function listAiRecords():
Promise<EvaluationAiOption[]> {
  const { data, error } =
    await supabase
      .from('ai_analyses')
      .select(`
        id,
        evidence_id,
        model,
        compliance_status,
        risk_level,
        confidence,
        processing_status,
        human_status,
        document_summary,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar los análisis IA',
      ),
    );
  }

  return (
    (data ?? []) as
      EvaluationAiRow[]
  ).map(mapAiAnalysis);
}

export async function listEvaluationItems():
Promise<EvaluationItem[]> {
  const [
    assignments,
    evaluations,
    evidences,
    aiAnalyses,
  ] = await Promise.all([
    listAssignments(),
    listEvaluationRecords(),
    listEvidenceRecords(),
    listAiRecords(),
  ]);

  const evaluationByAssignment =
    new Map(
      evaluations.map(
        (evaluation) => [
          evaluation.assignmentId,
          evaluation,
        ],
      ),
    );

  const evidencesByAssignment =
    new Map<
      string,
      EvaluationEvidenceOption[]
    >();

  evidences.forEach((evidence) => {
    const current =
      evidencesByAssignment.get(
        evidence.assignmentId,
      ) ?? [];

    current.push(evidence);

    evidencesByAssignment.set(
      evidence.assignmentId,
      current,
    );
  });

  const analysesByEvidence =
    new Map<
      string,
      EvaluationAiOption[]
    >();

  aiAnalyses.forEach((analysis) => {
    const current =
      analysesByEvidence.get(
        analysis.evidenceId,
      ) ?? [];

    current.push(analysis);

    analysesByEvidence.set(
      analysis.evidenceId,
      current,
    );
  });

  return assignments.flatMap(
    (assignment) => {
      const operation =
        firstRelation(
          assignment.mining_operations,
        );

      const obligation =
        firstRelation(
          assignment.obligation_catalog,
        );

      const company =
        firstRelation(
          assignment.companies,
        );

      if (
        !operation ||
        !obligation ||
        !company ||
        !obligation.active
      ) {
        return [];
      }

      const assignmentEvidences =
        (
          evidencesByAssignment.get(
            assignment.id,
          ) ?? []
        ).sort(
          (first, second) =>
            new Date(
              second.uploadedAt,
            ).getTime() -
            new Date(
              first.uploadedAt,
            ).getTime(),
        );

      const evidenceIds =
        new Set(
          assignmentEvidences.map(
            (evidence) =>
              evidence.id,
          ),
        );

      const assignmentAnalyses =
        aiAnalyses
          .filter((analysis) =>
            evidenceIds.has(
              analysis.evidenceId,
            ),
          )
          .sort(
            (first, second) =>
              new Date(
                second.createdAt,
              ).getTime() -
              new Date(
                first.createdAt,
              ).getTime(),
          );

      const latestEvidence =
        assignmentEvidences[0];

      const latestAiAnalysis =
        latestEvidence
          ? (
              analysesByEvidence.get(
                latestEvidence.id,
              ) ?? []
            )
              .sort(
                (first, second) =>
                  new Date(
                    second.createdAt,
                  ).getTime() -
                  new Date(
                    first.createdAt,
                  ).getTime(),
              )[0]
          : undefined;

      return [{
        assignmentId:
          assignment.id,

        companyId:
          assignment.company_id,

        companyName:
          company.legal_name,

        operationId:
          assignment.operation_id,

        operationName:
          operation.name,

        operationCode:
          operation.internal_code ??
          operation.code ??
          undefined,

        catalogId:
          assignment.catalog_id,

        obligationCode:
          obligation.code,

        obligationTitle:
          obligation.title,

        obligationDescription:
          obligation.description ??
          undefined,

        category:
          obligation.category,

        criticality:
          obligation.criticality,

        requiredEvidence:
          obligation.required_evidence,

        dueDate:
          assignment.due_date ??
          undefined,

        assignmentStatus:
          assignment.status,

        evidences:
          assignmentEvidences,

        aiAnalyses:
          assignmentAnalyses,

        latestEvidence,
        latestAiAnalysis,

        evaluation:
          evaluationByAssignment.get(
            assignment.id,
          ),
      }];
    },
  );
}

export async function saveEvaluation(
  values: EvaluationFormValues,
): Promise<EvaluationRecord> {
  if (!values.assignmentId) {
    throw new Error(
      'La obligación asignada es obligatoria.',
    );
  }

  if (
    values.score < 0 ||
    values.score > 100
  ) {
    throw new Error(
      'El puntaje debe estar entre 0 y 100.',
    );
  }

  if (
    values.validated &&
    (
      values.complianceStatus ===
        'Pendiente' ||
      values.riskLevel ===
        'Pendiente'
    )
  ) {
    throw new Error(
      'Para validar la evaluación debes seleccionar el cumplimiento y el riesgo.',
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

  const validatedAt =
    values.validated
      ? new Date().toISOString()
      : null;

  const validatedBy =
    values.validated
      ? userData.user.id
      : null;

  const payload = {
    assignment_id:
      values.assignmentId,

    evidence_id:
      values.evidenceId ||
      null,

    ai_analysis_id:
      values.aiAnalysisId ||
      null,

    compliance_status:
      values.complianceStatus,

    risk_level:
      values.riskLevel,

    score:
      values.score,

    evaluation_comment:
      values.evaluationComment
        .trim() || null,

    corrective_action:
      values.correctiveAction
        .trim() || null,

    validated:
      values.validated,

    validated_by:
      validatedBy,

    validated_at:
      validatedAt,
  };

  const { data, error } =
    await supabase
      .from('evaluations')
      .upsert(
        payload,
        {
          onConflict:
            'assignment_id',
        },
      )
      .select(`
        id,
        assignment_id,
        evidence_id,
        ai_analysis_id,
        compliance_status,
        risk_level,
        score,
        validated,
        validated_by,
        validated_at,
        evaluation_comment,
        corrective_action,
        created_at,
        updated_at
      `)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo guardar la evaluación',
      ),
    );
  }

  return mapEvaluation(
    data as EvaluationRow,
  );
}

export async function removeEvaluation(
  evaluationId: string,
): Promise<void> {
  const { error } =
    await supabase
      .from('evaluations')
      .delete()
      .eq('id', evaluationId);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo eliminar la evaluación',
      ),
    );
  }
}

export async function createEvaluationEvidenceUrl(
  storagePath: string,
): Promise<string> {
  if (!storagePath) {
    throw new Error(
      'La evidencia no tiene una ruta válida.',
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
      `No se pudo abrir la evidencia: ${error.message}`,
    );
  }

  return data.signedUrl;
}

export async function openEvaluationEvidence(
  storagePath: string,
): Promise<void> {
  const signedUrl =
    await createEvaluationEvidenceUrl(
      storagePath,
    );

  const openedWindow =
    window.open(
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