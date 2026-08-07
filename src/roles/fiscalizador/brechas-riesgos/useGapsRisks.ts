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
  listGapsRisksData,
  openGapEvidence,
  removeGapRisk,
  saveGapRisk,
} from './gaps-risks.service';

import type {
  GapAssignmentContext,
  GapFilters,
  GapFormValues,
  GapRiskItem,
  GapSummary,
} from './gapsRisks.types';

/* =========================================================
   FILTROS INICIALES

   IMPORTANTE:
   Los select "Todos" deben usar cadena vacía.
========================================================= */

const INITIAL_FILTERS: GapFilters = {
  search: '',

  companyId: '',
  operationId: '',

  riskLevel: '',
  status: '',
  source: '',
  priority: '',

  overdueOnly: false,
};

/* =========================================================
   TABLAS REALTIME
========================================================= */

const REALTIME_TABLES = [
  'gaps',
  'evaluations',
  'ai_analyses',
  'evidence_documents',
  'obligation_assignments',
  'obligation_catalog',
  'mining_operations',
  'companies',
];

/* =========================================================
   UTILIDADES
========================================================= */

function getMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function normalize(
  value: string | null | undefined,
): string {
  return String(value ?? '')
    .trim()
    .toLocaleLowerCase('es');
}

function isGapOverdue(
  gap: GapRiskItem,
): boolean {
  if (!gap.dueDate) {
    return false;
  }

  if (
    gap.status === 'Cerrada' ||
    gap.status === 'Descartada'
  ) {
    return false;
  }

  const dueDate =
    new Date(`${gap.dueDate}T23:59:59`);

  if (
    Number.isNaN(
      dueDate.getTime(),
    )
  ) {
    return false;
  }

  return dueDate.getTime() < Date.now();
}

/* =========================================================
   HOOK PRINCIPAL
========================================================= */

