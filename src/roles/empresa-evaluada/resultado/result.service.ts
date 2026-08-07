import {
  supabase,
} from '../../../services/supabase';

import type {
  CompanyEvaluationResult,
  CompanyResultData,
  ResultOperationOption,
  ResultSummary,
} from './result.types';


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
}


interface CatalogRow {
  id: string;

  code: string;

  title: string;
}


/*
 * Usamos Record porque evaluation_results
 * puede contener diferentes campos dependiendo
 * de la evolución de la base de datos.
 */
type EvaluationResultRow =
  Record<string, unknown>;


interface RelatedRow {
  assignment_id: string;
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
    .toLocaleLowerCase('es');
}


/* =========================================================
   STRING
========================================================= */

function stringValue(
  row: EvaluationResultRow,
  keys: string[],
  fallback = '',
): string {
  for (const key of keys) {
    const value =
      row[key];

    if (
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return fallback;
}


/* =========================================================
   STRING OPCIONAL
========================================================= */

function optionalString(
  row: EvaluationResultRow,
  keys: string[],
): string | undefined {
  const value =
    stringValue(
      row,
      keys,
      '',
    );

  return value ||
    undefined;
}


/* =========================================================
   NÚMERO
========================================================= */

function numberValue(
  value: unknown,
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
   BOOLEAN
========================================================= */

function booleanValue(
  row: EvaluationResultRow,
  keys: string[],
): boolean | undefined {
  for (const key of keys) {
    const value =
      row[key];

    if (
      typeof value ===
      'boolean'
    ) {
      return value;
    }
  }

  return undefined;
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
  } =
    await supabase
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
      'Este usuario no tiene una empresa asociada.',
    );
  }


  return profile.company_id;
}


/* =========================================================
   DATA VACÍA
========================================================= */

function emptyData():
CompanyResultData {
  return {
    results: [],

    operations: [],

    summary: {
      total: 0,

      validated: 0,

      compliant: 0,

      partial: 0,

      nonCompliant: 0,

      pending: 0,

      averageScore: 0,

      highRisk: 0,

      gaps: 0,

      observations: 0,

      recommendations: 0,
    },

    overallCompliance:
      'Pendiente',

    overallRisk:
      'No determinado',

    lastUpdated:
      new Date()
        .toISOString(),
  };
}


/* =========================================================
   CONTAR REGISTROS RELACIONADOS
========================================================= */

function countByAssignment(
  rows: RelatedRow[],
  assignmentId: string,
): number {
  return rows.filter(
    (
      row,
    ) =>
      row.assignment_id ===
      assignmentId,
  ).length;
}


/* =========================================================
   SABER SI RESULTADO ESTÁ VALIDADO
========================================================= */

function getValidatedState(
  row: EvaluationResultRow,
): boolean {
  /*
   * 1. Buscar boolean explícito.
   */

  const explicitValidated =
    booleanValue(
      row,
      [
        'validated',
        'is_validated',
      ],
    );


  if (
    typeof explicitValidated ===
    'boolean'
  ) {
    return explicitValidated;
  }


  /*
   * 2. Si existe fecha de validación,
   * se considera validado.
   */

  const validatedAt =
    optionalString(
      row,
      [
        'validated_at',
        'validation_date',
      ],
    );


  if (validatedAt) {
    return true;
  }


  /*
   * 3. Revisar estado.
   */

  const status =
    normalize(
      stringValue(
        row,
        [
          'status',
          'result_status',
        ],
        '',
      ),
    );


  return [
    'validado',
    'validada',
    'finalizado',
    'finalizada',
    'aprobado',
    'aprobada',
  ].includes(status);
}


/* =========================================================
   FECHA DE RESULTADO
========================================================= */

function getCreatedAt(
  row: EvaluationResultRow,
): string {
  return stringValue(
    row,
    [
      'created_at',
      'updated_at',
      'validated_at',
    ],
    new Date()
      .toISOString(),
  );
}


/* =========================================================
   OBTENER RESULTADOS
========================================================= */

