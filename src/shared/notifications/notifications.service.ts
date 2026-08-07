import { supabase } from '../../services/supabase';

import type {
  Notification,
  NotificationRow,
} from './notifications.types';

const NOTIFICATION_SELECT = `
  id,
  user_id,
  role,
  title,
  message,
  type,
  module,
  reference_id,
  route,
  is_read,
  created_at,
  read_at
`;

function mapNotification(
  row: NotificationRow,
): Notification {
  return {
    id: row.id,

    userId:
      row.user_id ?? undefined,

    role:
      row.role ?? undefined,

    title:
      row.title,

    message:
      row.message,

    type:
      row.type,

    module:
      row.module ?? undefined,

    referenceId:
      row.reference_id ?? undefined,

    route:
      row.route ?? undefined,

    isRead:
      row.is_read,

    createdAt:
      row.created_at,

    readAt:
      row.read_at ?? undefined,
  };
}

function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (error.code === '42501') {
    return 'No tienes permisos para consultar las notificaciones.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

export async function listNotifications():
Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(NOTIFICATION_SELECT)
    .order('created_at', {
      ascending: false,
    })
    .limit(30);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las notificaciones',
      ),
    );
  }

  return (
    (data ?? []) as NotificationRow[]
  ).map(mapNotification);
}

export async function markNotificationAsRead(
  notificationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo marcar la notificación como leída',
      ),
    );
  }
}

export async function markAllNotificationsAsRead():
Promise<void> {
  const { data: userData } =
    await supabase.auth.getUser();

  if (!userData.user) {
    throw new Error(
      'No existe un usuario autenticado.',
    );
  }

  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('is_read', false);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron marcar las notificaciones como leídas',
      ),
    );
  }
}