export function useGapsRisks() {
  const [
    contexts,
    setContexts,
  ] = useState<GapAssignmentContext[]>([]);

  const [
    gaps,
    setGaps,
  ] = useState<GapRiskItem[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<GapFilters>({
    ...INITIAL_FILTERS,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    openingEvidenceId,
    setOpeningEvidenceId,
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
     CARGA DE DATOS
  ======================================================= */

  const loadData =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const result =
          await listGapsRisksData();

        console.log(
          'Contextos de brechas:',
          result.contexts,
        );

        console.log(
          'Brechas cargadas:',
          result.gaps,
        );

        setContexts(result.contexts);
        setGaps(result.gaps);

        setLastUpdated(new Date());
      } catch (loadError) {
        console.error(
          '[Brechas] Error al cargar el módulo:',
          loadError,
        );

        setError(
          getMessage(
            loadError,
            'No se pudo cargar el módulo de brechas y riesgos.',
          ),
        );

        setContexts([]);
        setGaps([]);
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
    'fiscalizador-brechas-riesgos',
    REALTIME_TABLES,
    () => {
      void loadData();
    },
  );

  /* =======================================================
     EMPRESAS
  ======================================================= */

  const companies =
    useMemo(() => {
      const companyMap =
        new Map<string, string>();

      contexts.forEach((context) => {
        companyMap.set(
          context.companyId,
          context.companyName,
        );
      });

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
    }, [contexts]);

  /* =======================================================
     OPERACIONES
  ======================================================= */

  const operations =
    useMemo(() => {
      const operationMap =
        new Map<
          string,
          {
            id: string;
            name: string;
            companyId: string;
          }
        >();

      contexts.forEach((context) => {
        operationMap.set(
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
        operationMap.values(),
      ).sort((first, second) =>
        first.name.localeCompare(
          second.name,
          'es',
        ),
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

  /* =======================================================
     CONTEXTOS DE OBLIGACIONES

     Solo se filtran por empresa y operación.
  ======================================================= */

  const filteredContexts =
    useMemo(() => {
      return contexts.filter(
        (context) => {
          const matchesCompany =
            !filters.companyId ||
            context.companyId ===
              filters.companyId;

          const matchesOperation =
            !filters.operationId ||
            context.operationId ===
              filters.operationId;

          return (
            matchesCompany &&
            matchesOperation
          );
        },
      );
    }, [
      contexts,
      filters.companyId,
      filters.operationId,
    ]);

  /* =======================================================
     FILTRADO DE BRECHAS

     Esta es la corrección principal.
  ======================================================= */

  const filteredGaps =
    useMemo(() => {
      const normalizedSearch =
        normalize(filters.search);

      const result =
        gaps.filter((gap) => {
          const searchableValues = [
            gap.title,
            gap.description,
            gap.companyName,
            gap.operationName,
            gap.operationCode,
            gap.obligationCode,
            gap.obligationTitle,
            gap.obligationDescription,
            gap.category,
            gap.technicalBasis,
            gap.treatmentMeasure,
            gap.responsibleName,
            gap.riskLevel,
            gap.status,
            gap.source,
            gap.priority,
          ];

          const matchesSearch =
            normalizedSearch.length === 0 ||
            searchableValues.some(
              (value) =>
                normalize(value).includes(
                  normalizedSearch,
                ),
            );

          const matchesCompany =
            filters.companyId === '' ||
            gap.companyId ===
              filters.companyId;

          const matchesOperation =
            filters.operationId === '' ||
            gap.operationId ===
              filters.operationId;

          const matchesRisk =
            filters.riskLevel === '' ||
            gap.riskLevel ===
              filters.riskLevel;

          const matchesStatus =
            filters.status === '' ||
            gap.status ===
              filters.status;

          const matchesSource =
            filters.source === '' ||
            gap.source ===
              filters.source;

          const matchesPriority =
            filters.priority === '' ||
            gap.priority ===
              filters.priority;

          const matchesOverdue =
            filters.overdueOnly === false ||
            isGapOverdue(gap);

          return (
            matchesSearch &&
            matchesCompany &&
            matchesOperation &&
            matchesRisk &&
            matchesStatus &&
            matchesSource &&
            matchesPriority &&
            matchesOverdue
          );
        });

      console.log(
        '[Brechas] Total recibido por el hook:',
        gaps.length,
      );

      console.log(
        '[Brechas] Total después de filtros:',
        result.length,
      );

      console.log(
        '[Brechas] Filtros activos:',
        filters,
      );

      return result;
    }, [
      gaps,
      filters.search,
      filters.companyId,
      filters.operationId,
      filters.riskLevel,
      filters.status,
      filters.source,
      filters.priority,
      filters.overdueOnly,
    ]);

  /* =======================================================
     RESUMEN

     Los indicadores se calculan sobre todas las brechas.
  ======================================================= */

  const summary =
    useMemo<GapSummary>(() => {
      return {
        total:
          gaps.length,

        open:
          gaps.filter(
            (gap) =>
              gap.status === 'Abierta',
          ).length,

        inTreatment:
          gaps.filter(
            (gap) =>
              gap.status ===
              'En tratamiento',
          ).length,

        pendingVerification:
          gaps.filter(
            (gap) =>
              gap.status ===
              'Pendiente de verificación',
          ).length,

        closed:
          gaps.filter(
            (gap) =>
              gap.status === 'Cerrada',
          ).length,

        highRisk:
          gaps.filter(
            (gap) =>
              gap.riskLevel === 'Alto' ||
              gap.riskLevel ===
                'Crítico',
          ).length,

        urgent:
          gaps.filter(
            (gap) =>
              gap.priority === 'Urgente',
          ).length,

        overdue:
          gaps.filter(
            isGapOverdue,
          ).length,
      };
    }, [gaps]);

  /* =======================================================
     GUARDAR
  ======================================================= */

  const submitGap =
    useCallback(
      async (
        values: GapFormValues,
      ) => {
        try {
          setSaving(true);
          setError('');

          const saved =
            await saveGapRisk(values);

          await loadData();

          return saved;
        } catch (saveError) {
          const message =
            getMessage(
              saveError,
              'No se pudo guardar la brecha.',
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
     ELIMINAR
  ======================================================= */

  const deleteGap =
    useCallback(
      async (
        gapId: string,
      ) => {
        try {
          setDeleting(true);
          setError('');

          await removeGapRisk(gapId);

          await loadData();
        } catch (deleteError) {
          const message =
            getMessage(
              deleteError,
              'No se pudo eliminar la brecha.',
            );

          setError(message);

          throw new Error(message);
        } finally {
          setDeleting(false);
        }
      },
      [loadData],
    );

  /* =======================================================
     ABRIR EVIDENCIA
  ======================================================= */

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

          await openGapEvidence(
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

  /* =======================================================
     ACTUALIZAR FILTROS
  ======================================================= */

  const updateFilter =
    useCallback(
      <
        Key extends keyof GapFilters,
      >(
        key: Key,
        value: GapFilters[Key],
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

  /* =======================================================
     RETORNO
  ======================================================= */

  return {
    contexts,
    filteredContexts,

    gaps,
    filteredGaps,

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
    submitGap,
    deleteGap,
    openEvidence,
    updateFilter,

    isOverdue:
      isGapOverdue,

    clearFilters,
    clearError,
  };
}