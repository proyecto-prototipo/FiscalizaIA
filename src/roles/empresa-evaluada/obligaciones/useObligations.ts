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
  getCompanyObligations,
} from './obligations.service';

import type {
  CompanyObligationFilters,
  CompanyObligationsData,
} from './obligations.types';


const INITIAL_FILTERS:
CompanyObligationFilters = {
  search: '',

  operationId: '',

  status: '',

  criticality: '',

  category: '',

  onlyExpired: false,
};


function normalize(
  value:
    string |
    undefined,
): string {
  return String(
    value ?? '',
  )
    .trim()
    .toLocaleLowerCase(
      'es',
    );
}


export function useObligations() {
  const [
    data,
    setData,
  ] =
    useState<CompanyObligationsData | null>(
      null,
    );

  const [
    filters,
    setFilters,
  ] =
    useState<CompanyObligationFilters>(
      INITIAL_FILTERS,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState('');


  /* =======================================================
     CARGAR
  ======================================================= */

  const loadObligations =
    useCallback(
      async (
        background = false,
      ) => {
        try {
          if (background) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }

          setError('');

          const result =
            await getCompanyObligations();

          setData(result);
        } catch (loadError) {
          console.error(
            '[Empresa - Obligaciones]',
            loadError,
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar las obligaciones.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadObligations();
  }, [loadObligations]);


  /* =======================================================
     REALTIME
  ======================================================= */

  useRealtimeModule(
    'empresa-obligaciones',
    [
      'obligation_assignments',
      'obligation_catalog',
      'mining_operations',
      'evidence_documents',
    ],
    () => {
      void loadObligations(
        true,
      );
    },
  );


  /* =======================================================
     FILTRAR
  ======================================================= */

  const filteredObligations =
    useMemo(() => {
      if (!data) {
        return [];
      }


      const search =
        normalize(
          filters.search,
        );


      return data.obligations.filter(
        (obligation) => {
          if (
            search
          ) {
            const searchable =
              normalize(
                [
                  obligation.code,
                  obligation.title,
                  obligation.description,
                  obligation.category,
                  obligation.operationName,
                  obligation.requiredEvidence,
                ].join(' '),
              );

            if (
              !searchable.includes(
                search,
              )
            ) {
              return false;
            }
          }


          if (
            filters.operationId &&
            obligation.operationId !==
              filters.operationId
          ) {
            return false;
          }


          if (
            filters.status &&
            normalize(
              obligation.status,
            ) !==
              normalize(
                filters.status,
              )
          ) {
            return false;
          }


          if (
            filters.criticality &&
            normalize(
              obligation.criticality,
            ) !==
              normalize(
                filters.criticality,
              )
          ) {
            return false;
          }


          if (
            filters.category &&
            obligation.category !==
              filters.category
          ) {
            return false;
          }


          if (
            filters.onlyExpired &&
            !obligation.expired
          ) {
            return false;
          }


          return true;
        },
      );
    }, [
      data,
      filters,
    ]);


  const categories =
    useMemo(() => {
      if (!data) {
        return [];
      }

      return Array.from(
        new Set(
          data.obligations.map(
            (obligation) =>
              obligation.category,
          ),
        ),
      ).sort();
    }, [data]);


  /* =======================================================
     ACTUALIZAR FILTRO
  ======================================================= */

  function updateFilter<
    K extends
      keyof CompanyObligationFilters,
  >(
    field: K,
    value:
      CompanyObligationFilters[K],
  ) {
    setFilters(
      (current) => ({
        ...current,

        [field]:
          value,
      }),
    );
  }


  function clearFilters() {
    setFilters(
      INITIAL_FILTERS,
    );
  }


  return {
    data,

    obligations:
      filteredObligations,

    categories,

    filters,

    loading,
    refreshing,

    error,

    loadObligations,

    updateFilter,
    clearFilters,

    clearError: () =>
      setError(''),
  };
}