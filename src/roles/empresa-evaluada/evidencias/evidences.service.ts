import {
  supabase,
} from '../../../services/supabase';

import type {
  CompanyEvidence,
  CompanyOperationOption,
  EvidenceAssignmentOption,
  EvidencesData,
  EvidenceSummary,
  UploadEvidencePayload,
} from './evidences.types';


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

  required_evidence: string;
}

interface EvidenceRow {
  id: string;

  operation_id: string;
  assignment_id: string;

  file_name: string;
  storage_path: string;

  version:
    number | string | null;

  status: string;

  review_comment:
    string | null;

  reviewed_at:
    string | null;

  ai_status: string;

  ai_confidence:
    number | string | null;

  uploaded_at: string;
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


function numericValue(
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


function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (
    error.code === '42501'
  ) {
    return 'No tienes permisos para realizar esta operación.';
  }

  if (
    error.code === 'PGRST116'
  ) {
    return 'No se encontró el registro solicitado.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}


function sanitizeFileName(
  fileName: string,
): string {
  return fileName
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[^a-zA-Z0-9._-]/g,
      '_',
    );
}


/* =========================================================
   OBTENER EMPRESA ACTUAL
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
      'No existe un usuario autenticado.',
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
      getErrorMessage(
        error,
        'No se pudo identificar la empresa',
      ),
    );
  }


  const profile =
    data as ProfileRow;


  if (
    !profile.company_id
  ) {
    throw new Error(
      'Tu usuario todavía no tiene una empresa asociada.',
    );
  }


  return profile.company_id;
}


/* =========================================================
   CARGAR EVIDENCIAS
========================================================= */

export async function getCompanyEvidences():
Promise<EvidencesData> {
  const companyId =
    await getCurrentCompanyId();


  /* =======================================================
     OPERACIONES
  ======================================================= */

  const {
    data: operationsData,
    error: operationsError,
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
    operationsError
  ) {
    throw new Error(
      getErrorMessage(
        operationsError,
        'No se pudieron cargar las operaciones',
      ),
    );
  }


  const operations =
    (
      operationsData ?? []
    ) as OperationRow[];


  const operationOptions:
  CompanyOperationOption[] =
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
      evidences: [],

      assignments: [],

      operations: [],

      summary: {
        total: 0,

        pending: 0,

        reviewing: 0,

        approved: 0,

        observed: 0,

        rejected: 0,
      },

      lastUpdated:
        new Date()
          .toISOString(),
    };
  }


  /* =======================================================
     OBLIGACIONES ASIGNADAS
  ======================================================= */

  const {
    data: assignmentsData,
    error: assignmentsError,
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
    assignmentsError
  ) {
    throw new Error(
      getErrorMessage(
        assignmentsError,
        'No se pudieron cargar las obligaciones',
      ),
    );
  }


  const assignments =
    (
      assignmentsData ?? []
    ) as AssignmentRow[];


