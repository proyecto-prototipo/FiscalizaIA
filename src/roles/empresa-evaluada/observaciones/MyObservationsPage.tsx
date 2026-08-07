import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FilterX,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  ShieldAlert,
} from 'lucide-react';

import {
  useState,
} from 'react';

import {
  useObservations,
} from './useObservations';

import type {
  CompanyObservation,
  ObservationOperationOption,
} from './observations.types';

import styles
  from './MyObservationsPage.module.css';


/* =========================================================
   FECHA
========================================================= */

function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Sin fecha';
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

      timeStyle:
        'short',
    },
  ).format(date);
}


/* =========================================================
   CARD
========================================================= */

function ObservationCard({
  observation,
  responding,

  onSubmit,
}: {
  observation:
    CompanyObservation;

  responding: boolean;

  onSubmit:
    (
      observationId: string,
      response: string,
    ) => Promise<void>;
}) {
  const [
    response,
    setResponse,
  ] =
    useState(
      observation.response ??
      '',
    );


  const canRespond =
    observation.status ===
      'Pendiente' ||
    observation.status ===
      'Respondida';


  return (
    <article
      className={
        styles.observationCard
      }
    >
      {/* HEADER */}

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
                observation.obligationCode
              }
            </span>


            <span
              className={
                styles.source
              }
            >
              {observation.source}
            </span>


            <span
              className={
                styles.severity
              }
            >
              {observation.severity}
            </span>


            {observation.expired && (
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
            {observation.title}
          </h2>


          <p
            className={
              styles.obligation
            }
          >
            {
              observation.obligationTitle
            }
          </p>
        </div>


        <span
          className={
            styles.statusBadge
          }
        >
          {observation.status}
        </span>
      </header>


      {/* INFORMACIÓN */}

      <div
        className={
          styles.infoGrid
        }
      >
        <div>
          <MessageSquareText
            size={19}
          />

          <span>
            <small>
              Operación
            </small>

            <strong>
              {
                observation.operationName
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
              Criticidad
            </small>

            <strong>
              {
                observation.severity
              }
            </strong>
          </span>
        </div>


        <div>
          <Clock3
            size={19}
          />

          <span>
            <small>
              Registrada
            </small>

            <strong>
              {formatDate(
                observation.createdAt,
              )}
            </strong>
          </span>
        </div>
      </div>


      {/* OBSERVACIÓN */}

      <div
        className={
          styles.description
        }
      >
        <span>
          Observación del fiscalizador
        </span>

        <p>
          {observation.description}
        </p>
      </div>


      {/* RESPUESTA */}

      <div
        className={
          styles.responseArea
        }
      >
        <div
          className={
            styles.responseHeader
          }
        >
          <div>
            <strong>
              Respuesta de la empresa
            </strong>

            <span>
              Explica las acciones o
              correcciones realizadas.
            </span>
          </div>


          {observation.respondedAt && (
            <small>
              Respondida:{' '}

              {formatDate(
                observation.respondedAt,
              )}
            </small>
          )}
        </div>


        <textarea
          value={
            response
          }
          disabled={
            !canRespond ||
            responding
          }
          placeholder="Describe las acciones realizadas para atender esta observación..."
          onChange={(event) =>
            setResponse(
              event.currentTarget
                .value,
            )
          }
        />


        <div
          className={
            styles.responseFooter
          }
        >
          <span>
            {response.length}{' '}
            caracteres
          </span>


          {canRespond ? (
            <button
              type="button"
              disabled={
                responding ||
                response.trim()
                  .length <
                  5
              }
              onClick={() =>
                void onSubmit(
                  observation.id,
                  response,
                )
              }
            >
              <Send
                size={17}
              />

              {responding
                ? 'Enviando...'
                : observation.status ===
                    'Respondida'
                  ? 'Actualizar respuesta'
                  : 'Enviar respuesta'}
            </button>
          ) : (
            <span
              className={
                styles.lockedMessage
              }
            >
              Esta observación ya se
              encuentra en revisión.
            </span>
          )}
        </div>
      </div>
    </article>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function MyObservationsPage() {
  const {
    data,

    observations,

    filters,

    loading,

    refreshing,

    respondingId,

    error,

    success,

    loadObservations,

    submitResponse,

    updateFilter,

    clearFilters,

    clearError,

    clearSuccess,
  } =
    useObservations();


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
          Cargando observaciones
        </strong>

        <span>
          Estamos consultando las
          observaciones asociadas a
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
          observaciones
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadObservations()
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
            Observaciones
          </h1>

          <p>
            Revisa las observaciones
            identificadas durante la
            evaluación y registra las
            acciones realizadas para
            atenderlas.
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
            void loadObservations(
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


      {/* MENSAJES */}

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


      {success && (
        <div
          className={
            styles.success
          }
        >
          <CheckCircle2
            size={18}
          />

          <span>
            {success}
          </span>

          <button
            type="button"
            onClick={
              clearSuccess
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
          <MessageSquareText />

          <span>
            Total

            <strong>
              {data.summary.total}
            </strong>
          </span>
        </div>


        <div>
          <Clock3 />

          <span>
            Pendientes

            <strong>
              {
                data.summary
                  .pending
              }
            </strong>
          </span>
        </div>


        <div>
          <Send />

          <span>
            Respondidas

            <strong>
              {
                data.summary
                  .responded
              }
            </strong>
          </span>
        </div>


        <div>
          <RefreshCw />

          <span>
            En verificación

            <strong>
              {
                data.summary
                  .verifying
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
                data.summary
                  .closed
              }
            </strong>
          </span>
        </div>


        <div>
          <ShieldAlert />

          <span>
            Críticas / altas

            <strong>
              {
                data.summary
                  .critical
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
            placeholder="Buscar observación, obligación u operación..."
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
                ObservationOperationOption,
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
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todos los estados
          </option>

          <option value="Pendiente">
            Pendiente
          </option>

          <option value="Respondida">
            Respondida
          </option>

          <option value="En verificación">
            En verificación
          </option>

          <option value="Cerrada">
            Cerrada
          </option>
        </select>


        <select
          value={
            filters.severity
          }
          onChange={(event) =>
            updateFilter(
              'severity',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todas las criticidades
          </option>

          <option value="Crítica">
            Crítica
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
              Observaciones recibidas
            </h2>

            <span>
              {observations.length}{' '}
              observación(es)
            </span>
          </div>
        </div>


        {observations.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <MessageSquareText
              size={40}
            />

            <strong>
              No existen observaciones
            </strong>

            <span>
              No encontramos registros
              con los filtros actuales.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.listScroll
            }
          >
            {observations.map(
              (
                observation:
                  CompanyObservation,
              ) => (
                <ObservationCard
                  key={
                    observation.id
                  }

                  observation={
                    observation
                  }

                  responding={
                    respondingId ===
                    observation.id
                  }

                  onSubmit={
                    submitResponse
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