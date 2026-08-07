import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useRealtimeModule,
} from '../../../shared/hooks/useRealtimeModule';

import {
  getFiscalizadorDashboard,
} from './dashboard.service';

import type {
  DashboardData,
} from './dashboard.types';

const REALTIME_TABLES = [
  'companies',
  'mining_operations',
  'obligation_assignments',
  'evidence_documents',
  'ai_analyses',
  'evaluations',
  'gaps',
  'observations',
  'recommendations',
  'evaluation_results',
  'compliance_reports',
];

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'No se pudo cargar el dashboard.';
}

export function useDashboard() {
  const [
    data,
    setData,
  ] = useState<DashboardData | null>(
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
      ): Promise<void> => {
        try {
          if (background) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }

          setError('');

          const result:
          DashboardData =
            await getFiscalizadorDashboard();

          setData(result);
        } catch (loadError) {
          console.error(
            '[Dashboard] Error al cargar:',
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
    'fiscalizador-dashboard',
    REALTIME_TABLES,
    () => {
      void loadDashboard(true);
    },
  );

  const clearError =
    useCallback(() => {
      setError('');
    }, []);

  return {
    data,
    loading,
    refreshing,
    error,

    loadDashboard,
    clearError,
  };
}