  if (
    assignments.length === 0
  ) {
    return {
      evidences: [],

      assignments: [],

      operations:
        operationOptions,

      summary: {
        total: 0,

        pending: 0,

        reviewing: 0,

        approved: 0,

        observed: 0,

        rejected: 0,
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
      title,
      criticality,
      required_evidence
    `)
    .in(
      'id',
      catalogIds,
    );


  if (
    catalogError
  ) {
    throw new Error(
      getErrorMessage(
        catalogError,
        'No se pudo cargar el catálogo de obligaciones',
      ),
    );
  }


  const catalogs =
    (
      catalogData ?? []
    ) as CatalogRow[];


  /* =======================================================
     EVIDENCIAS
  ======================================================= */

  const {
    data: evidenceData,
    error: evidenceError,
  } = await supabase
    .from(
      'evidence_documents',
    )
    .select(`
      id,
      operation_id,
      assignment_id,
      file_name,
      storage_path,
      version,
      status,
      review_comment,
      reviewed_at,
      ai_status,
      ai_confidence,
      uploaded_at
    `)
    .in(
      'operation_id',
      operationIds,
    )
    .order(
      'uploaded_at',
      {
        ascending: false,
      },
    );


  if (
    evidenceError
  ) {
    throw new Error(
      getErrorMessage(
        evidenceError,
        'No se pudieron cargar las evidencias',
      ),
    );
  }


  const evidenceRows =
    (
      evidenceData ?? []
    ) as EvidenceRow[];


  /* =======================================================
     MAPAS
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


  /* =======================================================
     OPCIONES DE ASIGNACIÓN
  ======================================================= */

  const assignmentOptions =
    assignments
      .map(
        (
          assignment,
        ): EvidenceAssignmentOption | null => {
          const catalog =
            catalogMap.get(
              assignment.catalog_id,
            );


          const operation =
            operationMap.get(
              assignment.operation_id,
            );


          if (
            !catalog ||
            !operation
          ) {
            return null;
          }


          return {
            id:
              assignment.id,

            operationId:
              operation.id,

            operationName:
              operation.name,

            catalogId:
              catalog.id,

            code:
              catalog.code,

            title:
              catalog.title,

            criticality:
              catalog.criticality,

            requiredEvidence:
              catalog.required_evidence,

            dueDate:
              assignment.due_date ??
              undefined,

            status:
              assignment.status,
          };
        },
      )
      .filter(
        (
          assignment,
        ): assignment is EvidenceAssignmentOption =>
          assignment !== null,
      );


  /* =======================================================
     EVIDENCIAS MAPEADAS
  ======================================================= */

  const evidences =
    evidenceRows
      .map(
        (
          evidence,
        ): CompanyEvidence | null => {
          const assignment =
            assignmentMap.get(
              evidence.assignment_id,
            );


          if (
            !assignment
          ) {
            return null;
          }


          const catalog =
            catalogMap.get(
              assignment.catalog_id,
            );


          const operation =
            operationMap.get(
              evidence.operation_id,
            );


          if (
            !catalog ||
            !operation
          ) {
            return null;
          }


          return {
            id:
              evidence.id,

            assignmentId:
              evidence.assignment_id,

            operationId:
              evidence.operation_id,

            obligationCode:
              catalog.code,

            obligationTitle:
              catalog.title,

            operationName:
              operation.name,

            fileName:
              evidence.file_name,

            storagePath:
              evidence.storage_path,

            version:
              numericValue(
                evidence.version,
              ) || 1,

            status:
              evidence.status,

            aiStatus:
              evidence.ai_status,

            aiConfidence:
              evidence.ai_confidence !==
              null
                ? numericValue(
                    evidence.ai_confidence,
                  )
                : undefined,

            reviewComment:
              evidence.review_comment ??
              undefined,

            uploadedAt:
              evidence.uploaded_at,

            reviewedAt:
              evidence.reviewed_at ??
              undefined,
          };
        },
      )
      .filter(
        (
          evidence,
        ): evidence is CompanyEvidence =>
          evidence !== null,
      );


  /* =======================================================
     RESUMEN
  ======================================================= */

  const summary:
  EvidenceSummary = {
    total:
      evidences.length,

    pending:
      evidences.filter(
        (
          evidence,
        ) =>
          normalize(
            evidence.status,
          ) ===
          'pendiente',
      ).length,

    reviewing:
      evidences.filter(
        (
          evidence,
        ) => {
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
        (
          evidence,
        ) =>
          normalize(
            evidence.status,
          ) ===
          'aprobada',
      ).length,

    observed:
      evidences.filter(
        (
          evidence,
        ) =>
          normalize(
            evidence.status,
          ) ===
          'observada',
      ).length,

    rejected:
      evidences.filter(
        (
          evidence,
        ) =>
          normalize(
            evidence.status,
          ) ===
          'rechazada',
      ).length,
  };


  return {
    evidences,

    assignments:
      assignmentOptions,

    operations:
      operationOptions,

    summary,

    lastUpdated:
      new Date()
        .toISOString(),
  };
}


/* =========================================================
   SUBIR EVIDENCIA
========================================================= */

export async function uploadCompanyEvidence(
  payload:
    UploadEvidencePayload,
): Promise<void> {
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


  const companyId =
    await getCurrentCompanyId();


  /* =======================================================
     VALIDACIONES ARCHIVO
  ======================================================= */

  const maxFileSize =
    20 *
    1024 *
    1024;


  if (
    payload.file.size >
    maxFileSize
  ) {
    throw new Error(
      'El archivo no puede superar los 20 MB.',
    );
  }


  if (
    payload.file.size === 0
  ) {
    throw new Error(
      'El archivo seleccionado está vacío.',
    );
  }


  /* =======================================================
     ASIGNACIÓN
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
      operation_id
    `)
    .eq(
      'id',
      payload.assignmentId,
    )
    .single();


  if (
    assignmentError ||
    !assignmentData
  ) {
    throw new Error(
      'No se encontró la obligación seleccionada.',
    );
  }


  const operationId =
    assignmentData.operation_id as string;


  /* =======================================================
     VALIDAR QUE LA OPERACIÓN SEA DE LA EMPRESA
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
      company_id
    `)
    .eq(
      'id',
      operationId,
    )
    .eq(
      'company_id',
      companyId,
    )
    .single();


  if (
    operationError ||
    !operationData
  ) {
    throw new Error(
      'La obligación seleccionada no pertenece a tu empresa.',
    );
  }


  /* =======================================================
     RUTA STORAGE
  ======================================================= */

  const safeName =
    sanitizeFileName(
      payload.file.name,
    );


  const uniqueId =
    crypto.randomUUID();


  const storagePath =
    `${companyId}/${payload.assignmentId}/${uniqueId}-${safeName}`;


  /* =======================================================
     SUBIR AL STORAGE
  ======================================================= */

  const {
    error: uploadError,
  } =
    await supabase.storage
      .from('evidences')
      .upload(
        storagePath,
        payload.file,
        {
          cacheControl:
            '3600',

          upsert:
            false,

          contentType:
            payload.file.type ||
            undefined,
        },
      );


  if (
    uploadError
  ) {
    throw new Error(
      `No se pudo subir el archivo: ${uploadError.message}`,
    );
  }


  /* =======================================================
     REGISTRAR EN BASE DE DATOS
  ======================================================= */

  const {
    error: insertError,
  } = await supabase
    .from(
      'evidence_documents',
    )
    .insert({
      operation_id:
        operationId,

      assignment_id:
        payload.assignmentId,

      file_name:
        payload.file.name,

      storage_path:
        storagePath,

      status:
        'Pendiente',

      ai_status:
        'Pendiente',

      uploaded_by:
        authData.user.id,
    });


  if (
    insertError
  ) {
    /*
     * Si falla la inserción,
     * eliminamos el archivo para
     * no dejar datos huérfanos.
     */

    await supabase.storage
      .from('evidences')
      .remove([
        storagePath,
      ]);


    throw new Error(
      `El archivo se subió, pero no se pudo registrar la evidencia: ${insertError.message}`,
    );
  }
}


/* =========================================================
   OBTENER URL TEMPORAL
========================================================= */

export async function getEvidenceSignedUrl(
  storagePath: string,
): Promise<string> {
  if (
    !storagePath
  ) {
    throw new Error(
      'La evidencia no tiene una ruta de archivo válida.',
    );
  }


  const {
    data,
    error,
  } =
    await supabase.storage
      .from('evidences')
      .createSignedUrl(
        storagePath,
        60,
      );


  if (
    error
  ) {
    throw new Error(
      `No se pudo abrir el documento: ${error.message}`,
    );
  }


  if (
    !data?.signedUrl
  ) {
    throw new Error(
      'No se pudo generar el enlace del documento.',
    );
  }


  return data.signedUrl;
}