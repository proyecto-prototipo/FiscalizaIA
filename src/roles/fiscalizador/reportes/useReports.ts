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
  listReportsData,
  removeReport,
  saveReport,
} from './reports.service';

import type {
  ReportContext,
  ReportFilters,
  ReportFormValues,
  ReportItem,
  ReportSummary,
} from './reports.types';

const INITIAL_FILTERS:
ReportFilters = {
  search: '',

  companyId: '',
  operationId: '',

  reportType: '',
  status: '',
  complianceLevel: '',
};

const REALTIME_TABLES = [
  'compliance_reports',
  'evaluation_results',
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

export function useReports() {
  const [
    contexts,
    setContexts,
  ] = useState<ReportContext[]>([]);

  const [
    reports,
    setReports,
  ] = useState<ReportItem[]>([]);

  const [
    filters,
    setFilters,
  ] = useState<ReportFilters>({
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
          await listReportsData();

        setContexts(data.contexts);
        setReports(data.reports);

        setLastUpdated(new Date());
      } catch (loadError) {
        setError(
          getMessage(
            loadError,
            'No se pudo cargar el módulo de reportes.',
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
    'fiscalizador-reportes',
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
      return contexts.map(
        (context) => ({
          id:
            context.operationId,

          name:
            context.operationName,

          companyId:
            context.companyId,
        }),
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

  const filteredReports =
    useMemo(() => {
      const search =
        normalize(filters.search);

      return reports.filter(
        (report) => {
          const searchMatches =
            !search ||
            [
              report.title,
              report.companyName,
              report.operationName,
              report.executiveSummary,
              report.conclusions,
            ].some((value) =>
              normalize(value).includes(
                search,
              ),
            );

          return (
            searchMatches &&

            (
              !filters.companyId ||
              report.companyId ===
                filters.companyId
            ) &&

            (
              !filters.operationId ||
              report.operationId ===
                filters.operationId
            ) &&

            (
              !filters.reportType ||
              report.reportType ===
                filters.reportType
            ) &&

            (
              !filters.status ||
              report.status ===
                filters.status
            ) &&

            (
              !filters.complianceLevel ||
              report.complianceLevel ===
                filters.complianceLevel
            )
          );
        },
      );
    }, [
      reports,
      filters,
    ]);

  const summary =
    useMemo<ReportSummary>(() => {
      const totalScore =
        reports.reduce(
          (sum, report) =>
            sum + report.overallScore,
          0,
        );

      return {
        total:
          reports.length,

        drafts:
          reports.filter(
            (report) =>
              report.status ===
              'Borrador',
          ).length,

        generated:
          reports.filter(
            (report) =>
              report.status ===
              'Generado',
          ).length,

        issued:
          reports.filter(
            (report) =>
              report.status ===
              'Emitido',
          ).length,

        archived:
          reports.filter(
            (report) =>
              report.status ===
              'Archivado',
          ).length,

        critical:
          reports.filter(
            (report) =>
              report.riskLevel ===
              'Crítico',
          ).length,

        averageScore:
          reports.length
            ? Math.round(
                totalScore /
                reports.length,
              )
            : 0,
      };
    }, [reports]);

  const submitReport =
    useCallback(
      async (
        values: ReportFormValues,
      ) => {
        const context =
          contexts.find(
            (item) =>
              item.operationId ===
              values.operationId,
          );

        if (!context) {
          throw new Error(
            'No se encontró el contexto de la operación.',
          );
        }

        try {
          setSaving(true);
          setError('');

          const saved =
            await saveReport(
              values,
              context,
            );

          await loadData();

          return saved;
        } catch (saveError) {
          const message =
            getMessage(
              saveError,
              'No se pudo guardar el reporte.',
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

  const deleteReport =
    useCallback(
      async (reportId: string) => {
        try {
          setDeleting(true);
          setError('');

          await removeReport(reportId);
          await loadData();
        } catch (deleteError) {
          const message =
            getMessage(
              deleteError,
              'No se pudo eliminar el reporte.',
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
        Key extends keyof ReportFilters,
      >(
        key: Key,
        value: ReportFilters[Key],
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

    reports,
    filteredReports,

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
    submitReport,
    deleteReport,
    updateFilter,

    clearFilters: () =>
      setFilters({
        ...INITIAL_FILTERS,
      }),

    clearError: () =>
      setError(''),
  };
}