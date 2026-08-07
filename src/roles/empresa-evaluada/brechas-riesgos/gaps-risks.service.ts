import {
  supabase,
} from '../../../services/supabase';

import type {
  CompanyGapRisk,
  GapOperationOption,
  GapRiskSummary,
  GapsRisksData,
} from './gaps-risks.types';


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


type GapRow =
  Record<string, unknown>;


/* =========================================================
   HELPERS
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


function textValue(
  row: GapRow,
  keys: string[],
  fallback = '',
): string {
  for (
    const key of keys
  ) {
    const value =
      row[key];

    if (
      typeof value ===
        'string' &&
      value.trim()
    ) {
      return value.trim();
    }
  }

  return fallback;
}


function optionalText(
  row: GapRow,
  keys: string[],
): string | undefined {
  const result =
    textValue(
      row,
      keys,
      '',
    );

  return result ||
    undefined;
}


/* =========================================================
   VENCIMIENTO
========================================================= */

function isExpired(
  dueDate?: string,
  status?: string,
): boolean {
  if (!dueDate) {
    return false;
  }


  const currentStatus =
    normalize(
      status,
    );


  if (
    currentStatus ===
      'cerrada' ||
    currentStatus ===
      'cerrado'
  ) {
    return false;
  }


  const date =
    new Date(
      `${dueDate}T23:59:59`,
    );


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return false;
  }


  return (
    date.getTime() <
    Date.now()
  );
}


/* =========================================================
   DATA VACÍA
========================================================= */

function emptyData():
GapsRisksData {
  return {
    gaps: [],

    operations: [],

    summary: {
      total: 0,

      open: 0,

      treatment: 0,

      verifying: 0,

      closed: 0,

      highRisk: 0,

      urgent: 0,

      expired: 0,
    },

    lastUpdated:
      new Date()
        .toISOString(),
  };
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
   CARGAR BRECHAS
========================================================= */

export async function getCompanyGapsRisks():
Promise<GapsRisksData> {
  const companyId =
    await getCurrentCompanyId();


  /* =======================================================
     OPERACIONES
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
  GapOperationOption[] =
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
    return emptyData();
  }


  /* =======================================================
     ASIGNACIONES
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
     CATÁLOGO
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
     BRECHAS
  ======================================================= */

  const {
    data: gapData,
    error: gapError,
  } =
    await supabase
      .from('gaps')
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
      );


  if (
    gapError
  ) {
    throw new Error(
      `No se pudieron cargar las brechas: ${gapError.message}`,
    );
  }


  const rows =
    (
      gapData ?? []
    ) as GapRow[];


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
     MAPEAR
  ======================================================= */

  const gaps =
    rows
      .map(
        (
          row,
        ): CompanyGapRisk | null => {
          const assignmentId =
            String(
              row.assignment_id ??
              '',
            );


          const assignment =
            assignmentMap.get(
              assignmentId,
            );


          if (
            !assignment
          ) {
            return null;
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
            return null;
          }


          const status =
            textValue(
              row,
              [
                'status',
              ],
              'Abierta',
            );


          const dueDate =
            optionalText(
              row,
              [
                'due_date',
                'target_date',
              ],
            );


          return {
            id:
              String(
                row.id,
              ),

            assignmentId,

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

            title:
              textValue(
                row,
                [
                  'title',
                ],
                'Brecha detectada',
              ),

            description:
              textValue(
                row,
                [
                  'description',
                ],
                'Sin descripción.',
              ),

            riskLevel:
              textValue(
                row,
                [
                  'risk_level',
                ],
                'No determinado',
              ),

            status,

            source:
              textValue(
                row,
                [
                  'source',
                ],
                'Manual',
              ),

            priority:
              textValue(
                row,
                [
                  'priority',
                ],
                'Media',
              ),

            probability:
              textValue(
                row,
                [
                  'probability',
                ],
                'Media',
              ),

            impact:
              optionalText(
                row,
                [
                  'impact',
                ],
              ),

            treatment:
              optionalText(
                row,
                [
                  'treatment',
                  'treatment_plan',
                ],
              ),

            responsible:
              optionalText(
                row,
                [
                  'responsible',
                  'responsible_area',
                ],
              ),

            dueDate,

            closedAt:
              optionalText(
                row,
                [
                  'closed_at',
                ],
              ),

            createdAt:
              textValue(
                row,
                [
                  'created_at',
                ],
                new Date()
                  .toISOString(),
              ),

            updatedAt:
              optionalText(
                row,
                [
                  'updated_at',
                ],
              ),

            expired:
              isExpired(
                dueDate,
                status,
              ),
          };
        },
      )
      .filter(
        (
          gap,
        ): gap is CompanyGapRisk =>
          gap !== null,
      );


  /* =======================================================
     SUMMARY
  ======================================================= */

  const summary:
  GapRiskSummary = {
    total:
      gaps.length,


    open:
      gaps.filter(
        (
          gap,
        ) =>
          normalize(
            gap.status,
          ) ===
          'abierta',
      ).length,


    treatment:
      gaps.filter(
        (
          gap,
        ) => {
          const status =
            normalize(
              gap.status,
            );

          return (
            status ===
              'en tratamiento' ||
            status ===
              'en proceso'
          );
        },
      ).length,


    verifying:
      gaps.filter(
        (
          gap,
        ) => {
          const status =
            normalize(
              gap.status,
            );

          return (
            status ===
              'por verificar' ||
            status ===
              'en verificación' ||
            status ===
              'en verificacion'
          );
        },
      ).length,


    closed:
      gaps.filter(
        (
          gap,
        ) =>
          normalize(
            gap.status,
          ) ===
          'cerrada',
      ).length,


    highRisk:
      gaps.filter(
        (
          gap,
        ) => {
          const risk =
            normalize(
              gap.riskLevel,
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


    urgent:
      gaps.filter(
        (
          gap,
        ) =>
          normalize(
            gap.priority,
          ) ===
          'urgente',
      ).length,


    expired:
      gaps.filter(
        (
          gap,
        ) =>
          gap.expired,
      ).length,
  };


  return {
    gaps,

    operations:
      operationOptions,

    summary,

    lastUpdated:
      new Date()
        .toISOString(),
  };
}