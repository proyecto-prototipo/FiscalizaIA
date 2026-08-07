import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Download,
  Eye,
  FileCheck2,
  FileSearch,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';

import {
  type FormEvent,
  useMemo,
  useState,
} from 'react';

import {
  Badge,
  PageHeader,
  Panel,
  PrimaryButton,
} from '../../../shared/components/Ui';

import type {
  EvidenceDocument,
  EvidenceReviewFormValues,
  EvidenceStatus,
  ObligationCriticality,
} from './evidences.types';

import { useEvidences } from './useEvidences';

import styles from './EvidencesPage.module.css';


/* =========================================================
   OPCIONES
========================================================= */

const EVIDENCE_STATUSES:
EvidenceStatus[] = [
  'Pendiente',
  'En revisión',
  'Aprobada',
  'Observada',
  'Rechazada',
];


const FINAL_REVIEW_STATUSES:
EvidenceStatus[] = [
  'Aprobada',
  'Observada',
  'Rechazada',
];


const CRITICALITIES:
ObligationCriticality[] = [
  'Baja',
  'Media',
  'Alta',
];


const EMPTY_REVIEW_FORM:
EvidenceReviewFormValues = {
  status: 'Aprobada',

  reviewComment: '',
};


/* =========================================================
   FUNCIONES AUXILIARES
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
    return 'Sin fecha';
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


function formatDateTime(
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
    return 'Sin fecha';
  }


  return new Intl.DateTimeFormat(
    'es-PE',
    {
      day: '2-digit',

      month: 'short',

      year: 'numeric',

      hour: '2-digit',

      minute: '2-digit',
    },
  ).format(date);
}


function formatTime(
  value: Date | null,
): string {
  if (!value) {
    return 'Pendiente';
  }


  return new Intl.DateTimeFormat(
    'es-PE',
    {
      hour: '2-digit',

      minute: '2-digit',
    },
  ).format(value);
}


function formatConfidence(
  value?: number,
): string {
  if (
    value === undefined
  ) {
    return 'Sin análisis';
  }


  return `${Math.round(
    value,
  )} %`;
}


function getFileExtension(
  fileName: string,
): string {
  const segments =
    fileName.split('.');


  if (
    segments.length < 2
  ) {
    return 'Archivo';
  }


  return (
    segments
      .at(-1)
      ?.toUpperCase() ??
    'Archivo'
  );
}


/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function EvidencesPage() {
  const {
    filteredEvidences,

    filteredAssignmentOptions,

    companies,

    filteredOperationOptions,

    filters,

    summary,

    loading,

    saving,

    openingFileId,

    downloadingFileId,

    error,

    lastUpdated,

    loadData,

    openEvidence,

    downloadEvidence,

    startReview,

    reviewEvidence,

    updateFilter,

    clearFilters,

    clearError,
  } =
    useEvidences();


  /* =======================================================
     ESTADO: DETALLE
  ======================================================= */

  const [
    detailEvidence,
    setDetailEvidence,
  ] =
    useState<EvidenceDocument | null>(
      null,
    );


  /* =======================================================
     ESTADO: REVISIÓN
  ======================================================= */

  const [
    reviewEvidenceSelected,
    setReviewEvidenceSelected,
  ] =
    useState<EvidenceDocument | null>(
      null,
    );


  const [
    reviewForm,
    setReviewForm,
  ] =
    useState<EvidenceReviewFormValues>(
      EMPTY_REVIEW_FORM,
    );


  const [
    formError,
    setFormError,
  ] =
    useState('');


  /* =======================================================
     ETIQUETA DE RESULTADOS
  ======================================================= */

  const resultsLabel =
    useMemo(
      () => {
        const total =
          filteredEvidences.length;


        return total === 1
          ? '1 evidencia encontrada'
          : `${total} evidencias encontradas`;
      },
      [
        filteredEvidences.length,
      ],
    );


  /* =======================================================
     DETALLE
  ======================================================= */

  function openDetail(
    evidence:
      EvidenceDocument,
  ) {
    clearError();

    setDetailEvidence(
      evidence,
    );
  }


  function closeDetail() {
    setDetailEvidence(
      null,
    );
  }


  /* =======================================================
     ABRIR MODAL DE REVISIÓN
  ======================================================= */

  async function openReviewModal(
    evidence:
      EvidenceDocument,
  ) {
    clearError();

    setFormError('');


    try {
      let selectedEvidence =
        evidence;


      /*
       * Si todavía está pendiente,
       * primero pasamos la evidencia
       * a "En revisión".
       */
      if (
        evidence.status ===
        'Pendiente'
      ) {
        selectedEvidence =
          await startReview(
            evidence.id,
          );
      }


      /*
       * Cerramos el drawer
       * si estaba abierto.
       */
      setDetailEvidence(
        null,
      );


      /*
       * Guardamos la evidencia
       * que se va a evaluar.
       */
      setReviewEvidenceSelected(
        selectedEvidence,
      );


      /*
       * Preparamos el formulario.
       */
      setReviewForm({
        status:
          selectedEvidence.status ===
            'Aprobada' ||
          selectedEvidence.status ===
            'Observada' ||
          selectedEvidence.status ===
            'Rechazada'
            ? selectedEvidence.status
            : 'Aprobada',

        reviewComment:
          selectedEvidence
            .reviewComment ??
          '',
      });
    } catch (reviewError) {
      setFormError(
        reviewError instanceof
          Error
          ? reviewError.message
          : 'No se pudo iniciar la revisión.',
      );
    }
  }


  /* =======================================================
     CERRAR MODAL
  ======================================================= */

  function closeReviewModal() {
    if (saving) {
      return;
    }


    setReviewEvidenceSelected(
      null,
    );


    setReviewForm(
      EMPTY_REVIEW_FORM,
    );


    setFormError('');
  }


  /* =======================================================
     CAMBIAR ESTADO DEL FORMULARIO

     IMPORTANTE:
     Recibimos directamente el valor.
     No guardamos el evento de React.
  ======================================================= */

  function handleReviewStatusChange(
    value: string,
  ) {
    const status =
      value as
        EvidenceReviewFormValues['status'];


    setReviewForm(
      (
        current,
      ) => ({
        ...current,

        status,
      }),
    );


    /*
     * Al cambiar de estado,
     * limpiamos mensajes anteriores.
     */
    if (formError) {
      setFormError('');
    }
  }


  /* =======================================================
     CAMBIAR COMENTARIO

     ESTA ES LA CORRECCIÓN PRINCIPAL
     DEL ERROR "reading value".
  ======================================================= */

  function handleReviewCommentChange(
    value: string,
  ) {
    setReviewForm(
      (
        current,
      ) => ({
        ...current,

        reviewComment:
          value,
      }),
    );


    if (formError) {
      setFormError('');
    }
  }


  /* =======================================================
     GUARDAR REVISIÓN
  ======================================================= */

  async function handleReviewSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();


    if (
      !reviewEvidenceSelected
    ) {
      return;
    }


    const comment =
      reviewForm
        .reviewComment
        .trim();


    /*
     * Observada y Rechazada
     * necesitan comentario.
     */
    if (
      (
        reviewForm.status ===
          'Observada' ||
        reviewForm.status ===
          'Rechazada'
      ) &&
      !comment
    ) {
      setFormError(
        'Debes registrar una observación para este estado.',
      );

      return;
    }


    try {
      setFormError('');


      await reviewEvidence(
        reviewEvidenceSelected.id,

        {
          ...reviewForm,

          reviewComment:
            comment,
        },
      );


      /*
       * Cerramos el modal
       * cuando la revisión termina.
       */
      setReviewEvidenceSelected(
        null,
      );


      setReviewForm(
        EMPTY_REVIEW_FORM,
      );


      setFormError('');
    } catch (submitError) {
      setFormError(
        submitError instanceof
          Error
          ? submitError.message
          : 'No se pudo guardar la revisión.',
      );
    }
  }


  /* =======================================================
     ARCHIVOS
  ======================================================= */

  async function handleOpenFile(
    evidence:
      EvidenceDocument,
  ) {
    await openEvidence(
      evidence,
    );
  }


  async function handleDownloadFile(
    evidence:
      EvidenceDocument,
  ) {
    await downloadEvidence(
      evidence,
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
      {/* ===================================================
          HEADER
      =================================================== */}

      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Revisión de evidencias"
        description="Consulta, descarga y revisa los documentos presentados por las empresas evaluadas."
        action={
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              void loadData()
            }
            disabled={
              loading
            }
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? styles.spinning
                  : undefined
              }
            />

            Actualizar
          </button>
        }
      />


      {/* ===================================================
          REALTIME
      =================================================== */}

      <div
        className={
          styles.realtimeBar
        }
      >
        <div
          className={
            styles.realtimeStatus
          }
        >
          <span
            className={
              styles.realtimeDot
            }
          />

          Actualización en tiempo real
        </div>


        <span>
          Última actualización:{' '}

          {formatTime(
            lastUpdated,
          )}
        </span>
      </div>


      {/* ===================================================
          ERROR GENERAL
      =================================================== */}

      {error && (
        <div
          className={
            styles.errorBanner
          }
        >
          <CircleAlert
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
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
        </div>
      )}


      {/* ===================================================
          RESUMEN
      =================================================== */}

      <section
        className={
          styles.summaryGrid
        }
      >
        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <ClipboardList
              size={21}
            />
          </div>


          <div>
            <span>
              Total de evidencias
            </span>

            <strong>
              {summary.total}
            </strong>

            <small>
              Documentos registrados
            </small>
          </div>
        </article>


        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <FileSearch
              size={21}
            />
          </div>


          <div>
            <span>
              Pendientes
            </span>

            <strong>
              {summary.pending}
            </strong>

            <small>
              Esperando revisión
            </small>
          </div>
        </article>


        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <ShieldAlert
              size={21}
            />
          </div>


          <div>
            <span>
              En revisión
            </span>

            <strong>
              {summary.inReview}
            </strong>

            <small>
              En evaluación fiscalizadora
            </small>
          </div>
        </article>


        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <CheckCircle2
              size={21}
            />
          </div>


          <div>
            <span>
              Aprobadas
            </span>

            <strong>
              {summary.approved}
            </strong>

            <small>
              Evidencias conformes
            </small>
          </div>
        </article>


        <article
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <AlertTriangle
              size={21}
            />
          </div>


          <div>
            <span>
              Observadas o rechazadas
            </span>

            <strong>
              {summary.observed}
            </strong>

            <small>
              Requieren corrección
            </small>
          </div>
        </article>
      </section>


      {/* ===================================================
          PANEL PRINCIPAL
      =================================================== */}

      <Panel>
        {/* =================================================
            FILTROS
        ================================================= */}

        <div
          className={
            styles.filters
          }
        >
          {/* BUSCADOR */}

          <div
            className={
              styles.searchField
            }
          >
            <Search size={18} />


            <input
              type="search"
              value={
                filters.search
              }
              placeholder="Buscar archivo, empresa, operación u obligación"
              onChange={(
                event,
              ) => {
                const value =
                  event
                    .currentTarget
                    .value;


                updateFilter(
                  'search',
                  value,
                );
              }}
            />
          </div>


          {/* EMPRESA */}

          <select
            value={
              filters.companyId
            }
            onChange={(
              event,
            ) => {
              const value =
                event
                  .currentTarget
                  .value;


              updateFilter(
                'companyId',
                value,
              );
            }}
          >
            <option value="">
              Todas las empresas
            </option>


            {companies.map(
              (
                company,
              ) => (
                <option
                  key={
                    company.id
                  }
                  value={
                    company.id
                  }
                >
                  {company.name}
                </option>
              ),
            )}
          </select>


          {/* OPERACIÓN */}

          <select
            value={
              filters.operationId
            }
            onChange={(
              event,
            ) => {
              const value =
                event
                  .currentTarget
                  .value;


              updateFilter(
                'operationId',
                value,
              );
            }}
          >
            <option value="">
              Todas las operaciones
            </option>


            {filteredOperationOptions.map(
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
                  {operation.name}
                </option>
              ),
            )}
          </select>


          {/* OBLIGACIÓN */}

          <select
            value={
              filters.assignmentId
            }
            onChange={(
              event,
            ) => {
              const value =
                event
                  .currentTarget
                  .value;


              updateFilter(
                'assignmentId',
                value,
              );
            }}
          >
            <option value="">
              Todas las obligaciones
            </option>


            {filteredAssignmentOptions.map(
              (
                assignment,
              ) => (
                <option
                  key={
                    assignment.id
                  }
                  value={
                    assignment.id
                  }
                >
                  {
                    assignment
                      .obligationCode
                  }

                  {' — '}

                  {
                    assignment
                      .obligationTitle
                  }
                </option>
              ),
            )}
          </select>


          {/* ESTADO */}

          <select
            value={
              filters.status
            }
            onChange={(
              event,
            ) => {
              const value =
                event
                  .currentTarget
                  .value as
                    | EvidenceStatus
                    | '';


              updateFilter(
                'status',
                value,
              );
            }}
          >
            <option value="">
              Todos los estados
            </option>


            {EVIDENCE_STATUSES.map(
              (
                status,
              ) => (
                <option
                  key={
                    status
                  }
                  value={
                    status
                  }
                >
                  {status}
                </option>
              ),
            )}
          </select>


          {/* CRITICIDAD */}

          <select
            value={
              filters.criticality
            }
            onChange={(
              event,
            ) => {
              const value =
                event
                  .currentTarget
                  .value as
                    | ObligationCriticality
                    | '';


              updateFilter(
                'criticality',
                value,
              );
            }}
          >
            <option value="">
              Todas las criticidades
            </option>


            {CRITICALITIES.map(
              (
                criticality,
              ) => (
                <option
                  key={
                    criticality
                  }
                  value={
                    criticality
                  }
                >
                  {criticality}
                </option>
              ),
            )}
          </select>


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
            Limpiar filtros
          </button>
        </div>


        {/* =================================================
            HEADER TABLA
        ================================================= */}

        <div
          className={
            styles.tableHeader
          }
        >
          <div>
            <h3>
              Evidencias presentadas
            </h3>

            <span>
              {resultsLabel}
            </span>
          </div>
        </div>


        {/* =================================================
            CONTENIDO
        ================================================= */}

        {loading ? (
          <div
            className={
              styles.loadingState
            }
          >
            <RefreshCw
              size={27}
              className={
                styles.spinning
              }
            />

            <span>
              Cargando evidencias...
            </span>
          </div>
        ) : filteredEvidences.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <FileCheck2
              size={42}
            />

            <h3>
              Aún no existen evidencias
            </h3>

            <p>
              Las evidencias aparecerán
              aquí cuando la Empresa
              Evaluada cargue documentos
              para sus obligaciones
              asignadas.
            </p>
          </div>
        ) : (
          <div
            className={
              styles.tableWrapper
            }
          >
            <table
              className={
                styles.table
              }
            >
              <thead>
                <tr>
                  <th>
                    Archivo
                  </th>

                  <th>
                    Empresa
                  </th>

                  <th>
                    Operación
                  </th>

                  <th>
                    Obligación
                  </th>

                  <th>
                    Criticidad
                  </th>

                  <th>
                    Versión
                  </th>

                  <th>
                    Fecha de carga
                  </th>

                  <th>
                    Estado
                  </th>

                  <th>
                    IA
                  </th>

                  <th
                    aria-label="Acciones"
                  />
                </tr>
              </thead>


              <tbody>
                {filteredEvidences.map(
                  (
                    evidence,
                  ) => (
                    <tr
                      key={
                        evidence.id
                      }
                    >
                      {/* ARCHIVO */}

                      <td>
                        <div
                          className={
                            styles.fileCell
                          }
                        >
                          <div
                            className={
                              styles.fileIcon
                            }
                          >
                            <FileCheck2
                              size={18}
                            />
                          </div>


                          <div>
                            <strong>
                              {
                                evidence.fileName
                              }
                            </strong>


                            <span>
                              {getFileExtension(
                                evidence.fileName,
                              )}
                            </span>
                          </div>
                        </div>
                      </td>


                      {/* EMPRESA */}

                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {
                              evidence.companyName
                            }
                          </strong>


                          <span>
                            Empresa evaluada
                          </span>
                        </div>
                      </td>


                      {/* OPERACIÓN */}

                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {
                              evidence.operationName
                            }
                          </strong>


                          <span>
                            {
                              evidence.operationCode ??
                              'Sin código'
                            }
                          </span>
                        </div>
                      </td>


                      {/* OBLIGACIÓN */}

                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {
                              evidence.obligationTitle
                            }
                          </strong>


                          <span>
                            {
                              evidence.obligationCode
                            }
                          </span>
                        </div>
                      </td>


                      {/* CRITICIDAD */}

                      <td>
                        <Badge
                          value={
                            evidence
                              .obligationCriticality
                          }
                        />
                      </td>


                      {/* VERSIÓN */}

                      <td>
                        <span
                          className={
                            styles.versionBadge
                          }
                        >
                          v
                          {
                            evidence.version
                          }
                        </span>
                      </td>


                      {/* FECHA */}

                      <td>
                        {formatDate(
                          evidence.uploadedAt,
                        )}
                      </td>


                      {/* ESTADO */}

                      <td>
                        <Badge
                          value={
                            evidence.status
                          }
                        />
                      </td>


                      {/* IA */}

                      <td>
                        <div
                          className={
                            styles.aiCell
                          }
                        >
                          <Badge
                            value={
                              evidence.aiStatus
                            }
                          />


                          <span>
                            {formatConfidence(
                              evidence.aiConfidence,
                            )}
                          </span>
                        </div>
                      </td>


                      {/* ACCIONES */}

                      <td>
                        <div
                          className={
                            styles.rowActions
                          }
                        >
                          {/* DETALLE */}

                          <button
                            type="button"
                            title="Ver detalle"
                            onClick={() =>
                              openDetail(
                                evidence,
                              )
                            }
                          >
                            <Eye
                              size={17}
                            />
                          </button>


                          {/* ABRIR */}

                          <button
                            type="button"
                            title="Abrir archivo"
                            disabled={
                              openingFileId ===
                              evidence.id
                            }
                            onClick={() =>
                              void handleOpenFile(
                                evidence,
                              )
                            }
                          >
                            {openingFileId ===
                            evidence.id ? (
                              <RefreshCw
                                size={17}
                                className={
                                  styles.spinning
                                }
                              />
                            ) : (
                              <FileSearch
                                size={17}
                              />
                            )}
                          </button>


                          {/* DESCARGAR */}

                          <button
                            type="button"
                            title="Descargar archivo"
                            disabled={
                              downloadingFileId ===
                              evidence.id
                            }
                            onClick={() =>
                              void handleDownloadFile(
                                evidence,
                              )
                            }
                          >
                            {downloadingFileId ===
                            evidence.id ? (
                              <RefreshCw
                                size={17}
                                className={
                                  styles.spinning
                                }
                              />
                            ) : (
                              <Download
                                size={17}
                              />
                            )}
                          </button>


                          {/* REVISAR */}

                          <button
                            type="button"
                            title="Revisar evidencia"
                            disabled={
                              saving
                            }
                            onClick={() =>
                              void openReviewModal(
                                evidence,
                              )
                            }
                          >
                            <ClipboardList
                              size={17}
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>


      {/* ===================================================
          DRAWER DE DETALLE
      =================================================== */}

      {detailEvidence && (
        <div
          className={
            styles.drawerBackdrop
          }
        >
          <aside
            className={
              styles.drawer
            }
          >
            {/* HEADER */}

            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  Detalle de evidencia
                </span>

                <h2>
                  {
                    detailEvidence.fileName
                  }
                </h2>
              </div>


              <button
                type="button"
                onClick={
                  closeDetail
                }
                aria-label="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>


            {/* BODY */}

            <div
              className={
                styles.drawerBody
              }
            >
              <div
                className={
                  styles.detailBadges
                }
              >
                <Badge
                  value={
                    detailEvidence.status
                  }
                />


                <Badge
                  value={
                    detailEvidence
                      .obligationCriticality
                  }
                />


                <Badge
                  value={
                    detailEvidence.aiStatus
                  }
                />
              </div>


              <dl
                className={
                  styles.detailList
                }
              >
                <div>
                  <dt>
                    Empresa
                  </dt>

                  <dd>
                    {
                      detailEvidence.companyName
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Operación minera
                  </dt>

                  <dd>
                    {
                      detailEvidence.operationName
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Obligación
                  </dt>

                  <dd>
                    {
                      detailEvidence.obligationCode
                    }

                    {' — '}

                    {
                      detailEvidence.obligationTitle
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Categoría
                  </dt>

                  <dd>
                    {
                      detailEvidence
                        .obligationCategory
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Evidencia requerida
                  </dt>

                  <dd>
                    {
                      detailEvidence.requiredEvidence
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Nombre del archivo
                  </dt>

                  <dd>
                    {
                      detailEvidence.fileName
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Versión
                  </dt>

                  <dd>
                    v
                    {
                      detailEvidence.version
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Fecha de carga
                  </dt>

                  <dd>
                    {formatDateTime(
                      detailEvidence.uploadedAt,
                    )}
                  </dd>
                </div>


                <div>
                  <dt>
                    Resultado de revisión
                  </dt>

                  <dd>
                    {
                      detailEvidence
                        .reviewComment ??
                      'Todavía no existe una observación del fiscalizador.'
                    }
                  </dd>
                </div>


                <div>
                  <dt>
                    Fecha de revisión
                  </dt>

                  <dd>
                    {formatDateTime(
                      detailEvidence.reviewedAt,
                    )}
                  </dd>
                </div>


                <div>
                  <dt>
                    Confianza de IA
                  </dt>

                  <dd>
                    {formatConfidence(
                      detailEvidence.aiConfidence,
                    )}
                  </dd>
                </div>


                <div>
                  <dt>
                    Resumen de IA
                  </dt>

                  <dd>
                    {
                      detailEvidence.aiResult
                        ?.summary ??
                      'El documento todavía no ha sido analizado por la IA.'
                    }
                  </dd>
                </div>
              </dl>
            </div>


            {/* FOOTER */}

            <div
              className={
                styles.drawerFooter
              }
            >
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  void handleDownloadFile(
                    detailEvidence,
                  )
                }
              >
                <Download
                  size={17}
                />

                Descargar
              </button>


              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  void handleOpenFile(
                    detailEvidence,
                  )
                }
              >
                <FileSearch
                  size={17}
                />

                Abrir archivo
              </button>


              <PrimaryButton
                onClick={() =>
                  void openReviewModal(
                    detailEvidence,
                  )
                }
                disabled={
                  saving
                }
              >
                <ClipboardList
                  size={17}
                />

                Revisar evidencia
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}


      {/* ===================================================
          MODAL DE REVISIÓN
      =================================================== */}

      {reviewEvidenceSelected && (
        <div
          className={
            styles.modalBackdrop
          }
        >
          <div
            className={
              styles.modal
            }
            role="dialog"
            aria-modal="true"
          >
            {/* HEADER */}

            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  Revisión fiscalizadora
                </span>


                <h2>
                  Evaluar evidencia
                </h2>


                <p>
                  {
                    reviewEvidenceSelected
                      .fileName
                  }
                </p>
              </div>


              <button
                type="button"
                onClick={
                  closeReviewModal
                }
                disabled={
                  saving
                }
                aria-label="Cerrar revisión"
              >
                <X size={20} />
              </button>
            </div>


            {/* FORM */}

            <form
              className={
                styles.modalForm
              }
              onSubmit={
                handleReviewSubmit
              }
            >
              {/* CONTEXTO */}

              <div
                className={
                  styles.reviewContext
                }
              >
                <div>
                  <span>
                    Empresa
                  </span>

                  <strong>
                    {
                      reviewEvidenceSelected
                        .companyName
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Operación
                  </span>

                  <strong>
                    {
                      reviewEvidenceSelected
                        .operationName
                    }
                  </strong>
                </div>


                <div>
                  <span>
                    Obligación
                  </span>

                  <strong>
                    {
                      reviewEvidenceSelected
                        .obligationTitle
                    }
                  </strong>
                </div>
              </div>


              {/* =================================================
                  CAMPOS
              ================================================= */}

              <div
                className={
                  styles.formGrid
                }
              >
                {/* RESULTADO */}

                <label>
                  Resultado de revisión *


                  <select
                    value={
                      reviewForm.status
                    }
                    onChange={(
                      event,
                    ) => {
                      /*
                       * Guardamos el valor
                       * inmediatamente.
                       *
                       * NO usamos event.currentTarget
                       * dentro de setReviewForm.
                       */
                      const value =
                        event
                          .currentTarget
                          .value;


                      handleReviewStatusChange(
                        value,
                      );
                    }}
                  >
                    {FINAL_REVIEW_STATUSES.map(
                      (
                        status,
                      ) => (
                        <option
                          key={
                            status
                          }
                          value={
                            status
                          }
                        >
                          {status}
                        </option>
                      ),
                    )}
                  </select>
                </label>


                {/* COMENTARIO */}

                <label
                  className={
                    styles.fullField
                  }
                >
                  Comentario del fiscalizador


                  <textarea
                    rows={6}
                    value={
                      reviewForm.reviewComment
                    }
                    placeholder={
                      reviewForm.status ===
                        'Observada' ||
                      reviewForm.status ===
                        'Rechazada'
                        ? 'Describe las observaciones y correcciones necesarias.'
                        : 'Registra un comentario opcional sobre la conformidad del documento.'
                    }
                    onChange={(
                      event,
                    ) => {
                      /*
                       * CORRECCIÓN PRINCIPAL:
                       *
                       * Primero extraemos el valor.
                       * Después actualizamos React.
                       */
                      const value =
                        event
                          .currentTarget
                          .value;


                      handleReviewCommentChange(
                        value,
                      );
                    }}
                  />
                </label>
              </div>


              {/* ERROR FORMULARIO */}

              {formError && (
                <div
                  className={
                    styles.formError
                  }
                >
                  <CircleAlert
                    size={17}
                  />

                  {formError}
                </div>
              )}


              {/* FOOTER */}

              <div
                className={
                  styles.modalFooter
                }
              >
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={
                    closeReviewModal
                  }
                  disabled={
                    saving
                  }
                >
                  Cancelar
                </button>


                <PrimaryButton
                  type="submit"
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? 'Guardando...'
                    : 'Guardar revisión'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}