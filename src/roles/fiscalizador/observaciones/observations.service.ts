import { supabase } from '../../../services/supabase';

import type {
  ObservationAiOption,
  ObservationAiRow,
  ObservationAssignmentContext,
  ObservationAssignmentRow,
  ObservationEvaluationOption,
  ObservationEvaluationRow,
  ObservationEvidenceOption,
  ObservationEvidenceRow,
  ObservationFormValues,
  ObservationGapOption,
  ObservationGapRow,
  ObservationItem,
  ObservationRecord,
  ObservationRow,
} from './observations.types';

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

const OBSERVATION_SELECT = `
  id,
  assignment_id,
  evaluation_id,
  gap_id,
  evidence_id,
  ai_analysis_id,
  title,
  description,
  source,
  text,
  validated,
  observation_type,
  severity,
  status,
  requires_response,
  responsible_name,
  due_date,
  company_response,
  response_evidence_path,
  responded_by,
  responded_at,
  verification_comment,
  created_by,
  verified_by,
  verified_at,
  closed_by,
  closed_at,
  created_at,
  updated_at
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
  if (value === null || value === undefined) {
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

function toStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter(Boolean);
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

  if (error.code === '23514') {
    return 'El tipo, severidad, estado u origen seleccionado no está permitido.';
  }

  if (error.code === '23502') {
    return 'Falta completar un dato obligatorio.';
  }

  if (error.code === 'PGRST116') {
    return 'La observación solicitada no fue encontrada.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

function mapObservation(
  row: ObservationRow,
): ObservationRecord {
  const description =
    row.description ??
    row.text ??
    undefined;

  return {
    id: row.id,
    assignmentId: row.assignment_id,

    evaluationId:
      row.evaluation_id ?? undefined,

    gapId:
      row.gap_id ?? undefined,

    evidenceId:
      row.evidence_id ?? undefined,

    aiAnalysisId:
      row.ai_analysis_id ?? undefined,

    title:
      row.title ??
      'Observación sin título',

    description,

    text:
      row.text ??
      description ??
      '',

    observationType:
      row.observation_type ??
      'Técnica',

    severity:
      row.severity ??
      'Media',

    status:
      row.status ??
      'Abierta',

    source:
      row.source,

    requiresResponse:
      row.requires_response ??
      true,

    validated:
      row.validated,

    responsibleName:
      row.responsible_name ?? undefined,

    dueDate:
      row.due_date ?? undefined,

    companyResponse:
      row.company_response ?? undefined,

    responseEvidencePath:
      row.response_evidence_path ??
      undefined,

    respondedBy:
      row.responded_by ?? undefined,

    respondedAt:
      row.responded_at ?? undefined,

    verificationComment:
      row.verification_comment ??
      undefined,

    createdBy:
      row.created_by ?? undefined,

    verifiedBy:
      row.verified_by ?? undefined,

    verifiedAt:
      row.verified_at ?? undefined,

    closedBy:
      row.closed_by ?? undefined,

    closedAt:
      row.closed_at ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at ??
      row.created_at,
  };
}

function mapEvidence(
  row: ObservationEvidenceRow,
): ObservationEvidenceOption {
  return {
    id: row.id,
    assignmentId: row.assignment_id,

    fileName: row.file_name,
    storagePath: row.storage_path,
    version: row.version,

    status: row.status,
    aiStatus:
      row.ai_status ?? 'Pendiente',

    uploadedAt: row.uploaded_at,
  };
}

function mapAiAnalysis(
  row: ObservationAiRow,
): ObservationAiOption {
  return {
    id: row.id,
    evidenceId: row.evidence_id,

    model: row.model,
    processingStatus:
      row.processing_status,

    complianceStatus:
      row.compliance_status,

    riskLevel:
      row.risk_level,

    confidence:
      row.confidence === null
        ? undefined
        : parseNumber(row.confidence),

    documentSummary:
      row.document_summary ?? undefined,

    observations:
      toStringArray(row.observations),

    recommendations:
      toStringArray(row.recommendations),

    humanStatus:
      row.human_status,

    createdAt:
      row.created_at,
  };
}

function mapEvaluation(
  row: ObservationEvaluationRow,
): ObservationEvaluationOption {
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

function mapGap(
  row: ObservationGapRow,
): ObservationGapOption {
  return {
    id: row.id,
    assignmentId: row.assignment_id,

    evaluationId:
      row.evaluation_id ?? undefined,

    evidenceId:
      row.evidence_id ?? undefined,

    aiAnalysisId:
      row.ai_analysis_id ?? undefined,

    title: row.title,

    description:
      row.description ?? undefined,

    riskLevel:
      row.risk_level,

    status:
      row.status,

    priority:
      row.priority,

    technicalBasis:
      row.technical_basis ?? undefined,

    treatmentMeasure:
      row.treatment_measure ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

async function listAssignments():
Promise<ObservationAssignmentRow[]> {
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
        'No se pudieron cargar las obligaciones asignadas',
      ),
    );
  }

  return (
    data ?? []
  ) as unknown as ObservationAssignmentRow[];
}

async function listObservationRecords():
Promise<ObservationRecord[]> {
  const { data, error } =
    await supabase
      .from('observations')
      .select(OBSERVATION_SELECT)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las observaciones',
      ),
    );
  }

  return (
    (data ?? []) as ObservationRow[]
  ).map(mapObservation);
}

async function listEvidenceRecords():
Promise<ObservationEvidenceOption[]> {
  const { data, error } =
    await supabase
      .from('evidence_documents')
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
    (data ?? []) as ObservationEvidenceRow[]
  ).map(mapEvidence);
}

async function listAiRecords():
Promise<ObservationAiOption[]> {
  const { data, error } =
    await supabase
      .from('ai_analyses')
      .select(`
        id,
        evidence_id,
        model,
        processing_status,
        compliance_status,
        risk_level,
        confidence,
        document_summary,
        observations,
        recommendations,
        human_status,
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
    (data ?? []) as ObservationAiRow[]
  ).map(mapAiAnalysis);
}

