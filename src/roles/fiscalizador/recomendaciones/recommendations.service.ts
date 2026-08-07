import { supabase } from '../../../services/supabase';

import type {
  RecommendationContext,
  RecommendationFormValues,
  RecommendationItem,
  RecommendationRecord,
  RecommendationRow,
} from './recommendations.types';

interface AssignmentRow {
  id: string;
  company_id: string | null;
  operation_id: string;
  catalog_id: string;
}

interface CompanyRow {
  id: string;
  legal_name: string;
}

interface OperationRow {
  id: string;
  company_id: string;
  name: string;
}

interface CatalogRow {
  id: string;
  code: string;
  title: string;
  category: string;
  criticality: 'Baja' | 'Media' | 'Alta';
  active: boolean | null;
}

interface EvaluationRow {
  id: string;
  assignment_id: string;
}

interface GapRow {
  id: string;
  assignment_id: string;
  title: string;
  risk_level: string;
}

interface ObservationRow {
  id: string;
  assignment_id: string;
  title: string | null;
  text: string;
  severity: string | null;
}

const RECOMMENDATION_SELECT = `
  id,
  assignment_id,
  evaluation_id,
  gap_id,
  observation_id,
  ai_analysis_id,
  title,
  description,
  text,
  recommendation_type,
  priority,
  status,
  source,
  responsible_name,
  due_date,
  progress,
  expected_result,
  implementation_comment,
  verification_comment,
  created_by,
  implemented_by,
  implemented_at,
  verified_by,
  verified_at,
  created_at,
  updated_at
`;

function parseNumber(
  value: number | string | null | undefined,
): number {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
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
    return 'El estado, prioridad, tipo o avance no está permitido.';
  }

  if (error.code === '23502') {
    return 'Falta completar un dato obligatorio.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

function mapRecommendation(
  row: RecommendationRow,
): RecommendationRecord {
  return {
    id: row.id,
    assignmentId: row.assignment_id,

    evaluationId:
      row.evaluation_id ?? undefined,

    gapId:
      row.gap_id ?? undefined,

    observationId:
      row.observation_id ?? undefined,

    aiAnalysisId:
      row.ai_analysis_id ?? undefined,

    title: row.title,

    description:
      row.description ?? undefined,

    text: row.text,

    recommendationType:
      row.recommendation_type,

    priority:
      row.priority,

    status:
      row.status,

    source:
      row.source,

    responsibleName:
      row.responsible_name ?? undefined,

    dueDate:
      row.due_date ?? undefined,

    progress:
      parseNumber(row.progress),

    expectedResult:
      row.expected_result ?? undefined,

    implementationComment:
      row.implementation_comment ??
      undefined,

    verificationComment:
      row.verification_comment ??
      undefined,

    createdBy:
      row.created_by ?? undefined,

    implementedBy:
      row.implemented_by ?? undefined,

    implementedAt:
      row.implemented_at ?? undefined,

    verifiedBy:
      row.verified_by ?? undefined,

    verifiedAt:
      row.verified_at ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

async function listAssignments():
Promise<AssignmentRow[]> {
  const { data, error } = await supabase
    .from('obligation_assignments')
    .select(`
      id,
      company_id,
      operation_id,
      catalog_id
    `);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las obligaciones asignadas',
      ),
    );
  }

  return (data ?? []) as AssignmentRow[];
}

async function listCompanies():
Promise<CompanyRow[]> {
  const { data, error } = await supabase
    .from('companies')
    .select('id, legal_name');

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las empresas',
      ),
    );
  }

  return (data ?? []) as CompanyRow[];
}

async function listOperations():
Promise<OperationRow[]> {
  const { data, error } = await supabase
    .from('mining_operations')
    .select('id, company_id, name');

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las operaciones',
      ),
    );
  }

  return (data ?? []) as OperationRow[];
}

async function listCatalog():
Promise<CatalogRow[]> {
  const { data, error } = await supabase
    .from('obligation_catalog')
    .select(`
      id,
      code,
      title,
      category,
      criticality,
      active
    `);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cargar el catálogo de obligaciones',
      ),
    );
  }

  return (data ?? []) as CatalogRow[];
}

