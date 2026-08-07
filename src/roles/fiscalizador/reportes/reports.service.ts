import { supabase } from '../../../services/supabase';

import type {
  ReportComplianceLevel,
  ReportContext,
  ReportFormValues,
  ReportItem,
  ReportRecord,
  ReportResultSnapshot,
  ReportRiskLevel,
  ReportRow,
} from './reports.types';

/* =========================================================
   TIPOS INTERNOS DE BASE DE DATOS
========================================================= */

interface CompanyDatabaseRow {
  id: string;
  legal_name: string;
}

interface OperationDatabaseRow {
  id: string;
  company_id: string;
  name: string;
}

interface AssignmentDatabaseRow {
  id: string;
  operation_id: string;
  catalog_id: string;
}

interface CatalogDatabaseRow {
  id: string;
  code: string;
  title: string;
}

interface EvaluationResultDatabaseRow {
  assignment_id: string;
  compliance_status: string;
  risk_level: string;
  score: number | string;
  conclusion: string | null;
}

interface AssignmentReferenceRow {
  assignment_id: string;
}

/* =========================================================
   SELECT PRINCIPAL DE REPORTES
========================================================= */

const REPORT_SELECT = `
  id,
  company_id,
  operation_id,
  title,
  report_type,
  period_start,
  period_end,
  status,
  executive_summary,
  conclusions,
  overall_score,
  compliance_level,
  risk_level,
  total_results,
  compliant_count,
  partial_count,
  non_compliant_count,
  gaps_count,
  observations_count,
  recommendations_count,
  compliance_snapshot,
  risk_snapshot,
  results_snapshot,
  generated_by,
  issued_by,
  issued_at,
  created_at,
  updated_at
`;

/* =========================================================
   UTILIDADES
========================================================= */

function parseNumber(
  value: number | string | null | undefined,
): number {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function parseObject(
  value: unknown,
): Record<string, unknown> {
  if (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return value as Record<string, unknown>;
  }

  return {};
}

function parseResultSnapshots(
  value: unknown,
): ReportResultSnapshot[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(
    (item): item is ReportResultSnapshot =>
      Boolean(
        item &&
        typeof item === 'object',
      ),
  );
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
    return 'Ya existe un reporte con los mismos datos.';
  }

  if (error.code === '23514') {
    return 'El tipo, estado, periodo o puntaje ingresado no está permitido.';
  }

  if (error.code === '23502') {
    return 'Falta completar un dato obligatorio.';
  }

  if (error.code === 'PGRST116') {
    return 'El reporte solicitado no fue encontrado.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

/* =========================================================
   MAPEO DE REPORTES
========================================================= */

function mapReport(
  row: ReportRow,
): ReportRecord {
  return {
    id: row.id,

    companyId:
      row.company_id,

    operationId:
      row.operation_id ?? undefined,

    title:
      row.title,

    reportType:
      row.report_type,

    periodStart:
      row.period_start ?? undefined,

    periodEnd:
      row.period_end ?? undefined,

    status:
      row.status,

    executiveSummary:
      row.executive_summary ?? undefined,

    conclusions:
      row.conclusions ?? undefined,

    overallScore:
      parseNumber(row.overall_score),

    complianceLevel:
      row.compliance_level,

    riskLevel:
      row.risk_level,

    totalResults:
      row.total_results,

    compliantCount:
      row.compliant_count,

    partialCount:
      row.partial_count,

    nonCompliantCount:
      row.non_compliant_count,

    gapsCount:
      row.gaps_count,

    observationsCount:
      row.observations_count,

    recommendationsCount:
      row.recommendations_count,

    complianceSnapshot:
      parseObject(
        row.compliance_snapshot,
      ),

    riskSnapshot:
      parseObject(
        row.risk_snapshot,
      ),

    resultsSnapshot:
      parseResultSnapshots(
        row.results_snapshot,
      ),

    generatedBy:
      row.generated_by ?? undefined,

    issuedBy:
      row.issued_by ?? undefined,

    issuedAt:
      row.issued_at ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* =========================================================
   CONSULTAS PRINCIPALES
========================================================= */

async function listCompanies():
Promise<CompanyDatabaseRow[]> {
  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      legal_name
    `)
    .order('legal_name', {
      ascending: true,
    });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las empresas',
      ),
    );
  }

  return (
    data ?? []
  ) as CompanyDatabaseRow[];
}

async function listOperations():
Promise<OperationDatabaseRow[]> {
  const { data, error } = await supabase
    .from('mining_operations')
    .select(`
      id,
      company_id,
      name
    `)
    .order('name', {
      ascending: true,
    });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las operaciones',
      ),
    );
  }

  return (
    data ?? []
  ) as OperationDatabaseRow[];
}

async function listAssignments():
Promise<AssignmentDatabaseRow[]> {
  const { data, error } = await supabase
    .from('obligation_assignments')
    .select(`
      id,
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

  return (
    data ?? []
  ) as AssignmentDatabaseRow[];
}

async function listCatalog():
Promise<CatalogDatabaseRow[]> {
  const { data, error } = await supabase
    .from('obligation_catalog')
    .select(`
      id,
      code,
      title
    `)
    .order('code', {
      ascending: true,
    });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cargar el catálogo de obligaciones',
      ),
    );
  }

  return (
    data ?? []
  ) as CatalogDatabaseRow[];
}

async function listEvaluationResults():
Promise<EvaluationResultDatabaseRow[]> {
  const { data, error } = await supabase
    .from('evaluation_results')
    .select(`
      assignment_id,
      compliance_status,
      risk_level,
      score,
      conclusion
    `);

  if (error) {
    console.warn(
      '[Reportes] No se pudieron cargar los resultados:',
      error,
    );

    return [];
  }

  return (
    data ?? []
  ) as EvaluationResultDatabaseRow[];
}

async function listAssignmentReferences(
  tableName:
    | 'gaps'
    | 'observations'
    | 'recommendations',
): Promise<AssignmentReferenceRow[]> {
  const { data, error } = await supabase
    .from(tableName)
    .select('assignment_id');

  if (error) {
    console.warn(
      `[Reportes] No se pudo cargar ${tableName}:`,
      error,
    );

    return [];
  }

  return (
    data ?? []
  ) as AssignmentReferenceRow[];
}

async function listReportRecords():
Promise<ReportRecord[]> {
  const { data, error } = await supabase
    .from('compliance_reports')
    .select(REPORT_SELECT)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar los reportes',
      ),
    );
  }

  return (
    (data ?? []) as ReportRow[]
  ).map(mapReport);
}