async function listEvaluationRecords():
Promise<ObservationEvaluationOption[]> {
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
    (data ?? []) as ObservationEvaluationRow[]
  ).map(mapEvaluation);
}

async function listGapRecords():
Promise<ObservationGapOption[]> {
  const { data, error } =
    await supabase
      .from('gaps')
      .select(`
        id,
        assignment_id,
        evaluation_id,
        evidence_id,
        ai_analysis_id,
        title,
        description,
        risk_level,
        status,
        priority,
        technical_basis,
        treatment_measure,
        created_at,
        updated_at
      `)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las brechas',
      ),
    );
  }

  return (
    (data ?? []) as ObservationGapRow[]
  ).map(mapGap);
}

export async function listObservationsData():
Promise<{
  contexts: ObservationAssignmentContext[];
  observations: ObservationItem[];
}> {
  const [
    assignmentRows,
    observationRecords,
    evidences,
    aiAnalyses,
    evaluations,
    gaps,
  ] = await Promise.all([
    listAssignments(),
    listObservationRecords(),
    listEvidenceRecords(),
    listAiRecords(),
    listEvaluationRecords(),
    listGapRecords(),
  ]);

  const evidencesByAssignment =
    new Map<
      string,
      ObservationEvidenceOption[]
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

  const evaluationByAssignment =
    new Map(
      evaluations.map((evaluation) => [
        evaluation.assignmentId,
        evaluation,
      ]),
    );

  const gapsByAssignment =
    new Map<
      string,
      ObservationGapOption[]
    >();

  gaps.forEach((gap) => {
    const current =
      gapsByAssignment.get(
        gap.assignmentId,
      ) ?? [];

    current.push(gap);

    gapsByAssignment.set(
      gap.assignmentId,
      current,
    );
  });

  const contexts =
    assignmentRows.flatMap(
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
          obligation.active === false
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

        const assignmentGaps =
          (
            gapsByAssignment.get(
              assignment.id,
            ) ?? []
          ).sort(
            (first, second) =>
              new Date(
                second.createdAt,
              ).getTime() -
              new Date(
                first.createdAt,
              ).getTime(),
          );

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

          assignmentStatus:
            assignment.status,

          dueDate:
            assignment.due_date ??
            undefined,

          evidences:
            assignmentEvidences,

          aiAnalyses:
            assignmentAnalyses,

          gaps:
            assignmentGaps,

          evaluation:
            evaluationByAssignment.get(
              assignment.id,
            ),

          latestEvidence:
            assignmentEvidences[0],

          latestAiAnalysis:
            assignmentAnalyses[0],
        }];
      },
    );

  const contextByAssignment =
    new Map(
      contexts.map((context) => [
        context.assignmentId,
        context,
      ]),
    );

  const observations =
    observationRecords.flatMap(
      (observation) => {
        const context =
          contextByAssignment.get(
            observation.assignmentId,
          );

        if (!context) {
          return [];
        }

        return [{
          ...observation,

          companyId:
            context.companyId,

          companyName:
            context.companyName,

          operationId:
            context.operationId,

          operationName:
            context.operationName,

          operationCode:
            context.operationCode,

          obligationCode:
            context.obligationCode,

          obligationTitle:
            context.obligationTitle,

          obligationDescription:
            context.obligationDescription,

          category:
            context.category,

          criticality:
            context.criticality,

          requiredEvidence:
            context.requiredEvidence,

          evidence:
            observation.evidenceId
              ? context.evidences.find(
                  (item) =>
                    item.id ===
                    observation.evidenceId,
                )
              : undefined,

          aiAnalysis:
            observation.aiAnalysisId
              ? context.aiAnalyses.find(
                  (item) =>
                    item.id ===
                    observation.aiAnalysisId,
                )
              : undefined,

          evaluation:
            observation.evaluationId ===
            context.evaluation?.id
              ? context.evaluation
              : undefined,

          gap:
            observation.gapId
              ? context.gaps.find(
                  (item) =>
                    item.id ===
                    observation.gapId,
                )
              : undefined,
        }];
      },
    );

  return {
    contexts,
    observations,
  };
}