async function listEvaluations():
Promise<EvaluationRow[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select('id, assignment_id');

  if (error) {
    console.warn(
      '[Recomendaciones] Evaluaciones no disponibles:',
      error,
    );

    return [];
  }

  return (data ?? []) as EvaluationRow[];
}

async function listGaps():
Promise<GapRow[]> {
  const { data, error } = await supabase
    .from('gaps')
    .select(`
      id,
      assignment_id,
      title,
      risk_level
    `);

  if (error) {
    console.warn(
      '[Recomendaciones] Brechas no disponibles:',
      error,
    );

    return [];
  }

  return (data ?? []) as GapRow[];
}

async function listObservations():
Promise<ObservationRow[]> {
  const { data, error } = await supabase
    .from('observations')
    .select(`
      id,
      assignment_id,
      title,
      text,
      severity
    `);

  if (error) {
    console.warn(
      '[Recomendaciones] Observaciones no disponibles:',
      error,
    );

    return [];
  }

  return (data ?? []) as ObservationRow[];
}

async function listRecommendationRecords():
Promise<RecommendationRecord[]> {
  const { data, error } = await supabase
    .from('recommendations')
    .select(RECOMMENDATION_SELECT)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las recomendaciones',
      ),
    );
  }

  return (
    (data ?? []) as RecommendationRow[]
  ).map(mapRecommendation);
}

export async function listRecommendationsData():
Promise<{
  contexts: RecommendationContext[];
  recommendations: RecommendationItem[];
}> {
  const [
    assignments,
    companies,
    operations,
    catalog,
    recommendationRecords,
  ] = await Promise.all([
    listAssignments(),
    listCompanies(),
    listOperations(),
    listCatalog(),
    listRecommendationRecords(),
  ]);

  const [
    evaluations,
    gaps,
    observations,
  ] = await Promise.all([
    listEvaluations(),
    listGaps(),
    listObservations(),
  ]);

  const companiesById =
    new Map(
      companies.map((company) => [
        company.id,
        company,
      ]),
    );

  const operationsById =
    new Map(
      operations.map((operation) => [
        operation.id,
        operation,
      ]),
    );

  const catalogById =
    new Map(
      catalog.map((item) => [
        item.id,
        item,
      ]),
    );

  const evaluationByAssignment =
    new Map(
      evaluations.map((evaluation) => [
        evaluation.assignment_id,
        evaluation.id,
      ]),
    );

  const gapsByAssignment =
    new Map<string, GapRow[]>();

  gaps.forEach((gap) => {
    const current =
      gapsByAssignment.get(
        gap.assignment_id,
      ) ?? [];

    current.push(gap);

    gapsByAssignment.set(
      gap.assignment_id,
      current,
    );
  });

  const observationsByAssignment =
    new Map<string, ObservationRow[]>();

  observations.forEach((observation) => {
    const current =
      observationsByAssignment.get(
        observation.assignment_id,
      ) ?? [];

    current.push(observation);

    observationsByAssignment.set(
      observation.assignment_id,
      current,
    );
  });

  const contexts:
  RecommendationContext[] = [];

  assignments.forEach((assignment) => {
    const operation =
      operationsById.get(
        assignment.operation_id,
      );

    const obligation =
      catalogById.get(
        assignment.catalog_id,
      );

    if (
      !operation ||
      !obligation ||
      obligation.active === false
    ) {
      return;
    }

    const companyId =
      assignment.company_id ??
      operation.company_id;

    const company =
      companiesById.get(companyId);

    contexts.push({
      assignmentId:
        assignment.id,

      companyId,

      companyName:
        company?.legal_name ??
        'Empresa sin nombre',

      operationId:
        operation.id,

      operationName:
        operation.name,

      obligationCode:
        obligation.code,

      obligationTitle:
        obligation.title,

      category:
        obligation.category,

      criticality:
        obligation.criticality,

      evaluationId:
        evaluationByAssignment.get(
          assignment.id,
        ),

      gaps:
        (
          gapsByAssignment.get(
            assignment.id,
          ) ?? []
        ).map((gap) => ({
          id: gap.id,
          title: gap.title,
          riskLevel: gap.risk_level,
        })),

      observations:
        (
          observationsByAssignment.get(
            assignment.id,
          ) ?? []
        ).map((observation) => ({
          id: observation.id,

          title:
            observation.title ??
            observation.text,

          severity:
            observation.severity ??
            'Media',
        })),
    });
  });

  const contextsByAssignment =
    new Map(
      contexts.map((context) => [
        context.assignmentId,
        context,
      ]),
    );

  const recommendations:
  RecommendationItem[] = [];

  recommendationRecords.forEach(
    (recommendation) => {
      const context =
        contextsByAssignment.get(
          recommendation.assignmentId,
        );

      if (!context) {
        return;
      }

      recommendations.push({
        ...recommendation,

        companyId:
          context.companyId,

        companyName:
          context.companyName,

        operationId:
          context.operationId,

        operationName:
          context.operationName,

        obligationCode:
          context.obligationCode,

        obligationTitle:
          context.obligationTitle,

        category:
          context.category,

        criticality:
          context.criticality,

        gapTitle:
          recommendation.gapId
            ? context.gaps.find(
                (gap) =>
                  gap.id ===
                  recommendation.gapId,
              )?.title
            : undefined,

        observationTitle:
          recommendation.observationId
            ? context.observations.find(
                (observation) =>
                  observation.id ===
                  recommendation.observationId,
              )?.title
            : undefined,
      });
    },
  );

  console.log(
    '[Recomendaciones] Contextos:',
    contexts.length,
  );

  console.log(
    '[Recomendaciones] Registros:',
    recommendations.length,
  );

  return {
    contexts,
    recommendations,
  };
}

