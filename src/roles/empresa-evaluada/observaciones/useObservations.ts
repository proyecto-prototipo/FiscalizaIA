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
  getCompanyObservations,
  respondObservation,
} from './observations.service';

import type {
  ObservationFilters,
  ObservationsData,
} from './observations.types';


const INITIAL_FILTERS: ObservationFilters = {
  search: '',
  operationId: '',
  status: '',
  severity: '',
  source: '',
  onlyExpired: false,
};


function normalize(
  value: string | undefined,
): string {
  return String(
    value ?? '',
  )
    .trim()
    .toLocaleLowerCase('es');
}


export function useObservations() {
  const [
    data,
    setData,
  ] = useState<ObservationsData | null>(
    null,
  );

  const [
    filters,
    setFilters,
  ] = useState<ObservationFilters>(
    INITIAL_FILTERS,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    respondingId,
    setRespondingId,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState('');

  const [
    success,
    setSuccess,
  ] = useState('');


  const loadObservations =
    useCallback(
      async (
        background = false,
      ) => {
        try {
          if (background) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const result:
            ObservationsData =
              await getCompanyObservations();

          setData(result);
        } catch (loadError) {
          console.error(
            '[Empresa Observaciones]',
            loadError,
          );

          setError(
            loadError instanceof Error
              ? loadError.message
              : 'No se pudieron cargar las observaciones.',
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  useEffect(() => {
    void loadObservations();
  }, [loadObservations]);


  useRealtimeModule(
    'empresa-observaciones',
    [
      'observations',
      'obligation_assignments',
      'obligation_catalog',
      'mining_operations',
    ],
    () => {
      void loadObservations(true);
    },
  );


  const observations =
    useMemo(() => {
      if (!data) {
        return [];
      }

      const search =
        normalize(
          filters.search,
        );

      return data.observations.filter(
        (observation) => {
          if (search) {
            const searchable =
              normalize(
                [
                  observation.title,
                  observation.description,
                  observation.obligationCode,
                  observation.obligationTitle,
                  observation.operationName,
                  observation.source,
                  observation.response,
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
            observation.operationId !==
              filters.operationId
          ) {
            return false;
          }


          if (
            filters.status &&
            normalize(
              observation.status,
            ) !==
              normalize(
                filters.status,
              )
          ) {
            return false;
          }


          if (
            filters.severity &&
            normalize(
              observation.severity,
            ) !==
              normalize(
                filters.severity,
              )
          ) {
            return false;
          }


          if (
            filters.source &&
            normalize(
              observation.source,
            ) !==
              normalize(
                filters.source,
              )
          ) {
            return false;
          }


          if (
            filters.onlyExpired &&
            !observation.expired
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


  async function submitResponse(
    observationId: string,
    response: string,
  ) {
    try {
      setRespondingId(
        observationId,
      );

      setError('');
      setSuccess('');

      await respondObservation(
        observationId,
        response,
      );

      setSuccess(
        'Respuesta enviada correctamente.',
      );

      await loadObservations(
        true,
      );
    } catch (responseError) {
      console.error(
        '[Empresa Observaciones] Respuesta:',
        responseError,
      );

      setError(
        responseError instanceof Error
          ? responseError.message
          : 'No se pudo enviar la respuesta.',
      );
    } finally {
      setRespondingId(null);
    }
  }


  function updateFilter<
    K extends keyof ObservationFilters,
  >(
    field: K,
    value: ObservationFilters[K],
  ) {
    setFilters(
      (current) => ({
        ...current,
        [field]: value,
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

    observations,

    filters,

    loading,
    refreshing,
    respondingId,

    error,
    success,

    loadObservations,
    submitResponse,

    updateFilter,
    clearFilters,

    clearError: () =>
      setError(''),

    clearSuccess: () =>
      setSuccess(''),
  };
}