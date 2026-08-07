import {
  LogOut,
  Menu,
  ShieldCheck,
  X,
  type LucideIcon,
} from 'lucide-react';

import {
  NavLink,
  Outlet,
  useNavigate,
} from 'react-router-dom';

import {
  useState,
} from 'react';

import {
  useAuth,
} from '../../app/AuthContext';

import {
  useCurrentProfile,
} from '../profile/useCurrentProfile';

import NotificationBell
  from '../notifications/NotificationBell';

import styles
  from '../styles/layout.module.css';


/* =========================================================
   TIPOS
========================================================= */

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}


/* =========================================================
   COMPONENTE
========================================================= */

export function RoleLayout({
  roleLabel,
  items,
}: {
  roleLabel: string;
  items: NavItem[];
}) {
  const [open, setOpen] = useState(false);

  const {
    user,
    signOut,
  } = useAuth();

  const {
    profile,
  } = useCurrentProfile();

  const navigate = useNavigate();

  const displayName =
    profile?.displayName?.trim() ||
    user?.name?.trim() ||
    'Usuario';

  const initials =
    displayName
      .split(' ')
      .filter(Boolean)
      .map((value) => value.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();

  async function handleSignOut() {
    await signOut();

    navigate('/', {
      replace: true,
    });
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className={styles.shell}>
      {/* =================================================
          SIDEBAR
      ================================================= */}

      <aside
        className={`${styles.sidebar} ${
          open
            ? styles.open
            : ''
        }`}
      >
        {/* ===============================================
            MARCA
        =============================================== */}

        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <ShieldCheck size={21} />
          </div>

          <div className={styles.brandCopy}>
            <strong>
              FiscalizaIA
            </strong>

            <span>
              MINERA
            </span>
          </div>

          <button
            type="button"
            className={styles.close}
            onClick={() =>
              setOpen(false)
            }
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
        </div>


        {/* ===============================================
            ROL
        =============================================== */}

        <div className={styles.roleBadge}>
          {roleLabel}
        </div>


        {/* ===============================================
            NAVEGACIÓN
        =============================================== */}

        <nav className={styles.nav}>
          {items.map(
            ({
              label,
              to,
              icon: Icon,
            }) => (
              <NavLink
                key={to}
                to={to}
                end={
                  to ===
                  '/fiscalizador' ||
                  to ===
                  '/empresa'
                }
                onClick={() =>
                  setOpen(false)
                }
                className={({
                  isActive,
                }) =>
                  isActive
                    ? styles.active
                    : ''
                }
              >
                <Icon size={18} />

                <span>
                  {label}
                </span>
              </NavLink>
            ),
          )}
        </nav>


        {/* ===============================================
            CERRAR SESIÓN
        =============================================== */}

        <button
          type="button"
          className={styles.logout}
          onClick={() =>
            void handleSignOut()
          }
        >
          <LogOut size={18} />

          <span>
            Cerrar sesión
          </span>
        </button>
      </aside>


      {/* =================================================
          CONTENIDO PRINCIPAL
      ================================================= */}

      <main className={styles.main}>
        {/* ===============================================
            TOPBAR
        =============================================== */}

        <header className={styles.topbar}>
          {/* MENÚ RESPONSIVE */}

          <button
            type="button"
            className={styles.menuButton}
            onClick={() =>
              setOpen(true)
            }
            aria-label="Abrir menú"
          >
            <Menu size={22} />
          </button>


          {/* INFORMACIÓN DEL SISTEMA */}

          <div className={styles.topCopy}>
            <span>
              Preparación ambiental inteligente
            </span>

            <strong>
              {user?.companyName ??
                'FiscalizaIA Minera'}
            </strong>
          </div>


          {/* =============================================
              USUARIO
          ============================================= */}

          <div className={styles.topActions}>
            {/* NOTIFICACIONES */}

            <NotificationBell />


            {/* AVATAR */}

            <div className={styles.avatar}>
              {initials}
            </div>


            {/* ÚNICO BLOQUE DE PERFIL */}

            <div className={styles.userMeta}>
              <strong>
                {displayName}
              </strong>

              <span>
                {user?.email ?? ''}
              </span>
            </div>
          </div>
        </header>


        {/* ===============================================
            CONTENIDO DE LAS PÁGINAS
        =============================================== */}

        <div className={styles.content}>
          <Outlet />
        </div>
      </main>


      {/* =================================================
          FONDO RESPONSIVE
      ================================================= */}

      {open && (
        <button
          type="button"
          className={styles.backdrop}
          onClick={() =>
            setOpen(false)
          }
          aria-label="Cerrar menú"
        />
      )}
    </div>
  );
}