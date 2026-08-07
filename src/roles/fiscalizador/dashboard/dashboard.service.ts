import { supabase } from '../../../services/supabase';

import type {
  DashboardComplianceData,
  DashboardData,
  DashboardEvidenceData,
  DashboardGapStatusData,
  DashboardOperationItem,
  DashboardRecentActivity,
  DashboardRiskData,
  DashboardSummary,
} from './dashboard.types';

/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface CompanyRow {
  id: string;
  legal_name: string;
}

interface OperationRow {
  id: string;
  company_id: string;
  name: string;
  created_at?: string;
}

interface AssignmentRow {
  id: string;
  operation_id: string;
  catalog_id: string;
  status?: string;
  created_at?: string;
}

interface EvidenceRow {
  id: string;
  operation_id: string;
  assignment_id: string;

  file_name: string | null;
  status: string | null;

  ai_status: string | null;

  uploaded_at: string;
}

interface AIAnalysisRow {
  id: string;
  evidence_id: string;

  compliance_status: string;
  risk_level: string;

  confidence: number | string | null;

  reviewed_at: string | null;
}

interface EvaluationRow {
  id: string;
  assignment_id: string;

  compliance_status: string;
  risk_level: string;

  score: number | string;

  validated: boolean;

  created_at: string;
}

interface GapRow {
  id: string;
  assignment_id: string;

  title: string;
  risk_level: string;
  status: string;

  created_at: string;
}

interface ObservationRow {
  id: string;
  assignment_id: string;

  title: string | null;
  text: string;

  created_at: string;
}

interface RecommendationRow {
  id: string;
  assignment_id: string;

  title?: string | null;
  description?: string | null;

  created_at: string;
}

interface ResultRow {
  id: string;
  assignment_id: string;

  compliance_status: string;
  risk_level: string;

  score: number | string;

  created_at: string;
}

interface ReportRow {
  id: string;

  title: string;
  status: string;

  company_id: string;
  operation_id: string | null;

  created_at: string;
}

/* =========================================================
   UTILIDADES
========================================================= */

function numberValue(
  value: number | string | null | undefined,
): number {
  const parsed = Number(value ?? 0);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function normalize(
  value: string | null | undefined,
): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es');
}

