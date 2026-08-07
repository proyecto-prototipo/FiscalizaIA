import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRealtimeModule } from '../../../shared/hooks/useRealtimeModule';

import {
  invokeEvidenceAnalysis,
  listAiAnalyses,
  listCandidateEvidences,
  openAiEvidenceFile,
  validateAiAnalysis,
} from './ai-review.service';

import type {
  AiAnalysis,
  AiCandidateEvidence,
  AiHumanReviewForm,
  AiReviewFilters,
  AiReviewSummary,
} from './aiReview.types';

const INITIAL_FILTERS: AiReviewFilters = {
  search: '',
  companyId: '',
  operationId: '',
  processingStatus: '',
  complianceStatus: '',
  riskLevel: '',
  humanStatus: '',
};

const REALTIME_TABLES = [
  'ai_analyses',
  'evidence_documents',
  'obligation_assignments',
  'obligation_catalog',
  'mining_operations',
  'companies',
];

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function normalizeText(value?: string): string {
  return value
    ?.trim()
    .toLowerCase() ?? '';
}

export function useAIReview() {
  const [analyses, setAnalyses] =
    useState<AiAnalysis[]>([]);

  const [candidates, setCandidates] =
    useState<AiCandidateEvidence[]>([]);

  const [filters, setFilters] =
    useState<AiReviewFilters>(
      INITIAL_FILTERS,
    );

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [
    processingEvidenceId,
    setProcessingEvidenceId,
  ] = useState<string | null>(null);

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

        const [
          analysesResult,
          candidatesResult,
        ] = await Promise.all([
          listAiAnalyses(),
          listCandidateEvidences(),
        ]);

        setAnalyses(analysesResult);
        setCandidates(candidatesResult);
        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            'No se pudo cargar el módulo de Revisión IA.',
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
    'fiscalizador-revision-ia',
    REALTIME_TABLES,
    () => {
      void loadData();
    },
  );

  const companies =
    useMemo(() => {
      const map =
        new Map<string, string>();

      candidates.forEach((candidate) => {
        if (candidate.companyId) {
          map.set(
            candidate.companyId,
            candidate.companyName,
          );
        }
      });

      return Array.from(
        map.entries(),
      ).map(([id, name]) => ({
        id,
        name,
      }));
    }, [candidates]);

  const operations =
    useMemo(() => {
      const map =
        new Map<
          string,
          {
            id: string;
            name: string;
            companyId?: string;
          }
        >();

      candidates.forEach((candidate) => {
        map.set(candidate.operationId, {
          id: candidate.operationId,
          name: candidate.operationName,
          companyId: candidate.companyId,
        });
      });

      return Array.from(
        map.values(),
      );
    }, [candidates]);

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

  const filteredCandidates =
    useMemo(() => {
      const search =
        normalizeText(filters.search);

      return candidates.filter(
        (candidate) => {
          const matchesSearch =
            !search ||
            [
              candidate.fileName,
              candidate.companyName,
              candidate.operationName,
              candidate.operationCode,
              candidate.obligationCode,
              candidate.obligationTitle,
              candidate.obligationCategory,
            ].some((value) =>
              normalizeText(value).includes(
                search,
              ),
            );

          const matchesCompany =
            !filters.companyId ||
            candidate.companyId ===
              filters.companyId;

          const matchesOperation =
            !filters.operationId ||
            candidate.operationId ===
              filters.operationId;

          return (
            matchesSearch &&
            matchesCompany &&
            matchesOperation
          );
        },
      );
    }, [
      candidates,
      filters.search,
      filters.companyId,
      filters.operationId,
    ]);

  const filteredAnalyses =
    useMemo(() => {
      const search =
        normalizeText(filters.search);

      return analyses.filter(
        (analysis) => {
          const matchesSearch =
            !search ||
            [
              analysis.fileName,
              analysis.companyName,
              analysis.operationName,
              analysis.operationCode,
              analysis.obligationCode,
              analysis.obligationTitle,
              analysis.documentSummary,
              analysis.documentType,
              analysis.model,
            ].some((value) =>
              normalizeText(value).includes(
                search,
              ),
            );

          const matchesCompany =
            !filters.companyId ||
            analysis.companyId ===
              filters.companyId;

          const matchesOperation =
            !filters.operationId ||
            analysis.operationId ===
              filters.operationId;

          const matchesProcessing =
            !filters.processingStatus ||
            analysis.processingStatus ===
              filters.processingStatus;

          const matchesCompliance =
            !filters.complianceStatus ||
            analysis.complianceStatus ===
              filters.complianceStatus;

          const matchesRisk =
            !filters.riskLevel ||
            analysis.riskLevel ===
              filters.riskLevel;

          const matchesHumanStatus =
            !filters.humanStatus ||
            analysis.humanStatus ===
              filters.humanStatus;

          return (
            matchesSearch &&
            matchesCompany &&
            matchesOperation &&
            matchesProcessing &&
            matchesCompliance &&
            matchesRisk &&
            matchesHumanStatus
          );
        },
      );
    }, [
      analyses,
      filters,
    ]);

  const summary =
    useMemo<AiReviewSummary>(() => ({
      totalEvidences:
        candidates.length,

      pending:
        candidates.filter(
          (candidate) =>
            candidate.aiStatus ===
            'Pendiente',
        ).length,

      processing:
        analyses.filter(
          (analysis) =>
            analysis.processingStatus ===
            'Procesando',
        ).length,

      completed:
        analyses.filter(
          (analysis) =>
            analysis.processingStatus ===
            'Completado',
        ).length,

      errors:
        analyses.filter(
          (analysis) =>
            analysis.processingStatus ===
            'Error',
        ).length,

      highRisk:
        analyses.filter(
          (analysis) =>
            analysis.riskLevel === 'Alto' ||
            analysis.riskLevel ===
              'Crítico',
        ).length,

      pendingValidation:
        analyses.filter(
          (analysis) =>
            analysis.processingStatus ===
              'Completado' &&
            analysis.humanStatus ===
              'Pendiente',
        ).length,
    }), [
      analyses,
      candidates,
    ]);

  const analyzeEvidence =
    useCallback(
      async (
        evidenceId: string,
      ) => {
        try {
          setProcessingEvidenceId(
            evidenceId,
          );

          setError('');

          const response =
            await invokeEvidenceAnalysis(
              evidenceId,
            );

          await loadData();

          return response;
        } catch (analysisError) {
          const message =
            getErrorMessage(
              analysisError,
              'No se pudo ejecutar el análisis con IA.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setProcessingEvidenceId(null);
        }
      },
      [loadData],
    );

  const reviewAnalysis =
    useCallback(
      async (
        analysisId: string,
        values: AiHumanReviewForm,
      ) => {
        try {
          setSaving(true);
          setError('');

          const updatedAnalysis =
            await validateAiAnalysis(
              analysisId,
              values,
            );

          setAnalyses((current) =>
            current.map((analysis) =>
              analysis.id === analysisId
                ? updatedAnalysis
                : analysis,
            ),
          );

          await loadData();

          return updatedAnalysis;
        } catch (reviewError) {
          const message =
            getErrorMessage(
              reviewError,
              'No se pudo guardar la validación.',
            );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
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

          await openAiEvidenceFile(
            storagePath,
          );
        } catch (openError) {
          setError(
            getErrorMessage(
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
        Key extends keyof AiReviewFilters,
      >(
        key: Key,
        value: AiReviewFilters[Key],
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

  const clearFilters =
    useCallback(() => {
      setFilters({
        ...INITIAL_FILTERS,
      });
    }, []);

  const clearError =
    useCallback(() => {
      setError('');
    }, []);

  return {
    analyses,
    candidates,

    filteredAnalyses,
    filteredCandidates,

    companies,
    operations,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    processingEvidenceId,
    openingEvidenceId,
    error,
    lastUpdated,

    loadData,
    analyzeEvidence,
    reviewAnalysis,
    openEvidence,
    updateFilter,
    clearFilters,
    clearError,
  };
}