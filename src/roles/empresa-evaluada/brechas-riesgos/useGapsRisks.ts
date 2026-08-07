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
  getCompanyGapsRisks,
} from './gaps-risks.service';

import type {
  GapRiskFilters,
  GapsRisksData,
} from './gaps-risks.types';


const INITIAL_FILTERS:
GapRiskFilters = {
  search: '',

  operationId: '',

  riskLevel: '',

  status: '',

  source: '',

  priority: '',

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


export function useGapsRisks() {
  const [
    data,
    setData,
  ] =
    useState<GapsRisksData | null>(
      null,
    );


  const [
    filters,
    setFilters,
  ] =
    useState<GapRiskFilters>(
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
     LOAD
  ======================================================= */

  const loadGapsRisks =
    useCallback(
      async (
        background = false,
      ) => {
        try {
          if (
            background
          ) {
            setRefreshing(
              true,
            );
          } else {
            setLoading(
              true,
            );
          }


          setError('');


          const result:
            GapsRisksData =
              await getCompanyGapsRisks();


          setData(
            result,
          );
        } catch (loadError) {
          console.error(
            '[Empresa Brechas]',
            loadError,
          );


          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar las brechas y riesgos.',
          );
        } finally {
          setLoading(
            false,
          );

          setRefreshing(
            false,
          );
        }
      },
      [],
    );


  useEffect(() => {
    void loadGapsRisks();
  }, [
    loadGapsRisks,
  ]);


  /* =======================================================
     REALTIME
  ======================================================= */

  useRealtimeModule(
    'empresa-brechas-riesgos',
    [
      'gaps',
      'obligation_assignments',
      'obligation_catalog',
      'mining_operations',
    ],
    () => {
      void loadGapsRisks(
        true,
      );
    },
  );


  /* =======================================================
     FILTERS
  ======================================================= */

  const gaps =
    useMemo(() => {
      if (!data) {
        return [];
      }


      const search =
        normalize(
          filters.search,
        );


      return data.gaps.filter(
        (
          gap,
        ) => {
          if (search) {
            const searchable =
              normalize(
                [
                  gap.title,
                  gap.description,
                  gap.obligationCode,
                  gap.obligationTitle,
                  gap.operationName,
                  gap.riskLevel,
                  gap.source,
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
            gap.operationId !==
              filters.operationId
          ) {
            return false;
          }


          if (
            filters.riskLevel &&
            normalize(
              gap.riskLevel,
            ) !==
              normalize(
                filters.riskLevel,
              )
          ) {
            return false;
          }


          if (
            filters.status &&
            normalize(
              gap.status,
            ) !==
              normalize(
                filters.status,
              )
          ) {
            return false;
          }


          if (
            filters.source &&
            normalize(
              gap.source,
            ) !==
              normalize(
                filters.source,
              )
          ) {
            return false;
          }


          if (
            filters.priority &&
            normalize(
              gap.priority,
            ) !==
              normalize(
                filters.priority,
              )
          ) {
            return false;
          }


          if (
            filters.onlyExpired &&
            !gap.expired
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


  function updateFilter<
    K extends
      keyof GapRiskFilters,
  >(
    field: K,

    value:
      GapRiskFilters[K],
  ) {
    setFilters(
      (
        current,
      ) => ({
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

    gaps,

    filters,

    loading,

    refreshing,

    error,

    loadGapsRisks,

    updateFilter,

    clearFilters,

    clearError: () =>
      setError(''),
  };
}