import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useRealtimeModule,
} from '../../../shared/hooks/useRealtimeModule';

import {
  listObservationsData,
  openObservationEvidence,
  removeObservation,
  saveObservation,
} from './observations.service';

import type {
  ObservationAssignmentContext,
  ObservationFilters,
  ObservationFormValues,
  ObservationItem,
  ObservationSummary,
} from './observations.types';

const INITIAL_FILTERS:
ObservationFilters = {
  search: '',

  companyId: '',
  operationId: '',

  observationType: '',
  severity: '',
  status: '',
  source: '',

  overdueOnly: false,
  pendingResponseOnly: false,
};

const REALTIME_TABLES = [
  'observations',
  'gaps',
  'evaluations',
  'ai_analyses',
  'evidence_documents',
  'obligation_assignments',
  'obligation_catalog',
  'mining_operations',
  'companies',
];

function getMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function normalize(
  value?: string,
): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

function isOverdue(
  observation: ObservationItem,
): boolean {
  if (
    !observation.dueDate ||
    observation.status === 'Subsanada' ||
    observation.status === 'Cerrada' ||
    observation.status === 'Descartada'
  ) {
    return false;
  }

  const limit =
    new Date(
      `${observation.dueDate}T23:59:59`,
    );

  return limit.getTime() < Date.now();
}

