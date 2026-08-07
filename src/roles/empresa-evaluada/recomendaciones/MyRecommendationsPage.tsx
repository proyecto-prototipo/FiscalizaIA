import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock3,
  FilterX,
  Lightbulb,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
} from 'lucide-react';

import {
  useRecommendations,
} from './useRecommendations';

import type {
  CompanyRecommendation,
  RecommendationOperationOption,
} from './recommendations.types';

import styles
  from './MyRecommendationsPage.module.css';


function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Sin fecha definida';
  }


  const date =
    new Date(value);


  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return value;
  }


  return new Intl.DateTimeFormat(
    'es-PE',
    {
      dateStyle:
        'medium',
    },
  ).format(date);
}


/* =========================================================
   CARD
========================================================= */

function RecommendationCard({
  recommendation,
}: {
  recommendation:
    CompanyRecommendation;
}) {
  return (
    <article
      className={
        styles.recommendationCard
      }
    >
      <header
        className={
          styles.cardHeader
        }
      >
        <div>
          <div
            className={
              styles.badges
            }
          >
            <span
              className={
                styles.code
              }
            >
              {
                recommendation.obligationCode
              }
            </span>

            <span
              className={
                styles.priority
              }
            >
              Prioridad{' '}
              {
                recommendation.priority
              }
            </span>

            <span
              className={
                styles.type
              }
            >
              {
                recommendation.recommendationType
              }
            </span>

            {recommendation.expired && (
              <span
                className={
                  styles.expired
                }
              >
                Vencida
              </span>
            )}
          </div>


          <h2>
            {
              recommendation.title
            }
          </h2>


          <p
            className={
              styles.obligation
            }
          >
            {
              recommendation.obligationTitle
            }
          </p>
        </div>


        <span
          className={
            styles.statusBadge
          }
        >
          {
            recommendation.status
          }
        </span>
      </header>


      {/* DESCRIPTION */}

      <div
        className={
          styles.description
        }
      >
        <span>
          Recomendación
        </span>

        <p>
          {
            recommendation.description
          }
        </p>
      </div>


      {/* INFO */}

      <div
        className={
          styles.infoGrid
        }
      >
        <div>
          <Target size={19} />

          <span>
            <small>
              Operación
            </small>

            <strong>
              {
                recommendation.operationName
              }
            </strong>
          </span>
        </div>


        <div>
          <Lightbulb size={19} />

          <span>
            <small>
              Origen
            </small>

            <strong>
              {
                recommendation.source
              }
            </strong>
          </span>
        </div>


        <div>
          <Clock3 size={19} />

          <span>
            <small>
              Fecha objetivo
            </small>

            <strong>
              {formatDate(
                recommendation.dueDate,
              )}
            </strong>
          </span>
        </div>
      </div>


      {/* PROGRESS */}

      <div
        className={
          styles.progressSection
        }
      >
        <div
          className={
            styles.progressHeader
          }
        >
          <span>
            Avance de implementación
          </span>

          <strong>
            {
              recommendation.progress
            }%
          </strong>
        </div>


        <div
          className={
            styles.progressTrack
          }
        >
          <div
            style={{
              width:
                `${recommendation.progress}%`,
            }}
          />
        </div>
      </div>


      <footer
        className={
          styles.cardFooter
        }
      >
        <span>
          Registrada:{' '}

          {formatDate(
            recommendation.createdAt,
          )}
        </span>


        {recommendation.implementedAt && (
          <span>
            Implementada:{' '}

            {formatDate(
              recommendation.implementedAt,
            )}
          </span>
        )}
      </footer>
    </article>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function MyRecommendationsPage() {
  const {
    data,

    recommendations,

    filters,

    loading,

    refreshing,

    error,

    loadRecommendations,

    updateFilter,

    clearFilters,

    clearError,
  } =
    useRecommendations();


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
          Cargando recomendaciones
        </strong>

        <span>
          Estamos consultando las
          acciones recomendadas para
          tu empresa.
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
          size={38}
        />

        <strong>
          No se pudieron cargar las
          recomendaciones
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadRecommendations()
          }
        >
          Reintentar
        </button>
      </div>
    );
  }


  return (
    <div
      className={
        styles.page
      }
    >
      {/* HERO */}

      <section
        className={
          styles.hero
        }
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
            Recomendaciones
          </h1>

          <p>
            Consulta las acciones
            recomendadas para mejorar
            el cumplimiento y reducir
            las brechas identificadas.
          </p>
        </div>


        <button
          type="button"
          className={
            styles.refreshButton
          }
          disabled={
            refreshing
          }
          onClick={() =>
            void loadRecommendations(
              true,
            )
          }
        >
          <RefreshCw size={18} />

          {refreshing
            ? 'Actualizando...'
            : 'Actualizar'}
        </button>
      </section>


      {/* REALTIME */}

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
          Última actualización:{' '}

          {formatDate(
            data.lastUpdated,
          )}
        </small>
      </div>


      {error && (
        <div
          className={
            styles.error
          }
        >
          <AlertTriangle
            size={18}
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


      {/* SUMMARY */}

      <section
        className={
          styles.summary
        }
      >
        <div>
          <Lightbulb />

          <span>
            Total

            <strong>
              {
                data.summary.total
              }
            </strong>
          </span>
        </div>


        <div>
          <Clock3 />

          <span>
            Pendientes

            <strong>
              {
                data.summary.pending
              }
            </strong>
          </span>
        </div>


        <div>
          <BarChart3 />

          <span>
            En ejecución

            <strong>
              {
                data.summary.inProgress
              }
            </strong>
          </span>
        </div>


        <div>
          <CheckCircle2 />

          <span>
            Implementadas

            <strong>
              {
                data.summary.implemented
              }
            </strong>
          </span>
        </div>


        <div>
          <ShieldAlert />

          <span>
            Prioridad alta

            <strong>
              {
                data.summary.highPriority
              }
            </strong>
          </span>
        </div>


        <div>
          <Target />

          <span>
            Avance promedio

            <strong>
              {
                data.summary.averageProgress
              }%
            </strong>
          </span>
        </div>
      </section>


      {/* FILTERS */}

      <section
        className={
          styles.filters
        }
      >
        <div
          className={
            styles.search
          }
        >
          <Search size={18} />

          <input
            value={
              filters.search
            }
            placeholder="Buscar recomendación, obligación u operación..."
            onChange={(event) =>
              updateFilter(
                'search',
                event.currentTarget.value,
              )
            }
          />
        </div>


        <select
          value={
            filters.operationId
          }
          onChange={(event) =>
            updateFilter(
              'operationId',
              event.currentTarget.value,
            )
          }
        >
          <option value="">
            Todas las operaciones
          </option>

          {data.operations.map(
            (
              operation:
                RecommendationOperationOption,
            ) => (
              <option
                key={operation.id}
                value={operation.id}
              >
                {operation.name}
              </option>
            ),
          )}
        </select>


        <select
          value={
            filters.status
          }
          onChange={(event) =>
            updateFilter(
              'status',
              event.currentTarget.value,
            )
          }
        >
          <option value="">
            Todos los estados
          </option>

          <option value="Pendiente">
            Pendiente
          </option>

          <option value="En ejecución">
            En ejecución
          </option>

          <option value="Implementada">
            Implementada
          </option>
        </select>


        <select
          value={
            filters.priority
          }
          onChange={(event) =>
            updateFilter(
              'priority',
              event.currentTarget.value,
            )
          }
        >
          <option value="">
            Todas las prioridades
          </option>

          <option value="Alta">
            Alta
          </option>

          <option value="Media">
            Media
          </option>

          <option value="Baja">
            Baja
          </option>
        </select>


        <select
          value={
            filters.source
          }
          onChange={(event) =>
            updateFilter(
              'source',
              event.currentTarget.value,
            )
          }
        >
          <option value="">
            Todos los orígenes
          </option>

          <option value="Manual">
            Manual
          </option>

          <option value="IA">
            IA
          </option>

          <option value="Evaluación">
            Evaluación
          </option>
        </select>


        <label
          className={
            styles.checkbox
          }
        >
          <input
            type="checkbox"
            checked={
              filters.onlyExpired
            }
            onChange={(event) =>
              updateFilter(
                'onlyExpired',
                event.currentTarget.checked,
              )
            }
          />

          Solo vencidas
        </label>


        <button
          type="button"
          className={
            styles.clearButton
          }
          onClick={
            clearFilters
          }
        >
          <FilterX size={17} />

          Limpiar
        </button>
      </section>


      {/* LIST */}

      <section
        className={
          styles.listPanel
        }
      >
        <div
          className={
            styles.listHeader
          }
        >
          <div>
            <h2>
              Recomendaciones asignadas
            </h2>

            <span>
              {
                recommendations.length
              }{' '}
              recomendación(es)
            </span>
          </div>
        </div>


        {recommendations.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <Lightbulb
              size={42}
            />

            <strong>
              No existen recomendaciones
            </strong>

            <span>
              Las recomendaciones
              aparecerán cuando sean
              generadas y asociadas a
              tus obligaciones.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.listScroll
            }
          >
            {recommendations.map(
              (
                recommendation:
                  CompanyRecommendation,
              ) => (
                <RecommendationCard
                  key={
                    recommendation.id
                  }

                  recommendation={
                    recommendation
                  }
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}