function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (error.code === '42501') {
    return 'No tienes permisos para consultar los indicadores.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

async function safeQuery<T>(
  table: string,
  select: string,
): Promise<T[]> {
  const { data, error } = await supabase
    .from(table)
    .select(select);

  if (error) {
    console.warn(
      `[Dashboard] No se pudo cargar ${table}:`,
      error,
    );

    return [];
  }

  return (data ?? []) as T[];
}

/* =========================================================
   CARGAR DASHBOARD
========================================================= */

export async function getFiscalizadorDashboard():
Promise<DashboardData> {
  const [
    companies,
    operations,
    assignments,
    evidences,
    aiAnalyses,
    evaluations,
    gaps,
    observations,
    recommendations,
    results,
    reports,
  ] = await Promise.all([
    safeQuery<CompanyRow>(
      'companies',
      `
        id,
        legal_name
      `,
    ),

    safeQuery<OperationRow>(
      'mining_operations',
      `
        id,
        company_id,
        name,
        created_at
      `,
    ),

    safeQuery<AssignmentRow>(
      'obligation_assignments',
      `
        id,
        operation_id,
        catalog_id,
        status,
        created_at
      `,
    ),

    safeQuery<EvidenceRow>(
      'evidence_documents',
      `
        id,
        operation_id,
        assignment_id,
        file_name,
        status,
        ai_status,
        uploaded_at
      `,
    ),

    safeQuery<AIAnalysisRow>(
      'ai_analyses',
      `
        id,
        evidence_id,
        compliance_status,
        risk_level,
        confidence,
        reviewed_at
      `,
    ),

    safeQuery<EvaluationRow>(
      'evaluations',
      `
        id,
        assignment_id,
        compliance_status,
        risk_level,
        score,
        validated,
        created_at
      `,
    ),

    safeQuery<GapRow>(
      'gaps',
      `
        id,
        assignment_id,
        title,
        risk_level,
        status,
        created_at
      `,
    ),

    safeQuery<ObservationRow>(
      'observations',
      `
        id,
        assignment_id,
        title,
        text,
        created_at
      `,
    ),

    safeQuery<RecommendationRow>(
      'recommendations',
      `
        id,
        assignment_id,
        title,
        description,
        created_at
      `,
    ),

    safeQuery<ResultRow>(
      'evaluation_results',
      `
        id,
        assignment_id,
        compliance_status,
        risk_level,
        score,
        created_at
      `,
    ),

    safeQuery<ReportRow>(
      'compliance_reports',
      `
        id,
        title,
        status,
        company_id,
        operation_id,
        created_at
      `,
    ),
  ]);

  /* =======================================================
     RESUMEN GENERAL
  ======================================================= */

  const validatedEvaluations =
    evaluations.filter(
      (evaluation) =>
        evaluation.validated,
    ).length;

  const criticalGaps =
    gaps.filter(
      (gap) =>
        normalize(gap.risk_level) ===
        'crítico' ||
        normalize(gap.risk_level) ===
        'critico',
    ).length;

  const openGaps =
    gaps.filter(
      (gap) =>
        normalize(gap.status) ===
        'abierta',
    ).length;

  const scores =
    results
      .map((result) =>
        numberValue(result.score),
      )
      .filter((score) =>
        Number.isFinite(score),
      );

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (sum, score) =>
              sum + score,
            0,
          ) / scores.length,
        )
      : 0;

  const compliantResults =
    results.filter(
      (result) =>
        normalize(
          result.compliance_status,
        ) === 'cumple',
    ).length;

  const complianceRate =
    results.length > 0
      ? Math.round(
          (
            compliantResults /
            results.length
          ) * 100,
        )
      : 0;

  const summary:
  DashboardSummary = {
    companies:
      companies.length,

    operations:
      operations.length,

    obligations:
      assignments.length,

    evidences:
      evidences.length,

    pendingEvidences:
      evidences.filter(
        (evidence) =>
          normalize(
            evidence.status,
          ) === 'pendiente',
      ).length,

    aiAnalyses:
      aiAnalyses.length,

    evaluations:
      evaluations.length,

    validatedEvaluations,

    gaps:
      gaps.length,

    criticalGaps,

    openGaps,

    observations:
      observations.length,

    recommendations:
      recommendations.length,

    results:
      results.length,

    reports:
      reports.length,

    averageScore,

    complianceRate,
  };

  /* =======================================================
     CUMPLIMIENTO
  ======================================================= */

  const compliance:
  DashboardComplianceData = {
    compliant:
      results.filter(
        (result) =>
          normalize(
            result.compliance_status,
          ) === 'cumple',
      ).length,

    partial:
      results.filter(
        (result) =>
          normalize(
            result.compliance_status,
          ) ===
          'cumple parcialmente',
      ).length,

    nonCompliant:
      results.filter(
        (result) =>
          normalize(
            result.compliance_status,
          ) === 'no cumple',
      ).length,

    pending:
      results.filter(
        (result) =>
          normalize(
            result.compliance_status,
          ) === 'pendiente',
      ).length,
  };

  /* =======================================================
     RIESGOS
  ======================================================= */

  const risks:
  DashboardRiskData = {
    low:
      gaps.filter(
        (gap) =>
          normalize(
            gap.risk_level,
          ) === 'bajo',
      ).length,

    medium:
      gaps.filter(
        (gap) =>
          normalize(
            gap.risk_level,
          ) === 'medio',
      ).length,

    high:
      gaps.filter(
        (gap) =>
          normalize(
            gap.risk_level,
          ) === 'alto',
      ).length,

    critical:
      criticalGaps,
  };

  /* =======================================================
     EVIDENCIAS
  ======================================================= */

  const evidenceData:
  DashboardEvidenceData = {
    pending:
      evidences.filter(
        (evidence) =>
          normalize(
            evidence.status,
          ) === 'pendiente',
      ).length,

    reviewing:
      evidences.filter(
        (evidence) =>
          normalize(
            evidence.status,
          ) === 'en revisión' ||
          normalize(
            evidence.status,
          ) === 'en revision',
      ).length,

    approved:
      evidences.filter(
        (evidence) =>
          normalize(
            evidence.status,
          ) === 'aprobada',
      ).length,

    observed:
      evidences.filter(
        (evidence) =>
          normalize(
            evidence.status,
          ) === 'observada',
      ).length,

    rejected:
      evidences.filter(
        (evidence) =>
          normalize(
            evidence.status,
          ) === 'rechazada',
      ).length,
  };

  /* =======================================================
     ESTADO DE BRECHAS
  ======================================================= */

  const gapStatus:
  DashboardGapStatusData = {
    open:
      gaps.filter(
        (gap) =>
          normalize(
            gap.status,
          ) === 'abierta',
      ).length,

    treatment:
      gaps.filter(
        (gap) =>
          normalize(
            gap.status,
          ) === 'en tratamiento',
      ).length,

    verifying:
      gaps.filter(
        (gap) =>
          normalize(
            gap.status,
          ) === 'por verificar' ||
          normalize(
            gap.status,
          ) === 'en verificación' ||
          normalize(
            gap.status,
          ) === 'en verificacion',
      ).length,

    closed:
      gaps.filter(
        (gap) =>
          normalize(
            gap.status,
          ) === 'cerrada',
      ).length,
  };

  /* =======================================================
     OPERACIONES
  ======================================================= */

  const companiesById =
    new Map(
      companies.map(
        (company) => [
          company.id,
          company,
        ],
      ),
    );

  const assignmentsByOperation =
    new Map<string, AssignmentRow[]>();

  assignments.forEach(
    (assignment) => {
      const current =
        assignmentsByOperation.get(
          assignment.operation_id,
        ) ?? [];

      current.push(assignment);

      assignmentsByOperation.set(
        assignment.operation_id,
        current,
      );
    },
  );

  const evaluationsByAssignment =
    new Map<string, EvaluationRow[]>();

  evaluations.forEach(
    (evaluation) => {
      const current =
        evaluationsByAssignment.get(
          evaluation.assignment_id,
        ) ?? [];

      current.push(evaluation);

      evaluationsByAssignment.set(
        evaluation.assignment_id,
        current,
      );
    },
  );

  const operationItems:
  DashboardOperationItem[] =
    operations.map(
      (operation) => {
        const operationAssignments =
          assignmentsByOperation.get(
            operation.id,
          ) ?? [];

        const assignmentIds =
          new Set(
            operationAssignments.map(
              (assignment) =>
                assignment.id,
            ),
          );

        const operationEvidences =
          evidences.filter(
            (evidence) =>
              evidence.operation_id ===
              operation.id,
          );

        const operationGaps =
          gaps.filter(
            (gap) =>
              assignmentIds.has(
                gap.assignment_id,
              ),
          );

        const operationEvaluations =
          operationAssignments
            .flatMap(
              (assignment) =>
                evaluationsByAssignment.get(
                  assignment.id,
                ) ?? [],
            );

        const operationScores =
          operationEvaluations.map(
            (evaluation) =>
              numberValue(
                evaluation.score,
              ),
          );

        const operationAverage =
          operationScores.length > 0
            ? Math.round(
                operationScores.reduce(
                  (sum, score) =>
                    sum + score,
                  0,
                ) /
                  operationScores.length,
              )
            : 0;

        let riskLevel:
        DashboardOperationItem['riskLevel'] =
          'No determinado';

        if (
          operationGaps.some(
            (gap) =>
              normalize(
                gap.risk_level,
              ) === 'crítico' ||
              normalize(
                gap.risk_level,
              ) === 'critico',
          )
        ) {
          riskLevel = 'Crítico';
        } else if (
          operationGaps.some(
            (gap) =>
              normalize(
                gap.risk_level,
              ) === 'alto',
          )
        ) {
          riskLevel = 'Alto';
        } else if (
          operationGaps.some(
            (gap) =>
              normalize(
                gap.risk_level,
              ) === 'medio',
          )
        ) {
          riskLevel = 'Medio';
        } else if (
          operationGaps.length > 0
        ) {
          riskLevel = 'Bajo';
        }

        return {
          id:
            operation.id,

          companyName:
            companiesById.get(
              operation.company_id,
            )?.legal_name ??
            'Empresa sin nombre',

          operationName:
            operation.name,

          obligations:
            operationAssignments.length,

          evidences:
            operationEvidences.length,

          gaps:
            operationGaps.length,

          averageScore:
            operationAverage,

          riskLevel,
        };
      },
    );

  /* =======================================================
     ACTIVIDAD RECIENTE
  ======================================================= */

  const recentActivity:
  DashboardRecentActivity[] = [];

  evidences.forEach(
    (evidence) => {
      recentActivity.push({
        id:
          `evidence-${evidence.id}`,

        type:
          'Evidencia',

        title:
          'Nueva evidencia',

        description:
          evidence.file_name ??
          'Documento presentado',

        route:
          '/fiscalizador/evidencias',

        createdAt:
          evidence.uploaded_at,

        severity:
          evidence.status ===
          'Aprobada'
            ? 'success'
            : 'normal',
      });
    },
  );

  evaluations.forEach(
    (evaluation) => {
      recentActivity.push({
        id:
          `evaluation-${evaluation.id}`,

        type:
          'Evaluación',

        title:
          evaluation.validated
            ? 'Evaluación validada'
            : 'Evaluación registrada',

        description:
          `${evaluation.compliance_status} · ${numberValue(
            evaluation.score,
          )}/100`,

        route:
          '/fiscalizador/evaluaciones',

        createdAt:
          evaluation.created_at,

        severity:
          evaluation.validated
            ? 'success'
            : 'normal',
      });
    },
  );

  gaps.forEach(
    (gap) => {
      const critical =
        normalize(
          gap.risk_level,
        ) === 'crítico' ||
        normalize(
          gap.risk_level,
        ) === 'critico';

      recentActivity.push({
        id:
          `gap-${gap.id}`,

        type:
          'Brecha',

        title:
          gap.title,

        description:
          `Riesgo ${gap.risk_level} · ${gap.status}`,

        route:
          '/fiscalizador/brechas-riesgos',

        createdAt:
          gap.created_at,

        severity:
          critical
            ? 'critical'
            : normalize(
                gap.risk_level,
              ) === 'alto'
              ? 'warning'
              : 'normal',
      });
    },
  );

  observations.forEach(
    (observation) => {
      recentActivity.push({
        id:
          `observation-${observation.id}`,

        type:
          'Observación',

        title:
          observation.title ??
          'Nueva observación',

        description:
          observation.text,

        route:
          '/fiscalizador/observaciones',

        createdAt:
          observation.created_at,

        severity:
          'warning',
      });
    },
  );

  recommendations.forEach(
    (recommendation) => {
      recentActivity.push({
        id:
          `recommendation-${recommendation.id}`,

        type:
          'Recomendación',

        title:
          recommendation.title ??
          'Nueva recomendación',

        description:
          recommendation.description ??
          'Se registró una nueva recomendación.',

        route:
          '/fiscalizador/recomendaciones',

        createdAt:
          recommendation.created_at,

        severity:
          'normal',
      });
    },
  );

  reports.forEach(
    (report) => {
      recentActivity.push({
        id:
          `report-${report.id}`,

        type:
          'Reporte',

        title:
          report.title,

        description:
          `Estado: ${report.status}`,

        route:
          '/fiscalizador/reportes',

        createdAt:
          report.created_at,

        severity:
          report.status ===
          'Emitido'
            ? 'success'
            : 'normal',
      });
    },
  );

  recentActivity.sort(
    (a, b) =>
      new Date(
        b.createdAt,
      ).getTime() -
      new Date(
        a.createdAt,
      ).getTime(),
  );

  return {
    summary,

    compliance,

    risks,

    evidences:
      evidenceData,

    gapStatus,

    operations:
      operationItems
        .sort(
          (a, b) =>
            b.gaps - a.gaps,
        )
        .slice(0, 6),

    recentActivity:
      recentActivity.slice(
        0,
        8,
      ),

    lastUpdated:
      new Date().toISOString(),
  };
}