export async function getCompanyResults():
Promise<CompanyResultData> {
  const companyId =
    await getCurrentCompanyId();


  /* =======================================================
     1. OPERACIONES
  ======================================================= */

  const {
    data: operationData,
    error: operationError,
  } =
    await supabase
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
  ResultOperationOption[] =
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


  /* =======================================================
     SIN OPERACIONES
  ======================================================= */

  if (
    operationIds.length === 0
  ) {
    return emptyData();
  }


  /* =======================================================
     2. OBLIGACIONES ASIGNADAS
  ======================================================= */

  const {
    data: assignmentData,
    error: assignmentError,
  } =
    await supabase
      .from(
        'obligation_assignments',
      )
      .select(`
        id,
        operation_id,
        catalog_id
      `)
      .in(
        'operation_id',
        operationIds,
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


  const assignmentIds =
    assignments.map(
      (
        assignment,
      ) =>
        assignment.id,
    );


  /* =======================================================
     SIN ASIGNACIONES
  ======================================================= */

  if (
    assignmentIds.length === 0
  ) {
    return {
      ...emptyData(),

      operations:
        operationOptions,
    };
  }


  /* =======================================================
     3. CATÁLOGO
  ======================================================= */

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


  const {
    data: catalogData,
    error: catalogError,
  } =
    await supabase
      .from(
        'obligation_catalog',
      )
      .select(`
        id,
        code,
        title
      `)
      .in(
        'id',
        catalogIds,
      );


  if (
    catalogError
  ) {
    throw new Error(
      `No se pudo cargar el catálogo de obligaciones: ${catalogError.message}`,
    );
  }


  const catalogs =
    (
      catalogData ?? []
    ) as CatalogRow[];


  /* =======================================================
     4. RESULTADOS + DATOS RELACIONADOS
  ======================================================= */

  const [
    resultResponse,
    gapResponse,
    observationResponse,
    recommendationResponse,
  ] =
    await Promise.all([

      /* RESULTADOS */

      supabase
        .from(
          'evaluation_results',
        )
        .select('*')
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


      /* BRECHAS */

      supabase
        .from('gaps')
        .select(`
          assignment_id
        `)
        .in(
          'assignment_id',
          assignmentIds,
        ),


      /* OBSERVACIONES */

      supabase
        .from(
          'observations',
        )
        .select(`
          assignment_id
        `)
        .in(
          'assignment_id',
          assignmentIds,
        ),


      /* RECOMENDACIONES */

      supabase
        .from(
          'recommendations',
        )
        .select(`
          assignment_id
        `)
        .in(
          'assignment_id',
          assignmentIds,
        ),
    ]);


  /* =======================================================
     ERRORES
  ======================================================= */

  if (
    resultResponse.error
  ) {
    throw new Error(
      `No se pudieron cargar los resultados: ${resultResponse.error.message}`,
    );
  }


  if (
    gapResponse.error
  ) {
    throw new Error(
      `No se pudieron cargar las brechas: ${gapResponse.error.message}`,
    );
  }


  if (
    observationResponse.error
  ) {
    throw new Error(
      `No se pudieron cargar las observaciones: ${observationResponse.error.message}`,
    );
  }


  if (
    recommendationResponse.error
  ) {
    throw new Error(
      `No se pudieron cargar las recomendaciones: ${recommendationResponse.error.message}`,
    );
  }


  /* =======================================================
     5. TIPAR RESPUESTAS
  ======================================================= */

  const resultRows =
    (
      resultResponse.data ?? []
    ) as EvaluationResultRow[];


  const gapRows =
    (
      gapResponse.data ?? []
    ) as RelatedRow[];


  const observationRows =
    (
      observationResponse.data ?? []
    ) as RelatedRow[];


  const recommendationRows =
    (
      recommendationResponse.data ?? []
    ) as RelatedRow[];


  /* =======================================================
     DEBUG
  ======================================================= */

  console.log(
    '[Resultado Empresa] evaluation_results:',
    resultRows,
  );


  console.log(
    '[Resultado Empresa] gaps:',
    gapRows.length,
  );


  console.log(
    '[Resultado Empresa] observations:',
    observationRows.length,
  );


  console.log(
    '[Resultado Empresa] recommendations:',
    recommendationRows.length,
  );


  /* =======================================================
     6. MAPAS
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


  const assignmentMap =
    new Map(
      assignments.map(
        (
          assignment,
        ) => [
          assignment.id,
          assignment,
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


  /* =======================================================
     7. ÚLTIMO RESULTADO POR OBLIGACIÓN
  ======================================================= */

  const latestResultMap =
    new Map<
      string,
      EvaluationResultRow
    >();


  resultRows.forEach(
    (
      result,
    ) => {
      const assignmentId =
        stringValue(
          result,
          [
            'assignment_id',
          ],
          '',
        );


      if (
        !assignmentId
      ) {
        return;
      }


      /*
       * Como resultRows viene ordenado
       * por created_at DESC,
       * conservamos el primero.
       */
      if (
        !latestResultMap.has(
          assignmentId,
        )
      ) {
        latestResultMap.set(
          assignmentId,
          result,
        );
      }
    },
  );


  /* =======================================================
     8. CONSTRUIR RESULTADOS
  ======================================================= */

  const results:
  CompanyEvaluationResult[] =
    [];


  latestResultMap.forEach(
    (
      result,
      assignmentId,
    ) => {
      const assignment =
        assignmentMap.get(
          assignmentId,
        );


      if (
        !assignment
      ) {
        return;
      }


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
        return;
      }


      /* ===================================================
         ESTADO DE CUMPLIMIENTO
      =================================================== */

      const complianceStatus =
        stringValue(
          result,
          [
            'compliance_status',
            'compliance_level',
            'result',
          ],
          'Pendiente',
        );


      /* ===================================================
         RIESGO
      =================================================== */

      const riskLevel =
        stringValue(
          result,
          [
            'risk_level',
            'overall_risk',
          ],
          'No determinado',
        );


      /* ===================================================
         VALIDACIÓN
      =================================================== */

      const validated =
        getValidatedState(
          result,
        );


      const validatedAt =
        optionalString(
          result,
          [
            'validated_at',
            'validation_date',
          ],
        );


      /* ===================================================
         COMENTARIOS
      =================================================== */

      const evaluationComment =
        optionalString(
          result,
          [
            'evaluation_comment',
            'comment',
            'comments',
            'conclusion',
          ],
        );


      const correctiveAction =
        optionalString(
          result,
          [
            'corrective_action',
            'corrective_actions',
            'action',
          ],
        );


      /* ===================================================
         INSERTAR RESULTADO
      =================================================== */

      results.push({
        id:
          stringValue(
            result,
            [
              'id',
            ],
          ),

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

        complianceStatus,

        riskLevel,

        score:
          numberValue(
            result.score,
          ),

        validated,

        validatedAt,

        evaluationComment,

        correctiveAction,

        createdAt:
          getCreatedAt(
            result,
          ),

        gapsCount:
          countByAssignment(
            gapRows,
            assignmentId,
          ),

        observationsCount:
          countByAssignment(
            observationRows,
            assignmentId,
          ),

        recommendationsCount:
          countByAssignment(
            recommendationRows,
            assignmentId,
          ),
      });
    },
  );


  /* =======================================================
     9. ORDENAR RESULTADOS
  ======================================================= */

  results.sort(
    (
      first,
      second,
    ) =>
      second.createdAt
        .localeCompare(
          first.createdAt,
        ),
  );


  /* =======================================================
     10. RESULTADOS REALMENTE EVALUADOS
  ======================================================= */

  /*
   * Solo estos estados participan en
   * el promedio de cumplimiento general.
   *
   * Un resultado Pendiente no debe
   * bajar artificialmente el puntaje.
   */
  const evaluatedResults =
    results.filter(
      (
        result,
      ) => {
        const status =
          normalize(
            result.complianceStatus,
          );


        return (
          status ===
            'cumple' ||
          status ===
            'cumple parcialmente' ||
          status ===
            'no cumple'
        );
      },
    );


  /* =======================================================
     11. RESUMEN
  ======================================================= */

  const summary:
  ResultSummary = {
    /* TOTAL */

    total:
      results.length,


    /* VALIDADOS */

    validated:
      results.filter(
        (
          result,
        ) =>
          result.validated,
      ).length,


    /* CUMPLE */

    compliant:
      results.filter(
        (
          result,
        ) =>
          normalize(
            result.complianceStatus,
          ) ===
          'cumple',
      ).length,


    /* PARCIAL */

    partial:
      results.filter(
        (
          result,
        ) =>
          normalize(
            result.complianceStatus,
          ) ===
          'cumple parcialmente',
      ).length,


    /* NO CUMPLE */

    nonCompliant:
      results.filter(
        (
          result,
        ) =>
          normalize(
            result.complianceStatus,
          ) ===
          'no cumple',
      ).length,


    /* PENDIENTES */

    pending:
      results.filter(
        (
          result,
        ) => {
          const status =
            normalize(
              result.complianceStatus,
            );


          return ![
            'cumple',
            'cumple parcialmente',
            'no cumple',
          ].includes(
            status,
          );
        },
      ).length,


    /* =====================================================
       PROMEDIO

       IMPORTANTE:
       solamente resultados evaluados.
    ===================================================== */

    averageScore:
      evaluatedResults.length >
      0
        ? Math.round(
            evaluatedResults.reduce(
              (
                total,
                result,
              ) =>
                total +
                result.score,
              0,
            ) /
              evaluatedResults.length,
          )
        : 0,


    /* RIESGOS ALTOS */

    highRisk:
      results.filter(
        (
          result,
        ) => {
          const risk =
            normalize(
              result.riskLevel,
            );


          return (
            risk ===
              'alto' ||
            risk ===
              'crítico' ||
            risk ===
              'critico'
          );
        },
      ).length,


    /* BRECHAS */

    gaps:
      gapRows.length,


    /* OBSERVACIONES */

    observations:
      observationRows.length,


    /* RECOMENDACIONES */

    recommendations:
      recommendationRows.length,
  };


  /* =======================================================
     12. CUMPLIMIENTO GENERAL
  ======================================================= */

  let overallCompliance =
    'Pendiente';


  /*
   * REGLA DE CUMPLIMIENTO GENERAL
   *
   * 80 - 100:
   * Cumple
   *
   * 50 - 79:
   * Cumple parcialmente
   *
   * 0 - 49:
   * No cumple
   *
   * Los resultados pendientes no
   * participan en el promedio.
   */

  if (
    evaluatedResults.length >
    0
  ) {
    if (
      summary.averageScore >=
      80
    ) {
      overallCompliance =
        'Cumple';
    } else if (
      summary.averageScore >=
      50
    ) {
      overallCompliance =
        'Cumple parcialmente';
    } else {
      overallCompliance =
        'No cumple';
    }
  }


  /* =======================================================
     13. RIESGO GENERAL
  ======================================================= */

  const riskOrder:
  Record<
    string,
    number
  > = {
    'no determinado': 0,

    bajo: 1,

    medio: 2,

    alto: 3,

    crítico: 4,

    critico: 4,
  };


  let overallRisk =
    'No determinado';


  let highestRisk =
    0;


  /*
   * El riesgo general se calcula
   * independientemente del puntaje.
   *
   * Se conserva el riesgo más alto
   * encontrado entre los resultados.
   */
  results.forEach(
    (
      result,
    ) => {
      const normalizedRisk =
        normalize(
          result.riskLevel,
        );


      const value =
        riskOrder[
          normalizedRisk
        ] ?? 0;


      if (
        value >
        highestRisk
      ) {
        highestRisk =
          value;

        overallRisk =
          result.riskLevel;
      }
    },
  );


  /* =======================================================
     14. RETURN
  ======================================================= */

  return {
    results,

    operations:
      operationOptions,

    summary,

    overallCompliance,

    overallRisk,

    lastUpdated:
      new Date()
        .toISOString(),
  };
}