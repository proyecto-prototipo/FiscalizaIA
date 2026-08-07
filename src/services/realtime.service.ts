import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

import { supabase } from './supabase';

/* =========================================================
   TIPOS
   ========================================================= */

export type RealtimeTableName =
  | 'companies'
  | 'mining_operations'
  | 'obligation_assignments'
  | 'obligations'
  | 'evidences'
  | 'ai_reviews'
  | 'evaluations'
  | 'gaps'
  | 'risks'
  | 'observations'
  | 'recommendations'
  | 'results'
  | string;

export type RealtimeChangePayload =
  RealtimePostgresChangesPayload<Record<string, unknown>>;

export type RealtimeChangeCallback = (
  payload: RealtimeChangePayload,
) => void;

/* =========================================================
   SUSCRIPCIÓN A TABLAS
   ========================================================= */

/**
 * Crea un canal y registra varias tablas.
 *
 * IMPORTANTE:
 * Todos los callbacks `.on()` se agregan antes
 * de ejecutar `.subscribe()`.
 */
export function subscribeToTables(
  channelName: string,
  tables: RealtimeTableName[],
  onChange: RealtimeChangeCallback,
): RealtimeChannel {
  /*
   * Evita nombres repetidos o espacios extraños.
   */
  const normalizedChannelName =
    channelName
      .trim()
      .replace(/\s+/g, '-');

  /*
   * Se eliminan tablas duplicadas.
   */
  const uniqueTables = [
    ...new Set(
      tables
        .map((table) => table.trim())
        .filter(Boolean),
    ),
  ];

  /*
   * Primero se crea el canal.
   */
  let channel = supabase.channel(
    `realtime:${normalizedChannelName}`,
  );

  /*
   * Después se agregan TODOS los listeners.
   *
   * Todavía no se llama a subscribe().
   */
  uniqueTables.forEach((table) => {
    channel = channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
      },
      (payload) => {
        onChange(
          payload as RealtimeChangePayload,
        );
      },
    );
  });

  /*
   * Recién cuando todos los listeners están registrados,
   * se realiza la suscripción.
   */
  channel.subscribe((status, error) => {
    if (status === 'SUBSCRIBED') {
      console.info(
        `[Realtime] Canal conectado: ${normalizedChannelName}`,
      );
    }

    if (
      status === 'CHANNEL_ERROR' ||
      status === 'TIMED_OUT'
    ) {
      console.error(
        `[Realtime] Error en ${normalizedChannelName}:`,
        error,
      );
    }

    if (status === 'CLOSED') {
      console.info(
        `[Realtime] Canal cerrado: ${normalizedChannelName}`,
      );
    }
  });

  return channel;
}

/* =========================================================
   ELIMINAR SUSCRIPCIÓN
   ========================================================= */

/**
 * Retira de forma segura un canal de Supabase.
 */
export async function unsubscribeFromChannel(
  channel: RealtimeChannel | null,
): Promise<void> {
  if (!channel) {
    return;
  }

  try {
    await supabase.removeChannel(channel);
  } catch (error) {
    console.error(
      '[Realtime] No se pudo cerrar el canal:',
      error,
    );
  }
}