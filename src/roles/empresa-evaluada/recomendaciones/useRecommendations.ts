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
  getCompanyRecommendations,
} from './recommendations.service';

import type {
  RecommendationFilters,
  RecommendationsData,
} from './recommendations.types';


const INITIAL_FILTERS:
RecommendationFilters = {
  search: '',

  operationId: '',

  status: '',

  priority: '',

  source: '',

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
    .toLocaleLowerCase('es');
}


export function useRecommendations() {
  const [
    data,
    setData,
  ] =
    useState<RecommendationsData | null>(
      null,
    );


  const [
    filters,
    setFilters,
  ] =
    useState<RecommendationFilters>(
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

  const loadRecommendations =
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
            RecommendationsData =
              await getCompanyRecommendations();


          setData(
            result,
          );
        } catch (loadError) {
          console.error(
            '[Empresa Recomendaciones]',
            loadError,
          );


          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar las recomendaciones.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadRecommendations();
  }, [
    loadRecommendations,
  ]);


  /* =======================================================
     REALTIME
  ======================================================= */

  useRealtimeModule(
    'empresa-recomendaciones',
    [
      'recommendations',
      'obligation_assignments',
      'obligation_catalog',
      'mining_operations',
    ],
    () => {
      void loadRecommendations(
        true,
      );
    },
  );


  /* =======================================================
     FILTROS
  ======================================================= */

  const recommendations =
    useMemo(() => {
      if (!data) {
        return [];
      }


      const search =
        normalize(
          filters.search,
        );


      return data.recommendations.filter(
        (
          recommendation,
        ) => {
          if (search) {
            const searchable =
              normalize(
                [
                  recommendation.title,
                  recommendation.description,
                  recommendation.obligationCode,
                  recommendation.obligationTitle,
                  recommendation.operationName,
                  recommendation.recommendationType,
                  recommendation.source,
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
            recommendation.operationId !==
              filters.operationId
          ) {
            return false;
          }


          if (
            filters.status &&
            normalize(
              recommendation.status,
            ) !==
              normalize(
                filters.status,
              )
          ) {
            return false;
          }


          if (
            filters.priority &&
            normalize(
              recommendation.priority,
            ) !==
              normalize(
                filters.priority,
              )
          ) {
            return false;
          }


          if (
            filters.source &&
            normalize(
              recommendation.source,
            ) !==
              normalize(
                filters.source,
              )
          ) {
            return false;
          }


          if (
            filters.onlyExpired &&
            !recommendation.expired
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
      keyof RecommendationFilters,
  >(
    field: K,

    value:
      RecommendationFilters[K],
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

    recommendations,

    filters,

    loading,

    refreshing,

    error,

    loadRecommendations,

    updateFilter,

    clearFilters,

    clearError: () =>
      setError(''),
  };
}