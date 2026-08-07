import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FilterX,
  Gauge,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
} from 'lucide-react';

import {
  useGapsRisks,
} from './useGapsRisks';

import type {
  CompanyGapRisk,
  GapOperationOption,
} from './gaps-risks.types';

import styles
  from './MyGapsRisksPage.module.css';


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

function GapCard({
  gap,
}: {
  gap:
    CompanyGapRisk;
}) {
  return (
    <article
      className={
        styles.gapCard
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
                gap.obligationCode
              }
            </span>


            <span
              className={
                styles.risk
              }
            >
              Riesgo{' '}
              {
                gap.riskLevel
              }
            </span>


            <span
              className={
                styles.priority
              }
            >
              Prioridad{' '}
              {
                gap.priority
              }
            </span>


            {gap.expired && (
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
            {gap.title}
          </h2>


          <p
            className={
              styles.obligation
            }
          >
            {
              gap.obligationTitle
            }
          </p>
        </div>


        <span
          className={
            styles.statusBadge
          }
        >
          {gap.status}
        </span>
      </header>


      {/* DESCRIPTION */}

      <div
        className={
          styles.description
        }
      >
        <span>
          Brecha detectada
        </span>

        <p>
          {gap.description}
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
                gap.operationName
              }
            </strong>
          </span>
        </div>


        <div>
          <ShieldAlert
            size={19}
          />

          <span>
            <small>
              Riesgo
            </small>

            <strong>
              {
                gap.riskLevel
              }
            </strong>
          </span>
        </div>


        <div>
          <Gauge size={19} />

          <span>
            <small>
              Probabilidad
            </small>

            <strong>
              {
                gap.probability
              }
            </strong>
          </span>
        </div>


        <div>
          <RefreshCw
            size={19}
          />

          <span>
            <small>
              Origen
            </small>

            <strong>
              {gap.source}
            </strong>
          </span>
        </div>
      </div>


      {/* SECONDARY */}

      <div
        className={
          styles.secondaryGrid
        }
      >
        <div>
          <span>
            Impacto
          </span>

          <strong>
            {
              gap.impact ??
              'No especificado'
            }
          </strong>
        </div>


        <div>
          <span>
            Tratamiento
          </span>

          <strong>
            {
              gap.treatment ??
              'Pendiente de definir'
            }
          </strong>
        </div>


        <div>
          <span>
            Responsable
          </span>

          <strong>
            {
              gap.responsible ??
              'No asignado'
            }
          </strong>
        </div>


        <div>
          <span>
            Fecha objetivo
          </span>

          <strong>
            {formatDate(
              gap.dueDate,
            )}
          </strong>
        </div>
      </div>


      <footer
        className={
          styles.cardFooter
        }
      >
        <span>
          Detectada:{' '}

          {formatDate(
            gap.createdAt,
          )}
        </span>


        {gap.closedAt && (
          <span>
            Cerrada:{' '}

            {formatDate(
              gap.closedAt,
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

export default function MyGapsRisksPage() {
  const {
    data,

    gaps,

    filters,

    loading,

    refreshing,

    error,

    loadGapsRisks,

    updateFilter,

    clearFilters,

    clearError,
  } =
    useGapsRisks();


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
          Cargando brechas y riesgos
        </strong>

        <span>
          Estamos consultando los
          hallazgos asociados a tu
          empresa.
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
          No se pudieron cargar
          las brechas
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadGapsRisks()
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
            Brechas y riesgos
          </h1>

          <p>
            Consulta las brechas
            identificadas durante la
            evaluación, su nivel de
            riesgo, prioridad y estado
            de tratamiento.
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
            void loadGapsRisks(
              true,
            )
          }
        >
          <RefreshCw
            size={18}
          />

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


      {/* ERROR */}

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
          <Target />

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
          <AlertTriangle />

          <span>
            Abiertas

            <strong>
              {
                data.summary.open
              }
            </strong>
          </span>
        </div>


        <div>
          <RefreshCw />

          <span>
            En tratamiento

            <strong>
              {
                data.summary.treatment
              }
            </strong>
          </span>
        </div>


        <div>
          <Clock3 />

          <span>
            Por verificar

            <strong>
              {
                data.summary.verifying
              }
            </strong>
          </span>
        </div>


        <div>
          <CheckCircle2 />

          <span>
            Cerradas

            <strong>
              {
                data.summary.closed
              }
            </strong>
          </span>
        </div>


        <div>
          <ShieldAlert />

          <span>
            Riesgo alto/crítico

            <strong>
              {
                data.summary.highRisk
              }
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
          <Search
            size={18}
          />

          <input
            value={
              filters.search
            }
            placeholder="Buscar brecha, obligación u operación..."
            onChange={(event) =>
              updateFilter(
                'search',
                event.currentTarget
                  .value,
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
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todas las operaciones
          </option>

          {data.operations.map(
            (
              operation:
                GapOperationOption,
            ) => (
              <option
                key={
                  operation.id
                }
                value={
                  operation.id
                }
              >
                {operation.name}
              </option>
            ),
          )}
        </select>


        <select
          value={
            filters.riskLevel
          }
          onChange={(event) =>
            updateFilter(
              'riskLevel',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todos los riesgos
          </option>

          <option value="Bajo">
            Bajo
          </option>

          <option value="Medio">
            Medio
          </option>

          <option value="Alto">
            Alto
          </option>

          <option value="Crítico">
            Crítico
          </option>

          <option value="No determinado">
            No determinado
          </option>
        </select>


        <select
          value={
            filters.status
          }
          onChange={(event) =>
            updateFilter(
              'status',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todos los estados
          </option>

          <option value="Abierta">
            Abierta
          </option>

          <option value="En tratamiento">
            En tratamiento
          </option>

          <option value="Por verificar">
            Por verificar
          </option>

          <option value="Cerrada">
            Cerrada
          </option>
        </select>


        <select
          value={
            filters.priority
          }
          onChange={(event) =>
            updateFilter(
              'priority',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todas las prioridades
          </option>

          <option value="Baja">
            Baja
          </option>

          <option value="Media">
            Media
          </option>

          <option value="Alta">
            Alta
          </option>

          <option value="Urgente">
            Urgente
          </option>
        </select>


        <select
          value={
            filters.source
          }
          onChange={(event) =>
            updateFilter(
              'source',
              event.currentTarget
                .value,
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
                event.currentTarget
                  .checked,
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
          <FilterX
            size={17}
          />

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
              Brechas detectadas
            </h2>

            <span>
              {gaps.length}{' '}
              brecha(s)
              encontrada(s)
            </span>
          </div>
        </div>


        {gaps.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <ShieldAlert
              size={42}
            />

            <strong>
              No existen brechas
            </strong>

            <span>
              Las brechas aparecerán
              cuando sean detectadas
              durante la evaluación.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.listScroll
            }
          >
            {gaps.map(
              (
                gap:
                  CompanyGapRisk,
              ) => (
                <GapCard
                  key={gap.id}
                  gap={gap}
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}