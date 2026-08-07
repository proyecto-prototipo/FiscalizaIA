import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bot,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  FileBarChart,
  FileCheck2,
  FileText,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Target,
  UploadCloud,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useDashboard,
} from './useDashboard';

import type {
  DashboardRecentActivity,
} from './dashboard.types';

import styles
  from './FiscalizadorDashboardPage.module.css';

/* =========================================================
   DONUT
========================================================= */

function DonutChart({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  const safeValue =
    Math.max(
      0,
      Math.min(100, value),
    );

  return (
    <div className={styles.donutWrapper}>
      <div
        className={styles.donut}
        style={{
          '--value':
            `${safeValue * 3.6}deg`,
        } as React.CSSProperties}
      >
        <div className={styles.donutCenter}>
          <strong>
            {safeValue}%
          </strong>

          <span>
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   BARRAS
========================================================= */

function MetricBar({
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
          (value / total) * 100,
        )
      : 0;

  return (
    <div className={styles.metricBar}>
      <div className={styles.metricBarHeader}>
        <span>{label}</span>

        <strong>{value}</strong>
      </div>

      <div className={styles.metricTrack}>
        <div
          className={styles.metricFill}
          style={{
            width:
              `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   ACTIVIDAD
========================================================= */

function ActivityIcon({
  item,
}: {
  item: DashboardRecentActivity;
}) {
  switch (item.type) {
    case 'Evidencia':
      return <UploadCloud size={17} />;

    case 'Evaluación':
      return <ClipboardCheck size={17} />;

    case 'Brecha':
      return <ShieldAlert size={17} />;

    case 'Observación':
      return <AlertTriangle size={17} />;

    case 'Recomendación':
      return <Sparkles size={17} />;

    case 'Reporte':
      return <FileBarChart size={17} />;

    default:
      return <Activity size={17} />;
  }
}

function formatRelativeDate(
  value: string,
): string {
  const date =
    new Date(value);

  const difference =
    Date.now() -
    date.getTime();

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
    Math.floor(
      minutes / 60,
    );

  if (hours < 24) {
    return `Hace ${hours} h`;
  }

  const days =
    Math.floor(
      hours / 24,
    );

  return `Hace ${days} d`;
}

/* =========================================================
   PÁGINA
========================================================= */

export default function FiscalizadorDashboardPage() {
  const navigate =
    useNavigate();

  const {
    data,
    loading,
    refreshing,
    error,
    loadDashboard,
    clearError,
  } = useDashboard();

  if (
    loading &&
    !data
  ) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.loadingSpinner} />

        <strong>
          Preparando panorama de fiscalización
        </strong>

        <span>
          Estamos consolidando la información
          registrada en los diferentes módulos.
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.errorPage}>
        <AlertTriangle size={36} />

        <h2>
          No se pudo cargar el dashboard
        </h2>

        <p>
          {error}
        </p>

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
    gapStatus,
    operations,
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

  const gapTotal =
    gapStatus.open +
    gapStatus.treatment +
    gapStatus.verifying +
    gapStatus.closed;

  return (
    <div className={styles.page}>
      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <section className={styles.hero}>
        <div>
          <span className={styles.eyebrow}>
            ADMINISTRADOR FISCALIZADOR
          </span>

          <h1>
            Panorama general de evaluación
          </h1>

          <p>
            Indicadores consolidados de empresas,
            obligaciones, evidencias, inteligencia
            artificial, brechas y cumplimiento.
          </p>
        </div>

        <button
          type="button"
          className={styles.refreshButton}
          disabled={refreshing}
          onClick={() =>
            void loadDashboard(true)
          }
        >
          <RefreshCw
            size={17}
            className={
              refreshing
                ? styles.spinning
                : ''
            }
          />

          {refreshing
            ? 'Actualizando...'
            : 'Actualizar'}
        </button>
      </section>

      {error && (
        <div className={styles.errorBanner}>
          <AlertTriangle size={17} />

          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
          >
            ×
          </button>
        </div>
      )}

      <div className={styles.realtimeBar}>
        <div>
          <i />
          Actualización automática
        </div>

        <span>
          Última actualización:{' '}
          {new Intl.DateTimeFormat(
            'es-PE',
            {
              hour: '2-digit',
              minute: '2-digit',
            },
          ).format(
            new Date(
              data.lastUpdated,
            ),
          )}
        </span>
      </div>

      {/* =================================================
          KPI PRINCIPALES
      ================================================= */}

      <section className={styles.kpiGrid}>
        <button
          type="button"
          className={styles.kpiCard}
          onClick={() =>
            navigate(
              '/fiscalizador/empresas',
            )
          }
        >
          <span className={styles.kpiIcon}>
            <Building2 size={22} />
          </span>

          <div>
            <span>
              Empresas evaluadas
            </span>

            <strong>
              {summary.companies}
            </strong>

            <small>
              {summary.operations}{' '}
              operaciones registradas
            </small>
          </div>
        </button>

        <button
          type="button"
          className={styles.kpiCard}
          onClick={() =>
            navigate(
              '/fiscalizador/obligaciones',
            )
          }
        >
          <span className={styles.kpiIcon}>
            <ClipboardCheck size={22} />
          </span>

          <div>
            <span>
              Obligaciones
            </span>

            <strong>
              {summary.obligations}
            </strong>

            <small>
              Asignadas en el sistema
            </small>
          </div>
        </button>

        <button
          type="button"
          className={styles.kpiCard}
          onClick={() =>
            navigate(
              '/fiscalizador/evidencias',
            )
          }
        >
          <span className={styles.kpiIcon}>
            <FileCheck2 size={22} />
          </span>

          <div>
            <span>
              Evidencias
            </span>

            <strong>
              {summary.evidences}
            </strong>

            <small>
              {summary.pendingEvidences}{' '}
              pendientes de revisión
            </small>
          </div>
        </button>

        <button
          type="button"
          className={styles.kpiCard}
          onClick={() =>
            navigate(
              '/fiscalizador/evaluaciones',
            )
          }
        >
          <span className={styles.kpiIcon}>
            <Target size={22} />
          </span>

          <div>
            <span>
              Evaluaciones
            </span>

            <strong>
              {summary.evaluations}
            </strong>

            <small>
              {summary.validatedEvaluations}{' '}
              validadas
            </small>
          </div>
        </button>

        <button
          type="button"
          className={styles.kpiCard}
          onClick={() =>
            navigate(
              '/fiscalizador/brechas-riesgos',
            )
          }
        >
          <span className={styles.kpiIcon}>
            <ShieldAlert size={22} />
          </span>

          <div>
            <span>
              Brechas detectadas
            </span>

            <strong>
              {summary.gaps}
            </strong>

            <small>
              {summary.criticalGaps}{' '}
              de riesgo crítico
            </small>
          </div>
        </button>

        <button
          type="button"
          className={styles.kpiCard}
          onClick={() =>
            navigate(
              '/fiscalizador/revision-ia',
            )
          }
        >
          <span className={styles.kpiIcon}>
            <Bot size={22} />
          </span>

          <div>
            <span>
              Análisis IA
            </span>

            <strong>
              {summary.aiAnalyses}
            </strong>

            <small>
              Revisiones inteligentes
            </small>
          </div>
        </button>
      </section>

      {/* =================================================
          INDICADORES PRINCIPALES
      ================================================= */}

      <section className={styles.analyticsGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIcon}>
                <BarChart3 size={18} />
              </span>

              <div>
                <h2>
                  Nivel de cumplimiento
                </h2>

                <p>
                  Resultados consolidados
                </p>
              </div>
            </div>
          </div>

          <div className={styles.complianceContent}>
            <DonutChart
              value={
                summary.complianceRate
              }
              label="Cumplimiento"
            />

            <div className={styles.chartLegend}>
              <MetricBar
                label="Cumple"
                value={
                  compliance.compliant
                }
                total={
                  complianceTotal
                }
              />

              <MetricBar
                label="Cumple parcialmente"
                value={
                  compliance.partial
                }
                total={
                  complianceTotal
                }
              />

              <MetricBar
                label="No cumple"
                value={
                  compliance.nonCompliant
                }
                total={
                  complianceTotal
                }
              />

              <MetricBar
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

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIcon}>
                <ShieldAlert size={18} />
              </span>

              <div>
                <h2>
                  Distribución de riesgos
                </h2>

                <p>
                  Brechas por nivel de riesgo
                </p>
              </div>
            </div>

            <strong className={styles.bigMetric}>
              {riskTotal}
            </strong>
          </div>

          <div className={styles.verticalChart}>
            {[
              {
                label: 'Bajo',
                value: risks.low,
              },
              {
                label: 'Medio',
                value: risks.medium,
              },
              {
                label: 'Alto',
                value: risks.high,
              },
              {
                label: 'Crítico',
                value: risks.critical,
              },
            ].map((item) => {
              const height =
                riskTotal > 0
                  ? Math.max(
                      10,
                      (
                        item.value /
                        riskTotal
                      ) *
                        100,
                    )
                  : 4;

              return (
                <div
                  className={styles.verticalItem}
                  key={item.label}
                >
                  <strong>
                    {item.value}
                  </strong>

                  <div className={styles.verticalTrack}>
                    <div
                      className={styles.verticalFill}
                      style={{
                        height:
                          `${height}%`,
                      }}
                    />
                  </div>

                  <span>
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </article>

        <article className={styles.scorePanel}>
          <span>
            Puntaje promedio
          </span>

          <strong>
            {summary.averageScore}
          </strong>

          <small>
            de 100 puntos
          </small>

          <div className={styles.scoreTrack}>
            <div
              style={{
                width:
                  `${summary.averageScore}%`,
              }}
            />
          </div>

          <p>
            Promedio calculado a partir
            de los resultados registrados.
          </p>
        </article>
      </section>

      {/* =================================================
          EVIDENCIAS + BRECHAS
      ================================================= */}

      <section className={styles.twoColumns}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIcon}>
                <UploadCloud size={18} />
              </span>

              <div>
                <h2>
                  Estado de evidencias
                </h2>

                <p>
                  Seguimiento documental
                </p>
              </div>
            </div>

            <strong className={styles.bigMetric}>
              {evidenceTotal}
            </strong>
          </div>

          <div className={styles.statusBars}>
            <MetricBar
              label="Pendientes"
              value={evidences.pending}
              total={evidenceTotal}
            />

            <MetricBar
              label="En revisión"
              value={evidences.reviewing}
              total={evidenceTotal}
            />

            <MetricBar
              label="Aprobadas"
              value={evidences.approved}
              total={evidenceTotal}
            />

            <MetricBar
              label="Observadas"
              value={evidences.observed}
              total={evidenceTotal}
            />

            <MetricBar
              label="Rechazadas"
              value={evidences.rejected}
              total={evidenceTotal}
            />
          </div>
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIcon}>
                <Target size={18} />
              </span>

              <div>
                <h2>
                  Gestión de brechas
                </h2>

                <p>
                  Avance del tratamiento
                </p>
              </div>
            </div>

            <strong className={styles.bigMetric}>
              {gapTotal}
            </strong>
          </div>

          <div className={styles.gapCards}>
            <div>
              <strong>
                {gapStatus.open}
              </strong>
              <span>Abiertas</span>
            </div>

            <div>
              <strong>
                {gapStatus.treatment}
              </strong>
              <span>
                En tratamiento
              </span>
            </div>

            <div>
              <strong>
                {gapStatus.verifying}
              </strong>
              <span>
                Por verificar
              </span>
            </div>

            <div>
              <strong>
                {gapStatus.closed}
              </strong>
              <span>Cerradas</span>
            </div>
          </div>
        </article>
      </section>

      {/* =================================================
          OPERACIONES
      ================================================= */}

      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <div>
            <span className={styles.panelIcon}>
              <Building2 size={18} />
            </span>

            <div>
              <h2>
                Estado por operación
              </h2>

              <p>
                Operaciones con mayor actividad
                de fiscalización
              </p>
            </div>
          </div>

          <button
            type="button"
            className={styles.linkButton}
            onClick={() =>
              navigate(
                '/fiscalizador/operaciones',
              )
            }
          >
            Ver operaciones
          </button>
        </div>

        {operations.length === 0 ? (
          <div className={styles.empty}>
            <Building2 size={34} />

            <strong>
              Sin operaciones registradas
            </strong>

            <span>
              Las operaciones aparecerán
              aquí cuando sean registradas.
            </span>
          </div>
        ) : (
          <div className={styles.operationTableWrapper}>
            <table className={styles.operationTable}>
              <thead>
                <tr>
                  <th>
                    Empresa / operación
                  </th>

                  <th>
                    Obligaciones
                  </th>

                  <th>
                    Evidencias
                  </th>

                  <th>
                    Brechas
                  </th>

                  <th>
                    Puntaje
                  </th>

                  <th>
                    Riesgo
                  </th>
                </tr>
              </thead>

              <tbody>
                {operations.map(
                  (operation) => (
                    <tr key={operation.id}>
                      <td>
                        <strong>
                          {
                            operation.companyName
                          }
                        </strong>

                        <span>
                          {
                            operation.operationName
                          }
                        </span>
                      </td>

                      <td>
                        {operation.obligations}
                      </td>

                      <td>
                        {operation.evidences}
                      </td>

                      <td>
                        {operation.gaps}
                      </td>

                      <td>
                        <strong
                          className={
                            styles.scoreValue
                          }
                        >
                          {
                            operation.averageScore
                          }
                          /100
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`${styles.riskBadge} ${
                            styles[
                              `risk${operation.riskLevel
                                .normalize('NFD')
                                .replace(
                                  /[\u0300-\u036f]/g,
                                  '',
                                )
                                .replace(
                                  /\s+/g,
                                  '',
                                )}`
                            ] ?? ''
                          }`}
                        >
                          {
                            operation.riskLevel
                          }
                        </span>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* =================================================
          ACTIVIDAD + RESUMEN
      ================================================= */}

      <section className={styles.bottomGrid}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIcon}>
                <Activity size={18} />
              </span>

              <div>
                <h2>
                  Actividad reciente
                </h2>

                <p>
                  Últimos movimientos
                  registrados
                </p>
              </div>
            </div>
          </div>

          {recentActivity.length === 0 ? (
            <div className={styles.empty}>
              <Activity size={32} />

              <strong>
                Sin actividad reciente
              </strong>
            </div>
          ) : (
            <div className={styles.activityList}>
              {recentActivity.map(
                (item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`${styles.activityItem} ${styles[item.severity]}`}
                    onClick={() =>
                      navigate(
                        item.route,
                      )
                    }
                  >
                    <span className={styles.activityIcon}>
                      <ActivityIcon
                        item={item}
                      />
                    </span>

                    <span className={styles.activityContent}>
                      <strong>
                        {item.title}
                      </strong>

                      <span>
                        {item.description}
                      </span>
                    </span>

                    <small>
                      {formatRelativeDate(
                        item.createdAt,
                      )}
                    </small>
                  </button>
                ),
              )}
            </div>
          )}
        </article>

        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelIcon}>
                <FileText size={18} />
              </span>

              <div>
                <h2>
                  Resumen del proceso
                </h2>

                <p>
                  Indicadores complementarios
                </p>
              </div>
            </div>
          </div>

          <div className={styles.quickStats}>
            <button
              type="button"
              onClick={() =>
                navigate(
                  '/fiscalizador/observaciones',
                )
              }
            >
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
                  '/fiscalizador/recomendaciones',
                )
              }
            >
              <span>
                Recomendaciones
              </span>

              <strong>
                {summary.recommendations}
              </strong>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/fiscalizador/resultados',
                )
              }
            >
              <span>
                Resultados
              </span>

              <strong>
                {summary.results}
              </strong>
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  '/fiscalizador/reportes',
                )
              }
            >
              <span>
                Reportes
              </span>

              <strong>
                {summary.reports}
              </strong>
            </button>
          </div>

          <div className={styles.alertBox}>
            <ShieldAlert size={20} />

            <div>
              <strong>
                Atención prioritaria
              </strong>

              <span>
                {summary.criticalGaps === 0
                  ? 'No existen brechas críticas registradas.'
                  : `${summary.criticalGaps} brecha(s) requieren atención crítica.`}
              </span>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}