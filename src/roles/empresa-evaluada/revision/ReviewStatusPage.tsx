import {
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  Circle,
  ClipboardCheck,
  FileText,
  FilterX,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react';

import {
  useReviewStatus,
} from './useReviewStatus';

import type {
  ReviewTrackingItem,
} from './review.types';

import styles
  from './ReviewStatusPage.module.css';


function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Sin registro';
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
   PASO
========================================================= */

function Step({
  completed,
  active,
  title,
  description,
}: {
  completed: boolean;

  active?: boolean;

  title: string;

  description: string;
}) {
  return (
    <div
      className={`${styles.step} ${
        completed
          ? styles.stepCompleted
          : active
            ? styles.stepActive
            : ''
      }`}
    >
      <span
        className={
          styles.stepIcon
        }
      >
        {completed ? (
          <Check
            size={16}
          />
        ) : (
          <Circle
            size={14}
          />
        )}
      </span>


      <div>
        <strong>
          {title}
        </strong>

        <span>
          {description}
        </span>
      </div>
    </div>
  );
}


/* =========================================================
   CARD
========================================================= */

function ReviewCard({
  item,
}: {
  item:
    ReviewTrackingItem;
}) {
  return (
    <article
      className={
        styles.reviewCard
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
              styles.codeRow
            }
          >
            <span
              className={
                styles.code
              }
            >
              {
                item.obligationCode
              }
            </span>

            <span
              className={
                styles.criticality
              }
            >
              {
                item.criticality
              }
            </span>
          </div>

          <h2>
            {
              item.obligationTitle
            }
          </h2>

          <p>
            {
              item.operationName
            }
          </p>
        </div>


        <div
          className={
            styles.stageBadge
          }
        >
          {
            item.currentStage
          }
        </div>
      </header>


      {/* =================================================
          PROGRESO
      ================================================= */}

      <div
        className={
          styles.progressArea
        }
      >
        <div
          className={
            styles.progressHeader
          }
        >
          <span>
            Avance del proceso
          </span>

          <strong>
            {item.progress}%
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
                `${item.progress}%`,
            }}
          />
        </div>
      </div>


      {/* =================================================
          ETAPAS
      ================================================= */}

      <div
        className={
          styles.steps
        }
      >
        <Step
          completed={
            item.evidencePresented
          }
          active={
            !item.evidencePresented
          }
          title="Evidencia"
          description={
            item.evidencePresented
              ? 'Documento presentado'
              : 'Pendiente de presentación'
          }
        />


        <Step
          completed={
            item.aiCompleted
          }
          active={
            item.evidencePresented &&
            !item.aiCompleted
          }
          title="Análisis IA"
          description={
            item.evidence?.aiStatus ??
            'Pendiente'
          }
        />


        <Step
          completed={
            item.fiscalizerReviewed
          }
          active={
            item.aiCompleted &&
            !item.fiscalizerReviewed
          }
          title="Revisión fiscalizadora"
          description={
            item.evidence?.status ??
            'Pendiente'
          }
        />


        <Step
          completed={
            item.evaluationValidated
          }
          active={
            item.fiscalizerReviewed &&
            !item.evaluationValidated
          }
          title="Evaluación"
          description={
            item.evaluationValidated
              ? 'Validada'
              : 'Pendiente'
          }
        />
      </div>


      {/* =================================================
          INFORMACIÓN
      ================================================= */}

      <div
        className={
          styles.infoGrid
        }
      >
        <div>
          <FileText
            size={19}
          />

          <span>
            <small>
              Documento
            </small>

            <strong>
              {
                item.evidence?.fileName ??
                'Sin evidencia'
              }
            </strong>
          </span>
        </div>


        <div>
          <Bot
            size={19}
          />

          <span>
            <small>
              IA
            </small>

            <strong>
              {
                item.evidence?.aiStatus ??
                'Pendiente'
              }
            </strong>
          </span>
        </div>


        <div>
          <ShieldCheck
            size={19}
          />

          <span>
            <small>
              Estado
            </small>

            <strong>
              {
                item.evidence?.status ??
                'Sin evidencia'
              }
            </strong>
          </span>
        </div>


        <div>
          <ClipboardCheck
            size={19}
          />

          <span>
            <small>
              Resultado
            </small>

            <strong>
              {
                item.evaluation
                  ?.complianceStatus ??
                'Pendiente'
              }
            </strong>
          </span>
        </div>
      </div>


      {/* =================================================
          IA
      ================================================= */}

      {typeof
        item.evidence
          ?.aiConfidence ===
        'number' && (
        <div
          className={
            styles.aiConfidence
          }
        >
          <div>
            <span>
              Confianza del análisis IA
            </span>

            <strong>
              {
                item.evidence
                  .aiConfidence
              }%
            </strong>
          </div>


          <div
            className={
              styles.aiBar
            }
          >
            <i
              style={{
                width:
                  `${
                    item.evidence
                      .aiConfidence
                  }%`,
              }}
            />
          </div>
        </div>
      )}


      {/* =================================================
          EVALUACIÓN
      ================================================= */}

      {item.evaluation && (
        <div
          className={
            styles.evaluation
          }
        >
          <div>
            <span>
              Cumplimiento
            </span>

            <strong>
              {
                item.evaluation
                  .complianceStatus
              }
            </strong>
          </div>


          <div>
            <span>
              Riesgo
            </span>

            <strong>
              {
                item.evaluation
                  .riskLevel
              }
            </strong>
          </div>


          <div>
            <span>
              Puntaje
            </span>

            <strong>
              {
                item.evaluation
                  .score
              }/100
            </strong>
          </div>
        </div>
      )}


      {/* =================================================
          COMENTARIO
      ================================================= */}

      {item.evidence
        ?.reviewComment && (
        <div
          className={
            styles.comment
          }
        >
          <span>
            Comentario del fiscalizador
          </span>

          <p>
            {
              item.evidence
                .reviewComment
            }
          </p>
        </div>
      )}


      <footer
        className={
          styles.cardFooter
        }
      >
        Última actualización:{' '}

        {formatDate(
          item.lastUpdated,
        )}
      </footer>
    </article>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function ReviewStatusPage() {
  const {
    data,

    items,

    filters,

    loading,

    refreshing,

    error,

    loadReviewStatus,

    updateFilter,

    clearFilters,

    clearError,
  } =
    useReviewStatus();


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
          Cargando estado de revisión
        </strong>

        <span>
          Estamos consultando el avance
          de tus obligaciones.
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
          No se pudo cargar el estado
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadReviewStatus()
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
            Estado de revisión
          </h1>

          <p>
            Sigue el avance de tus
            evidencias, análisis IA,
            revisión fiscalizadora y
            evaluaciones.
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
            void loadReviewStatus(
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


      <section
        className={
          styles.summary
        }
      >
        <div>
          <ClipboardCheck />

          <span>
            Total
            <strong>
              {data.summary.total}
            </strong>
          </span>
        </div>


        <div>
          <FileText />

          <span>
            Sin evidencia
            <strong>
              {
                data.summary
                  .withoutEvidence
              }
            </strong>
          </span>
        </div>


        <div>
          <RefreshCw />

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
          <ShieldCheck />

          <span>
            En revisión
            <strong>
              {
                data.summary
                  .reviewing
              }
            </strong>
          </span>
        </div>


        <div>
          <Bot />

          <span>
            IA completada
            <strong>
              {
                data.summary
                  .aiCompleted
              }
            </strong>
          </span>
        </div>


        <div>
          <CheckCircle2 />

          <span>
            Finalizadas
            <strong>
              {
                data.summary
                  .finalized
              }
            </strong>
          </span>
        </div>
      </section>


      {/* FILTROS */}

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
            placeholder="Buscar obligación, documento u operación..."
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
              operation,
            ) => (
              <option
                key={
                  operation.id
                }
                value={
                  operation.id
                }
              >
                {
                  operation.name
                }
              </option>
            ),
          )}
        </select>


        <select
          value={
            filters.stage
          }
          onChange={(event) =>
            updateFilter(
              'stage',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todas las etapas
          </option>

          <option value="Sin evidencia">
            Sin evidencia
          </option>

          <option value="Evidencia presentada">
            Evidencia presentada
          </option>

          <option value="Análisis IA">
            Análisis IA
          </option>

          <option value="Revisión fiscalizadora">
            Revisión fiscalizadora
          </option>

          <option value="Finalizado">
            Finalizado
          </option>
        </select>


        <select
          value={
            filters.criticality
          }
          onChange={(event) =>
            updateFilter(
              'criticality',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todas las criticidades
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


      {/* LISTADO */}

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
              Seguimiento de revisión
            </h2>

            <span>
              {items.length}{' '}
              obligación(es)
            </span>
          </div>
        </div>


        {items.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <ClipboardCheck
              size={40}
            />

            <strong>
              No existen registros
            </strong>

            <span>
              No encontramos procesos
              con los filtros actuales.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.listScroll
            }
          >
            {items.map(
              (
                item:
                  ReviewTrackingItem,
              ) => (
                <ReviewCard
                  key={
                    item.assignmentId
                  }
                  item={
                    item
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