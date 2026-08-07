export type NotificationType =
  | 'Información'
  | 'Éxito'
  | 'Advertencia'
  | 'Crítica';

export interface Notification {
  id: string;

  userId?: string;
  role?: string;

  title: string;
  message: string;

  type: NotificationType;

  module?: string;
  referenceId?: string;
  route?: string;

  isRead: boolean;

  createdAt: string;
  readAt?: string;
}

export interface NotificationRow {
  id: string;

  user_id: string | null;
  role: string | null;

  title: string;
  message: string;

  type: NotificationType;

  module: string | null;
  reference_id: string | null;
  route: string | null;

  is_read: boolean;

  created_at: string;
  read_at: string | null;
}