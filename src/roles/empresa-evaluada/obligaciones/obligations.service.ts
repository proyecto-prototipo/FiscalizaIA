import {
  supabase,
} from '../../../services/supabase';

import type {
  CompanyObligation,
  CompanyObligationsData,
  CompanyObligationSummary,
  CompanyOperationOption,
} from './obligations.types';


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

  due_date: string | null;

  status: string;

  assigned_at:
    string | null;

  notes:
    string | null;

  created_at: string;
}

interface CatalogRow {
  id: string;

  code: string;
  title: string;

  description:
    string | null;

  category: string;

  criticality: string;

  required_evidence:
    string;

  active: boolean;
}

interface EvidenceRow {
  id: string;

  assignment_id: string;

  status: string | null;

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
    .toLocaleLowerCase('es');
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
    return 'No tienes permisos para consultar las obligaciones.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}


/* =========================================================
   EMPRESA AUTENTICADA
========================================================= */

async function getCompanyId():
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

  if (!profile.company_id) {
    throw new Error(
      'Este usuario todavía no tiene una empresa asociada.',
    );
  }

  return profile.company_id;
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

  const normalizedStatus =
    normalize(status);

  if (
    [
      'cumplida',
      'completada',
      'cerrada',
    ].includes(
      normalizedStatus,
    )
  ) {
    return false;
  }

  const date =
    new Date(
      `${dueDate}T23:59:59`,
    );

  return (
    date.getTime() <
    Date.now()
  );
}


/* =========================================================
   CARGAR OBLIGACIONES
========================================================= */

