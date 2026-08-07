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
  listEvaluationItems,
  openEvaluationEvidence,
  removeEvaluation,
  saveEvaluation,
} from './evaluations.service';

import type {
  EvaluationFilters,
  EvaluationFormValues,
  EvaluationItem,
  EvaluationSummary,
} from './evaluations.types';

const INITIAL_FILTERS:
EvaluationFilters = {
  search: '',
  companyId: '',
  operationId: '',
  complianceStatus: '',
  riskLevel: '',
  validationStatus: '',
};

const REALTIME_TABLES = [
  'evaluations',
  'obligation_assignments',
  'obligation_catalog',
  'evidence_documents',
  'ai_analyses',
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

export function useEvaluations() {
  const [
    items,
    setItems,
  ] = useState<EvaluationItem[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<EvaluationFilters>(
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
          await listEvaluationItems();

        setItems(result);
        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getMessage(
            loadError,
            'No se pudo cargar el módulo de evaluaciones.',
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
    'fiscalizador-evaluaciones',
    REALTIME_TABLES,
    () => {
      void loadData();
    },
  );

  const companies =
    useMemo(() => {
      const map =
        new Map<string, string>();

      items.forEach((item) => {
        map.set(
          item.companyId,
          item.companyName,
        );
      });

      return Array.from(
        map.entries(),
      ).map(([id, name]) => ({
        id,
        name,
      }));
    }, [items]);

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

      items.forEach((item) => {
        map.set(
          item.operationId,
          {
            id:
              item.operationId,

            name:
              item.operationName,

            companyId:
              item.companyId,
          },
        );
      });

      return Array.from(
        map.values(),
      );
    }, [items]);

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

  const filteredItems =
    useMemo(() => {
      const search =
        normalize(filters.search);

      return items.filter(
        (item) => {
          const evaluation =
            item.evaluation;

          const matchesSearch =
            !search ||
            [
              item.companyName,
              item.operationName,
              item.operationCode,
              item.obligationCode,
              item.obligationTitle,
              item.category,
              item.requiredEvidence,
              evaluation
                ?.evaluationComment,
              evaluation
                ?.correctiveAction,
            ].some((value) =>
              normalize(value).includes(
                search,
              ),
            );

          const matchesCompany =
            !filters.companyId ||
            item.companyId ===
              filters.companyId;

          const matchesOperation =
            !filters.operationId ||
            item.operationId ===
              filters.operationId;

          const matchesCompliance =
            !filters.complianceStatus ||
            evaluation
              ?.complianceStatus ===
              filters.complianceStatus;

          const matchesRisk =
            !filters.riskLevel ||
            evaluation?.riskLevel ===
              filters.riskLevel;

          const matchesValidation =
            !filters.validationStatus ||
            (
              filters.validationStatus ===
                'Validada'
                ? evaluation?.validated ===
                  true
                : !evaluation?.validated
            );

          return (
            matchesSearch &&
            matchesCompany &&
            matchesOperation &&
            matchesCompliance &&
            matchesRisk &&
            matchesValidation
          );
        },
      );
    }, [
      items,
      filters,
    ]);

  const summary =
    useMemo<EvaluationSummary>(() => {
      const evaluations =
        items
          .map((item) =>
            item.evaluation,
          )
          .filter(
            (
              evaluation,
            ): evaluation is NonNullable<
              EvaluationItem[
                'evaluation'
              ]
            > =>
              Boolean(evaluation),
          );

      const totalScore =
        evaluations.reduce(
          (total, evaluation) =>
            total +
            evaluation.score,
          0,
        );

      return {
        total:
          items.length,

        pending:
          items.filter(
            (item) =>
              !item.evaluation,
          ).length,

        evaluated:
          evaluations.length,

        validated:
          evaluations.filter(
            (evaluation) =>
              evaluation.validated,
          ).length,

        nonCompliant:
          evaluations.filter(
            (evaluation) =>
              evaluation
                .complianceStatus ===
              'No cumple',
          ).length,

        highRisk:
          evaluations.filter(
            (evaluation) =>
              evaluation.riskLevel ===
                'Alto' ||
              evaluation.riskLevel ===
                'Crítico',
          ).length,

        averageScore:
          evaluations.length === 0
            ? 0
            : totalScore /
              evaluations.length,
      };
    }, [items]);

  const submitEvaluation =
    useCallback(
      async (
        values:
          EvaluationFormValues,
      ) => {
        try {
          setSaving(true);
          setError('');

          const saved =
            await saveEvaluation(
              values,
            );

          setItems((current) =>
            current.map((item) =>
              item.assignmentId ===
              saved.assignmentId
                ? {
                    ...item,
                    evaluation:
                      saved,
                  }
                : item,
            ),
          );

          await loadData();

          return saved;
        } catch (saveError) {
          const message =
            getMessage(
              saveError,
              'No se pudo guardar la evaluación.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadData],
    );

  const deleteEvaluation =
    useCallback(
      async (
        evaluationId: string,
      ) => {
        try {
          setDeleting(true);
          setError('');

          await removeEvaluation(
            evaluationId,
          );

          await loadData();
        } catch (deleteError) {
          const message =
            getMessage(
              deleteError,
              'No se pudo eliminar la evaluación.',
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

          await openEvaluationEvidence(
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
        Key extends keyof EvaluationFilters,
      >(
        key: Key,
        value:
          EvaluationFilters[Key],
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
    items,
    filteredItems,

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
    submitEvaluation,
    deleteEvaluation,
    openEvidence,
    updateFilter,

    clearFilters: () =>
      setFilters({
        ...INITIAL_FILTERS,
      }),

    clearError: () =>
      setError(''),
  };
}