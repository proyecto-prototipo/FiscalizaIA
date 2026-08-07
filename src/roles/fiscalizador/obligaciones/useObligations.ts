import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRealtimeModule } from '../../../shared/hooks/useRealtimeModule';

import {
  createAssignment,
  createCatalogItem,
  listAssignments,
  listCatalog,
  listOperationOptions,
  updateAssignment,
} from './obligations.service';

import type {
  AssignmentFormValues,
  AssignmentStatus,
  CatalogFormValues,
  ObligationAssignment,
  ObligationCatalog,
  ObligationCriticality,
  OperationOption,
} from './obligations.types';

/* =========================================================
   TIPOS
   ========================================================= */

export interface ObligationFilters {
  search: string;
  companyId: string;
  operationId: string;
  status: AssignmentStatus | '';
  criticality: ObligationCriticality | '';
}

export interface ObligationSummary {
  total: number;
  pending: number;
  inProcess: number;
  highPriority: number;
}

/* =========================================================
   VALORES INICIALES
   ========================================================= */

const INITIAL_FILTERS: ObligationFilters = {
  search: '',
  companyId: '',
  operationId: '',
  status: '',
  criticality: '',
};

/**
 * Se declara fuera del hook para no crear un arreglo
 * diferente en cada render.
 */
const REALTIME_TABLES = [
  'obligation_catalog',
  'obligation_assignments',
  'mining_operations',
  'companies',
];

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function normalizeValue(
  value: string | undefined,
): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

/* =========================================================
   HOOK PRINCIPAL
   ========================================================= */

