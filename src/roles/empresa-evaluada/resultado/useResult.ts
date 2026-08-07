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
  getCompanyResults,
} from './result.service';

import type {
  CompanyResultData,
  ResultFilters,
} from './result.types';


const INITIAL_FILTERS:
ResultFilters = {
  search: '',

  operationId: '',

  complianceStatus: '',

  riskLevel: '',

  onlyValidated: false,
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


export function useResult() {
  const [
    data,
    setData,
  ] =
    useState<CompanyResultData | null>(
      null,
    );


  const [
    filters,
    setFilters,
  ] =
    useState<ResultFilters>(
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

  const loadResults =
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


          const result:
            CompanyResultData =
              await getCompanyResults();


          setData(
            result,
          );
        } catch (loadError) {
          console.error(
            '[Empresa Resultado]',
            loadError,
          );


          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar los resultados.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadResults();
  }, [
    loadResults,
  ]);


  /* =======================================================
     REALTIME
  ======================================================= */

  useRealtimeModule(
    'empresa-resultado',
    [
      'evaluation_results',
      'gaps',
      'observations',
      'recommendations',
      'obligation_assignments',
      'obligation_catalog',
    ],
    () => {
      void loadResults(
        true,
      );
    },
  );


  /* =======================================================
     FILTROS
  ======================================================= */

  const results =
    useMemo(() => {
      if (!data) {
        return [];
      }


      const search =
        normalize(
          filters.search,
        );


      return data.results.filter(
        (
          result,
        ) => {
          if (search) {
            const searchable =
              normalize(
                [
                  result.obligationCode,
                  result.obligationTitle,
                  result.operationName,
                  result.complianceStatus,
                  result.riskLevel,
                  result.evaluationComment,
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
            result.operationId !==
              filters.operationId
          ) {
            return false;
          }


          if (
            filters.complianceStatus &&
            normalize(
              result.complianceStatus,
            ) !==
              normalize(
                filters.complianceStatus,
              )
          ) {
            return false;
          }


          if (
            filters.riskLevel &&
            normalize(
              result.riskLevel,
            ) !==
              normalize(
                filters.riskLevel,
              )
          ) {
            return false;
          }


          if (
            filters.onlyValidated &&
            !result.validated
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
    K extends keyof ResultFilters,
  >(
    field: K,

    value:
      ResultFilters[K],
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

    results,

    filters,

    loading,

    refreshing,

    error,

    loadResults,

    updateFilter,

    clearFilters,

    clearError: () =>
      setError(''),
  };
}