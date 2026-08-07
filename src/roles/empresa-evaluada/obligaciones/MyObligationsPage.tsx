import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FilterX,
  RefreshCw,
  Search,
  ShieldAlert,
  UploadCloud,
} from 'lucide-react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useObligations,
} from './useObligations';

import type {
  CompanyObligation,
} from './obligations.types';

import styles
  from './ObligationsPage.module.css';


/* =========================================================
   FORMATEAR FECHA
========================================================= */

function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Sin fecha límite';
  }

  const date =
    new Date(
      `${value}T12:00:00`,
    );

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
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(date);
}


/* =========================================================
   TARJETA DE OBLIGACIÓN
========================================================= */

function ObligationCard({
  obligation,
  onUpload,
}: {
  obligation: CompanyObligation;

  onUpload: (
    obligation: CompanyObligation,
  ) => void;
}) {
  const criticality =
    obligation.criticality
      ?.trim()
      .toLowerCase();


  const criticalityClass =
    criticality === 'alta'
      ? styles.high
      : criticality === 'media'
        ? styles.medium
        : styles.low;


  return (
    <article
      className={
        styles.obligationCard
      }
    >
      {/* =================================================
          CABECERA
      ================================================= */}

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
              {obligation.code}
            </span>


            <span
              className={`${styles.criticality} ${criticalityClass}`}
            >
              {obligation.criticality}
            </span>


            {obligation.expired && (
              <span
                className={
                  styles.expiredBadge
                }
              >
                Vencida
              </span>
            )}
          </div>


          <h2>
            {obligation.title}
          </h2>


          <p>
            {obligation.description ??
              'Sin descripción adicional.'}
          </p>
        </div>


        <span
          className={
            styles.status
          }
        >
          {obligation.status}
        </span>
      </header>


      {/* =================================================
          INFORMACIÓN
      ================================================= */}

      <div
        className={
          styles.details
        }
      >
        {/* OPERACIÓN */}

        <div>
          <ClipboardCheck
            size={19}
          />

          <span>
            <small>
              Operación
            </small>

            <strong>
              {
                obligation.operationName
              }
            </strong>
          </span>
        </div>


        {/* CATEGORÍA */}

        <div>
          <ShieldAlert
            size={19}
          />

          <span>
            <small>
              Categoría
            </small>

            <strong>
              {
                obligation.category
              }
            </strong>
          </span>
        </div>


        {/* FECHA */}

        <div>
          <CalendarDays
            size={19}
          />

          <span>
            <small>
              Fecha límite
            </small>

            <strong>
              {formatDate(
                obligation.dueDate,
              )}
            </strong>
          </span>
        </div>


        {/* EVIDENCIAS */}

        <div>
          <FileCheck2
            size={19}
          />

          <span>
            <small>
              Evidencias
            </small>

            <strong>
              {
                obligation.evidenceCount
              }{' '}
              presentada(s)
            </strong>
          </span>
        </div>
      </div>


      {/* =================================================
          EVIDENCIA REQUERIDA
      ================================================= */}

      <div
        className={
          styles.requiredEvidence
        }
      >
        <span>
          Evidencia requerida
        </span>

        <strong>
          {
            obligation.requiredEvidence
          }
        </strong>
      </div>


      {/* =================================================
          NOTA
      ================================================= */}

      {obligation.notes && (
        <div
          className={
            styles.notes
          }
        >
          <span>
            Nota del fiscalizador
          </span>

          <p>
            {obligation.notes}
          </p>
        </div>
      )}


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer
        className={
          styles.cardFooter
        }
      >
        <div>
          {obligation.evidenceCount >
          0 ? (
            <>
              <CheckCircle2
                size={18}
              />

              <span>
                Última evidencia:{' '}

                <strong>
                  {
                    obligation.latestEvidenceStatus ??
                    'Registrada'
                  }
                </strong>
              </span>
            </>
          ) : (
            <>
              <AlertTriangle
                size={18}
              />

              <span>
                Aún no presentaste evidencia
              </span>
            </>
          )}
        </div>


        {/* IMPORTANTE:
            Aquí usamos onUpload(),
            no openEvidence().
        */}

        <button
          type="button"
          onClick={() =>
            onUpload(
              obligation,
            )
          }
        >
          <UploadCloud
            size={18}
          />

          {obligation.evidenceCount >
          0
            ? 'Ver / presentar evidencia'
            : 'Presentar evidencia'}
        </button>
      </footer>
    </article>
  );
}


/* =========================================================
   PÁGINA
========================================================= */

