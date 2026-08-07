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
  listRecommendationsData,
  removeRecommendation,
  saveRecommendation,
} from './recommendations.service';

import type {
  RecommendationContext,
  RecommendationFilters,
  RecommendationFormValues,
  RecommendationItem,
  RecommendationSummary,
} from './recommendations.types';

const INITIAL_FILTERS:
RecommendationFilters = {
  search: '',
  companyId: '',
  operationId: '',

  recommendationType: '',
  priority: '',
  status: '',
  source: '',

  overdueOnly: false,
};

const REALTIME_TABLES = [
  'recommendations',
  'observations',
  'gaps',
  'evaluations',
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

function isOverdue(
  recommendation: RecommendationItem,
): boolean {
  if (
    !recommendation.dueDate ||
    [
      'Implementada',
      'Verificada',
      'Descartada',
    ].includes(recommendation.status)
  ) {
    return false;
  }

  const date =
    new Date(
      `${recommendation.dueDate}T23:59:59`,
    );

  return date.getTime() < Date.now();
}

export function useRecommendations() {
  const [
    contexts,
    setContexts,
  ] = useState<RecommendationContext[]>([]);

  const [
    recommendations,
    setRecommendations,
  ] = useState<RecommendationItem[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<RecommendationFilters>({
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

        const result =
          await listRecommendationsData();

        setContexts(result.contexts);

        setRecommendations(
          result.recommendations,
        );

        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getMessage(
            loadError,
            'No se pudo cargar el módulo de recomendaciones.',
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
    'fiscalizador-recomendaciones',
    REALTIME_TABLES,
    () => {
      void loadData();
    },
  );

  const companies =
    useMemo(() => {
      const values =
        new Map<string, string>();

      contexts.forEach((context) => {
        values.set(
          context.companyId,
          context.companyName,
        );
      });

      return Array.from(
        values.entries(),
      ).map(([id, name]) => ({
        id,
        name,
      }));
    }, [contexts]);

  const operations =
    useMemo(() => {
      const values =
        new Map<
          string,
          {
            id: string;
            name: string;
            companyId: string;
          }
        >();

      contexts.forEach((context) => {
        values.set(
          context.operationId,
          {
            id: context.operationId,
            name: context.operationName,
            companyId: context.companyId,
          },
        );
      });

      return Array.from(
        values.values(),
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

  const filteredRecommendations =
    useMemo(() => {
      const search =
        normalize(filters.search);

      return recommendations.filter(
        (recommendation) => {
          const searchMatches =
            !search ||
            [
              recommendation.title,
              recommendation.description,
              recommendation.companyName,
              recommendation.operationName,
              recommendation.obligationCode,
              recommendation.obligationTitle,
              recommendation.responsibleName,
              recommendation.expectedResult,
            ].some((value) =>
              normalize(value).includes(
                search,
              ),
            );

          return (
            searchMatches &&

            (
              !filters.companyId ||
              recommendation.companyId ===
                filters.companyId
            ) &&

            (
              !filters.operationId ||
              recommendation.operationId ===
                filters.operationId
            ) &&

            (
              !filters.recommendationType ||
              recommendation.recommendationType ===
                filters.recommendationType
            ) &&

            (
              !filters.priority ||
              recommendation.priority ===
                filters.priority
            ) &&

            (
              !filters.status ||
              recommendation.status ===
                filters.status
            ) &&

            (
              !filters.source ||
              recommendation.source ===
                filters.source
            ) &&

            (
              !filters.overdueOnly ||
              isOverdue(recommendation)
            )
          );
        },
      );
    }, [
      recommendations,
      filters,
    ]);

  const summary =
    useMemo<RecommendationSummary>(() => {
      const totalProgress =
        recommendations.reduce(
          (sum, item) =>
            sum + item.progress,
          0,
        );

      return {
        total:
          recommendations.length,

        pending:
          recommendations.filter(
            (item) =>
              item.status === 'Pendiente',
          ).length,

        inProgress:
          recommendations.filter(
            (item) =>
              item.status ===
              'En ejecución',
          ).length,

        implemented:
          recommendations.filter(
            (item) =>
              item.status ===
              'Implementada',
          ).length,

        verified:
          recommendations.filter(
            (item) =>
              item.status === 'Verificada',
          ).length,

        urgent:
          recommendations.filter(
            (item) =>
              item.priority === 'Urgente',
          ).length,

        overdue:
          recommendations.filter(
            isOverdue,
          ).length,

        averageProgress:
          recommendations.length
            ? Math.round(
                totalProgress /
                recommendations.length,
              )
            : 0,
      };
    }, [recommendations]);

  const submitRecommendation =
    useCallback(
      async (
        values:
        RecommendationFormValues,
      ) => {
        try {
          setSaving(true);
          setError('');

          const saved =
            await saveRecommendation(
              values,
            );

          await loadData();

          return saved;
        } catch (saveError) {
          const message =
            getMessage(
              saveError,
              'No se pudo guardar la recomendación.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadData],
    );

  const deleteRecommendation =
    useCallback(
      async (id: string) => {
        try {
          setDeleting(true);
          setError('');

          await removeRecommendation(id);
          await loadData();
        } catch (deleteError) {
          const message =
            getMessage(
              deleteError,
              'No se pudo eliminar la recomendación.',
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
        Key extends keyof RecommendationFilters,
      >(
        key: Key,
        value:
          RecommendationFilters[Key],
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

    recommendations,
    filteredRecommendations,

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
    submitRecommendation,
    deleteRecommendation,
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