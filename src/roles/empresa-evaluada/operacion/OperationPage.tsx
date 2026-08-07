import {
  Activity,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock3,
  Factory,
  MapPin,
  RefreshCw,
} from 'lucide-react';

import {
  useOperation,
} from './useOperation';

import type {
  CompanyOperation,
} from './operation.types';

import styles
  from './OperationPage.module.css';


/* =========================================================
   FECHA
========================================================= */

function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'No registrado';
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
   ESTADO
========================================================= */

function getStatusClass(
  status?: string,
): string {
  if (!status) {
    return styles.activeStatus;
  }

  const normalized =
    status
      .toLowerCase()
      .trim();

  if (
    [
      'inactivo',
      'inactiva',
      'suspendido',
      'suspendida',
      'cerrado',
      'cerrada',
    ].includes(
      normalized,
    )
  ) {
    return styles.inactiveStatus;
  }

  return styles.activeStatus;
}


/* =========================================================
   CARD OPERACIÓN
========================================================= */

function OperationCard({
  operation,
}: {
  operation:
    CompanyOperation;
}) {
  return (
    <article
      className={
        styles.operationCard
      }
    >
      <header
        className={
          styles.operationHeader
        }
      >
        <div
          className={
            styles.operationIdentity
          }
        >
          <span
            className={
              styles.operationIcon
            }
          >
            <Factory
              size={22}
            />
          </span>

          <div>
            <small>
              Operación minera
            </small>

            <h2>
              {operation.name}
            </h2>

            {operation.code && (
              <span>
                Código:{' '}
                {operation.code}
              </span>
            )}
          </div>
        </div>

        <span
          className={`${styles.statusBadge} ${getStatusClass(
            operation.status,
          )}`}
        >
          <i />

          {operation.status ??
            'Activa'}
        </span>
      </header>


      <div
        className={
          styles.operationInformation
        }
      >
        <div>
          <span
            className={
              styles.infoIcon
            }
          >
            <MapPin size={17} />
          </span>

          <div>
            <small>
              Ubicación
            </small>

            <strong>
              {operation.location ??
                'No registrada'}
            </strong>
          </div>
        </div>


        <div>
          <span
            className={
              styles.infoIcon
            }
          >
            <Activity
              size={17}
            />
          </span>

          <div>
            <small>
              Tipo de operación
            </small>

            <strong>
              {operation.operationType ??
                'No registrado'}
            </strong>
          </div>
        </div>


        <div>
          <span
            className={
              styles.infoIcon
            }
          >
            <Clock3
              size={17}
            />
          </span>

          <div>
            <small>
              Registrada
            </small>

            <strong>
              {formatDate(
                operation.createdAt,
              )}
            </strong>
          </div>
        </div>
      </div>


      {operation.description && (
        <div
          className={
            styles.description
          }
        >
          <span>
            Información de la operación
          </span>

          <p>
            {operation.description}
          </p>
        </div>
      )}
    </article>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function OperationPage() {
  const {
    data,

    loading,
    refreshing,

    error,

    loadOperations,
    clearError,
  } =
    useOperation();


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
          Cargando tu operación
        </strong>

        <span>
          Estamos consultando la
          información registrada por
          el fiscalizador.
        </span>
      </div>
    );
  }


  /* =======================================================
     ERROR TOTAL
  ======================================================= */

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
          No se pudo cargar la operación
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadOperations()
          }
        >
          Reintentar
        </button>
      </div>
    );
  }


  return (
    <div
      className={styles.page}
    >
      {/* =================================================
          HERO
      ================================================= */}

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
            Mi operación
          </h1>

          <p>
            Consulta la información
            de las operaciones asociadas
            a tu empresa.
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
            void loadOperations(
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


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className={
            styles.errorBanner
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
          EMPRESA
      ================================================= */}

      <section
        className={
          styles.companyPanel
        }
      >
        <span
          className={
            styles.companyIcon
          }
        >
          <Building2
            size={25}
          />
        </span>

        <div
          className={
            styles.companyInfo
          }
        >
          <small>
            Empresa evaluada
          </small>

          <strong>
            {data.company.name}
          </strong>

          {data.company.documentNumber && (
            <span>
              RUC / Documento:{' '}
              {
                data.company
                  .documentNumber
              }
            </span>
          )}
        </div>

        <div
          className={
            styles.companyStats
          }
        >
          <div>
            <span>
              Operaciones
            </span>

            <strong>
              {
                data.totalOperations
              }
            </strong>
          </div>

          <div>
            <span>
              Activas
            </span>

            <strong>
              {
                data.activeOperations
              }
            </strong>
          </div>

          <div>
            <span>
              Inactivas
            </span>

            <strong>
              {
                data.inactiveOperations
              }
            </strong>
          </div>
        </div>
      </section>


      {/* =================================================
          OPERACIONES
      ================================================= */}

      <section
        className={
          styles.operationsPanel
        }
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <div>
            <Factory
              size={20}
            />

            <div>
              <h2>
                Operaciones registradas
              </h2>

              <p>
                Información administrada
                por el fiscalizador.
              </p>
            </div>
          </div>

          <span>
            {
              data.operations.length
            }{' '}
            operación(es)
          </span>
        </div>


        {data.operations.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <Factory
              size={36}
            />

            <strong>
              No existen operaciones
              registradas
            </strong>

            <span>
              Cuando el fiscalizador
              registre una operación
              para tu empresa,
              aparecerá aquí.
            </span>
          </div>
        ) : (
          /*
           * SCROLL INTERNO:
           * si existen muchas operaciones
           * no alargamos toda la página.
           */
          <div
            className={
              styles.operationsScroll
            }
          >
            {data.operations.map(
              (
                operation:
                  CompanyOperation,
              ) => (
                <OperationCard
                  key={
                    operation.id
                  }
                  operation={
                    operation
                  }
                />
              ),
            )}
          </div>
        )}
      </section>


      {/* =================================================
          MENSAJE INFORMATIVO
      ================================================= */}

      <div
        className={
          styles.infoMessage
        }
      >
        <CheckCircle2
          size={18}
        />

        <div>
          <strong>
            Información administrada
          </strong>

          <span>
            Los datos de esta sección
            son gestionados por el
            Administrador Fiscalizador.
            Cualquier modificación se
            reflejará automáticamente.
          </span>
        </div>
      </div>
    </div>
  );
}