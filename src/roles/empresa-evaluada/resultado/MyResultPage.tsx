import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileCheck2,
  FilterX,
  Gauge,
  MessageSquareText,
  RefreshCw,
  Search,
  ShieldAlert,
  Target,
} from 'lucide-react';

import {
  useResult,
} from './useResult';

import type {
  CompanyEvaluationResult,
  ResultOperationOption,
} from './result.types';

import styles
  from './MyResultPage.module.css';


function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Pendiente';
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
   RESULT CARD
========================================================= */

function ResultCard({
  result,
}: {
  result:
    CompanyEvaluationResult;
}) {
  return (
    <article
      className={
        styles.resultCard
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
                result.obligationCode
              }
            </span>


            <span
              className={
                styles.compliance
              }
            >
              {
                result.complianceStatus
              }
            </span>


            <span
              className={
                styles.risk
              }
            >
              Riesgo{' '}
              {
                result.riskLevel
              }
            </span>
          </div>


          <h2>
            {
              result.obligationTitle
            }
          </h2>


          <p>
            {
              result.operationName
            }
          </p>
        </div>


        <div
          className={
            styles.score
          }
        >
          <strong>
            {Math.round(
              result.score,
            )}
          </strong>

          <span>
            / 100
          </span>
        </div>
      </header>


      <div
        className={
          styles.infoGrid
        }
      >
        <div>
          <ShieldAlert
            size={19}
          />

          <span>
            <small>
              Brechas
            </small>

            <strong>
              {
                result.gapsCount
              }
            </strong>
          </span>
        </div>


        <div>
          <MessageSquareText
            size={19}
          />

          <span>
            <small>
              Observaciones
            </small>

            <strong>
              {
                result.observationsCount
              }
            </strong>
          </span>
        </div>


        <div>
          <Target
            size={19}
          />

          <span>
            <small>
              Recomendaciones
            </small>

            <strong>
              {
                result.recommendationsCount
              }
            </strong>
          </span>
        </div>


        <div>
          <CheckCircle2
            size={19}
          />

          <span>
            <small>
              Validación
            </small>

            <strong>
              {result.validated
                ? 'Validado'
                : 'Pendiente'}
            </strong>
          </span>
        </div>
      </div>


      {result.evaluationComment && (
        <div
          className={
            styles.comment
          }
        >
          <span>
            Conclusión de la evaluación
          </span>

          <p>
            {
              result.evaluationComment
            }
          </p>
        </div>
      )}


      {result.correctiveAction && (
        <div
          className={
            styles.corrective
          }
        >
          <span>
            Acción correctiva
          </span>

          <p>
            {
              result.correctiveAction
            }
          </p>
        </div>
      )}


      <footer
        className={
          styles.cardFooter
        }
      >
        <span>
          Generado:{' '}

          {formatDate(
            result.createdAt,
          )}
        </span>


        <span>
          Validado:{' '}

          {formatDate(
            result.validatedAt,
          )}
        </span>
      </footer>
    </article>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function MyResultPage() {
  const {
    data,

    results,

    filters,

    loading,

    refreshing,

    error,

    loadResults,

    updateFilter,

    clearFilters,

    clearError,
  } =
    useResult();


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
          Cargando resultados
        </strong>

        <span>
          Estamos consolidando los
          resultados de la evaluación.
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
          size={40}
        />

        <strong>
          No se pudieron cargar
          los resultados
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadResults()
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
            Resultado de evaluación
          </h1>

          <p>
            Consulta el resultado
            consolidado de tus
            obligaciones, cumplimiento,
            riesgos y hallazgos.
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
            void loadResults(
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


      {/* RESULTADO GLOBAL */}

      <section
        className={
          styles.overview
        }
      >
        <div
          className={
            styles.mainScore
          }
        >
          <span>
            Puntaje general
          </span>

          <strong>
            {
              data.summary
                .averageScore
            }
          </strong>

          <small>
            de 100 puntos
          </small>

          <div
            className={
              styles.scoreTrack
            }
          >
            <i
              style={{
                width:
                  `${data.summary.averageScore}%`,
              }}
            />
          </div>
        </div>


        <div
          className={
            styles.overallState
          }
        >
          <ClipboardCheck
            size={24}
          />

          <span>
            Cumplimiento general
          </span>

          <strong>
            {
              data.overallCompliance
            }
          </strong>
        </div>


        <div
          className={
            styles.overallState
          }
        >
          <Gauge
            size={24}
          />

          <span>
            Riesgo general
          </span>

          <strong>
            {
              data.overallRisk
            }
          </strong>
        </div>
      </section>


      {/* SUMMARY */}

      <section
        className={
          styles.summary
        }
      >
        <div>
          <FileCheck2 />

          <span>
            Evaluaciones

            <strong>
              {
                data.summary.total
              }
            </strong>
          </span>
        </div>


        <div>
          <CheckCircle2 />

          <span>
            Cumple

            <strong>
              {
                data.summary.compliant
              }
            </strong>
          </span>
        </div>


        <div>
          <BarChart3 />

          <span>
            Parcial

            <strong>
              {
                data.summary.partial
              }
            </strong>
          </span>
        </div>


        <div>
          <AlertTriangle />

          <span>
            No cumple

            <strong>
              {
                data.summary.nonCompliant
              }
            </strong>
          </span>
        </div>


        <div>
          <ShieldAlert />

          <span>
            Brechas

            <strong>
              {
                data.summary.gaps
              }
            </strong>
          </span>
        </div>


        <div>
          <Target />

          <span>
            Recomendaciones

            <strong>
              {
                data.summary
                  .recommendations
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
            placeholder="Buscar obligación, operación o resultado..."
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
                ResultOperationOption,
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
            filters.complianceStatus
          }
          onChange={(event) =>
            updateFilter(
              'complianceStatus',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todos los cumplimientos
          </option>

          <option value="Cumple">
            Cumple
          </option>

          <option value="Cumple parcialmente">
            Cumple parcialmente
          </option>

          <option value="No cumple">
            No cumple
          </option>
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
        </select>


        <label
          className={
            styles.checkbox
          }
        >
          <input
            type="checkbox"
            checked={
              filters.onlyValidated
            }
            onChange={(event) =>
              updateFilter(
                'onlyValidated',
                event.currentTarget
                  .checked,
              )
            }
          />

          Solo validados
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
              Resultados por obligación
            </h2>

            <span>
              {results.length}{' '}
              resultado(s)
            </span>
          </div>
        </div>


        {results.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <FileCheck2
              size={42}
            />

            <strong>
              Aún no existen resultados
            </strong>

            <span>
              Los resultados aparecerán
              cuando el fiscalizador
              complete y valide las
              evaluaciones.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.listScroll
            }
          >
            {results.map(
              (
                result:
                  CompanyEvaluationResult,
              ) => (
                <ResultCard
                  key={result.id}

                  result={result}
                />
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}