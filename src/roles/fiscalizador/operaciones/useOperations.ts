import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRealtimeModule } from '../../../shared/hooks/useRealtimeModule';

import {
  changeOperationStatus,
  createOperation,
  listOperations,
  updateOperation,
} from './operations.service';

import type {
  Operation,
  OperationFormValues,
  OperationStage,
  OperationType,
  RiskLevel,
} from './operations.types';

/* =========================================================
   TIPOS
   ========================================================= */

export type ActivityFilter =
  | 'Todas'
  | 'Activas'
  | 'Inactivas';

export interface OperationsFilters {
  search: string;
  companyId: string;
  operationType: OperationType | '';
  stage: OperationStage | '';
  risk: RiskLevel | '';
  activity: ActivityFilter;
}

export interface OperationsSummary {
  total: number;
  active: number;
  inEvaluation: number;
  highRisk: number;
}

/* =========================================================
   VALORES INICIALES
   ========================================================= */

const INITIAL_FILTERS: OperationsFilters = {
  search: '',
  companyId: '',
  operationType: '',
  stage: '',
  risk: '',
  activity: 'Todas',
};

/**
 * Se mantiene el mismo arreglo durante toda la vida
 * del módulo para evitar reconstruir innecesariamente
 * la suscripción de Realtime.
 */
const REALTIME_TABLES = [
  'mining_operations',
  'companies',
  'obligation_assignments',
];

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

function normalizeSearchValue(
  value: string | undefined,
): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

/* =========================================================
   HOOK PRINCIPAL
   ========================================================= */

