import {
  useEffect,
  useRef,
} from 'react';

import type {
  RealtimeChannel,
} from '@supabase/supabase-js';

import {
  subscribeToTables,
  unsubscribeFromChannel,
} from '../../services/realtime.service';

/* =========================================================
   HOOK REALTIME
   ========================================================= */

/**
 * Escucha cambios en varias tablas de Supabase.
 *
 * El callback se guarda en una referencia para evitar
 * reconstruir el canal cada vez que el componente renderiza.
 */
export function useRealtimeModule(
  channelName: string,
  tables: string[],
  onChange: () => void,
): void {
  const callbackRef =
    useRef(onChange);

  const channelRef =
    useRef<RealtimeChannel | null>(null);

  /*
   * Mantiene actualizado el callback sin provocar
   * una nueva suscripción.
   */
  useEffect(() => {
    callbackRef.current = onChange;
  }, [onChange]);

  /*
   * Convierte el arreglo a una cadena estable.
   *
   * Esto evita que React reconstruya el canal solo porque
   * se creó un nuevo arreglo con los mismos valores.
   */
  const tablesKey =
    tables.join('|');

  useEffect(() => {
    let mounted = true;

    /*
     * React StrictMode puede ejecutar el efecto dos veces
     * durante el desarrollo.
     *
     * Por eso limpiamos cualquier canal anterior antes
     * de crear uno nuevo.
     */
    if (channelRef.current) {
      void unsubscribeFromChannel(
        channelRef.current,
      );

      channelRef.current = null;
    }

    const channel =
      subscribeToTables(
        channelName,
        tables,
        () => {
          if (!mounted) {
            return;
          }

          callbackRef.current();
        },
      );

    channelRef.current =
      channel;

    return () => {
      mounted = false;

      const currentChannel =
        channelRef.current;

      channelRef.current =
        null;

      void unsubscribeFromChannel(
        currentChannel,
      );
    };
  }, [
    channelName,
    tablesKey,
  ]);
}