export function useObligations() {
  const [
    catalog,
    setCatalog,
  ] = useState<ObligationCatalog[]>([]);

  const [
    assignments,
    setAssignments,
  ] = useState<ObligationAssignment[]>([]);

  const [
    operations,
    setOperations,
  ] = useState<OperationOption[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<ObligationFilters>(
    INITIAL_FILTERS,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(null);

  /* =======================================================
     CARGAR INFORMACIÓN
     ======================================================= */

  const loadData =
    useCallback(async (): Promise<void> => {
      try {
        setLoading(true);
        setError('');

        const [
          catalogResult,
          assignmentResult,
          operationResult,
        ] = await Promise.all([
          listCatalog(),
          listAssignments(),
          listOperationOptions(),
        ]);

        setCatalog(catalogResult);
        setAssignments(assignmentResult);
        setOperations(operationResult);
        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            'No se pudo cargar el módulo de obligaciones.',
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  /* =======================================================
     CARGA INICIAL
     ======================================================= */

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
     REALTIME
     ======================================================= */

  useRealtimeModule(
    'fiscalizador-obligations',
    REALTIME_TABLES,
    () => {
      void loadData();
    },
  );

  /* =======================================================
     EMPRESAS DISPONIBLES
     ======================================================= */

  const companies =
    useMemo(() => {
      const companyMap =
        new Map<string, string>();

      operations.forEach(
        (operation) => {
          companyMap.set(
            operation.companyId,
            operation.companyName,
          );
        },
      );

      return Array.from(
        companyMap.entries(),
      )
        .map(([id, name]) => ({
          id,
          name,
        }))
        .sort((first, second) =>
          first.name.localeCompare(
            second.name,
            'es',
          ),
        );
    }, [operations]);

  /* =======================================================
     OPERACIONES DISPONIBLES SEGÚN EMPRESA
     ======================================================= */

  const filteredOperationOptions =
    useMemo(() => {
      if (!filters.companyId) {
        return operations;
      }

      return operations.filter(
        (operation) =>
          operation.companyId ===
          filters.companyId,
      );
    }, [
      operations,
      filters.companyId,
    ]);

  /* =======================================================
     ASIGNACIONES FILTRADAS
     ======================================================= */

  const filteredAssignments =
    useMemo<ObligationAssignment[]>(() => {
      const searchValue =
        filters.search
          .trim()
          .toLowerCase();

      return assignments.filter(
        (assignment) => {
          const searchableValues = [
            assignment.catalogCode,
            assignment.catalogTitle,
            assignment.catalogDescription,
            assignment.category,
            assignment.requiredEvidence,
            assignment.operationName,
            assignment.operationCode,
            assignment.companyName,
            assignment.notes,
          ];

          const matchesSearch =
            !searchValue ||
            searchableValues.some(
              (value) =>
                normalizeValue(value)
                  .includes(searchValue),
            );

          const matchesCompany =
            !filters.companyId ||
            assignment.companyId ===
              filters.companyId;

          const matchesOperation =
            !filters.operationId ||
            assignment.operationId ===
              filters.operationId;

          const matchesStatus =
            !filters.status ||
            assignment.status ===
              filters.status;

          const matchesCriticality =
            !filters.criticality ||
            assignment.criticality ===
              filters.criticality;

          return (
            matchesSearch &&
            matchesCompany &&
            matchesOperation &&
            matchesStatus &&
            matchesCriticality
          );
        },
      );
    }, [
      assignments,
      filters,
    ]);

  /* =======================================================
     RESUMEN
     ======================================================= */

  const summary =
    useMemo<ObligationSummary>(() => {
      const pending =
        assignments.filter(
          (assignment) =>
            assignment.status ===
            'Pendiente',
        ).length;

      const inProcess =
        assignments.filter(
          (assignment) =>
            assignment.status ===
              'En proceso' ||
            assignment.status ===
              'Con evidencia',
        ).length;

      const highPriority =
        assignments.filter(
          (assignment) =>
            assignment.criticality ===
              'Alta' ||
            assignment.status ===
              'Vencida',
        ).length;

      return {
        total:
          assignments.length,

        pending,

        inProcess,

        highPriority,
      };
    }, [assignments]);

  /* =======================================================
     CREAR OBLIGACIÓN
     ======================================================= */

  const handleCreateCatalogItem =
    useCallback(
      async (
        values: CatalogFormValues,
      ): Promise<ObligationCatalog> => {
        try {
          setSaving(true);
          setError('');

          const createdItem =
            await createCatalogItem(
              values,
            );

          setCatalog(
            (currentCatalog) => {
              const alreadyExists =
                currentCatalog.some(
                  (item) =>
                    item.id ===
                    createdItem.id,
                );

              if (alreadyExists) {
                return currentCatalog;
              }

              return [
                createdItem,
                ...currentCatalog,
              ];
            },
          );

          setLastUpdated(new Date());

          await loadData();

          return createdItem;
        } catch (createError) {
          const message =
            getErrorMessage(
              createError,
              'No se pudo registrar la obligación.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadData],
    );

  /* =======================================================
     CREAR ASIGNACIÓN
     ======================================================= */

  const handleCreateAssignment =
    useCallback(
      async (
        values: AssignmentFormValues,
      ): Promise<ObligationAssignment> => {
        try {
          setSaving(true);
          setError('');

          const createdAssignment =
            await createAssignment(
              values,
              operations,
            );

          setAssignments(
            (currentAssignments) => {
              const alreadyExists =
                currentAssignments.some(
                  (assignment) =>
                    assignment.id ===
                    createdAssignment.id,
                );

              if (alreadyExists) {
                return currentAssignments;
              }

              return [
                createdAssignment,
                ...currentAssignments,
              ];
            },
          );

          setLastUpdated(new Date());

          await loadData();

          return createdAssignment;
        } catch (createError) {
          const message =
            getErrorMessage(
              createError,
              'No se pudo asignar la obligación.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [
        loadData,
        operations,
      ],
    );

  /* =======================================================
     EDITAR ASIGNACIÓN
     ======================================================= */

  const handleUpdateAssignment =
    useCallback(
      async (
        assignmentId: string,
        values: AssignmentFormValues,
      ): Promise<ObligationAssignment> => {
        try {
          setSaving(true);
          setError('');

          const updatedAssignment =
            await updateAssignment(
              assignmentId,
              values,
              operations,
            );

          setAssignments(
            (currentAssignments) =>
              currentAssignments.map(
                (assignment) =>
                  assignment.id ===
                  assignmentId
                    ? updatedAssignment
                    : assignment,
              ),
          );

          setLastUpdated(new Date());

          await loadData();

          return updatedAssignment;
        } catch (updateError) {
          const message =
            getErrorMessage(
              updateError,
              'No se pudo actualizar la asignación.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [
        loadData,
        operations,
      ],
    );

  /* =======================================================
     FILTROS
     ======================================================= */

  const updateFilter =
    useCallback(
      <
        Key extends keyof ObligationFilters,
      >(
        key: Key,
        value: ObligationFilters[Key],
      ): void => {
        setFilters(
          (currentFilters) => {
            /**
             * Cuando se cambia la empresa,
             * se limpia la operación seleccionada.
             */
            if (key === 'companyId') {
              return {
                ...currentFilters,
                companyId:
                  value as string,
                operationId: '',
              };
            }

            return {
              ...currentFilters,
              [key]: value,
            };
          },
        );
      },
      [],
    );

  const clearFilters =
    useCallback((): void => {
      setFilters({
        ...INITIAL_FILTERS,
      });
    }, []);

  const clearError =
    useCallback((): void => {
      setError('');
    }, []);

  /* =======================================================
     RETORNO
     ======================================================= */

  return {
    catalog,
    assignments,
    filteredAssignments,

    operations,
    filteredOperationOptions,
    companies,

    filters,
    summary,

    loading,
    saving,
    error,
    lastUpdated,

    loadData,

    createCatalogItem:
      handleCreateCatalogItem,

    createAssignment:
      handleCreateAssignment,

    updateAssignment:
      handleUpdateAssignment,

    updateFilter,
    clearFilters,
    clearError,
  };
}