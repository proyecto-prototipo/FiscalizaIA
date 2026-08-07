import {
  supabase,
} from '../../../services/supabase';

import type {
  ReviewEvaluationInfo,
  ReviewEvidenceInfo,
  ReviewOperationOption,
  ReviewStatusData,
  ReviewStatusSummary,
  ReviewTrackingItem,
} from './review.types';


/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface ProfileRow {
  company_id: string | null;
}


interface OperationRow {
  id: string;

  company_id: string;

  name: string;
}


interface AssignmentRow {
  id: string;

  operation_id: string;

  catalog_id: string;

  status: string;

  due_date: string | null;

  created_at: string;
}


interface CatalogRow {
  id: string;

  code: string;

  title: string;

  criticality: string;
}


interface EvidenceRow {
  id: string;

  assignment_id: string;

  operation_id: string;

  file_name: string;

  status: string;

  ai_status: string;

  ai_confidence:
    number | string | null;

  review_comment:
    string | null;

  uploaded_at: string;

  reviewed_at:
    string | null;
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
    Number(
      value ?? 0,
    );

  return Number.isFinite(
    parsed,
  )
    ? parsed
    : 0;
}


/* =========================================================
   EMPRESA ACTUAL
========================================================= */

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
      'No existe una sesión activa.',
    );
  }


  const {
    data,
    error,
  } = await supabase
    .from('profiles')
    .select(`
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


  if (
    !profile.company_id
  ) {
    throw new Error(
      'El usuario todavía no tiene una empresa asociada.',
    );
  }


  return profile.company_id;
}


/* =========================================================
   ESTADO ACTUAL
========================================================= */

function buildCurrentStage(
  evidence?: ReviewEvidenceInfo,

  evaluation?: ReviewEvaluationInfo,
):
ReviewTrackingItem['currentStage'] {
  if (
    evaluation?.validated
  ) {
    return 'Finalizado';
  }


  if (!evidence) {
    return 'Sin evidencia';
  }


  const evidenceStatus =
    normalize(
      evidence.status,
    );


  if (
    evidence.reviewedAt ||
    [
      'en revisión',
      'en revision',
      'aprobada',
      'observada',
      'rechazada',
    ].includes(
      evidenceStatus,
    )
  ) {
    return 'Revisión fiscalizadora';
  }


  if (
    normalize(
      evidence.aiStatus,
    ) === 'completado'
  ) {
    return 'Análisis IA';
  }


  return 'Evidencia presentada';
}


/* =========================================================
   PROGRESO
========================================================= */

function calculateProgress(
  evidencePresented: boolean,

  aiCompleted: boolean,

  fiscalizerReviewed: boolean,

  evaluationValidated: boolean,
): number {
  let progress = 0;


  if (
    evidencePresented
  ) {
    progress += 25;
  }


  if (
    aiCompleted
  ) {
    progress += 25;
  }


  if (
    fiscalizerReviewed
  ) {
    progress += 25;
  }


  if (
    evaluationValidated
  ) {
    progress += 25;
  }


  return progress;
}


/* =========================================================
   CARGAR ESTADO
========================================================= */

export async function getReviewStatus():
Promise<ReviewStatusData> {
  const companyId =
    await getCurrentCompanyId();


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
    )
    .order(
      'name',
      {
        ascending: true,
      },
    );


  if (
    operationError
  ) {
    throw new Error(
      `No se pudieron cargar las operaciones: ${operationError.message}`,
    );
  }


  const operations =
    (
      operationData ?? []
    ) as OperationRow[];


  const operationOptions:
  ReviewOperationOption[] =
    operations.map(
      (
        operation,
      ) => ({
        id:
          operation.id,

        name:
          operation.name,
      }),
    );


  const operationIds =
    operations.map(
      (
        operation,
      ) =>
        operation.id,
    );


  if (
    operationIds.length === 0
  ) {
    return {
      items: [],

      operations: [],

      summary: {
        total: 0,

        withoutEvidence: 0,

        pending: 0,

        reviewing: 0,

        aiCompleted: 0,

        finalized: 0,
      },

      lastUpdated:
        new Date()
          .toISOString(),
    };
  }


  /* =======================================================
     ASIGNACIONES
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
      catalog_id,
      status,
      due_date,
      created_at
    `)
    .in(
      'operation_id',
      operationIds,
    )
    .order(
      'created_at',
      {
        ascending: false,
      },
    );


  if (
    assignmentError
  ) {
    throw new Error(
      `No se pudieron cargar las obligaciones: ${assignmentError.message}`,
    );
  }


  const assignments =
    (
      assignmentData ?? []
    ) as AssignmentRow[];


  if (
    assignments.length === 0
  ) {
    return {
      items: [],

      operations:
        operationOptions,

      summary: {
        total: 0,

        withoutEvidence: 0,

        pending: 0,

        reviewing: 0,

        aiCompleted: 0,

        finalized: 0,
      },

      lastUpdated:
        new Date()
          .toISOString(),
    };
  }


  const assignmentIds =
    assignments.map(
      (
        assignment,
      ) =>
        assignment.id,
    );


  const catalogIds =
    Array.from(
      new Set(
        assignments.map(
          (
            assignment,
          ) =>
            assignment.catalog_id,
        ),
      ),
    );


  /* =======================================================
     CONSULTAS
  ======================================================= */

  const [
    catalogResponse,
    evidenceResponse,
    evaluationResponse,
  ] =
    await Promise.all([
      supabase
        .from(
          'obligation_catalog',
        )
        .select(`
          id,
          code,
          title,
          criticality
        `)
        .in(
          'id',
          catalogIds,
        ),

      supabase
        .from(
          'evidence_documents',
        )
        .select(`
          id,
          assignment_id,
          operation_id,
          file_name,
          status,
          ai_status,
          ai_confidence,
          review_comment,
          uploaded_at,
          reviewed_at
        `)
        .in(
          'assignment_id',
          assignmentIds,
        )
        .order(
          'uploaded_at',
          {
            ascending: false,
          },
        ),

      supabase
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
        .order(
          'created_at',
          {
            ascending: false,
          },
        ),
    ]);


  if (
    catalogResponse.error
  ) {
    throw new Error(
      `No se pudo cargar el catálogo: ${catalogResponse.error.message}`,
    );
  }


  if (
    evidenceResponse.error
  ) {
    throw new Error(
      `No se pudieron cargar las evidencias: ${evidenceResponse.error.message}`,
    );
  }


  if (
    evaluationResponse.error
  ) {
    throw new Error(
      `No se pudieron cargar las evaluaciones: ${evaluationResponse.error.message}`,
    );
  }


  const catalogs =
    (
      catalogResponse.data ?? []
    ) as CatalogRow[];


  const evidences =
    (
      evidenceResponse.data ?? []
    ) as EvidenceRow[];


  const evaluations =
    (
      evaluationResponse.data ?? []
    ) as EvaluationRow[];


  /* =======================================================
     MAPS
  ======================================================= */

  const operationMap =
    new Map(
      operations.map(
        (
          operation,
        ) => [
          operation.id,
          operation,
        ],
      ),
    );


  const catalogMap =
    new Map(
      catalogs.map(
        (
          catalog,
        ) => [
          catalog.id,
          catalog,
        ],
      ),
    );


  /*
   * Como las evidencias vienen
   * ordenadas por fecha DESC,
   * guardamos solamente la más reciente.
   */

  const latestEvidenceMap =
    new Map<
      string,
      EvidenceRow
    >();


  evidences.forEach(
    (
      evidence,
    ) => {
      if (
        !latestEvidenceMap.has(
          evidence.assignment_id,
        )
      ) {
        latestEvidenceMap.set(
          evidence.assignment_id,
          evidence,
        );
      }
    },
  );


  /*
   * Lo mismo para evaluación.
   */

  const latestEvaluationMap =
    new Map<
      string,
      EvaluationRow
    >();


  evaluations.forEach(
    (
      evaluation,
    ) => {
      if (
        !latestEvaluationMap.has(
          evaluation.assignment_id,
        )
      ) {
        latestEvaluationMap.set(
          evaluation.assignment_id,
          evaluation,
        );
      }
    },
  );


  /* =======================================================
     CONSTRUIR SEGUIMIENTO
  ======================================================= */

  const items =
    assignments
      .map(
        (
          assignment,
        ): ReviewTrackingItem | null => {
          const operation =
            operationMap.get(
              assignment.operation_id,
            );


          const catalog =
            catalogMap.get(
              assignment.catalog_id,
            );


          if (
            !operation ||
            !catalog
          ) {
            return null;
          }


          const evidenceRow =
            latestEvidenceMap.get(
              assignment.id,
            );


          const evaluationRow =
            latestEvaluationMap.get(
              assignment.id,
            );


          const evidence:
          ReviewEvidenceInfo | undefined =
            evidenceRow
              ? {
                  id:
                    evidenceRow.id,

                  fileName:
                    evidenceRow.file_name,

                  status:
                    evidenceRow.status,

                  aiStatus:
                    evidenceRow.ai_status,

                  aiConfidence:
                    evidenceRow.ai_confidence !==
                    null
                      ? numberValue(
                          evidenceRow.ai_confidence,
                        )
                      : undefined,

                  reviewComment:
                    evidenceRow.review_comment ??
                    undefined,

                  uploadedAt:
                    evidenceRow.uploaded_at,

                  reviewedAt:
                    evidenceRow.reviewed_at ??
                    undefined,
                }
              : undefined;


          const evaluation:
          ReviewEvaluationInfo | undefined =
            evaluationRow
              ? {
                  id:
                    evaluationRow.id,

                  complianceStatus:
                    evaluationRow.compliance_status,

                  riskLevel:
                    evaluationRow.risk_level,

                  score:
                    numberValue(
                      evaluationRow.score,
                    ),

                  validated:
                    Boolean(
                      evaluationRow.validated,
                    ),

                  createdAt:
                    evaluationRow.created_at,
                }
              : undefined;


          const evidencePresented =
            Boolean(
              evidence,
            );


          const aiCompleted =
            normalize(
              evidence?.aiStatus,
            ) ===
            'completado';


          const evidenceStatus =
            normalize(
              evidence?.status,
            );


          const fiscalizerReviewed =
            Boolean(
              evidence?.reviewedAt,
            ) ||
            [
              'en revisión',
              'en revision',
              'aprobada',
              'observada',
              'rechazada',
            ].includes(
              evidenceStatus,
            );


          const evaluationValidated =
            Boolean(
              evaluation?.validated,
            );


          const progress =
            calculateProgress(
              evidencePresented,

              aiCompleted,

              fiscalizerReviewed,

              evaluationValidated,
            );


          const dates =
            [
              assignment.created_at,

              evidence?.uploadedAt,

              evidence?.reviewedAt,

              evaluation?.createdAt,
            ]
              .filter(
                (
                  value,
                ): value is string =>
                  Boolean(value),
              )
              .map(
                (
                  value,
                ) =>
                  new Date(
                    value,
                  ),
              )
              .filter(
                (
                  date,
                ) =>
                  !Number.isNaN(
                    date.getTime(),
                  ),
              );


          const lastDate =
            dates.length > 0
              ? new Date(
                  Math.max(
                    ...dates.map(
                      (
                        date,
                      ) =>
                        date.getTime(),
                    ),
                  ),
                )
              : new Date();


          return {
            assignmentId:
              assignment.id,

            operationId:
              operation.id,

            operationName:
              operation.name,

            catalogId:
              catalog.id,

            obligationCode:
              catalog.code,

            obligationTitle:
              catalog.title,

            criticality:
              catalog.criticality,

            assignmentStatus:
              assignment.status,

            dueDate:
              assignment.due_date ??
              undefined,

            evidence,

            evaluation,

            evidencePresented,

            aiCompleted,

            fiscalizerReviewed,

            evaluationValidated,

            progress,

            currentStage:
              buildCurrentStage(
                evidence,
                evaluation,
              ),

            lastUpdated:
              lastDate.toISOString(),
          };
        },
      )
      .filter(
        (
          item,
        ): item is ReviewTrackingItem =>
          item !== null,
      );


  /* =======================================================
     RESUMEN
  ======================================================= */

  const summary:
  ReviewStatusSummary = {
    total:
      items.length,

    withoutEvidence:
      items.filter(
        (
          item,
        ) =>
          !item.evidencePresented,
      ).length,

    pending:
      items.filter(
        (
          item,
        ) =>
          item.currentStage ===
            'Evidencia presentada' ||
          item.currentStage ===
            'Análisis IA',
      ).length,

    reviewing:
      items.filter(
        (
          item,
        ) =>
          item.currentStage ===
          'Revisión fiscalizadora',
      ).length,

    aiCompleted:
      items.filter(
        (
          item,
        ) =>
          item.aiCompleted,
      ).length,

    finalized:
      items.filter(
        (
          item,
        ) =>
          item.evaluationValidated,
      ).length,
  };


  return {
    items,

    operations:
      operationOptions,

    summary,

    lastUpdated:
      new Date()
        .toISOString(),
  };
}