export async function getCompanyObligations():
Promise<CompanyObligationsData> {
  const companyId =
    await getCompanyId();


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


  if (operationError) {
    throw new Error(
      getErrorMessage(
        operationError,
        'No se pudieron cargar las operaciones',
      ),
    );
  }


  const operations =
    (
      operationData ?? []
    ) as OperationRow[];


  const operationOptions:
  CompanyOperationOption[] =
    operations.map(
      (operation) => ({
        id:
          operation.id,

        name:
          operation.name,
      }),
    );


  const operationIds =
    operations.map(
      (operation) =>
        operation.id,
    );


  if (
    operationIds.length === 0
  ) {
    return {
      obligations: [],

      operations:
        operationOptions,

      summary: {
        total: 0,

        pending: 0,
        inProgress: 0,
        completed: 0,
        expired: 0,

        highCriticality: 0,

        withEvidence: 0,
        withoutEvidence: 0,
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
      due_date,
      status,
      assigned_at,
      notes,
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


  if (assignmentError) {
    throw new Error(
      getErrorMessage(
        assignmentError,
        'No se pudieron cargar las obligaciones',
      ),
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
      obligations: [],

      operations:
        operationOptions,

      summary: {
        total: 0,

        pending: 0,
        inProgress: 0,
        completed: 0,
        expired: 0,

        highCriticality: 0,

        withEvidence: 0,
        withoutEvidence: 0,
      },

      lastUpdated:
        new Date()
          .toISOString(),
    };
  }


  const catalogIds =
    Array.from(
      new Set(
        assignments.map(
          (assignment) =>
            assignment.catalog_id,
        ),
      ),
    );


  /* =======================================================
     CATÁLOGO + EVIDENCIAS
  ======================================================= */

  const [
    catalogResponse,
    evidenceResponse,
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
          description,
          category,
          criticality,
          required_evidence,
          active
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
          status,
          uploaded_at
        `)
        .in(
          'assignment_id',
          assignments.map(
            (assignment) =>
              assignment.id,
          ),
        )
        .order(
          'uploaded_at',
          {
            ascending: false,
          },
        ),
    ]);


  if (
    catalogResponse.error
  ) {
    throw new Error(
      getErrorMessage(
        catalogResponse.error,
        'No se pudo cargar el catálogo de obligaciones',
      ),
    );
  }


  if (
    evidenceResponse.error
  ) {
    console.error(
      '[Empresa Obligaciones] Evidencias:',
      evidenceResponse.error,
    );
  }


  const catalogs =
    (
      catalogResponse.data ??
      []
    ) as CatalogRow[];


  const evidences =
    (
      evidenceResponse.data ??
      []
    ) as EvidenceRow[];


  /* =======================================================
     MAPS
  ======================================================= */

  const operationMap =
    new Map(
      operations.map(
        (operation) => [
          operation.id,
          operation,
        ],
      ),
    );


  const catalogMap =
    new Map(
      catalogs.map(
        (catalog) => [
          catalog.id,
          catalog,
        ],
      ),
    );


  const evidencesByAssignment =
    new Map<
      string,
      EvidenceRow[]
    >();


  evidences.forEach(
    (evidence) => {
      const current =
        evidencesByAssignment.get(
          evidence.assignment_id,
        ) ?? [];

      current.push(
        evidence,
      );

      evidencesByAssignment.set(
        evidence.assignment_id,
        current,
      );
    },
  );


  /* =======================================================
   CONSTRUIR OBLIGACIONES
======================================================= */

const obligations =
  assignments
    .map(
      (
        assignment,
      ): CompanyObligation | null => {
        const catalog =
          catalogMap.get(
            assignment.catalog_id,
          );

        const operation =
          operationMap.get(
            assignment.operation_id,
          );

        /*
         * Si falta alguna relación,
         * no podemos construir correctamente
         * la obligación.
         */
        if (
          !catalog ||
          !operation
        ) {
          return null;
        }

        const assignmentEvidences =
          evidencesByAssignment.get(
            assignment.id,
          ) ?? [];

        /*
         * Como evidenceResponse ya viene
         * ordenado por uploaded_at DESC,
         * la posición 0 representa
         * la evidencia más reciente.
         */
        const latestEvidence =
          assignmentEvidences[0];

        const obligation:
        CompanyObligation = {
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

          description:
            catalog.description ??
            undefined,

          category:
            catalog.category,

          criticality:
            catalog.criticality,

          requiredEvidence:
            catalog.required_evidence,

          dueDate:
            assignment.due_date ??
            undefined,

          status:
            assignment.status,

          assignedAt:
            assignment.assigned_at ??
            undefined,

          createdAt:
            assignment.created_at,

          notes:
            assignment.notes ??
            undefined,

          evidenceCount:
            assignmentEvidences.length,

          latestEvidenceStatus:
            latestEvidence?.status ??
            undefined,

          expired:
            isExpired(
              assignment.due_date ??
                undefined,
              assignment.status,
            ),
        };

        return obligation;
      },
    )
    .filter(
      (
        obligation,
      ): obligation is CompanyObligation =>
        obligation !== null,
    );


  /* =======================================================
     RESUMEN
  ======================================================= */

  const summary:
  CompanyObligationSummary = {
    total:
      obligations.length,

    pending:
      obligations.filter(
        (obligation) =>
          normalize(
            obligation.status,
          ) === 'pendiente',
      ).length,

    inProgress:
      obligations.filter(
        (obligation) => {
          const status =
            normalize(
              obligation.status,
            );

          return [
            'en proceso',
            'en revisión',
            'en revision',
          ].includes(
            status,
          );
        },
      ).length,

    completed:
      obligations.filter(
        (obligation) =>
          [
            'cumplida',
            'completada',
            'cerrada',
          ].includes(
            normalize(
              obligation.status,
            ),
          ),
      ).length,

    expired:
      obligations.filter(
        (obligation) =>
          obligation.expired,
      ).length,

    highCriticality:
      obligations.filter(
        (obligation) =>
          normalize(
            obligation.criticality,
          ) === 'alta',
      ).length,

    withEvidence:
      obligations.filter(
        (obligation) =>
          obligation.evidenceCount >
          0,
      ).length,

    withoutEvidence:
      obligations.filter(
        (obligation) =>
          obligation.evidenceCount ===
          0,
      ).length,
  };


  return {
    obligations,

    operations:
      operationOptions,

    summary,

    lastUpdated:
      new Date()
        .toISOString(),
  };
}