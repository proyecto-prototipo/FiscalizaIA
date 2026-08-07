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
  listResultsData,
  removeResult,
  saveResult,
} from './results.service';

import type {
  ResultContext,
  ResultFilters,
  ResultFormValues,
  ResultItem,
  ResultSummary,
} from './results.types';

const INITIAL_FILTERS:
ResultFilters = {
  search: '',

  companyId: '',
  operationId: '',

  complianceStatus: '',
  riskLevel: '',
  status: '',
};

const REALTIME_TABLES = [
  'evaluation_results',
  'evaluations',
  'gaps',
  'observations',
  'recommendations',
  'obligation_assignments',
  'obligation_catalog',
  'mining_operations',
  'companies',
];

function normalize(
  value?: string,
): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es');
}

function getMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export function useResults() {
  const [
    contexts,
    setContexts,
  ] = useState<ResultContext[]>([]);

  const [
    results,
    setResults,
  ] = useState<ResultItem[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<ResultFilters>({
    ...INITIAL_FILTERS,
  });

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [deleting, setDeleting] =
    useState(false);

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

        const data =
          await listResultsData();

        setContexts(data.contexts);
        setResults(data.results);

        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getMessage(
            loadError,
            'No se pudo cargar el módulo de resultados.',
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
    'fiscalizador-resultados',
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

  const filteredResults =
    useMemo(() => {
      const search =
        normalize(filters.search);

      return results.filter((result) => {
        const matchesSearch =
          !search ||
          [
            result.companyName,
            result.operationName,
            result.obligationCode,
            result.obligationTitle,
            result.conclusion,
            result.executiveSummary,
          ].some((value) =>
            normalize(value).includes(
              search,
            ),
          );

        return (
          matchesSearch &&

          (
            !filters.companyId ||
            result.companyId ===
              filters.companyId
          ) &&

          (
            !filters.operationId ||
            result.operationId ===
              filters.operationId
          ) &&

          (
            !filters.complianceStatus ||
            result.complianceStatus ===
              filters.complianceStatus
          ) &&

          (
            !filters.riskLevel ||
            result.riskLevel ===
              filters.riskLevel
          ) &&

          (
            !filters.status ||
            result.status ===
              filters.status
          )
        );
      });
    }, [
      results,
      filters,
    ]);

  const summary =
    useMemo<ResultSummary>(() => {
      const totalScore =
        results.reduce(
          (sum, result) =>
            sum + result.score,
          0,
        );

      return {
        total:
          results.length,

        drafts:
          results.filter(
            (result) =>
              result.status === 'Borrador',
          ).length,

        finalized:
          results.filter(
            (result) =>
              result.status ===
              'Finalizado',
          ).length,

        compliant:
          results.filter(
            (result) =>
              result.complianceStatus ===
              'Cumple',
          ).length,

        partial:
          results.filter(
            (result) =>
              result.complianceStatus ===
              'Cumple parcialmente',
          ).length,

        nonCompliant:
          results.filter(
            (result) =>
              result.complianceStatus ===
              'No cumple',
          ).length,

        criticalRisk:
          results.filter(
            (result) =>
              result.riskLevel ===
              'Crítico',
          ).length,

        averageScore:
          results.length
            ? Math.round(
                totalScore /
                results.length,
              )
            : 0,
      };
    }, [results]);

  const submitResult =
    useCallback(
      async (
        values: ResultFormValues,
      ) => {
        const context =
          contexts.find(
            (item) =>
              item.assignmentId ===
              values.assignmentId,
          );

        if (!context) {
          throw new Error(
            'No se encontró el contexto de la obligación.',
          );
        }

        try {
          setSaving(true);
          setError('');

          const saved =
            await saveResult(
              values,
              context,
            );

          await loadData();

          return saved;
        } catch (saveError) {
          const message =
            getMessage(
              saveError,
              'No se pudo guardar el resultado.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [
        contexts,
        loadData,
      ],
    );

  const deleteResult =
    useCallback(
      async (resultId: string) => {
        try {
          setDeleting(true);
          setError('');

          await removeResult(resultId);
          await loadData();
        } catch (deleteError) {
          const message =
            getMessage(
              deleteError,
              'No se pudo eliminar el resultado.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setDeleting(false);
        }
      },
      [loadData],
    );

  const updateFilter =
    useCallback(
      <
        Key extends keyof ResultFilters,
      >(
        key: Key,
        value: ResultFilters[Key],
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

    results,
    filteredResults,

    companies,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    deleting,

    error,
    lastUpdated,

    loadData,
    submitResult,
    deleteResult,
    updateFilter,

    clearFilters: () =>
      setFilters({
        ...INITIAL_FILTERS,
      }),

    clearError: () =>
      setError(''),
  };
}