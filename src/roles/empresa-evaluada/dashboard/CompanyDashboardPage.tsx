import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  Gauge,
  MessageSquareText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  UploadCloud,
} from 'lucide-react';

import type {
  CSSProperties,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useCompanyDashboard,
} from './useCompanyDashboard';

import type {
  CompanyDashboardActivity,
} from './companyDashboard.types';

import styles
  from './CompanyDashboardPage.module.css';


function Donut({
  value,
}: {
  value: number;
}) {
  const safeValue =
    Math.max(
      0,
      Math.min(
        100,
        value,
      ),
    );

  return (
    <div
      className={styles.donut}
      style={{
        '--value':
          `${safeValue * 3.6}deg`,
      } as CSSProperties}
    >
      <div
        className={
          styles.donutInside
        }
      >
        <strong>
          {safeValue}%
        </strong>

        <span>
          Cumplimiento
        </span>
      </div>
    </div>
  );
}


function Bar({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage =
    total > 0
      ? Math.round(
          (
            value /
            total
          ) *
            100,
        )
      : 0;

  return (
    <div className={styles.bar}>
      <div>
        <span>{label}</span>

        <strong>
          {value}
        </strong>
      </div>

      <div
        className={
          styles.barTrack
        }
      >
        <div
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}


function ActivityIcon({
  item,
}: {
  item:
    CompanyDashboardActivity;
}) {
  switch (item.type) {
    case 'Evidencia':
      return (
        <UploadCloud size={17} />
      );

    case 'Evaluación':
      return (
        <CheckCircle2 size={17} />
      );

    case 'Brecha':
      return (
        <ShieldAlert size={17} />
      );

    case 'Observación':
      return (
        <MessageSquareText
          size={17}
        />
      );

    case 'Recomendación':
      return (
        <Sparkles size={17} />
      );

    default:
      return (
        <Activity size={17} />
      );
  }
}


function relativeDate(
  value: string,
): string {
  const difference =
    Date.now() -
    new Date(
      value,
    ).getTime();

  const minutes =
    Math.floor(
      difference /
        60000,
    );

  if (minutes < 1) {
    return 'Ahora';
  }

  if (minutes < 60) {
    return `Hace ${minutes} min`;
  }

  const hours =
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  return `Hace ${Math.floor(
    hours / 24,
  )} d`;
}


export default function CompanyDashboardPage() {
  const navigate =
    useNavigate();

  const {
    data,

    loading,
    refreshing,

    error,

    loadDashboard,
    clearError,
  } =
    useCompanyDashboard();


  if (
    loading &&
    !data
  ) {
    return (
      <div
        className={
          styles.loading
        }
      >
        <div
          className={
            styles.spinner
          }
        />

        <strong>
          Preparando tu resumen
        </strong>

        <span>
          Estamos cargando la
          información de tu empresa.
        </span>
      </div>
    );
  }


  if (!data) {
    return (
      <div
        className={
          styles.loading
        }
      >
        <AlertTriangle
          size={35}
        />

        <strong>
          No se pudo cargar el resumen
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadDashboard()
          }
        >
          Reintentar
        </button>
      </div>
    );
  }


  const {
    summary,
    compliance,
    risks,
    evidences,
    obligations,
    recentActivity,
  } = data;


  const complianceTotal =
    compliance.compliant +
    compliance.partial +
    compliance.nonCompliant +
    compliance.pending;

  const riskTotal =
    risks.low +
    risks.medium +
    risks.high +
    risks.critical;

  const evidenceTotal =
    evidences.pending +
    evidences.reviewing +
    evidences.approved +
    evidences.observed +
    evidences.rejected;


  return (
    <div
      className={styles.page}
    >
      <section
        className={styles.hero}
      >
        <div>
          <span
            className={
              styles.eyebrow
            }
          >
            EMPRESA EVALUADA
          </span>

          <h1>
            Resumen de cumplimiento
          </h1>

          <p>
            Consulta el avance de tus
            obligaciones, evidencias,
            observaciones y resultados.
          </p>
        </div>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={refreshing}
          onClick={() =>
            void loadDashboard(
              true,
            )
          }
        >
          <RefreshCw
            size={17}
          />

          {refreshing
            ? 'Actualizando...'
            : 'Actualizar'}
        </button>
      </section>


      {error && (
        <div
          className={
            styles.error
          }
        >
          <AlertTriangle
            size={17}
          />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={
              clearError
            }
          >
            ×
          </button>
        </div>
      )}


      <div
        className={
          styles.realtime
        }
      >
        <span>
          <i />
          Actualización automática
        </span>

        <small>
          {new Intl.DateTimeFormat(
            'es-PE',
            {
              hour:
                '2-digit',
              minute:
                '2-digit',
            },
          ).format(
            new Date(
              data.lastUpdated,
            ),
          )}
        </small>
      </div>


      <section
        className={
          styles.kpis
        }
      >
        <button
          type="button"
          onClick={() =>
            navigate(
              '/empresa-evaluada/obligaciones',
            )
          }
        >
          <ClipboardList
            size={22}
          />

          <span>
            Obligaciones
          </span>

          <strong>
            {summary.obligations}
          </strong>

          <small>
            {
              summary.pendingObligations
            }{' '}
            pendientes
          </small>
        </button>


        <button
          type="button"
          onClick={() =>
            navigate(
              '/empresa-evaluada/evidencias',
            )
          }
        >
          <FileCheck2
            size={22}
          />

          <span>
            Evidencias
          </span>

          <strong>
            {summary.evidences}
          </strong>

          <small>
            {
              summary.approvedEvidences
            }{' '}
            aprobadas
          </small>
        </button>


        <button
          type="button"
          onClick={() =>
            navigate(
              '/empresa-evaluada/observaciones',
            )
          }
        >
          <MessageSquareText
            size={22}
          />

          <span>
            Observaciones
          </span>

          <strong>
            {summary.observations}
          </strong>
        </button>


        <button
          type="button"
          onClick={() =>
            navigate(
              '/empresa-evaluada/brechas-riesgos',
            )
          }
        >
          <ShieldAlert
            size={22}
          />

          <span>
            Brechas
          </span>

          <strong>
            {summary.gaps}
          </strong>

          <small>
            {risks.critical}{' '}
            críticas
          </small>
        </button>
      </section>


      <section
        className={
          styles.analytics
        }
      >
        <article
          className={styles.panel}
        >
          <div
            className={
              styles.panelTitle
            }
          >
            <Gauge size={19} />

            <div>
              <h2>
                Cumplimiento
              </h2>

              <span>
                Resultados consolidados
              </span>
            </div>
          </div>

          <div
            className={
              styles.compliance
            }
          >
            <Donut
              value={
                summary.complianceRate
              }
            />

            <div
              className={
                styles.bars
              }
            >
              <Bar
                label="Cumple"
                value={
                  compliance.compliant
                }
                total={
                  complianceTotal
                }
              />

              <Bar
                label="Cumple parcialmente"
                value={
                  compliance.partial
                }
                total={
                  complianceTotal
                }
              />

              <Bar
                label="No cumple"
                value={
                  compliance.nonCompliant
                }
                total={
                  complianceTotal
                }
              />

              <Bar
                label="Pendiente"
                value={
                  compliance.pending
                }
                total={
                  complianceTotal
                }
              />
            </div>
          </div>
        </article>


        <article
          className={styles.panel}
        >
          <div
            className={
              styles.panelTitle
            }
          >
            <ShieldAlert
              size={19}
            />

            <div>
              <h2>
                Brechas y riesgos
              </h2>

              <span>
                Distribución actual
              </span>
            </div>
          </div>

          <div
            className={
              styles.riskGrid
            }
          >
            {[
              [
                'Bajo',
                risks.low,
              ],
              [
                'Medio',
                risks.medium,
              ],
              [
                'Alto',
                risks.high,
              ],
              [
                'Crítico',
                risks.critical,
              ],
            ].map(
              ([
                label,
                value,
              ]) => (
                <div
                  key={label}
                >
                  <strong>
                    {value}
                  </strong>

                  <span>
                    {label}
                  </span>
                </div>
              ),
            )}
          </div>

          <p
            className={
              styles.totalRisk
            }
          >
            Total de brechas:{' '}
            <strong>
              {riskTotal}
            </strong>
          </p>
        </article>


        <article
          className={
            styles.score
          }
        >
          <span>
            Puntaje general
          </span>

          <strong>
            {summary.averageScore}
          </strong>

          <small>
            de 100 puntos
          </small>

          <div>
            <i
              style={{
                width:
                  `${summary.averageScore}%`,
              }}
            />
          </div>
        </article>
      </section>


      <section
        className={
          styles.twoColumns
        }
      >
        <article
          className={styles.panel}
        >
          <div
            className={
              styles.panelTitle
            }
          >
            <ClipboardList
              size={19}
            />

            <div>
              <h2>
                Estado de obligaciones
              </h2>

              <span>
                Avance de cumplimiento
              </span>
            </div>
          </div>

          <div
            className={
              styles.statusGrid
            }
          >
            <div>
              <strong>
                {obligations.pending}
              </strong>

              <span>
                Pendientes
              </span>
            </div>

            <div>
              <strong>
                {
                  obligations.inProgress
                }
              </strong>

              <span>
                En proceso
              </span>
            </div>

            <div>
              <strong>
                {
                  obligations.completed
                }
              </strong>

              <span>
                Cumplidas
              </span>
            </div>

            <div>
              <strong>
                {
                  obligations.expired
                }
              </strong>

              <span>
                Vencidas
              </span>
            </div>
          </div>
        </article>


        <article
          className={styles.panel}
        >
          <div
            className={
              styles.panelTitle
            }
          >
            <UploadCloud
              size={19}
            />

            <div>
              <h2>
                Estado de evidencias
              </h2>

              <span>
                Seguimiento documental
              </span>
            </div>
          </div>

          <div
            className={
              styles.bars
            }
          >
            <Bar
              label="Pendientes"
              value={
                evidences.pending
              }
              total={
                evidenceTotal
              }
            />

            <Bar
              label="En revisión"
              value={
                evidences.reviewing
              }
              total={
                evidenceTotal
              }
            />

            <Bar
              label="Aprobadas"
              value={
                evidences.approved
              }
              total={
                evidenceTotal
              }
            />

            <Bar
              label="Observadas"
              value={
                evidences.observed
              }
              total={
                evidenceTotal
              }
            />

            <Bar
              label="Rechazadas"
              value={
                evidences.rejected
              }
              total={
                evidenceTotal
              }
            />
          </div>
        </article>
      </section>


      <section
        className={styles.panel}
      >
        <div
          className={
            styles.panelTitle
          }
        >
          <Activity
            size={19}
          />

          <div>
            <h2>
              Actividad reciente
            </h2>

            <span>
              Últimos cambios relacionados
              con tu empresa
            </span>
          </div>
        </div>

        {recentActivity.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <Activity
              size={30}
            />

            <strong>
              Sin actividad reciente
            </strong>

            <span>
              Los nuevos movimientos
              aparecerán aquí.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.activityList
            }
          >
            {recentActivity.map(
              (
                item:
                  CompanyDashboardActivity,
              ) => (
                <button
                  type="button"
                  key={item.id}
                  onClick={() =>
                    navigate(
                      item.route,
                    )
                  }
                >
                  <span
                    className={
                      styles.activityIcon
                    }
                  >
                    <ActivityIcon
                      item={item}
                    />
                  </span>

                  <span
                    className={
                      styles.activityText
                    }
                  >
                    <strong>
                      {item.title}
                    </strong>

                    <span>
                      {
                        item.description
                      }
                    </span>
                  </span>

                  <small>
                    {relativeDate(
                      item.createdAt,
                    )}
                  </small>
                </button>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}