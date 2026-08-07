import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { supabase } from '../../services/supabase';

import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from './notifications.service';

import type {
  Notification,
} from './notifications.types';

function getMessage(
  error: unknown,
  fallback: string,
): string {
  return error instanceof Error
    ? error.message
    : fallback;
}

export function useNotifications() {
  const [
    notifications,
    setNotifications,
  ] = useState<Notification[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState('');

  const loadNotifications =
    useCallback(async () => {
      try {
        setLoading(true);
        setError('');

        const result =
          await listNotifications();

        setNotifications(result);
      } catch (loadError) {
        console.error(
          '[Notificaciones] Error:',
          loadError,
        );

        setError(
          getMessage(
            loadError,
            'No se pudieron cargar las notificaciones.',
          ),
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel('global-notifications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          void loadNotifications();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(
        channel,
      );
    };
  }, [loadNotifications]);

  const unreadCount =
    useMemo(() => {
      return notifications.filter(
        (notification) =>
          !notification.isRead,
      ).length;
    }, [notifications]);

  const markAsRead =
    useCallback(
      async (
        notificationId: string,
      ) => {
        try {
          await markNotificationAsRead(
            notificationId,
          );

          setNotifications(
            (current) =>
              current.map(
                (notification) =>
                  notification.id ===
                  notificationId
                    ? {
                        ...notification,
                        isRead: true,
                        readAt:
                          new Date().toISOString(),
                      }
                    : notification,
              ),
          );
        } catch (readError) {
          setError(
            getMessage(
              readError,
              'No se pudo actualizar la notificación.',
            ),
          );
        }
      },
      [],
    );

  const markAllAsRead =
    useCallback(async () => {
      try {
        await markAllNotificationsAsRead();

        const now =
          new Date().toISOString();

        setNotifications(
          (current) =>
            current.map(
              (notification) => ({
                ...notification,
                isRead: true,
                readAt:
                  notification.readAt ??
                  now,
              }),
            ),
        );
      } catch (readError) {
        setError(
          getMessage(
            readError,
            'No se pudieron actualizar las notificaciones.',
          ),
        );
      }
    }, []);

  return {
    notifications,
    unreadCount,

    loading,
    error,

    loadNotifications,
    markAsRead,
    markAllAsRead,
  };
}