export function useOperations() {
  /* =======================================================
     ESTADOS
     ======================================================= */

  const [
    operations,
    setOperations,
  ] = useState<Operation[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<OperationsFilters>(
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
     CARGAR OPERACIONES
     ======================================================= */

  const loadOperations =
    useCallback(async (): Promise<void> => {
      try {
        setLoading(true);
        setError('');

        const result =
          await listOperations();

        setOperations(result);
        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            'No se pudieron cargar las operaciones.',
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
    void loadOperations();
  }, [loadOperations]);

  /* =======================================================
     ACTUALIZACIÓN EN TIEMPO REAL
     ======================================================= */

  /**
   * Esta llamada debe aparecer una sola vez.
   *
   * El hook useRealtimeModule se encarga de:
   * - crear el canal;
   * - registrar las tablas;
   * - suscribirse una vez;
   * - cerrar el canal al salir del módulo.
   */
  useRealtimeModule(
    'fiscalizador-operations',
    REALTIME_TABLES,
    () => {
      void loadOperations();
    },
  );

  /* =======================================================
     OPERACIONES FILTRADAS
     ======================================================= */

  const filteredOperations =
    useMemo<Operation[]>(() => {
      const searchValue =
        filters.search
          .trim()
          .toLowerCase();

      return operations.filter(
        (operation) => {
          const searchableValues = [
            operation.name,
            operation.internalCode,
            operation.companyName,
            operation.operationType,
            operation.stage,
            operation.region,
            operation.province,
            operation.district,
            operation.responsibleName,
          ];

          const matchesSearch =
            !searchValue ||
            searchableValues.some(
              (value) =>
                normalizeSearchValue(value)
                  .includes(searchValue),
            );

          const matchesCompany =
            !filters.companyId ||
            operation.companyId ===
              filters.companyId;

          const matchesType =
            !filters.operationType ||
            operation.operationType ===
              filters.operationType;

          const matchesStage =
            !filters.stage ||
            operation.stage ===
              filters.stage;

          const matchesRisk =
            !filters.risk ||
            operation.currentRisk ===
              filters.risk;

          const matchesActivity =
            filters.activity ===
              'Todas' ||
            (
              filters.activity ===
                'Activas' &&
              operation.active
            ) ||
            (
              filters.activity ===
                'Inactivas' &&
              !operation.active
            );

          return (
            matchesSearch &&
            matchesCompany &&
            matchesType &&
            matchesStage &&
            matchesRisk &&
            matchesActivity
          );
        },
      );
    }, [
      operations,
      filters,
    ]);

  /* =======================================================
     RESUMEN
     ======================================================= */

  const summary =
    useMemo<OperationsSummary>(() => {
      const active =
        operations.filter(
          (operation) =>
            operation.active,
        ).length;

      const inEvaluation =
        operations.filter(
          (operation) =>
            operation.status ===
            'En evaluación',
        ).length;

      const highRisk =
        operations.filter(
          (operation) =>
            operation.currentRisk ===
              'Alto' ||
            operation.currentRisk ===
              'Crítico',
        ).length;

      return {
        total:
          operations.length,

        active,

        inEvaluation,

        highRisk,
      };
    }, [operations]);

  /* =======================================================
     CREAR OPERACIÓN
     ======================================================= */

  const handleCreateOperation =
    useCallback(
      async (
        values: OperationFormValues,
      ): Promise<Operation> => {
        try {
          setSaving(true);
          setError('');

          const createdOperation =
            await createOperation(
              values,
            );

          /**
           * Se actualiza inmediatamente el estado local
           * para que la interfaz responda sin esperar
           * el evento de Realtime.
           */
          setOperations(
            (currentOperations) => {
              const alreadyExists =
                currentOperations.some(
                  (operation) =>
                    operation.id ===
                    createdOperation.id,
                );

              if (alreadyExists) {
                return currentOperations;
              }

              return [
                createdOperation,
                ...currentOperations,
              ];
            },
          );

          setLastUpdated(new Date());

          /**
           * Se vuelve a consultar Supabase para recuperar
           * relaciones y datos calculados.
           */
          await loadOperations();

          return createdOperation;
        } catch (createError) {
          const message =
            getErrorMessage(
              createError,
              'No se pudo registrar la operación.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadOperations],
    );

  /* =======================================================
     EDITAR OPERACIÓN
     ======================================================= */

  const handleUpdateOperation =
    useCallback(
      async (
        operationId: string,
        values: OperationFormValues,
      ): Promise<Operation> => {
        try {
          setSaving(true);
          setError('');

          const updatedOperation =
            await updateOperation(
              operationId,
              values,
            );

          setOperations(
            (currentOperations) =>
              currentOperations.map(
                (operation) =>
                  operation.id ===
                  operationId
                    ? updatedOperation
                    : operation,
              ),
          );

          setLastUpdated(new Date());

          await loadOperations();

          return updatedOperation;
        } catch (updateError) {
          const message =
            getErrorMessage(
              updateError,
              'No se pudo actualizar la operación.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadOperations],
    );

  /* =======================================================
     ACTIVAR O DESACTIVAR
     ======================================================= */

  const handleChangeOperationStatus =
    useCallback(
      async (
        operationId: string,
        active: boolean,
      ): Promise<void> => {
        try {
          setSaving(true);
          setError('');

          const updatedOperation =
            await changeOperationStatus(
              operationId,
              active,
            );

          /**
           * Si Supabase devuelve la operación actualizada,
           * se reemplaza directamente.
           *
           * Si el modo demostración devuelve null,
           * se cambia solo el campo active.
           */
          setOperations(
            (currentOperations) =>
              currentOperations.map(
                (operation) => {
                  if (
                    operation.id !==
                    operationId
                  ) {
                    return operation;
                  }

                  return (
                    updatedOperation ?? {
                      ...operation,
                      active,
                    }
                  );
                },
              ),
          );

          setLastUpdated(new Date());

          await loadOperations();
        } catch (statusError) {
          const message =
            getErrorMessage(
              statusError,
              'No se pudo cambiar la actividad de la operación.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadOperations],
    );

  /* =======================================================
     ACTUALIZAR UN FILTRO
     ======================================================= */

  const updateFilter =
    useCallback(
      <
        Key extends keyof OperationsFilters,
      >(
        key: Key,
        value: OperationsFilters[Key],
      ): void => {
        setFilters(
          (currentFilters) => ({
            ...currentFilters,
            [key]: value,
          }),
        );
      },
      [],
    );

  /* =======================================================
     LIMPIAR FILTROS
     ======================================================= */

  const clearFilters =
    useCallback((): void => {
      setFilters({
        ...INITIAL_FILTERS,
      });
    }, []);

  /* =======================================================
     LIMPIAR ERROR
     ======================================================= */

  const clearError =
    useCallback((): void => {
      setError('');
    }, []);

  /* =======================================================
     RETORNO
     ======================================================= */

  return {
    operations,
    filteredOperations,
    summary,
    filters,

    loading,
    saving,
    error,
    lastUpdated,

    loadOperations,

    createOperation:
      handleCreateOperation,

    updateOperation:
      handleUpdateOperation,

    changeOperationStatus:
      handleChangeOperationStatus,

    updateFilter,
    clearFilters,
    clearError,
  };
}