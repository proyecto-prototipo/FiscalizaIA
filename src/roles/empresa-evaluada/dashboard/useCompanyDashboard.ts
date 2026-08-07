import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useRealtimeModule,
} from '../../../shared/hooks/useRealtimeModule';

import {
  getCompanyDashboard,
} from './companyDashboard.service';

import type {
  CompanyDashboardData,
} from './companyDashboard.types';


const REALTIME_TABLES = [
  'companies',
  'mining_operations',
  'obligation_assignments',
  'evidence_documents',
  'evaluations',
  'gaps',
  'observations',
  'recommendations',
  'evaluation_results',
];


function getErrorMessage(
  error: unknown,
): string {
  return error instanceof Error
    ? error.message
    : 'No se pudo cargar el resumen.';
}


export function useCompanyDashboard() {
  const [
    data,
    setData,
  ] =
    useState<CompanyDashboardData | null>(
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


  const loadDashboard =
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
            await getCompanyDashboard();

          setData(result);
        } catch (loadError) {
          console.error(
            '[Empresa Dashboard]',
            loadError,
          );

          setError(
            getErrorMessage(
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


  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);


  useRealtimeModule(
    'empresa-dashboard',
    REALTIME_TABLES,
    () => {
      void loadDashboard(true);
    },
  );


  return {
    data,

    loading,
    refreshing,

    error,

    loadDashboard,

    clearError: () =>
      setError(''),
  };
}