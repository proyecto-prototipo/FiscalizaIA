import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useRealtimeModule } from '../../../shared/hooks/useRealtimeModule';

import {
  downloadEvidenceFile,
  listEvidenceAssignmentOptions,
  listEvidences,
  openEvidenceFile,
  reviewEvidence,
  startEvidenceReview,
} from './evidences.service';

import type {
  EvidenceAssignmentOption,
  EvidenceCompanyOption,
  EvidenceDocument,
  EvidenceFilters,
  EvidenceOperationOption,
  EvidenceReviewFormValues,
  EvidenceSummary,
} from './evidences.types';

/* =========================================================
   VALORES INICIALES
   ========================================================= */

const INITIAL_FILTERS: EvidenceFilters = {
  search: '',
  companyId: '',
  operationId: '',
  assignmentId: '',
  status: '',
  criticality: '',
};

const REALTIME_TABLES = [
  'evidence_documents',
  'obligation_assignments',
  'obligation_catalog',
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

export function useEvidences() {
  const [
    evidences,
    setEvidences,
  ] = useState<EvidenceDocument[]>([]);

  const [
    assignmentOptions,
    setAssignmentOptions,
  ] = useState<EvidenceAssignmentOption[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<EvidenceFilters>(
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
    openingFileId,
    setOpeningFileId,
  ] = useState<string | null>(null);

  const [
    downloadingFileId,
    setDownloadingFileId,
  ] = useState<string | null>(null);

  const [
    error,
    setError,
  ] = useState('');

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(null);

  /* =======================================================
     CARGAR DATOS
     ======================================================= */

  const loadData =
    useCallback(async (): Promise<void> => {
      try {
        setLoading(true);
        setError('');

        const [
          evidenceResult,
          assignmentResult,
        ] = await Promise.all([
          listEvidences(),
          listEvidenceAssignmentOptions(),
        ]);

        setEvidences(evidenceResult);
        setAssignmentOptions(
          assignmentResult,
        );

        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getErrorMessage(
            loadError,
            'No se pudo cargar el módulo de evidencias.',
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  /* =======================================================
     REALTIME
     ======================================================= */

  useRealtimeModule(
    'fiscalizador-evidences',
    REALTIME_TABLES,
    () => {
      void loadData();
    },
  );

  /* =======================================================
     EMPRESAS DISPONIBLES
     ======================================================= */

  const companies =
    useMemo<EvidenceCompanyOption[]>(() => {
      const companyMap =
        new Map<string, string>();

      assignmentOptions.forEach(
        (assignment) => {
          if (!assignment.companyId) {
            return;
          }

          companyMap.set(
            assignment.companyId,
            assignment.companyName,
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
    }, [assignmentOptions]);

  /* =======================================================
     OPERACIONES DISPONIBLES
     ======================================================= */

  const operations =
    useMemo<EvidenceOperationOption[]>(() => {
      const operationMap =
        new Map<
          string,
          EvidenceOperationOption
        >();

      assignmentOptions.forEach(
        (assignment) => {
          operationMap.set(
            assignment.operationId,
            {
              id:
                assignment.operationId,

              companyId:
                assignment.companyId,

              companyName:
                assignment.companyName,

              name:
                assignment.operationName,
            },
          );
        },
      );

      return Array.from(
        operationMap.values(),
      ).sort((first, second) =>
        first.name.localeCompare(
          second.name,
          'es',
        ),
      );
    }, [assignmentOptions]);

  /* =======================================================
     OPERACIONES FILTRADAS POR EMPRESA
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

  const filteredAssignmentOptions =
    useMemo(() => {
      return assignmentOptions.filter(
        (assignment) => {
          const matchesCompany =
            !filters.companyId ||
            assignment.companyId ===
              filters.companyId;

          const matchesOperation =
            !filters.operationId ||
            assignment.operationId ===
              filters.operationId;

          return (
            matchesCompany &&
            matchesOperation
          );
        },
      );
    }, [
      assignmentOptions,
      filters.companyId,
      filters.operationId,
    ]);

  /* =======================================================
     EVIDENCIAS FILTRADAS
     ======================================================= */

  const filteredEvidences =
    useMemo<EvidenceDocument[]>(() => {
      const searchValue =
        filters.search
          .trim()
          .toLowerCase();

      return evidences.filter(
        (evidence) => {
          const searchableValues = [
            evidence.fileName,
            evidence.companyName,
            evidence.operationName,
            evidence.operationCode,
            evidence.obligationCode,
            evidence.obligationTitle,
            evidence.obligationCategory,
            evidence.requiredEvidence,
            evidence.reviewComment,
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
            evidence.companyId ===
              filters.companyId;

          const matchesOperation =
            !filters.operationId ||
            evidence.operationId ===
              filters.operationId;

          const matchesAssignment =
            !filters.assignmentId ||
            evidence.assignmentId ===
              filters.assignmentId;

          const matchesStatus =
            !filters.status ||
            evidence.status ===
              filters.status;

          const matchesCriticality =
            !filters.criticality ||
            evidence.obligationCriticality ===
              filters.criticality;

          return (
            matchesSearch &&
            matchesCompany &&
            matchesOperation &&
            matchesAssignment &&
            matchesStatus &&
            matchesCriticality
          );
        },
      );
    }, [
      evidences,
      filters,
    ]);

  /* =======================================================
     RESUMEN
     ======================================================= */

  const summary =
    useMemo<EvidenceSummary>(() => {
      const pending =
        evidences.filter(
          (evidence) =>
            evidence.status ===
            'Pendiente',
        ).length;

      const inReview =
        evidences.filter(
          (evidence) =>
            evidence.status ===
            'En revisión',
        ).length;

      const approved =
        evidences.filter(
          (evidence) =>
            evidence.status ===
            'Aprobada',
        ).length;

      const observed =
        evidences.filter(
          (evidence) =>
            evidence.status ===
              'Observada' ||
            evidence.status ===
              'Rechazada',
        ).length;

      return {
        total:
          evidences.length,

        pending,

        inReview,

        approved,

        observed,
      };
    }, [evidences]);

  /* =======================================================
     ABRIR ARCHIVO
     ======================================================= */

  const handleOpenEvidence =
    useCallback(
      async (
        evidence: EvidenceDocument,
      ): Promise<void> => {
        try {
          setOpeningFileId(
            evidence.id,
          );

          setError('');

          await openEvidenceFile(
            evidence,
          );
        } catch (openError) {
          setError(
            getErrorMessage(
              openError,
              'No se pudo abrir la evidencia.',
            ),
          );
        } finally {
          setOpeningFileId(null);
        }
      },
      [],
    );

  /* =======================================================
     DESCARGAR ARCHIVO
     ======================================================= */

  const handleDownloadEvidence =
    useCallback(
      async (
        evidence: EvidenceDocument,
      ): Promise<void> => {
        try {
          setDownloadingFileId(
            evidence.id,
          );

          setError('');

          await downloadEvidenceFile(
            evidence,
          );
        } catch (downloadError) {
          setError(
            getErrorMessage(
              downloadError,
              'No se pudo descargar la evidencia.',
            ),
          );
        } finally {
          setDownloadingFileId(null);
        }
      },
      [],
    );

  /* =======================================================
     INICIAR REVISIÓN
     ======================================================= */

  const handleStartReview =
    useCallback(
      async (
        evidenceId: string,
      ): Promise<EvidenceDocument> => {
        try {
          setSaving(true);
          setError('');

          const updatedEvidence =
            await startEvidenceReview(
              evidenceId,
            );

          setEvidences(
            (currentEvidences) =>
              currentEvidences.map(
                (evidence) =>
                  evidence.id ===
                  evidenceId
                    ? updatedEvidence
                    : evidence,
              ),
          );

          setLastUpdated(
            new Date(),
          );

          return updatedEvidence;
        } catch (reviewError) {
          const message =
            getErrorMessage(
              reviewError,
              'No se pudo iniciar la revisión.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  /* =======================================================
     GUARDAR REVISIÓN
     ======================================================= */

  const handleReviewEvidence =
    useCallback(
      async (
        evidenceId: string,
        values: EvidenceReviewFormValues,
      ): Promise<EvidenceDocument> => {
        try {
          setSaving(true);
          setError('');

          const updatedEvidence =
            await reviewEvidence(
              evidenceId,
              values,
            );

          setEvidences(
            (currentEvidences) =>
              currentEvidences.map(
                (evidence) =>
                  evidence.id ===
                  evidenceId
                    ? updatedEvidence
                    : evidence,
              ),
          );

          setLastUpdated(
            new Date(),
          );

          return updatedEvidence;
        } catch (reviewError) {
          const message =
            getErrorMessage(
              reviewError,
              'No se pudo guardar la revisión.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [],
    );

  /* =======================================================
     FILTROS
     ======================================================= */

  const updateFilter =
    useCallback(
      <
        Key extends keyof EvidenceFilters,
      >(
        key: Key,
        value: EvidenceFilters[Key],
      ): void => {
        setFilters(
          (currentFilters) => {
            if (key === 'companyId') {
              return {
                ...currentFilters,

                companyId:
                  value as string,

                operationId: '',
                assignmentId: '',
              };
            }

            if (key === 'operationId') {
              return {
                ...currentFilters,

                operationId:
                  value as string,

                assignmentId: '',
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
    evidences,
    filteredEvidences,

    assignmentOptions,
    filteredAssignmentOptions,

    companies,
    operations,
    filteredOperationOptions,

    filters,
    summary,

    loading,
    saving,
    openingFileId,
    downloadingFileId,

    error,
    lastUpdated,

    loadData,

    openEvidence:
      handleOpenEvidence,

    downloadEvidence:
      handleDownloadEvidence,

    startReview:
      handleStartReview,

    reviewEvidence:
      handleReviewEvidence,

    updateFilter,
    clearFilters,
    clearError,
  };
}