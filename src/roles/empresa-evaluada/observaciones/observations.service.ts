import {
  supabase,
} from '../../../services/supabase';

import type {
  CompanyObservation,
  ObservationOperationOption,
  ObservationsData,
  ObservationSummary,
} from './observations.types';


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


type ObservationRow =
  Record<string, unknown>;


/* =========================================================
   UTILIDADES
========================================================= */

function textValue(
  row: ObservationRow,
  keys: string[],
  fallback = '',
): string {
  for (
    const key of keys
  ) {
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


function optionalText(
  row: ObservationRow,
  keys: string[],
): string | undefined {
  const value =
    textValue(
      row,
      keys,
      '',
    );

  return value ||
    undefined;
}


function booleanValue(
  value: unknown,
): boolean {
  return value === true;
}


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
    normalize(status);


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
      'Este usuario no tiene una empresa asociada.',
    );
  }


  return profile.company_id;
}


/* =========================================================
   CARGAR OBSERVACIONES
========================================================= */

export async function getCompanyObservations():
Promise<ObservationsData> {
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
  ObservationOperationOption[] =
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
      observations: [],

      operations: [],

      summary: {
        total: 0,
        pending: 0,
        responded: 0,
        verifying: 0,
        closed: 0,
        critical: 0,
        expired: 0,
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
      observations: [],

      operations:
        operationOptions,

      summary: {
        total: 0,
        pending: 0,
        responded: 0,
        verifying: 0,
        closed: 0,
        critical: 0,
        expired: 0,
      },

      lastUpdated:
        new Date()
          .toISOString(),
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
  } = await supabase
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
      `No se pudo cargar el catálogo: ${catalogError.message}`,
    );
  }


  const catalogs =
    (
      catalogData ?? []
    ) as CatalogRow[];


  /* =======================================================
     OBSERVACIONES
  ======================================================= */

  const {
    data: observationData,
    error: observationError,
  } = await supabase
    .from(
      'observations',
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
    );


  if (
    observationError
  ) {
    throw new Error(
      `No se pudieron cargar las observaciones: ${observationError.message}`,
    );
  }


  const observationRows =
    (
      observationData ?? []
    ) as ObservationRow[];


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

  const observations =
    observationRows
      .map(
        (
          row,
        ): CompanyObservation | null => {
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
              'Pendiente',
            );


          const dueDate =
            optionalText(
              row,
              [
                'due_date',
              ],
            );


          /*
           * Tu tabla tiene inicialmente
           * text y posteriormente title /
           * description.
           *
           * Por eso aceptamos ambos formatos.
           */
          const observationText =
            textValue(
              row,
              [
                'description',
                'text',
              ],
              'Sin descripción.',
            );


          const observationTitle =
            textValue(
              row,
              [
                'title',
              ],
              observationText.length >
                70
                ? `${observationText.slice(
                    0,
                    67,
                  )}...`
                : observationText,
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
              observationTitle,

            description:
              observationText,

            source:
              textValue(
                row,
                [
                  'source',
                ],
                'Manual',
              ),

            severity:
              textValue(
                row,
                [
                  'severity',
                ],
                'Media',
              ),

            priority:
              optionalText(
                row,
                [
                  'priority',
                ],
              ),

            status,

            validated:
              booleanValue(
                row.validated,
              ),

            dueDate,

            response:
              optionalText(
                row,
                [
                  'response',
                ],
              ),

            respondedAt:
              optionalText(
                row,
                [
                  'responded_at',
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
          observation,
        ): observation is CompanyObservation =>
          observation !== null,
      );


  /* =======================================================
     RESUMEN
  ======================================================= */

  const summary:
  ObservationSummary = {
    total:
      observations.length,


    pending:
      observations.filter(
        (
          observation,
        ) =>
          normalize(
            observation.status,
          ) ===
          'pendiente',
      ).length,


    responded:
      observations.filter(
        (
          observation,
        ) =>
          normalize(
            observation.status,
          ) ===
          'respondida',
      ).length,


    verifying:
      observations.filter(
        (
          observation,
        ) =>
          normalize(
            observation.status,
          ) ===
          'en verificación' ||
          normalize(
            observation.status,
          ) ===
          'en verificacion',
      ).length,


    closed:
      observations.filter(
        (
          observation,
        ) =>
          normalize(
            observation.status,
          ) ===
          'cerrada',
      ).length,


    critical:
      observations.filter(
        (
          observation,
        ) => {
          const severity =
            normalize(
              observation.severity,
            );

          return (
            severity ===
              'crítica' ||
            severity ===
              'critica' ||
            severity ===
              'alta'
          );
        },
      ).length,


    expired:
      observations.filter(
        (
          observation,
        ) =>
          observation.expired,
      ).length,
  };


  return {
    observations,

    operations:
      operationOptions,

    summary,

    lastUpdated:
      new Date()
        .toISOString(),
  };
}


/* =========================================================
   RESPONDER OBSERVACIÓN
========================================================= */

export async function respondObservation(
  observationId: string,
  response: string,
): Promise<void> {
  const cleanResponse =
    response.trim();


  if (
    cleanResponse.length <
    5
  ) {
    throw new Error(
      'La respuesta debe contener al menos 5 caracteres.',
    );
  }


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


  const now =
    new Date()
      .toISOString();


  const {
    error,
  } = await supabase
    .from(
      'observations',
    )
    .update({
      response:
        cleanResponse,

      status:
        'Respondida',

      responded_by:
        authData.user.id,

      responded_at:
        now,

      updated_at:
        now,
    })
    .eq(
      'id',
      observationId,
    );


  if (error) {
    throw new Error(
      `No se pudo enviar la respuesta: ${error.message}`,
    );
  }
}