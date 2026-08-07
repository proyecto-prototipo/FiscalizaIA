import { supabase } from '../../../services/supabase';

import type {
  ResultContext,
  ResultFormValues,
  ResultItem,
  ResultRecord,
  ResultRow,
} from './results.types';

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
  compliance_status: string;
  risk_level: string;
  score: number | string;
}

const RESULT_SELECT = `
  id,
  assignment_id,
  evaluation_id,
  compliance_status,
  risk_level,
  score,
  conclusion,
  executive_summary,
  strengths,
  findings,
  pending_actions,
  gaps_count,
  observations_count,
  recommendations_count,
  status,
  generated_by,
  finalized_by,
  finalized_at,
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

function parseStringArray(
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

function textToArray(
  value: string,
): string[] {
  return value
    .split('\n')
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

  if (error.code === '23505') {
    return 'Ya existe un resultado para esta obligación.';
  }

  if (error.code === '23514') {
    return 'El estado, nivel de riesgo o puntaje no está permitido.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

function mapResult(
  row: ResultRow,
): ResultRecord {
  return {
    id: row.id,

    assignmentId:
      row.assignment_id,

    evaluationId:
      row.evaluation_id ?? undefined,

    complianceStatus:
      row.compliance_status,

    riskLevel:
      row.risk_level,

    score:
      parseNumber(row.score),

    conclusion:
      row.conclusion ?? undefined,

    executiveSummary:
      row.executive_summary ?? undefined,

    strengths:
      parseStringArray(row.strengths),

    findings:
      parseStringArray(row.findings),

    pendingActions:
      parseStringArray(
        row.pending_actions,
      ),

    gapsCount:
      row.gaps_count,

    observationsCount:
      row.observations_count,

    recommendationsCount:
      row.recommendations_count,

    status:
      row.status,

    generatedBy:
      row.generated_by ?? undefined,

    finalizedBy:
      row.finalized_by ?? undefined,

    finalizedAt:
      row.finalized_at ?? undefined,

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
        'No se pudo cargar el catálogo',
      ),
    );
  }

  return (data ?? []) as CatalogRow[];
}

async function listEvaluations():
Promise<EvaluationRow[]> {
  const { data, error } = await supabase
    .from('evaluations')
    .select(`
      id,
      assignment_id,
      compliance_status,
      risk_level,
      score
    `);

  if (error) {
    console.warn(
      '[Resultados] Evaluaciones no disponibles:',
      error,
    );

    return [];
  }

  return (data ?? []) as EvaluationRow[];
}

async function countByAssignment(
  tableName:
    | 'gaps'
    | 'observations'
    | 'recommendations',
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from(tableName)
    .select('assignment_id');

  if (error) {
    console.warn(
      `[Resultados] No se pudo contar ${tableName}:`,
      error,
    );

    return new Map();
  }

  const values =
    new Map<string, number>();

  (data ?? []).forEach((row) => {
    const assignmentId =
      String(row.assignment_id);

    values.set(
      assignmentId,
      (values.get(assignmentId) ?? 0) + 1,
    );
  });

  return values;
}

async function listResultRecords():
Promise<ResultRecord[]> {
  const { data, error } = await supabase
    .from('evaluation_results')
    .select(RESULT_SELECT)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar los resultados',
      ),
    );
  }

  return (
    (data ?? []) as ResultRow[]
  ).map(mapResult);
}

export async function listResultsData():
Promise<{
  contexts: ResultContext[];
  results: ResultItem[];
}> {
  const [
    assignments,
    companies,
    operations,
    catalog,
    evaluations,
    resultRecords,
    gapsCount,
    observationsCount,
    recommendationsCount,
  ] = await Promise.all([
    listAssignments(),
    listCompanies(),
    listOperations(),
    listCatalog(),
    listEvaluations(),
    listResultRecords(),
    countByAssignment('gaps'),
    countByAssignment('observations'),
    countByAssignment('recommendations'),
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

  const evaluationsByAssignment =
    new Map(
      evaluations.map((evaluation) => [
        evaluation.assignment_id,
        evaluation,
      ]),
    );

  const contexts:
  ResultContext[] = [];

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

    const evaluation =
      evaluationsByAssignment.get(
        assignment.id,
      );

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
        evaluation?.id,

      evaluationScore:
        evaluation
          ? parseNumber(evaluation.score)
          : undefined,

      evaluationComplianceStatus:
        evaluation?.compliance_status,

      evaluationRiskLevel:
        evaluation?.risk_level,

      gapsCount:
        gapsCount.get(
          assignment.id,
        ) ?? 0,

      observationsCount:
        observationsCount.get(
          assignment.id,
        ) ?? 0,

      recommendationsCount:
        recommendationsCount.get(
          assignment.id,
        ) ?? 0,
    });
  });

  const contextsByAssignment =
    new Map(
      contexts.map((context) => [
        context.assignmentId,
        context,
      ]),
    );

  const results:
  ResultItem[] = [];

  resultRecords.forEach((result) => {
    const context =
      contextsByAssignment.get(
        result.assignmentId,
      );

    if (!context) {
      return;
    }

    results.push({
      ...result,

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
    });
  });

  console.log(
    '[Resultados] Contextos:',
    contexts.length,
  );

  console.log(
    '[Resultados] Registros:',
    results.length,
  );

  return {
    contexts,
    results,
  };
}

function validateResult(
  values: ResultFormValues,
): void {
  if (!values.assignmentId) {
    throw new Error(
      'Selecciona una obligación asignada.',
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
    values.status === 'Finalizado' &&
    !values.conclusion.trim()
  ) {
    throw new Error(
      'Registra una conclusión antes de finalizar.',
    );
  }
}

export async function saveResult(
  values: ResultFormValues,
  context: ResultContext,
): Promise<ResultRecord> {
  validateResult(values);

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error(
      'No se pudo identificar al fiscalizador.',
    );
  }

  const finalized =
    values.status === 'Finalizado';

  const payload = {
    assignment_id:
      values.assignmentId,

    evaluation_id:
      values.evaluationId || null,

    compliance_status:
      values.complianceStatus,

    risk_level:
      values.riskLevel,

    score:
      values.score,

    conclusion:
      values.conclusion.trim() ||
      null,

    executive_summary:
      values.executiveSummary.trim() ||
      null,

    strengths:
      textToArray(
        values.strengthsText,
      ),

    findings:
      textToArray(
        values.findingsText,
      ),

    pending_actions:
      textToArray(
        values.pendingActionsText,
      ),

    gaps_count:
      context.gapsCount,

    observations_count:
      context.observationsCount,

    recommendations_count:
      context.recommendationsCount,

    status:
      values.status,

    finalized_by:
      finalized
        ? userData.user.id
        : null,

    finalized_at:
      finalized
        ? new Date().toISOString()
        : null,
  };

  if (values.id) {
    const { data, error } = await supabase
      .from('evaluation_results')
      .update(payload)
      .eq('id', values.id)
      .select(RESULT_SELECT)
      .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          'No se pudo actualizar el resultado',
        ),
      );
    }

    return mapResult(
      data as ResultRow,
    );
  }

  const { data, error } = await supabase
    .from('evaluation_results')
    .insert({
      ...payload,
      generated_by:
        userData.user.id,
    })
    .select(RESULT_SELECT)
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo registrar el resultado',
      ),
    );
  }

  return mapResult(
    data as ResultRow,
  );
}

export async function removeResult(
  resultId: string,
): Promise<void> {
  const { error } = await supabase
    .from('evaluation_results')
    .delete()
    .eq('id', resultId);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo eliminar el resultado',
      ),
    );
  }
}