export function useObservations() {
  const [
    contexts,
    setContexts,
  ] = useState<
    ObservationAssignmentContext[]
  >([]);

  const [
    observations,
    setObservations,
  ] = useState<ObservationItem[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<ObservationFilters>(
    INITIAL_FILTERS,
  );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

  const [
    openingEvidenceId,
    setOpeningEvidenceId,
  ] = useState<string | null>(null);

  const [error, setError] =
    useState('');

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(null);

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const result =
          await listObservationsData();

        setContexts(result.contexts);
        setObservations(
          result.observations,
        );

        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getMessage(
            loadError,
            'No se pudo cargar el módulo de observaciones.',
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useRealtimeModule(
    'fiscalizador-observaciones',
    REALTIME_TABLES,
    () => {
      void loadData();
    },
  );

  const companies =
    useMemo(() => {
      const map =
        new Map<string, string>();

      contexts.forEach((context) => {
        map.set(
          context.companyId,
          context.companyName,
        );
      });

      return Array.from(
        map.entries(),
      ).map(([id, name]) => ({
        id,
        name,
      }));
    }, [contexts]);

  const operations =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            id: string;
            name: string;
            companyId: string;
          }
        >();

      contexts.forEach((context) => {
        map.set(
          context.operationId,
          {
            id:
              context.operationId,

            name:
              context.operationName,

            companyId:
              context.companyId,
          },
        );
      });

      return Array.from(
        map.values(),
      );
    }, [contexts]);

  const filteredOperations =
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

  const filteredContexts =
    useMemo(() => {
      return contexts.filter(
        (context) => {
          const companyMatches =
            !filters.companyId ||
            context.companyId ===
              filters.companyId;

          const operationMatches =
            !filters.operationId ||
            context.operationId ===
              filters.operationId;

          return (
            companyMatches &&
            operationMatches
          );
        },
      );
    }, [
      contexts,
      filters.companyId,
      filters.operationId,
    ]);

  const filteredObservations =
    useMemo(() => {
      const search =
        normalize(filters.search);

      return observations.filter(
        (observation) => {
          const searchMatches =
            !search ||
            [
              observation.title,
              observation.description,
              observation.companyName,
              observation.operationName,
              observation.operationCode,
              observation.obligationCode,
              observation.obligationTitle,
              observation.responsibleName,
              observation.companyResponse,
              observation.verificationComment,
            ].some((value) =>
              normalize(value).includes(
                search,
              ),
            );

          const companyMatches =
            !filters.companyId ||
            observation.companyId ===
              filters.companyId;

          const operationMatches =
            !filters.operationId ||
            observation.operationId ===
              filters.operationId;

          const typeMatches =
            !filters.observationType ||
            observation.observationType ===
              filters.observationType;

          const severityMatches =
            !filters.severity ||
            observation.severity ===
              filters.severity;

          const statusMatches =
            !filters.status ||
            observation.status ===
              filters.status;

          const sourceMatches =
            !filters.source ||
            observation.source ===
              filters.source;

          const overdueMatches =
            !filters.overdueOnly ||
            isOverdue(observation);

          const pendingResponseMatches =
            !filters.pendingResponseOnly ||
            (
              observation.requiresResponse &&
              !observation.respondedAt &&
              ![
                'Subsanada',
                'Cerrada',
                'Descartada',
              ].includes(
                observation.status,
              )
            );

          return (
            searchMatches &&
            companyMatches &&
            operationMatches &&
            typeMatches &&
            severityMatches &&
            statusMatches &&
            sourceMatches &&
            overdueMatches &&
            pendingResponseMatches
          );
        },
      );
    }, [
      observations,
      filters,
    ]);

  const summary =
    useMemo<ObservationSummary>(() => ({
      total:
        observations.length,

      open:
        observations.filter(
          (item) =>
            item.status === 'Abierta',
        ).length,

      notified:
        observations.filter(
          (item) =>
            item.status === 'Notificada',
        ).length,

      responded:
        observations.filter(
          (item) =>
            item.status === 'Respondida',
        ).length,

      pendingVerification:
        observations.filter(
          (item) =>
            item.status ===
            'En verificación',
        ).length,

      resolved:
        observations.filter(
          (item) =>
            item.status === 'Subsanada' ||
            item.status === 'Cerrada',
        ).length,

      critical:
        observations.filter(
          (item) =>
            item.severity === 'Crítica',
        ).length,

      overdue:
        observations.filter(
          isOverdue,
        ).length,
    }), [observations]);

  const submitObservation =
    useCallback(
      async (
        values: ObservationFormValues,
      ) => {
        try {
          setSaving(true);
          setError('');

          const saved =
            await saveObservation(
              values,
            );

          await loadData();

          return saved;
        } catch (saveError) {
          const message =
            getMessage(
              saveError,
              'No se pudo guardar la observación.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadData],
    );

  const deleteObservation =
    useCallback(
      async (
        observationId: string,
      ) => {
        try {
          setDeleting(true);
          setError('');

          await removeObservation(
            observationId,
          );

          await loadData();
        } catch (deleteError) {
          const message =
            getMessage(
              deleteError,
              'No se pudo eliminar la observación.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setDeleting(false);
        }
      },
      [loadData],
    );

  const openEvidence =
    useCallback(
      async (
        evidenceId: string,
        storagePath: string,
      ) => {
        try {
          setOpeningEvidenceId(
            evidenceId,
          );
          setError('');

          await openObservationEvidence(
            storagePath,
          );
        } catch (openError) {
          setError(
            getMessage(
              openError,
              'No se pudo abrir la evidencia.',
            ),
          );
        } finally {
          setOpeningEvidenceId(null);
        }
      },
      [],
    );

  const updateFilter =
    useCallback(
      <
        Key extends keyof ObservationFilters,
      >(
        key: Key,
        value:
          ObservationFilters[Key],
      ) => {
        setFilters((current) => {
          if (key === 'companyId') {
            return {
              ...current,
              companyId:
                value as string,
              operationId: '',
            };
          }

          return {
            ...current,
            [key]: value,
          };
        });
      },
      [],
    );

  return {
    contexts,
    filteredContexts,

    observations,
    filteredObservations,

    companies,
    operations,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    deleting,
    openingEvidenceId,

    error,
    lastUpdated,

    loadData,
    submitObservation,
    deleteObservation,
    openEvidence,
    updateFilter,

    isOverdue,

    clearFilters: () =>
      setFilters({
        ...INITIAL_FILTERS,
      }),

    clearError: () =>
      setError(''),
  };
}