function validateRecommendation(
  values: RecommendationFormValues,
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
    (
      values.priority === 'Alta' ||
      values.priority === 'Urgente'
    ) &&
    !values.dueDate
  ) {
    throw new Error(
      'Las recomendaciones de prioridad alta o urgente deben tener fecha límite.',
    );
  }

  if (
    values.status === 'Verificada' &&
    !values.verificationComment.trim()
  ) {
    throw new Error(
      'Registra el comentario de verificación.',
    );
  }
}

export async function saveRecommendation(
  values: RecommendationFormValues,
): Promise<RecommendationRecord> {
  validateRecommendation(values);

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error(
      'No se pudo identificar al fiscalizador.',
    );
  }

  const implemented =
    values.status === 'Implementada' ||
    values.status === 'Verificada';

  const verified =
    values.status === 'Verificada';

  const description =
    values.description.trim();

  const payload = {
    assignment_id:
      values.assignmentId,

    evaluation_id:
      values.evaluationId || null,

    gap_id:
      values.gapId || null,

    observation_id:
      values.observationId || null,

    ai_analysis_id:
      values.aiAnalysisId || null,

    title:
      values.title.trim(),

    description,

    text:
      description,

    recommendation_type:
      values.recommendationType,

    priority:
      values.priority,

    status:
      values.status,

    source:
      values.source,

    responsible_name:
      values.responsibleName.trim() ||
      null,

    due_date:
      values.dueDate || null,

    progress:
      verified || implemented
        ? 100
        : values.progress,

    expected_result:
      values.expectedResult.trim() ||
      null,

    implementation_comment:
      values.implementationComment.trim() ||
      null,

    verification_comment:
      values.verificationComment.trim() ||
      null,

    implemented_by:
      implemented
        ? userData.user.id
        : null,

    implemented_at:
      implemented
        ? new Date().toISOString()
        : null,

    verified_by:
      verified
        ? userData.user.id
        : null,

    verified_at:
      verified
        ? new Date().toISOString()
        : null,
  };

  if (values.id) {
    const { data, error } = await supabase
      .from('recommendations')
      .update(payload)
      .eq('id', values.id)
      .select(RECOMMENDATION_SELECT)
      .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          'No se pudo actualizar la recomendación',
        ),
      );
    }

    return mapRecommendation(
      data as RecommendationRow,
    );
  }

  const { data, error } = await supabase
    .from('recommendations')
    .insert({
      ...payload,
      created_by: userData.user.id,
    })
    .select(RECOMMENDATION_SELECT)
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo registrar la recomendación',
      ),
    );
  }

  return mapRecommendation(
    data as RecommendationRow,
  );
}

export async function removeRecommendation(
  recommendationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('recommendations')
    .delete()
    .eq('id', recommendationId);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo eliminar la recomendación',
      ),
    );
  }
}