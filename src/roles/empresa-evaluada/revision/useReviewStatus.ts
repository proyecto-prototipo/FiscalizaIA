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
  getReviewStatus,
} from './review.service';

import type {
  ReviewStatusData,
  ReviewStatusFilters,
} from './review.types';


const INITIAL_FILTERS:
ReviewStatusFilters = {
  search: '',

  operationId: '',

  stage: '',

  evidenceStatus: '',

  criticality: '',
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


export function useReviewStatus() {
  const [
    data,
    setData,
  ] =
    useState<ReviewStatusData | null>(
      null,
    );


  const [
    filters,
    setFilters,
  ] =
    useState<ReviewStatusFilters>(
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

  const loadReviewStatus =
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


          const result =
            await getReviewStatus();


          setData(
            result,
          );
        } catch (loadError) {
          console.error(
            '[Empresa - Estado revisión]',
            loadError,
          );


          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudo cargar el estado de revisión.',
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
    void loadReviewStatus();
  }, [
    loadReviewStatus,
  ]);


  /* =======================================================
     REALTIME
  ======================================================= */

  useRealtimeModule(
    'empresa-estado-revision',
    [
      'obligation_assignments',
      'obligation_catalog',
      'mining_operations',
      'evidence_documents',
      'evaluations',
    ],
    () => {
      void loadReviewStatus(
        true,
      );
    },
  );


  /* =======================================================
     FILTRAR
  ======================================================= */

  const items =
    useMemo(() => {
      if (!data) {
        return [];
      }


      const search =
        normalize(
          filters.search,
        );


      return data.items.filter(
        (
          item,
        ) => {
          if (search) {
            const searchable =
              normalize(
                [
                  item.obligationCode,
                  item.obligationTitle,
                  item.operationName,
                  item.evidence?.fileName,
                  item.evaluation?.complianceStatus,
                ].join(
                  ' ',
                ),
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
            item.operationId !==
              filters.operationId
          ) {
            return false;
          }


          if (
            filters.stage &&
            item.currentStage !==
              filters.stage
          ) {
            return false;
          }


          if (
            filters.evidenceStatus &&
            normalize(
              item.evidence?.status,
            ) !==
              normalize(
                filters.evidenceStatus,
              )
          ) {
            return false;
          }


          if (
            filters.criticality &&
            normalize(
              item.criticality,
            ) !==
              normalize(
                filters.criticality,
              )
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
      keyof ReviewStatusFilters,
  >(
    field: K,

    value:
      ReviewStatusFilters[K],
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

    items,

    filters,

    loading,

    refreshing,

    error,

    loadReviewStatus,

    updateFilter,

    clearFilters,

    clearError: () =>
      setError(''),
  };
}