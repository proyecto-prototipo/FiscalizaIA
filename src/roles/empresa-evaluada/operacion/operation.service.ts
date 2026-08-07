import {
  supabase,
} from '../../../services/supabase';

import type {
  CompanyOperation,
  OperationCompany,
  OperationPageData,
} from './operation.types';


/* =========================================================
   TIPOS INTERNOS
========================================================= */

type DatabaseRow =
  Record<string, unknown>;


/* =========================================================
   UTILIDADES
========================================================= */

function textValue(
  row: DatabaseRow,
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

    if (
      typeof value === 'number'
    ) {
      return String(value);
    }
  }

  return fallback;
}


function optionalText(
  row: DatabaseRow,
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
    return 'No tienes permisos para consultar esta operación.';
  }

  if (
    error.code === 'PGRST116'
  ) {
    return 'No se encontró la empresa asociada al usuario.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
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

  const companyId =
    data?.company_id as
      string | null;

  if (!companyId) {
    throw new Error(
      'Tu usuario todavía no tiene una empresa asociada.',
    );
  }

  return companyId;
}


/* =========================================================
   MAPEAR EMPRESA
========================================================= */

function mapCompany(
  row: DatabaseRow,
): OperationCompany {
  return {
    id:
      String(
        row.id ?? '',
      ),

    name:
      textValue(
        row,
        [
          'legal_name',
          'business_name',
          'company_name',
          'name',
        ],
        'Empresa evaluada',
      ),

    documentNumber:
      optionalText(
        row,
        [
          'ruc',
          'tax_id',
          'document_number',
          'document',
        ],
      ),

    status:
      optionalText(
        row,
        [
          'status',
          'state',
        ],
      ),
  };
}


/* =========================================================
   MAPEAR OPERACIÓN
========================================================= */

function mapOperation(
  row: DatabaseRow,
): CompanyOperation {
  return {
    id:
      String(
        row.id ?? '',
      ),

    companyId:
      String(
        row.company_id ?? '',
      ),

    name:
      textValue(
        row,
        [
          'name',
          'operation_name',
          'title',
        ],
        'Operación minera',
      ),

    code:
      optionalText(
        row,
        [
          'code',
          'operation_code',
        ],
      ),

    status:
      optionalText(
        row,
        [
          'status',
          'state',
        ],
      ),

    location:
      optionalText(
        row,
        [
          'location',
          'address',
          'district',
          'province',
          'department',
          'region',
        ],
      ),

    operationType:
      optionalText(
        row,
        [
          'operation_type',
          'type',
          'category',
        ],
      ),

    description:
      optionalText(
        row,
        [
          'description',
          'details',
          'notes',
        ],
      ),

    createdAt:
      optionalText(
        row,
        [
          'created_at',
        ],
      ),

    updatedAt:
      optionalText(
        row,
        [
          'updated_at',
        ],
      ),
  };
}


/* =========================================================
   DETERMINAR ESTADO
========================================================= */

function isActiveStatus(
  status?: string,
): boolean {
  if (!status) {
    /*
     * Si la tabla no tiene estado,
     * consideramos la operación activa.
     */
    return true;
  }

  const normalized =
    status
      .trim()
      .toLowerCase();

  return ![
    'inactiva',
    'inactivo',
    'cerrada',
    'cerrado',
    'suspendida',
    'suspendido',
  ].includes(normalized);
}


/* =========================================================
   CARGAR MI OPERACIÓN
========================================================= */

export async function getCompanyOperations():
Promise<OperationPageData> {
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
    .select('*')
    .eq(
      'id',
      companyId,
    )
    .single();

  if (companyError) {
    throw new Error(
      getErrorMessage(
        companyError,
        'No se pudo cargar la información de la empresa',
      ),
    );
  }


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
    .select('*')
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


  const company =
    mapCompany(
      companyData as DatabaseRow,
    );


  const operations =
    (
      (operationData ?? []) as
        DatabaseRow[]
    ).map(
      mapOperation,
    );


  const activeOperations =
    operations.filter(
      (operation) =>
        isActiveStatus(
          operation.status,
        ),
    ).length;


  return {
    company,

    operations,

    totalOperations:
      operations.length,

    activeOperations,

    inactiveOperations:
      Math.max(
        0,
        operations.length -
          activeOperations,
      ),

    lastUpdated:
      new Date()
        .toISOString(),
  };
}