import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Eye,
  FileCheck2,
  FileText,
  FilterX,
  RefreshCw,
  Search,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';

import {
  useRef,
} from 'react';

import {
  useEvidences,
} from './useEvidences';

import type {
  CompanyEvidence,
} from './evidences.types';

import styles
  from './MyEvidencesPage.module.css';


/* =========================================================
   FORMATOS
========================================================= */

function formatDate(
  value: string,
): string {
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


function formatFileSize(
  bytes: number,
): string {
  if (
    bytes <
    1024 * 1024
  ) {
    return `${(
      bytes /
      1024
    ).toFixed(1)} KB`;
  }


  return `${(
    bytes /
    1024 /
    1024
  ).toFixed(1)} MB`;
}


/* =========================================================
   STATUS
========================================================= */

function getStatusClass(
  status: string,
): string {
  switch (
    status
      .trim()
      .toLowerCase()
  ) {
    case 'aprobada':
      return styles.statusApproved;

    case 'observada':
      return styles.statusObserved;

    case 'rechazada':
      return styles.statusRejected;

    case 'en revisión':
    case 'en revision':
      return styles.statusReviewing;

    default:
      return styles.statusPending;
  }
}


/* =========================================================
   CARD
========================================================= */

function EvidenceCard({
  evidence,
  onOpen,
}: {
  evidence:
    CompanyEvidence;

  onOpen:
    (
      evidence:
        CompanyEvidence,
    ) => void;
}) {
  return (
    <article
      className={
        styles.evidenceCard
      }
    >
      <header
        className={
          styles.evidenceHeader
        }
      >
        <div
          className={
            styles.fileIdentity
          }
        >
          <span
            className={
              styles.fileIcon
            }
          >
            <FileText
              size={23}
            />
          </span>

          <div>
            <span
              className={
                styles.obligationCode
              }
            >
              {
                evidence.obligationCode
              }
            </span>

            <h2>
              {evidence.fileName}
            </h2>

            <p>
              {
                evidence.obligationTitle
              }
            </p>
          </div>
        </div>


        <span
          className={`${styles.statusBadge} ${getStatusClass(
            evidence.status,
          )}`}
        >
          {evidence.status}
        </span>
      </header>


      <div
        className={
          styles.evidenceDetails
        }
      >
        <div>
          <ShieldCheck
            size={18}
          />

          <span>
            <small>
              Operación
            </small>

            <strong>
              {
                evidence.operationName
              }
            </strong>
          </span>
        </div>


        <div>
          <Clock3
            size={18}
          />

          <span>
            <small>
              Presentado
            </small>

            <strong>
              {formatDate(
                evidence.uploadedAt,
              )}
            </strong>
          </span>
        </div>


        <div>
          <FileCheck2
            size={18}
          />

          <span>
            <small>
              Versión
            </small>

            <strong>
              v{evidence.version}
            </strong>
          </span>
        </div>


        <div>
          <ShieldCheck
            size={18}
          />

          <span>
            <small>
              Revisión IA
            </small>

            <strong>
              {evidence.aiStatus}
            </strong>
          </span>
        </div>
      </div>


      {typeof evidence.aiConfidence ===
        'number' && (
        <div
          className={
            styles.aiResult
          }
        >
          <span>
            Confianza del análisis
          </span>

          <div>
            <i
              style={{
                width:
                  `${Math.min(
                    100,
                    Math.max(
                      0,
                      evidence.aiConfidence,
                    ),
                  )}%`,
              }}
            />
          </div>

          <strong>
            {
              evidence.aiConfidence
            }%
          </strong>
        </div>
      )}


      {evidence.reviewComment && (
        <div
          className={
            styles.reviewComment
          }
        >
          <span>
            Comentario del fiscalizador
          </span>

          <p>
            {
              evidence.reviewComment
            }
          </p>
        </div>
      )}


      <footer
        className={
          styles.evidenceFooter
        }
      >
        <span>
          Documento registrado
          correctamente en FiscalizaIA
        </span>

        <button
          type="button"
          onClick={() =>
            onOpen(
              evidence,
            )
          }
        >
          <Eye size={17} />

          Ver documento
        </button>
      </footer>
    </article>
  );
}


/* =========================================================
   PAGE
========================================================= */

export default function MyEvidencesPage() {
  const fileInputRef =
    useRef<HTMLInputElement | null>(
      null,
    );


  const {
    data,

    evidences,

    filters,

    selectedAssignmentId,
    selectedFile,

    loading,
    refreshing,
    uploading,

    error,
    success,

    setSelectedAssignmentId,
    setSelectedFile,

    loadEvidences,
    uploadEvidence,
    openEvidence,

    updateFilter,
    clearFilters,

    clearError,
    clearSuccess,
  } =
    useEvidences();


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
          Cargando evidencias
        </strong>

        <span>
          Estamos consultando los
          documentos presentados por
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
          No se pudieron cargar
          las evidencias
        </strong>

        <span>
          {error}
        </span>

        <button
          type="button"
          onClick={() =>
            void loadEvidences()
          }
        >
          Reintentar
        </button>
      </div>
    );
  }


  const selectedAssignment =
    data.assignments.find(
      (assignment) =>
        assignment.id ===
        selectedAssignmentId,
    );


  return (
    <div
      className={
        styles.page
      }
    >
      {/* =================================================
          HEADER
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
            Mis evidencias
          </h1>

          <p>
            Presenta documentos para
            acreditar el cumplimiento
            de tus obligaciones y
            consulta su estado de
            revisión.
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
            void loadEvidences(
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
          MENSAJES
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


      {/* =================================================
          RESUMEN
      ================================================= */}

      <section
        className={
          styles.summary
        }
      >
        <div>
          <FileText />

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
          <RefreshCw />

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
          <CheckCircle2 />

          <span>
            Aprobadas
            <strong>
              {
                data.summary
                  .approved
              }
            </strong>
          </span>
        </div>

        <div>
          <AlertTriangle />

          <span>
            Observadas
            <strong>
              {
                data.summary
                  .observed
              }
            </strong>
          </span>
        </div>
      </section>


      {/* =================================================
          PRESENTAR EVIDENCIA
      ================================================= */}

      <section
        className={
          styles.uploadPanel
        }
      >
        <div
          className={
            styles.panelHeader
          }
        >
          <UploadCloud
            size={22}
          />

          <div>
            <h2>
              Presentar nueva evidencia
            </h2>

            <p>
              Selecciona la obligación
              y adjunta el documento
              correspondiente.
            </p>
          </div>
        </div>


        <div
          className={
            styles.uploadGrid
          }
        >
          <label>
            Obligación

            <select
              value={
                selectedAssignmentId
              }
              onChange={(event) => {
                setSelectedAssignmentId(
                  event.currentTarget
                    .value,
                );

                updateFilter(
                  'assignmentId',
                  event.currentTarget
                    .value,
                );
              }}
            >
              <option value="">
                Selecciona una obligación
              </option>

              {data.assignments.map(
                (assignment) => (
                  <option
                    key={
                      assignment.id
                    }
                    value={
                      assignment.id
                    }
                  >
                    {
                      assignment.code
                    }{' '}
                    -{' '}
                    {
                      assignment.title
                    }
                  </option>
                ),
              )}
            </select>
          </label>


          <div
            className={
              styles.fileSelector
            }
          >
            <span>
              Archivo
            </span>

            <input
              ref={
                fileInputRef
              }
              type="file"
              hidden
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
              onChange={(event) => {
                const file =
                  event.currentTarget
                    .files?.[0] ??
                  null;

                setSelectedFile(
                  file,
                );
              }}
            />


            <button
              type="button"
              onClick={() =>
                fileInputRef.current
                  ?.click()
              }
            >
              <UploadCloud
                size={18}
              />

              Seleccionar archivo
            </button>
          </div>
        </div>


        {selectedAssignment && (
          <div
            className={
              styles.assignmentInfo
            }
          >
            <div>
              <span>
                Obligación
              </span>

              <strong>
                {
                  selectedAssignment.code
                }{' '}
                -{' '}
                {
                  selectedAssignment.title
                }
              </strong>
            </div>

            <div>
              <span>
                Operación
              </span>

              <strong>
                {
                  selectedAssignment.operationName
                }
              </strong>
            </div>

            <div>
              <span>
                Evidencia requerida
              </span>

              <strong>
                {
                  selectedAssignment.requiredEvidence
                }
              </strong>
            </div>
          </div>
        )}


        {selectedFile && (
          <div
            className={
              styles.selectedFile
            }
          >
            <FileText
              size={21}
            />

            <div>
              <strong>
                {
                  selectedFile.name
                }
              </strong>

              <span>
                {formatFileSize(
                  selectedFile.size,
                )}
              </span>
            </div>

            <button
              type="button"
              aria-label="Quitar archivo"
              onClick={() => {
                setSelectedFile(
                  null,
                );

                if (
                  fileInputRef.current
                ) {
                  fileInputRef.current.value =
                    '';
                }
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}


        <div
          className={
            styles.uploadFooter
          }
        >
          <span>
            Tamaño máximo recomendado:
            20 MB.
          </span>

          <button
            type="button"
            className={
              styles.uploadButton
            }
            disabled={
              uploading ||
              !selectedAssignmentId ||
              !selectedFile
            }
            onClick={() =>
              void uploadEvidence()
            }
          >
            <UploadCloud
              size={18}
            />

            {uploading
              ? 'Presentando...'
              : 'Presentar evidencia'}
          </button>
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
            placeholder="Buscar documento, obligación u operación..."
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

          <option value="En revisión">
            En revisión
          </option>

          <option value="Aprobada">
            Aprobada
          </option>

          <option value="Observada">
            Observada
          </option>

          <option value="Rechazada">
            Rechazada
          </option>
        </select>


        <select
          value={
            filters.aiStatus
          }
          onChange={(event) =>
            updateFilter(
              'aiStatus',
              event.currentTarget
                .value,
            )
          }
        >
          <option value="">
            Todos los estados IA
          </option>

          <option value="Pendiente">
            IA pendiente
          </option>

          <option value="Procesando">
            IA procesando
          </option>

          <option value="Completado">
            IA completada
          </option>

          <option value="Error">
            Error IA
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

          Limpiar filtros
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
              Evidencias presentadas
            </h2>

            <span>
              {
                evidences.length
              }{' '}
              documento(s)
              encontrado(s)
            </span>
          </div>
        </div>


        {evidences.length ===
        0 ? (
          <div
            className={
              styles.empty
            }
          >
            <FileText
              size={40}
            />

            <strong>
              Aún no existen evidencias
            </strong>

            <span>
              Selecciona una obligación
              y presenta el documento
              requerido.
            </span>
          </div>
        ) : (
          <div
            className={
              styles.listScroll
            }
          >
            {evidences.map(
              (
                evidence:
                  CompanyEvidence,
              ) => (
                <EvidenceCard
                  key={
                    evidence.id
                  }
                  evidence={
                    evidence
                  }
                  onOpen={(
                    item,
                  ) =>
                    void openEvidence(
                      item.storagePath,
                    )
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