import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  useRealtimeModule,
} from '../../../shared/hooks/useRealtimeModule';

import {
  getSystemConfiguration,
  saveSystemConfiguration,
} from './configuration.service';

import type {
  SystemConfiguration,
  SystemConfigurationForm,
} from './configuration.types';

const INITIAL_FORM:
SystemConfigurationForm = {
  systemName:
    'FiscalizaIA Minera',

  supportEmail:
    'soporte@fiscalizaia.pe',

  defaultDueDays:
    15,

  realtimeEnabled:
    true,

  notificationsEnabled:
    true,

  aiAutoAnalysis:
    false,

  aiMinConfidence:
    70,
};

function getMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

function mapConfigurationToForm(
  configuration: SystemConfiguration,
): SystemConfigurationForm {
  return {
    systemName:
      configuration.systemName,

    supportEmail:
      configuration.supportEmail,

    defaultDueDays:
      configuration.defaultDueDays,

    realtimeEnabled:
      configuration.realtimeEnabled,

    notificationsEnabled:
      configuration.notificationsEnabled,

    aiAutoAnalysis:
      configuration.aiAutoAnalysis,

    aiMinConfidence:
      configuration.aiMinConfidence,
  };
}

export function useConfiguration() {
  const [
    configuration,
    setConfiguration,
  ] = useState<SystemConfiguration | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<SystemConfigurationForm>({
    ...INITIAL_FORM,
  });

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] = useState('');

  const [
    lastUpdated,
    setLastUpdated,
  ] = useState<Date | null>(null);

  const loadConfiguration =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const result =
          await getSystemConfiguration();

        setConfiguration(result);

        setForm(
          mapConfigurationToForm(
            result,
          ),
        );

        setLastUpdated(
          new Date(result.updatedAt),
        );
      } catch (loadError) {
        console.error(
          '[Configuración] Error al cargar:',
          loadError,
        );

        setError(
          getMessage(
            loadError,
            'No se pudo cargar la configuración.',
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadConfiguration();
  }, [loadConfiguration]);

  useRealtimeModule(
    'fiscalizador-configuracion',
    ['system_settings'],
    () => {
      void loadConfiguration();
    },
  );

  const updateField =
    useCallback(
      <
        Key extends keyof SystemConfigurationForm,
      >(
        key: Key,
        value: SystemConfigurationForm[Key],
      ) => {
        setForm((current) => ({
          ...current,
          [key]: value,
        }));

        setSuccessMessage('');
      },
      [],
    );

  const saveConfiguration =
    useCallback(async () => {
      try {
        setSaving(true);
        setError('');
        setSuccessMessage('');

        const result =
          await saveSystemConfiguration(
            form,
          );

        setConfiguration(result);

        setForm(
          mapConfigurationToForm(
            result,
          ),
        );

        setLastUpdated(
          new Date(result.updatedAt),
        );

        setSuccessMessage(
          'La configuración se guardó correctamente.',
        );

        return result;
      } catch (saveError) {
        const message =
          getMessage(
            saveError,
            'No se pudo guardar la configuración.',
          );

        setError(message);

        throw new Error(message);
      } finally {
        setSaving(false);
      }
    }, [form]);

  const resetConfiguration =
    useCallback(() => {
      if (configuration) {
        setForm(
          mapConfigurationToForm(
            configuration,
          ),
        );
      } else {
        setForm({
          ...INITIAL_FORM,
        });
      }

      setError('');
      setSuccessMessage('');
    }, [configuration]);

  const clearError =
    useCallback(() => {
      setError('');
    }, []);

  const clearSuccess =
    useCallback(() => {
      setSuccessMessage('');
    }, []);

  return {
    configuration,
    form,

    loading,
    saving,

    error,
    successMessage,

    lastUpdated,

    loadConfiguration,
    saveConfiguration,
    resetConfiguration,
    updateField,

    clearError,
    clearSuccess,
  };
}