/* =========================================================
   CÁLCULOS DEL REPORTE
========================================================= */

function determineComplianceLevel(
  totalResults: number,
  compliantCount: number,
  partialCount: number,
  nonCompliantCount: number,
): ReportComplianceLevel {
  if (totalResults === 0) {
    return 'Pendiente';
  }

  if (
    nonCompliantCount >
    compliantCount
  ) {
    return 'No cumple';
  }

  if (partialCount > 0) {
    return 'Cumple parcialmente';
  }

  return 'Cumple';
}

function determineRiskLevel(
  averageScore: number,
  totalResults: number,
): ReportRiskLevel {
  if (totalResults === 0) {
    return 'No determinado';
  }

  if (averageScore < 40) {
    return 'Crítico';
  }

  if (averageScore < 60) {
    return 'Alto';
  }

  if (averageScore < 80) {
    return 'Medio';
  }

  return 'Bajo';
}

/* =========================================================
   CARGA INTEGRAL DEL MÓDULO
========================================================= */

export async function listReportsData():
Promise<{
  contexts: ReportContext[];
  reports: ReportItem[];
}> {
  console.log(
    '[Reportes] Ejecutando reports.service.ts',
  );

  const [
    companies,
    operations,
    assignments,
    catalog,
    reportRecords,
  ] = await Promise.all([
    listCompanies(),
    listOperations(),
    listAssignments(),
    listCatalog(),
    listReportRecords(),
  ]);

  const [
    evaluationResults,
    gaps,
    observations,
    recommendations,
  ] = await Promise.all([
    listEvaluationResults(),

    listAssignmentReferences(
      'gaps',
    ),

    listAssignmentReferences(
      'observations',
    ),

    listAssignmentReferences(
      'recommendations',
    ),
  ]);

  const companiesById =
    new Map(
      companies.map((company) => [
        company.id,
        company,
      ]),
    );

  const catalogById =
    new Map(
      catalog.map((item) => [
        item.id,
        item,
      ]),
    );

  const assignmentsById =
    new Map(
      assignments.map((assignment) => [
        assignment.id,
        assignment,
      ]),
    );

  const assignmentsByOperation =
    new Map<
      string,
      AssignmentDatabaseRow[]
    >();

  assignments.forEach((assignment) => {
    const current =
      assignmentsByOperation.get(
        assignment.operation_id,
      ) ?? [];

    current.push(assignment);

    assignmentsByOperation.set(
      assignment.operation_id,
      current,
    );
  });

  const resultsByAssignment =
    new Map<
      string,
      EvaluationResultDatabaseRow
    >();

  evaluationResults.forEach((result) => {
    resultsByAssignment.set(
      result.assignment_id,
      result,
    );
  });

  function countReferencesByOperation(
    rows: AssignmentReferenceRow[],
    operationId: string,
  ): number {
    return rows.filter((row) => {
      const assignment =
        assignmentsById.get(
          row.assignment_id,
        );

      return (
        assignment?.operation_id ===
        operationId
      );
    }).length;
  }

  const contexts:
  ReportContext[] = operations.map(
    (operation) => {
      const company =
        companiesById.get(
          operation.company_id,
        );

      const operationAssignments =
        assignmentsByOperation.get(
          operation.id,
        ) ?? [];

      const operationResults =
        operationAssignments
          .map((assignment) => {
            const result =
              resultsByAssignment.get(
                assignment.id,
              );

            const obligation =
              catalogById.get(
                assignment.catalog_id,
              );

            if (!result || !obligation) {
              return null;
            }

            return {
              result,
              obligation,
            };
          })
          .filter(
            (
              item,
            ): item is {
              result:
                EvaluationResultDatabaseRow;

              obligation:
                CatalogDatabaseRow;
            } => Boolean(item),
          );

      const totalResults =
        operationResults.length;

      const compliantCount =
        operationResults.filter(
          ({ result }) =>
            result.compliance_status ===
            'Cumple',
        ).length;

      const partialCount =
        operationResults.filter(
          ({ result }) =>
            result.compliance_status ===
            'Cumple parcialmente',
        ).length;

      const nonCompliantCount =
        operationResults.filter(
          ({ result }) =>
            result.compliance_status ===
            'No cumple',
        ).length;

      const averageScore =
        totalResults > 0
          ? Math.round(
              operationResults.reduce(
                (total, item) =>
                  total +
                  parseNumber(
                    item.result.score,
                  ),
                0,
              ) / totalResults,
            )
          : 0;

      const gapsCount =
        countReferencesByOperation(
          gaps,
          operation.id,
        );

      const observationsCount =
        countReferencesByOperation(
          observations,
          operation.id,
        );

      const recommendationsCount =
        countReferencesByOperation(
          recommendations,
          operation.id,
        );

      const complianceLevel =
        determineComplianceLevel(
          totalResults,
          compliantCount,
          partialCount,
          nonCompliantCount,
        );

      const riskLevel =
        determineRiskLevel(
          averageScore,
          totalResults,
        );

      const resultsSnapshot:
      ReportResultSnapshot[] =
        operationResults.map(
          ({
            result,
            obligation,
          }) => ({
            obligation_code:
              obligation.code,

            obligation_title:
              obligation.title,

            compliance_status:
              result.compliance_status,

            risk_level:
              result.risk_level,

            score:
              parseNumber(
                result.score,
              ),

            conclusion:
              result.conclusion ??
              undefined,
          }),
        );

      return {
        companyId:
          operation.company_id,

        companyName:
          company?.legal_name ??
          'Empresa sin nombre',

        operationId:
          operation.id,

        operationName:
          operation.name,

        totalResults,
        compliantCount,
        partialCount,
        nonCompliantCount,

        gapsCount,
        observationsCount,
        recommendationsCount,

        averageScore,
        complianceLevel,
        riskLevel,

        resultsSnapshot,
      };
    },
  );

  const operationsById =
    new Map(
      operations.map((operation) => [
        operation.id,
        operation,
      ]),
    );

  const reports:
  ReportItem[] = reportRecords.map(
    (report) => {
      const company =
        companiesById.get(
          report.companyId,
        );

      const operation =
        report.operationId
          ? operationsById.get(
              report.operationId,
            )
          : undefined;

      return {
        ...report,

        companyName:
          company?.legal_name ??
          'Empresa sin nombre',

        operationName:
          operation?.name,
      };
    },
  );

  console.log(
    '[Reportes] Empresas:',
    companies.length,
  );

  console.log(
    '[Reportes] Operaciones:',
    operations.length,
  );

  console.log(
    '[Reportes] Asignaciones:',
    assignments.length,
  );

  console.log(
    '[Reportes] Resultados:',
    evaluationResults.length,
  );

  console.log(
    '[Reportes] Contextos:',
    contexts.length,
  );

  console.log(
    '[Reportes] Registros:',
    reports.length,
  );

  return {
    contexts,
    reports,
  };
}