export default function MyObligationsPage() {
  const navigate =
    useNavigate();


  const {
    data,

    obligations,

    categories,

    filters,

    loading,

    refreshing,

    error,

    loadObligations,

    updateFilter,

    clearFilters,

    clearError,
  } =
    useObligations();


  /* =======================================================
     ABRIR EVIDENCIAS
  ======================================================= */

function openEvidence(
  obligation: CompanyObligation,
) {
  const assignmentId =
    obligation.id;

  console.log(
    '[Empresa Obligaciones] assignment:',
    assignmentId,
  );

  navigate({
    pathname:
      '/empresa_evaluada/evidencias',

    search:
      `?assignment=${encodeURIComponent(
        assignmentId,
      )}`,
  });
}


  /* =======================================================
     LOADING
  ======================================================= */

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
          Cargando obligaciones
        </strong>

        <span>
          Estamos consultando las
          obligaciones asignadas a tu
          empresa.
        </span>
      </div>
    );
  }


  /* =======================================================
     ERROR GENERAL
  ======================================================= */

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
          obligaciones
        </strong>

        <span>
          {error ||
            'No se pudo recuperar la información.'}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadObligations()
          }
        >
          Reintentar
        </button>
      </div>
    );
  }


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className={
        styles.page
      }
    >
      {/* =================================================
          HERO
      ================================================= */}

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
            Mis obligaciones
          </h1>

          <p>
            Consulta las obligaciones
            asignadas, sus plazos y las
            evidencias que debes
            presentar.
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
            void loadObligations(
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


      {/* =================================================
          REALTIME
      ================================================= */}

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


      {/* =================================================
          ERROR
      ================================================= */}

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


      {/* =================================================
          RESUMEN
      ================================================= */}

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
          <CalendarDays />

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
          <RefreshCw />

          <span>
            En proceso

            <strong>
              {
                data.summary
                  .inProgress
              }
            </strong>
          </span>
        </div>


        <div>
          <CheckCircle2 />

          <span>
            Cumplidas

            <strong>
              {
                data.summary
                  .completed
              }
            </strong>
          </span>
        </div>


        <div>
          <AlertTriangle />

          <span>
            Vencidas

            <strong>
              {
                data.summary
                  .expired
              }
            </strong>
          </span>
        </div>


        <div>
          <ShieldAlert />

          <span>
            Criticidad alta

            <strong>
              {
                data.summary
                  .highCriticality
              }
            </strong>
          </span>
        </div>
      </section>


      {/* =================================================
          FILTROS
      ================================================= */}

      <section
        className={
          styles.filters
        }
      >
        {/* BUSCADOR */}

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
            placeholder="Buscar obligación, código, categoría..."
            onChange={(event) =>
              updateFilter(
                'search',
                event.currentTarget
                  .value,
              )
            }
          />
        </div>


        {/* OPERACIÓN */}

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
            (operation) => (
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


        {/* ESTADO */}

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

          <option value="En proceso">
            En proceso
          </option>

          <option value="En revisión">
            En revisión
          </option>

          <option value="Cumplida">
            Cumplida
          </option>

          <option value="Completada">
            Completada
          </option>
        </select>


        {/* CRITICIDAD */}

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


        {/* CATEGORÍA */}

        <select
          value={
            filters.category
          }
          onChange={(event) =>
            updateFilter(
              'category',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todas las categorías
          </option>

          {categories.map(
            (category) => (
              <option
                key={
                  category
                }
                value={
                  category
                }
              >
                {category}
              </option>
            ),
          )}
        </select>


        {/* VENCIDAS */}

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


        {/* LIMPIAR */}

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


      {/* =================================================
          LISTADO
      ================================================= */}

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
              Obligaciones asignadas
            </h2>

            <span>
              {
                obligations.length
              }{' '}
              obligación(es)
              encontrada(s)
            </span>
          </div>


          <span>
            {
              data.summary
                .withEvidence
            }{' '}
            con evidencia
          </span>
        </div>


        {/* ===============================================
            SIN DATOS
        =============================================== */}

        {obligations.length ===
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
              No existen obligaciones
              para mostrar
            </strong>

            <span>
              No se encontraron
              obligaciones con los
              filtros seleccionados.
            </span>
          </div>
        ) : (
          /* =============================================
             LISTA CON SCROLL
          ============================================= */

          <div
            className={
              styles.listScroll
            }
          >
            {obligations.map(
              (
                obligation:
                  CompanyObligation,
              ) => (
                <ObligationCard
                  key={
                    obligation.id
                  }
                  obligation={
                    obligation
                  }

                  /*
                   * El componente hijo
                   * llama a onUpload().
                   *
                   * Esa función apunta
                   * a openEvidence().
                   */
                  onUpload={
                    openEvidence
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