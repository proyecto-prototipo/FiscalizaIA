import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  supabase,
} from '../../services/supabase';

import {
  getCurrentProfile,
  PROFILE_UPDATED_EVENT,
} from './profile.service';

import type {
  CurrentProfile,
} from './profile.types';


/* =========================================================
   HOOK
========================================================= */

export function useCurrentProfile() {
  const [
    profile,
    setProfile,
  ] = useState<CurrentProfile | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  /*
   * Cada instancia tendrá un canal distinto.
   *
   * Esto evita que RoleLayout y ConfigurationPage
   * intenten utilizar exactamente el mismo nombre
   * de canal Realtime.
   */
  const channelSuffix =
    useRef(
      Math.random()
        .toString(36)
        .slice(2),
    );


  /* =======================================================
     CARGAR PERFIL
  ======================================================= */

  const loadProfile =
    useCallback(async () => {
      try {
        setError('');

        const result =
          await getCurrentProfile();

        setProfile(result);

        return result;
      } catch (loadError) {
        console.error(
          '[Perfil] Error al cargar:',
          loadError,
        );

        const message =
          loadError instanceof Error
            ? loadError.message
            : 'No se pudo cargar el perfil.';

        setError(message);

        return null;
      } finally {
        setLoading(false);
      }
    }, []);


  /* =======================================================
     CARGA INICIAL
  ======================================================= */

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);


  /* =======================================================
     ACTUALIZACIÓN INMEDIATA EN LA MISMA APP
  ======================================================= */

  useEffect(() => {
    function handleProfileUpdated(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<
          CurrentProfile
        >;

      const updatedProfile =
        customEvent.detail;

      if (!updatedProfile) {
        return;
      }

      setProfile(
        updatedProfile,
      );

      setError('');
    }

    window.addEventListener(
      PROFILE_UPDATED_EVENT,
      handleProfileUpdated,
    );

    return () => {
      window.removeEventListener(
        PROFILE_UPDATED_EVENT,
        handleProfileUpdated,
      );
    };
  }, []);


  /* =======================================================
     SUPABASE REALTIME
  ======================================================= */

  useEffect(() => {
    let mounted = true;

    let channel:
      ReturnType<
        typeof supabase.channel
      > | null = null;

    async function connectRealtime() {
      const {
        data,
        error: authError,
      } =
        await supabase.auth.getUser();

      if (
        authError ||
        !data.user ||
        !mounted
      ) {
        return;
      }

      const userId =
        data.user.id;

      const channelName =
        `profile-${userId}-${channelSuffix.current}`;

      channel = supabase
        .channel(
          channelName,
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter:
              `id=eq.${userId}`,
          },
          (payload) => {
            console.log(
              '[Perfil Realtime] Perfil actualizado:',
              payload,
            );

            /*
             * Recargamos desde Supabase para
             * mantener todos los campos sincronizados.
             */
            void loadProfile();
          },
        )
        .subscribe(
          (status) => {
            console.log(
              '[Perfil Realtime]',
              status,
            );
          },
        );
    }

    void connectRealtime();

    return () => {
      mounted = false;

      if (channel) {
        void supabase.removeChannel(
          channel,
        );
      }
    };
  }, [loadProfile]);


  /* =======================================================
     DEVOLVER HOOK
  ======================================================= */

  return {
    profile,

    loading,
    error,

    loadProfile,
  };
}