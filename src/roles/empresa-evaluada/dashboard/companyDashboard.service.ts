import {
  supabase,
} from '../../../services/supabase';

import type {
  CompanyComplianceData,
  CompanyDashboardActivity,
  CompanyDashboardData,
  CompanyDashboardSummary,
  CompanyEvidenceData,
  CompanyObligationData,
  CompanyRiskData,
} from './companyDashboard.types';


/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface ProfileRow {
  id: string;
  company_id: string | null;
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

interface AssignmentRow {
  id: string;

  operation_id: string;

  status: string | null;
  due_date: string | null;

  created_at: string;
}

interface EvidenceRow {
  id: string;

  operation_id: string;
  assignment_id: string;

  file_name: string | null;
  status: string | null;

  uploaded_at: string;
}

interface EvaluationRow {
  id: string;

  assignment_id: string;

  compliance_status: string;
  risk_level: string;

  score:
    number | string;

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

  title: string | null;
  description: string | null;

  created_at: string;
}

interface ResultRow {
  id: string;

  assignment_id: string;

  compliance_status: string;
  risk_level: string;

  score:
    number | string;

  created_at: string;
}


/* =========================================================
   UTILIDADES
========================================================= */

function normalize(
  value:
    string |
    null |
    undefined,
): string {
  return String(
    value ?? '',
  )
    .trim()
    .toLocaleLowerCase(
      'es',
    );
}

function numberValue(
  value:
    number |
    string |
    null |
    undefined,
): number {
  const parsed =
    Number(value ?? 0);

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


async function getCurrentCompanyId():
Promise<string> {
  const {
    data: authData,
    error: authError,
  } =
    await supabase.auth.getUser();

  if (
    authError ||
    !authData.user
  ) {
    throw new Error(
      'No existe un usuario autenticado.',
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .select(`
      id,
      company_id
    `)
    .eq(
      'id',
      authData.user.id,
    )
    .single();

  if (error) {
    throw new Error(
      `No se pudo identificar la empresa: ${error.message}`,
    );
  }

  const profile =
    data as ProfileRow;

  if (!profile.company_id) {
    throw new Error(
      'Este usuario todavía no tiene una empresa asignada.',
    );
  }

  return profile.company_id;
}


/* =========================================================
   CARGAR DASHBOARD
========================================================= */

export async function getCompanyDashboard():
Promise<CompanyDashboardData> {
  const companyId =
    await getCurrentCompanyId();


  /* =======================================================
     EMPRESA
  ======================================================= */

  const {
    data: companyData,
    error: companyError,
  } = await supabase
    .from('companies')
    .select(`
      id,
      legal_name
    `)
    .eq(
      'id',
      companyId,
    )
    .single();

  if (companyError) {
    throw new Error(
      `No se pudo cargar la empresa: ${companyError.message}`,
    );
  }

  const company =
    companyData as CompanyRow;


  /* =======================================================
     OPERACIONES
  ======================================================= */

  const {
    data: operationData,
    error: operationError,
  } = await supabase
    .from(
      'mining_operations',
    )
    .select(`
      id,
      company_id,
      name
    `)
    .eq(
      'company_id',
      companyId,
    );

  if (operationError) {
    throw new Error(
      `No se pudieron cargar las operaciones: ${operationError.message}`,
    );
  }

  const operations =
    (operationData ??
      []) as OperationRow[];

  const operationIds =
    operations.map(
      (operation) =>
        operation.id,
    );


  if (
    operationIds.length === 0
  ) {
    return {
      companyId,

      companyName:
        company.legal_name,

      summary: {
        operations: 0,

        obligations: 0,
        pendingObligations: 0,
        completedObligations: 0,

        evidences: 0,
        pendingEvidences: 0,
        approvedEvidences: 0,

        observations: 0,
        gaps: 0,
        recommendations: 0,

        results: 0,

        averageScore: 0,
        complianceRate: 0,
      },

      compliance: {
        compliant: 0,
        partial: 0,
        nonCompliant: 0,
        pending: 0,
      },

      risks: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0,
      },

      evidences: {
        pending: 0,
        reviewing: 0,
        approved: 0,
        observed: 0,
        rejected: 0,
      },

      obligations: {
        pending: 0,
        inProgress: 0,
        completed: 0,
        expired: 0,
      },

      recentActivity: [],

      lastUpdated:
        new Date()
          .toISOString(),
    };
  }


  /* =======================================================
     OBLIGACIONES
  ======================================================= */

  const {
    data: assignmentData,
    error: assignmentError,
  } = await supabase
    .from(
      'obligation_assignments',
    )
    .select(`
      id,
      operation_id,
      status,
      due_date,
      created_at
    `)
    .in(
      'operation_id',
      operationIds,
    );

  if (assignmentError) {
    throw new Error(
      `No se pudieron cargar las obligaciones: ${assignmentError.message}`,
    );
  }

  const assignments =
    (assignmentData ??
      []) as AssignmentRow[];

  const assignmentIds =
    assignments.map(
      (assignment) =>
        assignment.id,
    );


  /* =======================================================
     DATOS RELACIONADOS
  ======================================================= */

  const [
    evidenceResponse,
    evaluationResponse,
    gapsResponse,
    observationsResponse,
    recommendationsResponse,
    resultsResponse,
  ] = await Promise.all([
    supabase
      .from(
        'evidence_documents',
      )
      .select(`
        id,
        operation_id,
        assignment_id,
        file_name,
        status,
        uploaded_at
      `)
      .in(
        'operation_id',
        operationIds,
      ),

    assignmentIds.length > 0
      ? supabase
          .from(
            'evaluations',
          )
          .select(`
            id,
            assignment_id,
            compliance_status,
            risk_level,
            score,
            validated,
            created_at
          `)
          .in(
            'assignment_id',
            assignmentIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    assignmentIds.length > 0
      ? supabase
          .from('gaps')
          .select(`
            id,
            assignment_id,
            title,
            risk_level,
            status,
            created_at
          `)
          .in(
            'assignment_id',
            assignmentIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    assignmentIds.length > 0
      ? supabase
          .from(
            'observations',
          )
          .select(`
            id,
            assignment_id,
            title,
            text,
            created_at
          `)
          .in(
            'assignment_id',
            assignmentIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    assignmentIds.length > 0
      ? supabase
          .from(
            'recommendations',
          )
          .select(`
            id,
            assignment_id,
            title,
            description,
            created_at
          `)
          .in(
            'assignment_id',
            assignmentIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),

    assignmentIds.length > 0
      ? supabase
          .from(
            'evaluation_results',
          )
          .select(`
            id,
            assignment_id,
            compliance_status,
            risk_level,
            score,
            created_at
          `)
          .in(
            'assignment_id',
            assignmentIds,
          )
      : Promise.resolve({
          data: [],
          error: null,
        }),
  ]);


  if (
    evidenceResponse.error
  ) {
    console.error(
      '[Empresa Dashboard] Evidencias:',
      evidenceResponse.error,
    );
  }

  if (
    evaluationResponse.error
  ) {
    console.error(
      '[Empresa Dashboard] Evaluaciones:',
      evaluationResponse.error,
    );
  }

  if (gapsResponse.error) {
    console.error(
      '[Empresa Dashboard] Brechas:',
      gapsResponse.error,
    );
  }

  if (
    observationsResponse.error
  ) {
    console.error(
      '[Empresa Dashboard] Observaciones:',
      observationsResponse.error,
    );
  }

  if (
    recommendationsResponse.error
  ) {
    console.error(
      '[Empresa Dashboard] Recomendaciones:',
      recommendationsResponse.error,
    );
  }

  if (
    resultsResponse.error
  ) {
    console.error(
      '[Empresa Dashboard] Resultados:',
      resultsResponse.error,
    );
  }


  const evidences =
    (evidenceResponse.data ??
      []) as EvidenceRow[];

  const evaluations =
    (evaluationResponse.data ??
      []) as EvaluationRow[];

  const gaps =
    (gapsResponse.data ??
      []) as GapRow[];

  const observations =
    (observationsResponse.data ??
      []) as ObservationRow[];

  const recommendations =
    (recommendationsResponse.data ??
      []) as RecommendationRow[];

  const results =
    (resultsResponse.data ??
      []) as ResultRow[];


  /* =======================================================
     OBLIGACIONES
  ======================================================= */

  const now =
    new Date();

  const obligationData:
  CompanyObligationData = {
    pending:
      assignments.filter(
        (assignment) =>
          normalize(
            assignment.status,
          ) === 'pendiente',
      ).length,

    inProgress:
      assignments.filter(
        (assignment) => {
          const status =
            normalize(
              assignment.status,
            );

          return (
            status ===
              'en proceso' ||
            status ===
              'en revisión' ||
            status ===
              'en revision'
          );
        },
      ).length,

    completed:
      assignments.filter(
        (assignment) => {
          const status =
            normalize(
              assignment.status,
            );

          return (
            status ===
              'cumplida' ||
            status ===
              'completada'
          );
        },
      ).length,

    expired:
      assignments.filter(
        (assignment) => {
          if (
            !assignment.due_date
          ) {
            return false;
          }

          const dueDate =
            new Date(
              `${assignment.due_date}T23:59:59`,
            );

          const completed =
            [
              'cumplida',
              'completada',
            ].includes(
              normalize(
                assignment.status,
              ),
            );

          return (
            dueDate < now &&
            !completed
          );
        },
      ).length,
  };


  /* =======================================================
     EVIDENCIAS
  ======================================================= */

  const evidenceData:
  CompanyEvidenceData = {
    pending:
      evidences.filter(
        (evidence) =>
          normalize(
            evidence.status,
          ) === 'pendiente',
      ).length,

    reviewing:
      evidences.filter(
        (evidence) => {
          const status =
            normalize(
              evidence.status,
            );

          return (
            status ===
              'en revisión' ||
            status ===
              'en revision'
          );
        },
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
     CUMPLIMIENTO
  ======================================================= */

  const compliance:
  CompanyComplianceData = {
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
  CompanyRiskData = {
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
      gaps.filter(
        (gap) => {
          const value =
            normalize(
              gap.risk_level,
            );

          return (
            value === 'crítico' ||
            value === 'critico'
          );
        },
      ).length,
  };


  /* =======================================================
     SCORE
  ======================================================= */

  const scores =
    results.map(
      (result) =>
        numberValue(
          result.score,
        ),
    );

  const averageScore =
    scores.length > 0
      ? Math.round(
          scores.reduce(
            (
              total,
              score,
            ) =>
              total + score,
            0,
          ) /
            scores.length,
        )
      : 0;

  const complianceRate =
    results.length > 0
      ? Math.round(
          (
            compliance.compliant /
            results.length
          ) *
            100,
        )
      : 0;


  /* =======================================================
     ACTIVIDAD RECIENTE
  ======================================================= */

  const recentActivity:
  CompanyDashboardActivity[] = [];


  evidences.forEach(
    (evidence) => {
      recentActivity.push({
        id:
          `evidence-${evidence.id}`,

        type:
          'Evidencia',

        title:
          'Evidencia registrada',

        description:
          evidence.file_name ??
          'Documento presentado',

        createdAt:
          evidence.uploaded_at,

        route:
          '/empresa-evaluada/evidencias',

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
            ? 'Evaluación actualizada'
            : 'Evaluación en proceso',

        description:
          `${
            evaluation.compliance_status
          } · ${numberValue(
            evaluation.score,
          )}/100`,

        createdAt:
          evaluation.created_at,

        route:
          '/empresa-evaluada/revision',

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
        [
          'crítico',
          'critico',
        ].includes(
          normalize(
            gap.risk_level,
          ),
        );

      recentActivity.push({
        id:
          `gap-${gap.id}`,

        type:
          'Brecha',

        title:
          gap.title,

        description:
          `Riesgo ${gap.risk_level}`,

        createdAt:
          gap.created_at,

        route:
          '/empresa-evaluada/brechas-riesgos',

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

        createdAt:
          observation.created_at,

        route:
          '/empresa-evaluada/observaciones',

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

        createdAt:
          recommendation.created_at,

        route:
          '/empresa-evaluada/recomendaciones',

        severity:
          'normal',
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


  /* =======================================================
     RESUMEN
  ======================================================= */

  const summary:
  CompanyDashboardSummary = {
    operations:
      operations.length,

    obligations:
      assignments.length,

    pendingObligations:
      obligationData.pending,

    completedObligations:
      obligationData.completed,

    evidences:
      evidences.length,

    pendingEvidences:
      evidenceData.pending,

    approvedEvidences:
      evidenceData.approved,

    observations:
      observations.length,

    gaps:
      gaps.length,

    recommendations:
      recommendations.length,

    results:
      results.length,

    averageScore,

    complianceRate,
  };


  return {
    companyId,

    companyName:
      company.legal_name,

    summary,

    compliance,

    risks,

    evidences:
      evidenceData,

    obligations:
      obligationData,

    recentActivity:
      recentActivity.slice(
        0,
        8,
      ),

    lastUpdated:
      new Date()
        .toISOString(),
  };
}