function validateObservation(
  values: ObservationFormValues,
): void {
  if (!values.assignmentId) {
    throw new Error(
      'Selecciona una obligación asignada.',
    );
  }

  if (!values.title.trim()) {
    throw new Error(
      'El título es obligatorio.',
    );
  }

  if (!values.description.trim()) {
    throw new Error(
      'La descripción es obligatoria.',
    );
  }

  if (
    values.requiresResponse &&
    (
      values.severity === 'Alta' ||
      values.severity === 'Crítica'
    ) &&
    !values.dueDate
  ) {
    throw new Error(
      'Las observaciones de severidad alta o crítica deben tener una fecha límite.',
    );
  }

  if (
    (
      values.status === 'Subsanada' ||
      values.status === 'No subsanada'
    ) &&
    !values.verificationComment.trim()
  ) {
    throw new Error(
      'Registra el comentario de verificación.',
    );
  }
}

export async function saveObservation(
  values: ObservationFormValues,
): Promise<ObservationRecord> {
  validateObservation(values);

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error(
      'No se pudo identificar al fiscalizador.',
    );
  }

  const isVerified =
    values.status === 'Subsanada' ||
    values.status === 'No subsanada';

  const isClosed =
    values.status === 'Cerrada';

  const description =
    values.description.trim();

  const payload = {
    assignment_id:
      values.assignmentId,

    evaluation_id:
      values.evaluationId || null,

    gap_id:
      values.gapId || null,

    evidence_id:
      values.evidenceId || null,

    ai_analysis_id:
      values.aiAnalysisId || null,

    title:
      values.title.trim(),

    description,

    // Campo heredado obligatorio.
    text:
      description,

    observation_type:
      values.observationType,

    severity:
      values.severity,

    status:
      values.status,

    source:
      values.source,

    requires_response:
      values.requiresResponse,

    responsible_name:
      values.responsibleName.trim() ||
      null,

    due_date:
      values.dueDate || null,

    verification_comment:
      values.verificationComment.trim() ||
      null,

    validated:
      isVerified ||
      isClosed,

    verified_by:
      isVerified
        ? userData.user.id
        : null,

    verified_at:
      isVerified
        ? new Date().toISOString()
        : null,

    closed_by:
      isClosed
        ? userData.user.id
        : null,

    closed_at:
      isClosed
        ? new Date().toISOString()
        : null,
  };

  if (values.id) {
    const { data, error } =
      await supabase
        .from('observations')
        .update(payload)
        .eq('id', values.id)
        .select(OBSERVATION_SELECT)
        .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          'No se pudo actualizar la observación',
        ),
      );
    }

    return mapObservation(
      data as ObservationRow,
    );
  }

  const { data, error } =
    await supabase
      .from('observations')
      .insert({
        ...payload,
        created_by:
          userData.user.id,
      })
      .select(OBSERVATION_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo registrar la observación',
      ),
    );
  }

  return mapObservation(
    data as ObservationRow,
  );
}

export async function removeObservation(
  observationId: string,
): Promise<void> {
  const { error } =
    await supabase
      .from('observations')
      .delete()
      .eq('id', observationId);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo eliminar la observación',
      ),
    );
  }
}

export async function openObservationEvidence(
  storagePath: string,
): Promise<void> {
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

  const openedWindow =
    window.open(
      data.signedUrl,
      '_blank',
      'noopener,noreferrer',
    );

  if (!openedWindow) {
    throw new Error(
      'El navegador bloqueó la apertura del archivo.',
    );
  }
}