import {
  useCallback,
  useMemo,
  useState,
} from 'react';

import { useRealtimeModule } from '../../../shared/hooks/useRealtimeModule';

import {
  changeCompanyStatus,
  createCompany,
  listCompanies,
  updateCompany,
} from './companies.service';

import type {
  Company,
  CompanyFormValues,
  CompanyStatus,
} from './companies.types';

export type ActivityFilter =
  | 'Todas'
  | 'Activas'
  | 'Inactivas';

export type StatusFilter =
  | 'Todos'
  | CompanyStatus;

export interface CompaniesFilters {
  search: string;
  activity: ActivityFilter;
  status: StatusFilter;
}

const INITIAL_FILTERS: CompaniesFilters = {
  search: '',
  activity: 'Todas',
  status: 'Todos',
};

function getErrorMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filters, setFilters] =
    useState<CompaniesFilters>(INITIAL_FILTERS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] =
    useState<Date | null>(null);

  const loadCompanies = useCallback(async () => {
    try {
      setError('');

      const result = await listCompanies();

      setCompanies(result);
      setLastUpdated(new Date());
    } catch (loadError) {
      setError(
        getErrorMessage(
          loadError,
          'No se pudieron cargar las empresas.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * El hook compartido se encarga de:
   * 1. Ejecutar la carga inicial.
   * 2. Escuchar cambios de la tabla companies.
   * 3. Ejecutar nuevamente loadCompanies.
   */
  useRealtimeModule(
    'fiscalizador-companies',
    ['companies'],
    () => {
      void loadCompanies();
    },
  );

  const filteredCompanies = useMemo(() => {
    const searchValue = filters.search
      .trim()
      .toLowerCase();

    return companies.filter((company) => {
      const matchesSearch =
        !searchValue ||
        company.legalName
          .toLowerCase()
          .includes(searchValue) ||
        company.tradeName
          ?.toLowerCase()
          .includes(searchValue) ||
        company.ruc.includes(searchValue) ||
        company.region
          ?.toLowerCase()
          .includes(searchValue);

      const matchesActivity =
        filters.activity === 'Todas' ||
        (filters.activity === 'Activas'
          ? company.active
          : !company.active);

      const matchesStatus =
        filters.status === 'Todos' ||
        company.status === filters.status;

      return (
        matchesSearch &&
        matchesActivity &&
        matchesStatus
      );
    });
  }, [companies, filters]);

  const summary = useMemo(() => {
    return {
      total: companies.length,

      active: companies.filter(
        (company) => company.active,
      ).length,

      inEvaluation: companies.filter(
        (company) =>
          company.status === 'En evaluación',
      ).length,

      observed: companies.filter(
        (company) =>
          company.status === 'Observada',
      ).length,
    };
  }, [companies]);

  const handleCreateCompany =
    useCallback(
      async (
        values: CompanyFormValues,
      ): Promise<Company> => {
        try {
          setSaving(true);
          setError('');

          const company =
            await createCompany(values);

          await loadCompanies();

          return company;
        } catch (createError) {
          const message = getErrorMessage(
            createError,
            'No se pudo registrar la empresa.',
          );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadCompanies],
    );

  const handleUpdateCompany =
    useCallback(
      async (
        companyId: string,
        values: CompanyFormValues,
      ): Promise<Company> => {
        try {
          setSaving(true);
          setError('');

          const company = await updateCompany(
            companyId,
            values,
          );

          await loadCompanies();

          return company;
        } catch (updateError) {
          const message = getErrorMessage(
            updateError,
            'No se pudo actualizar la empresa.',
          );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadCompanies],
    );

  const handleActivityChange =
    useCallback(
      async (
        companyId: string,
        active: boolean,
      ): Promise<void> => {
        try {
          setSaving(true);
          setError('');

          await changeCompanyStatus(
            companyId,
            active,
          );

          await loadCompanies();
        } catch (statusError) {
          const message = getErrorMessage(
            statusError,
            'No se pudo cambiar el estado de la empresa.',
          );

          setError(message);
          throw new Error(message);
        } finally {
          setSaving(false);
        }
      },
      [loadCompanies],
    );

  const updateFilter = useCallback(
    <Key extends keyof CompaniesFilters>(
      key: Key,
      value: CompaniesFilters[Key],
    ) => {
      setFilters((current) => ({
        ...current,
        [key]: value,
      }));
    },
    [],
  );

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    companies,
    filteredCompanies,
    summary,
    filters,

    loading,
    saving,
    error,
    lastUpdated,

    loadCompanies,
    createCompany: handleCreateCompany,
    updateCompany: handleUpdateCompany,
    changeCompanyStatus:
      handleActivityChange,

    updateFilter,
    clearFilters,
    clearError: () => setError(''),
  };
}