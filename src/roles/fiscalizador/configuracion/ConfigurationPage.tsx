import {
  Bell,
  Bot,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Mail,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  UserRound,
  Zap,
} from 'lucide-react';

import {
  useEffect,
  useState,
  type FormEvent,
} from 'react';

import {
  PageHeader,
  Panel,
  PrimaryButton,
} from '../../../shared/components/Ui';

import {
  useConfiguration,
} from './useConfiguration';

import {
  useCurrentProfile,
} from '../../../shared/profile/useCurrentProfile';

import {
  updateCurrentDisplayName,
} from '../../../shared/profile/profile.service';

import styles from './ConfigurationPage.module.css';


/* =========================================================
   FORMATO DE FECHA
========================================================= */

function formatDateTime(
  value: Date | null,
): string {
  if (!value) {
    return 'Sin actualización';
  }

  return new Intl.DateTimeFormat(
    'es-PE',
    {
      dateStyle: 'medium',
      timeStyle: 'short',
    },
  ).format(value);
}


/* =========================================================
   COMPONENTE
========================================================= */

export default function ConfigurationPage() {
  /* =======================================================
     CONFIGURACIÓN GENERAL
  ======================================================= */

  const {
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
  } = useConfiguration();


  /* =======================================================
     PERFIL DEL USUARIO
  ======================================================= */

  const {
    profile,
    loading: profileLoading,
    error: profileError,
    loadProfile,
  } = useCurrentProfile();

  const [
    displayName,
    setDisplayName,
  ] = useState('');

  const [
    savingName,
    setSavingName,
  ] = useState(false);

  const [
    profileSuccess,
    setProfileSuccess,
  ] = useState('');

  const [
    profileSaveError,
    setProfileSaveError,
  ] = useState('');


  /* =======================================================
     CARGAR NOMBRE DEL PERFIL
  ======================================================= */

  useEffect(() => {
    if (profile) {
      setDisplayName(
        profile.displayName,
      );
    }
  }, [profile]);


  /* =======================================================
     GUARDAR CONFIGURACIÓN GENERAL
  ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      await saveConfiguration();
    } catch {
      // El error se muestra desde useConfiguration.
    }
  }


  /* =======================================================
     GUARDAR NOMBRE DEL USUARIO
  ======================================================= */

  async function handleSaveDisplayName() {
    try {
      setSavingName(true);

      setProfileSuccess('');
      setProfileSaveError('');

      const cleanName =
        displayName.trim();

      if (!cleanName) {
        setProfileSaveError(
          'Ingresa un nombre.',
        );

        return;
      }

      await updateCurrentDisplayName(
        cleanName,
      );

      /*
       * Recargamos el perfil para que:
       *
       * ConfigurationPage
       * RoleLayout
       * Avatar
       *
       * utilicen el nombre actualizado.
       */
      await loadProfile();

      setProfileSuccess(
        'Nombre actualizado correctamente.',
      );
    } catch (saveError) {
      console.error(
        '[Configuración] Error al actualizar nombre:',
        saveError,
      );

      setProfileSaveError(
        saveError instanceof Error
          ? saveError.message
          : 'No se pudo actualizar el nombre.',
      );
    } finally {
      setSavingName(false);
    }
  }


  /* =======================================================
     DESCARTAR CAMBIO DE NOMBRE
  ======================================================= */

  function resetDisplayName() {
    if (!profile) {
      return;
    }

    setDisplayName(
      profile.displayName,
    );

    setProfileSuccess('');
    setProfileSaveError('');
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className={styles.page}>
      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Configuración"
        description="Administra tu perfil, las preferencias generales y las opciones de automatización de FiscalizaIA Minera."
        action={
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            disabled={
              loading ||
              profileLoading
            }
            onClick={() => {
              void loadConfiguration();
              void loadProfile();
            }}
          >
            <RefreshCw size={17} />

            Actualizar
          </button>
        }
      />


      {/* =================================================
          MENSAJES GENERALES
      ================================================= */}

      {error && (
        <div className={styles.errorBanner}>
          <CircleAlert size={18} />

          <span>
            {error}
          </span>

          <button
            type="button"
            aria-label="Cerrar error"
            onClick={clearError}
          >
            ×
          </button>
        </div>
      )}

      {successMessage && (
        <div className={styles.successBanner}>
          <CheckCircle2 size={18} />

          <span>
            {successMessage}
          </span>

          <button
            type="button"
            aria-label="Cerrar mensaje"
            onClick={clearSuccess}
          >
            ×
          </button>
        </div>
      )}


      {/* =================================================
          PERFIL
      ================================================= */}

      <Panel>
        <div className={styles.sectionTitle}>
          <UserRound size={21} />

          <div>
            <h2>
              Mi perfil
            </h2>

            <p>
              Personaliza el nombre que aparece
              en la parte superior del sistema.
            </p>
          </div>
        </div>

        {profileLoading ? (
          <div className={styles.loadingState}>
            Cargando perfil...
          </div>
        ) : (
          <>
            <div className={styles.profileRow}>
              <label>
                <span className={styles.labelIcon}>
                  <UserRound size={15} />
                  Nombre visible
                </span>

                <input
                  type="text"
                  value={displayName}
                  maxLength={80}
                  autoComplete="name"
                  placeholder="Nombre del usuario"
                  onChange={(event) => {
                    setDisplayName(
                      event.currentTarget.value,
                    );

                    setProfileSuccess('');
                    setProfileSaveError('');
                  }}
                />
              </label>

              <div
                className={
                  styles.profileActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  disabled={
                    savingName ||
                    displayName ===
                      profile?.displayName
                  }
                  onClick={
                    resetDisplayName
                  }
                >
                  <RotateCcw size={16} />

                  Descartar
                </button>

                <button
                  type="button"
                  className={
                    styles.profileSaveButton
                  }
                  disabled={
                    savingName ||
                    !displayName.trim() ||
                    displayName.trim() ===
                      profile?.displayName
                  }
                  onClick={() =>
                    void handleSaveDisplayName()
                  }
                >
                  <Save size={16} />

                  {savingName
                    ? 'Guardando...'
                    : 'Actualizar nombre'}
                </button>
              </div>
            </div>

            <div
              className={
                styles.profileInfo
              }
            >
              <div>
                <span>
                  Nombre actual
                </span>

                <strong>
                  {profile?.displayName ||
                    'Sin nombre'}
                </strong>
              </div>

              <div>
                <span>
                  Rol
                </span>

                <strong>
                  Administrador Fiscalizador
                </strong>
              </div>
            </div>

            {(profileError ||
              profileSaveError) && (
              <div
                className={
                  styles.profileError
                }
              >
                <CircleAlert size={15} />

                <span>
                  {profileSaveError ||
                    profileError}
                </span>
              </div>
            )}

            {profileSuccess && (
              <div
                className={
                  styles.profileSuccess
                }
              >
                <CheckCircle2
                  size={15}
                />

                <span>
                  {profileSuccess}
                </span>
              </div>
            )}
          </>
        )}
      </Panel>


      {/* =================================================
          FORMULARIO DE CONFIGURACIÓN
      ================================================= */}

      <form
        className={styles.form}
        onSubmit={handleSubmit}
      >
        {/* ===============================================
            CONFIGURACIÓN GENERAL
        =============================================== */}

        <Panel>
          <div className={styles.sectionTitle}>
            <Settings size={21} />

            <div>
              <h2>
                Configuración general
              </h2>

              <p>
                Define el nombre del sistema,
                el correo de soporte y el plazo
                predeterminado.
              </p>
            </div>
          </div>

          {loading ? (
            <div
              className={
                styles.loadingState
              }
            >
              Cargando configuración...
            </div>
          ) : (
            <div
              className={
                styles.formGrid
              }
            >
              <label>
                Nombre del sistema

                <input
                  value={
                    form.systemName
                  }
                  placeholder="FiscalizaIA Minera"
                  onChange={(event) =>
                    updateField(
                      'systemName',
                      event.currentTarget
                        .value,
                    )
                  }
                />
              </label>

              <label>
                <span
                  className={
                    styles.labelIcon
                  }
                >
                  <Mail size={15} />
                  Correo de soporte
                </span>

                <input
                  type="email"
                  value={
                    form.supportEmail
                  }
                  placeholder="soporte@fiscalizaia.pe"
                  onChange={(event) =>
                    updateField(
                      'supportEmail',
                      event.currentTarget
                        .value,
                    )
                  }
                />
              </label>

              <label>
                <span
                  className={
                    styles.labelIcon
                  }
                >
                  <Clock3 size={15} />
                  Plazo predeterminado
                </span>

                <div
                  className={
                    styles.numberField
                  }
                >
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={
                      form.defaultDueDays
                    }
                    onChange={(event) =>
                      updateField(
                        'defaultDueDays',
                        Number(
                          event.currentTarget
                            .value,
                        ),
                      )
                    }
                  />

                  <span>
                    días
                  </span>
                </div>
              </label>
            </div>
          )}
        </Panel>


        {/* ===============================================
            AUTOMATIZACIÓN
        =============================================== */}

        <Panel>
          <div className={styles.sectionTitle}>
            <Zap size={21} />

            <div>
              <h2>
                Automatización
              </h2>

              <p>
                Activa o desactiva las funciones
                automáticas del sistema.
              </p>
            </div>
          </div>

          <div
            className={
              styles.switchGrid
            }
          >
            {/* REALTIME */}

            <label
              className={
                styles.switchCard
              }
            >
              <div
                className={
                  styles.switchContent
                }
              >
                <Zap size={20} />

                <span>
                  <strong>
                    Actualización automática
                  </strong>

                  <small>
                    Mantiene los módulos
                    sincronizados mediante
                    Supabase Realtime.
                  </small>
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  form.realtimeEnabled
                }
                onChange={(event) =>
                  updateField(
                    'realtimeEnabled',
                    event.currentTarget
                      .checked,
                  )
                }
              />
            </label>


            {/* NOTIFICACIONES */}

            <label
              className={
                styles.switchCard
              }
            >
              <div
                className={
                  styles.switchContent
                }
              >
                <Bell size={20} />

                <span>
                  <strong>
                    Notificaciones
                  </strong>

                  <small>
                    Habilita alertas sobre
                    evidencias, vencimientos,
                    brechas y otros cambios
                    importantes.
                  </small>
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  form.notificationsEnabled
                }
                onChange={(event) =>
                  updateField(
                    'notificationsEnabled',
                    event.currentTarget
                      .checked,
                  )
                }
              />
            </label>


            {/* IA */}

            <label
              className={
                styles.switchCard
              }
            >
              <div
                className={
                  styles.switchContent
                }
              >
                <Bot size={20} />

                <span>
                  <strong>
                    Análisis automático con IA
                  </strong>

                  <small>
                    Permite iniciar
                    automáticamente la revisión
                    de nuevas evidencias.
                  </small>
                </span>
              </div>

              <input
                type="checkbox"
                checked={
                  form.aiAutoAnalysis
                }
                onChange={(event) =>
                  updateField(
                    'aiAutoAnalysis',
                    event.currentTarget
                      .checked,
                  )
                }
              />
            </label>
          </div>
        </Panel>


        {/* ===============================================
            INTELIGENCIA ARTIFICIAL
        =============================================== */}

        <Panel>
          <div className={styles.sectionTitle}>
            <Bot size={21} />

            <div>
              <h2>
                Inteligencia artificial
              </h2>

              <p>
                Define la confianza mínima
                necesaria para considerar
                confiable un análisis.
              </p>
            </div>
          </div>

          <div
            className={
              styles.confidenceSection
            }
          >
            <div
              className={
                styles.confidenceHeader
              }
            >
              <div>
                <strong>
                  Confianza mínima
                </strong>

                <small>
                  Los resultados inferiores
                  deberán ser revisados
                  manualmente por el
                  fiscalizador.
                </small>
              </div>

              <span>
                {form.aiMinConfidence}%
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={
                form.aiMinConfidence
              }
              onChange={(event) =>
                updateField(
                  'aiMinConfidence',
                  Number(
                    event.currentTarget
                      .value,
                  ),
                )
              }
            />

            <div
              className={
                styles.rangeLabels
              }
            >
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
        </Panel>


        {/* ===============================================
            BOTONES FINALES
        =============================================== */}

        <div
          className={
            styles.footerActions
          }
        >
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            disabled={
              saving ||
              loading
            }
            onClick={
              resetConfiguration
            }
          >
            <RotateCcw size={17} />

            Descartar cambios
          </button>

          <PrimaryButton
            type="submit"
            disabled={
              saving ||
              loading
            }
          >
            <Save size={17} />

            {saving
              ? 'Guardando...'
              : 'Guardar configuración'}
          </PrimaryButton>
        </div>


        {/* ===============================================
            FECHA DE ACTUALIZACIÓN
        =============================================== */}

        <p
          className={
            styles.lastUpdated
          }
        >
          Última actualización:{' '}
          {formatDateTime(
            lastUpdated,
          )}
        </p>
      </form>
    </div>
  );
}