/* =========================================================
   VALIDACIÓN
========================================================= */

function validateReport(
  values: ReportFormValues,
): void {
  if (!values.companyId) {
    throw new Error(
      'Selecciona una empresa.',
    );
  }

  if (!values.operationId) {
    throw new Error(
      'Selecciona una operación.',
    );
  }

  if (!values.title.trim()) {
    throw new Error(
      'El título del reporte es obligatorio.',
    );
  }

  if (
    values.periodStart &&
    values.periodEnd &&
    values.periodStart >
      values.periodEnd
  ) {
    throw new Error(
      'La fecha inicial no puede ser posterior a la fecha final.',
    );
  }

  if (
    values.status === 'Emitido' &&
    !values.conclusions.trim()
  ) {
    throw new Error(
      'Registra las conclusiones antes de emitir el reporte.',
    );
  }
}

/* =========================================================
   GUARDAR O ACTUALIZAR REPORTE
========================================================= */

export async function saveReport(
  values: ReportFormValues,
  context: ReportContext,
): Promise<ReportRecord> {
  validateReport(values);

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

  const isIssued =
    values.status === 'Emitido';

  const payload = {
    company_id:
      values.companyId,

    operation_id:
      values.operationId,

    title:
      values.title.trim(),

    report_type:
      values.reportType,

    period_start:
      values.periodStart || null,

    period_end:
      values.periodEnd || null,

    status:
      values.status,

    executive_summary:
      values.executiveSummary.trim() ||
      null,

    conclusions:
      values.conclusions.trim() ||
      null,

    overall_score:
      context.averageScore,

    compliance_level:
      context.complianceLevel,

    risk_level:
      context.riskLevel,

    total_results:
      context.totalResults,

    compliant_count:
      context.compliantCount,

    partial_count:
      context.partialCount,

    non_compliant_count:
      context.nonCompliantCount,

    gaps_count:
      context.gapsCount,

    observations_count:
      context.observationsCount,

    recommendations_count:
      context.recommendationsCount,

    compliance_snapshot: {
      total:
        context.totalResults,

      cumple:
        context.compliantCount,

      cumple_parcialmente:
        context.partialCount,

      no_cumple:
        context.nonCompliantCount,
    },

    risk_snapshot: {
      nivel:
        context.riskLevel,

      puntaje_promedio:
        context.averageScore,

      brechas:
        context.gapsCount,
    },

    results_snapshot:
      context.resultsSnapshot,

    issued_by:
      isIssued
        ? userData.user.id
        : null,

    issued_at:
      isIssued
        ? new Date().toISOString()
        : null,
  };

  if (values.id) {
    const { data, error } = await supabase
      .from('compliance_reports')
      .update(payload)
      .eq('id', values.id)
      .select(REPORT_SELECT)
      .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          'No se pudo actualizar el reporte',
        ),
      );
    }

    return mapReport(
      data as ReportRow,
    );
  }

  const { data, error } = await supabase
    .from('compliance_reports')
    .insert({
      ...payload,

      generated_by:
        userData.user.id,
    })
    .select(REPORT_SELECT)
    .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo generar el reporte',
      ),
    );
  }

  return mapReport(
    data as ReportRow,
  );
}

/* =========================================================
   ELIMINAR REPORTE
========================================================= */

export async function removeReport(
  reportId: string,
): Promise<void> {
  if (!reportId) {
    throw new Error(
      'No se proporcionó el identificador del reporte.',
    );
  }

  const { error } = await supabase
    .from('compliance_reports')
    .delete()
    .eq('id', reportId);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo eliminar el reporte',
      ),
    );
  }
}