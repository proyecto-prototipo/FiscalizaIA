import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useRealtimeModule,
} from '../../../shared/hooks/useRealtimeModule';

import {
  getCompanyOperations,
} from './operation.service';

import type {
  OperationPageData,
} from './operation.types';


function getMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo cargar la operación.';
}


export function useOperation() {
  const [
    data,
    setData,
  ] =
    useState<OperationPageData | null>(
      null,
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
    error,
    setError,
  ] = useState('');


  /* =======================================================
     CARGAR
  ======================================================= */

  const loadOperations =
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

          const result =
            await getCompanyOperations();

          setData(result);
        } catch (loadError) {
          console.error(
            '[Empresa - Operación]',
            loadError,
          );

          setError(
            getMessage(
              loadError,
            ),
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [],
    );


  /* =======================================================
     CARGA INICIAL
  ======================================================= */

  useEffect(() => {
    void loadOperations();
  }, [loadOperations]);


  /* =======================================================
     REALTIME
  ======================================================= */

  useRealtimeModule(
    'empresa-operacion',
    [
      'companies',
      'mining_operations',
    ],
    () => {
      void loadOperations(
        true,
      );
    },
  );


  return {
    data,

    loading,
    refreshing,

    error,

    loadOperations,

    clearError: () =>
      setError(''),
  };
}