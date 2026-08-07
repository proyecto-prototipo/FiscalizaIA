import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle2,
  CircleAlert,
  Info,
} from 'lucide-react';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useNotifications,
} from './useNotifications';

import type {
  Notification,
  NotificationType,
} from './notifications.types';

import styles from './NotificationBell.module.css';

function formatRelativeTime(
  value: string,
): string {
  const date =
    new Date(value);

  const difference =
    Date.now() - date.getTime();

  const minutes =
    Math.floor(
      difference / 60000,
    );

  if (minutes < 1) {
    return 'Ahora';
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours =
    Math.floor(minutes / 60);

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days =
    Math.floor(hours / 24);

  if (days === 1) {
    return 'Hace 1 día';
  }

  return `Hace ${days} días`;
}

function NotificationIcon({
  type,
}: {
  type: NotificationType;
}) {
  switch (type) {
    case 'Crítica':
      return (
        <CircleAlert size={18} />
      );

    case 'Advertencia':
      return (
        <AlertTriangle size={18} />
      );

    case 'Éxito':
      return (
        <CheckCircle2 size={18} />
      );

    default:
      return (
        <Info size={18} />
      );
  }
}

export default function NotificationBell() {
  const [
    open,
    setOpen,
  ] = useState(false);

  const wrapperRef =
    useRef<HTMLDivElement | null>(
      null,
    );

  const navigate =
    useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      const target =
        event.target as Node;

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          target,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleOutsideClick,
      );
    };
  }, []);

  async function openNotification(
    notification: Notification,
  ) {
    if (!notification.isRead) {
      await markAsRead(
        notification.id,
      );
    }

    setOpen(false);

    if (notification.route) {
      navigate(
        notification.route,
      );
    }
  }

  return (
    <div
      className={styles.wrapper}
      ref={wrapperRef}
    >
      <button
        type="button"
        className={styles.bellButton}
        aria-label="Notificaciones"
        onClick={() =>
          setOpen((current) => !current)
        }
      >
        <Bell size={19} />

        {unreadCount > 0 && (
          <span
            className={styles.counter}
          >
            {unreadCount > 99
              ? '99+'
              : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={
            styles.dropdown
          }
        >
          <header
            className={
              styles.header
            }
          >
            <div>
              <strong>
                Notificaciones
              </strong>

              <span>
                {unreadCount === 0
                  ? 'Todo está revisado'
                  : `${unreadCount} sin leer`}
              </span>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() =>
                  void markAllAsRead()
                }
              >
                <Check size={15} />
                Marcar todas
              </button>
            )}
          </header>

          <div
            className={
              styles.notifications
            }
          >
            {loading ? (
              <div
                className={
                  styles.empty
                }
              >
                Cargando...
              </div>
            ) : error ? (
              <div
                className={
                  styles.empty
                }
              >
                {error}
              </div>
            ) : notifications.length ===
              0 ? (
              <div
                className={
                  styles.empty
                }
              >
                <Bell size={28} />

                <strong>
                  Sin notificaciones
                </strong>

                <span>
                  Las nuevas alertas
                  aparecerán aquí.
                </span>
              </div>
            ) : (
              notifications.map(
                (notification) => (
                  <button
                    type="button"
                    key={
                      notification.id
                    }
                    className={`
                      ${styles.notification}
                      ${
                        !notification.isRead
                          ? styles.unread
                          : ''
                      }
                    `}
                    onClick={() =>
                      void openNotification(
                        notification,
                      )
                    }
                  >
                    <span
                      className={`
                        ${styles.notificationIcon}
                        ${
                          styles[
                            `type${notification.type}`
                          ] ?? ''
                        }
                      `}
                    >
                      <NotificationIcon
                        type={
                          notification.type
                        }
                      />
                    </span>

                    <span
                      className={
                        styles.notificationContent
                      }
                    >
                      <strong>
                        {
                          notification.title
                        }
                      </strong>

                      <span>
                        {
                          notification.message
                        }
                      </span>

                      <small>
                        {formatRelativeTime(
                          notification.createdAt,
                        )}
                      </small>
                    </span>

                    {!notification.isRead && (
                      <i
                        className={
                          styles.unreadDot
                        }
                      />
                    )}
                  </button>
                ),
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}