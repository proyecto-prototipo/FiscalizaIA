import {
  AlertTriangle,
  Bot,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileSearch,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
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
  AiAnalysis,
  AiComplianceStatus,
  AiHumanReviewForm,
  AiHumanStatus,
  AiProcessingStatus,
  AiRiskLevel,
} from './aiReview.types';

import { useAIReview } from './useAIReview';

import styles from './AIReviewPage.module.css';

const PROCESSING_STATUSES:
AiProcessingStatus[] = [
  'Pendiente',
  'Procesando',
  'Completado',
  'Error',
];

const COMPLIANCE_STATUSES:
AiComplianceStatus[] = [
  'Pendiente',
  'Cumple',
  'Cumple parcialmente',
  'No cumple',
  'No determinado',
];

const RISK_LEVELS: AiRiskLevel[] = [
  'Pendiente',
  'Bajo',
  'Medio',
  'Alto',
  'Crítico',
  'No determinado',
];

const HUMAN_STATUSES: AiHumanStatus[] = [
  'Pendiente',
  'Validado',
  'Observado',
  'Rechazado',
];

const EMPTY_REVIEW:
AiHumanReviewForm = {
  humanStatus: 'Validado',
  reviewComment: '',
};

function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
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

function ResultList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className={styles.resultSection}>
      <h3>{title}</h3>

      {items.length === 0 ? (
        <p>
          No se identificaron elementos.
        </p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={`${title}-${index}`}>
              {item}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function AIReviewPage() {
  const {
    filteredAnalyses,
    filteredCandidates,

    companies,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    processingEvidenceId,
    openingEvidenceId,
    error,
    lastUpdated,

    loadData,
    analyzeEvidence,
    reviewAnalysis,
    openEvidence,
    updateFilter,
    clearFilters,
    clearError,
  } = useAIReview();

  const [
    selectedAnalysis,
    setSelectedAnalysis,
  ] = useState<AiAnalysis | null>(
    null,
  );

  const [
    validationAnalysis,
    setValidationAnalysis,
  ] = useState<AiAnalysis | null>(
    null,
  );

  const [
    reviewForm,
    setReviewForm,
  ] = useState<AiHumanReviewForm>(
    EMPTY_REVIEW,
  );

  const [
    formError,
    setFormError,
  ] = useState('');

  const analysisResultLabel =
    useMemo(() => {
      const total =
        filteredAnalyses.length;

      return total === 1
        ? '1 análisis encontrado'
        : `${total} análisis encontrados`;
    }, [filteredAnalyses.length]);

  function openValidation(
    analysis: AiAnalysis,
  ) {
    setValidationAnalysis(analysis);

    setReviewForm({
      humanStatus:
        analysis.humanStatus ===
          'Pendiente'
          ? 'Validado'
          : analysis.humanStatus,

      reviewComment:
        analysis.humanReviewComment ??
        '',
    });

    setFormError('');
    setSelectedAnalysis(null);
  }

  function closeValidation() {
    if (saving) {
      return;
    }

    setValidationAnalysis(null);
    setReviewForm(EMPTY_REVIEW);
    setFormError('');
  }

  async function submitValidation(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!validationAnalysis) {
      return;
    }

    if (
      (
        reviewForm.humanStatus ===
          'Observado' ||
        reviewForm.humanStatus ===
          'Rechazado'
      ) &&
      !reviewForm.reviewComment.trim()
    ) {
      setFormError(
        'Debes registrar el motivo de la observación o rechazo.',
      );

      return;
    }

    try {
      setFormError('');

      await reviewAnalysis(
        validationAnalysis.id,
        reviewForm,
      );

      closeValidation();
    } catch (validationError) {
      setFormError(
        validationError instanceof Error
          ? validationError.message
          : 'No se pudo guardar la validación.',
      );
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Revisión con inteligencia artificial"
        description="Analiza las evidencias mediante Google AI Studio y valida los resultados antes de incorporarlos al proceso de fiscalización."
        action={
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              void loadData()
            }
            disabled={loading}
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

      <div className={styles.realtimeBar}>
        <div className={styles.realtimeStatus}>
          <span
            className={styles.realtimeDot}
          />

          Actualización automática
        </div>

        <span>
          Última actualización:{' '}
          {formatTime(lastUpdated)}
        </span>
      </div>

      {error && (
        <div className={styles.errorBanner}>
          <CircleAlert size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
            aria-label="Cerrar error"
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <Bot size={23} />

          <div>
            <span>
              Evidencias disponibles
            </span>

            <strong>
              {summary.totalEvidences}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <Sparkles size={23} />

          <div>
            <span>
              Pendientes de análisis
            </span>

            <strong>
              {summary.pending}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <BrainCircuit size={23} />

          <div>
            <span>Procesando</span>

            <strong>
              {summary.processing}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={23} />

          <div>
            <span>Completados</span>

            <strong>
              {summary.completed}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <AlertTriangle size={23} />

          <div>
            <span>
              Riesgo alto o crítico
            </span>

            <strong>
              {summary.highRisk}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <ShieldCheck size={23} />

          <div>
            <span>
              Pendientes de validar
            </span>

            <strong>
              {summary.pendingValidation}
            </strong>
          </div>
        </article>
      </section>

      <Panel>
        <div className={styles.sectionHeader}>
          <div>
            <h2>
              Evidencias para analizar
            </h2>

            <p>
              Selecciona un documento y
              ejecuta el análisis automático.
            </p>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <RefreshCw
              size={31}
              className={styles.spinning}
            />

            <p>
              Cargando evidencias...
            </p>
          </div>
        ) : filteredCandidates.length ===
          0 ? (
          <div className={styles.emptyState}>
            <Sparkles size={43} />

            <h3>
              No existen evidencias
              disponibles
            </h3>

            <p>
              Cuando se registren evidencias,
              aparecerán en este espacio para
              su revisión con IA.
            </p>
          </div>
        ) : (
          <div className={styles.candidateGrid}>
            {filteredCandidates.map(
              (evidence) => {
                const isProcessing =
                  processingEvidenceId ===
                    evidence.id ||
                  evidence.aiStatus ===
                    'Procesando';

                return (
                  <article
                    key={evidence.id}
                    className={
                      styles.candidateCard
                    }
                  >
                    <div
                      className={
                        styles.cardTop
                      }
                    >
                      <Badge
                        value={
                          evidence.aiStatus
                        }
                      />

                      <span>
                        Versión{' '}
                        {evidence.version}
                      </span>
                    </div>

                    <h3>
                      {evidence.fileName}
                    </h3>

                    <p
                      className={
                        styles.obligationText
                      }
                    >
                      {evidence.obligationCode}
                      {' — '}
                      {evidence.obligationTitle}
                    </p>

                    <dl
                      className={
                        styles.cardDetails
                      }
                    >
                      <div>
                        <dt>Empresa</dt>
                        <dd>
                          {evidence.companyName}
                        </dd>
                      </div>

                      <div>
                        <dt>Operación</dt>
                        <dd>
                          {evidence.operationName}
                        </dd>
                      </div>

                      <div>
                        <dt>Criticidad</dt>
                        <dd>
                          <Badge
                            value={
                              evidence
                                .obligationCriticality
                            }
                          />
                        </dd>
                      </div>
                    </dl>

                    <div
                      className={
                        styles.cardActions
                      }
                    >
                      <button
                        type="button"
                        className={
                          styles.secondaryButton
                        }
                        disabled={
                          openingEvidenceId ===
                          evidence.id
                        }
                        onClick={() =>
                          void openEvidence(
                            evidence.id,
                            evidence.storagePath,
                          )
                        }
                      >
                        <FileSearch
                          size={16}
                        />

                        Abrir
                      </button>

                      <PrimaryButton
                        disabled={
                          isProcessing
                        }
                        onClick={() =>
                          void analyzeEvidence(
                            evidence.id,
                          )
                        }
                      >
                        {isProcessing ? (
                          <RefreshCw
                            size={16}
                            className={
                              styles.spinning
                            }
                          />
                        ) : (
                          <Sparkles
                            size={16}
                          />
                        )}

                        {isProcessing
                          ? 'Analizando...'
                          : evidence
                              .latestAnalysisId
                            ? 'Analizar nuevamente'
                            : 'Analizar con IA'}
                      </PrimaryButton>
                    </div>
                  </article>
                );
              },
            )}
          </div>
        )}
      </Panel>

      <Panel>
        <div className={styles.filters}>
          <div className={styles.searchField}>
            <Search size={18} />

            <input
              value={filters.search}
              placeholder="Buscar archivo, empresa, operación u obligación"
              onChange={(event) =>
                updateFilter(
                  'search',
                  event.currentTarget.value,
                )
              }
            />
          </div>

          <select
            value={filters.companyId}
            onChange={(event) =>
              updateFilter(
                'companyId',
                event.currentTarget.value,
              )
            }
          >
            <option value="">
              Todas las empresas
            </option>

            {companies.map((company) => (
              <option
                key={company.id}
                value={company.id}
              >
                {company.name}
              </option>
            ))}
          </select>

          <select
            value={filters.operationId}
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

            {filteredOperations.map(
              (operation) => (
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
              filters.processingStatus
            }
            onChange={(event) =>
              updateFilter(
                'processingStatus',
                event.currentTarget
                  .value as
                  | AiProcessingStatus
                  | '',
              )
            }
          >
            <option value="">
              Todos los procesos
            </option>

            {PROCESSING_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
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
                  .value as
                  | AiComplianceStatus
                  | '',
              )
            }
          >
            <option value="">
              Todos los cumplimientos
            </option>

            {COMPLIANCE_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.riskLevel}
            onChange={(event) =>
              updateFilter(
                'riskLevel',
                event.currentTarget
                  .value as
                  | AiRiskLevel
                  | '',
              )
            }
          >
            <option value="">
              Todos los riesgos
            </option>

            {RISK_LEVELS.map((risk) => (
              <option
                key={risk}
                value={risk}
              >
                {risk}
              </option>
            ))}
          </select>

          <select
            value={filters.humanStatus}
            onChange={(event) =>
              updateFilter(
                'humanStatus',
                event.currentTarget
                  .value as
                  | AiHumanStatus
                  | '',
              )
            }
          >
            <option value="">
              Todas las validaciones
            </option>

            {HUMAN_STATUSES.map(
              (status) => (
                <option
                  key={status}
                  value={status}
                >
                  {status}
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            className={styles.clearButton}
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>

        <div className={styles.tableHeader}>
          <div>
            <h2>
              Historial de análisis
            </h2>

            <span>
              {analysisResultLabel}
            </span>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <RefreshCw
              size={31}
              className={styles.spinning}
            />

            <p>
              Cargando análisis...
            </p>
          </div>
        ) : filteredAnalyses.length ===
          0 ? (
          <div className={styles.emptyState}>
            <BrainCircuit size={43} />

            <h3>
              Aún no existen análisis
            </h3>

            <p>
              Ejecuta el análisis sobre una
              evidencia para visualizar los
              resultados.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Documento</th>
                  <th>Empresa</th>
                  <th>Obligación</th>
                  <th>Proceso</th>
                  <th>Cumplimiento</th>
                  <th>Riesgo</th>
                  <th>Confianza</th>
                  <th>Validación</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {filteredAnalyses.map(
                  (analysis) => (
                    <tr key={analysis.id}>
                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {analysis.fileName}
                          </strong>

                          <span>
                            {analysis.model}
                          </span>
                        </div>
                      </td>

                      <td>
                        {analysis.companyName}
                      </td>

                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {
                              analysis
                                .obligationCode
                            }
                          </strong>

                          <span>
                            {
                              analysis
                                .obligationTitle
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <Badge
                          value={
                            analysis
                              .processingStatus
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={
                            analysis
                              .complianceStatus
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={
                            analysis.riskLevel
                          }
                        />
                      </td>

                      <td>
                        {analysis.confidence ===
                        undefined
                          ? '—'
                          : `${Math.round(
                              analysis.confidence,
                            )} %`}
                      </td>

                      <td>
                        <Badge
                          value={
                            analysis.humanStatus
                          }
                        />
                      </td>

                      <td>
                        <button
                          type="button"
                          className={
                            styles.iconButton
                          }
                          aria-label="Ver análisis"
                          onClick={() =>
                            setSelectedAnalysis(
                              analysis,
                            )
                          }
                        >
                          <Eye size={17} />
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selectedAnalysis && (
        <div
          className={
            styles.drawerBackdrop
          }
        >
          <aside className={styles.drawer}>
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  Resultado del análisis
                </span>

                <h2>
                  {selectedAnalysis.fileName}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAnalysis(null)
                }
                aria-label="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={
                styles.drawerBody
              }
            >
              <div className={styles.badges}>
                <Badge
                  value={
                    selectedAnalysis
                      .processingStatus
                  }
                />

                <Badge
                  value={
                    selectedAnalysis
                      .complianceStatus
                  }
                />

                <Badge
                  value={
                    selectedAnalysis
                      .riskLevel
                  }
                />

                <Badge
                  value={
                    selectedAnalysis
                      .humanStatus
                  }
                />
              </div>

              <section
                className={
                  styles.resultSection
                }
              >
                <h3>
                  Resumen técnico
                </h3>

                <p>
                  {selectedAnalysis
                    .documentSummary ??
                    'No se generó un resumen técnico.'}
                </p>
              </section>

              <section
                className={
                  styles.resultSection
                }
              >
                <h3>
                  Tipo de documento
                </h3>

                <p>
                  {selectedAnalysis
                    .documentType ??
                    'No determinado'}
                </p>
              </section>

              <ResultList
                title="Información faltante"
                items={
                  selectedAnalysis
                    .missingInformation
                }
              />

              <ResultList
                title="Inconsistencias"
                items={
                  selectedAnalysis
                    .inconsistencies
                }
              />

              <ResultList
                title="Brechas detectadas"
                items={
                  selectedAnalysis.breaches
                }
              />

              <ResultList
                title="Observaciones"
                items={
                  selectedAnalysis
                    .observations
                }
              />

              <ResultList
                title="Recomendaciones"
                items={
                  selectedAnalysis
                    .recommendations
                }
              />

              {selectedAnalysis.errorMessage && (
                <section
                  className={
                    styles.errorSection
                  }
                >
                  <h3>
                    Error de procesamiento
                  </h3>

                  <p>
                    {
                      selectedAnalysis
                        .errorMessage
                    }
                  </p>
                </section>
              )}

              <section
                className={
                  styles.resultSection
                }
              >
                <h3>
                  Información del análisis
                </h3>

                <dl
                  className={
                    styles.analysisInfo
                  }
                >
                  <div>
                    <dt>Modelo</dt>
                    <dd>
                      {selectedAnalysis.model}
                    </dd>
                  </div>

                  <div>
                    <dt>Confianza</dt>
                    <dd>
                      {selectedAnalysis
                        .confidence ===
                      undefined
                        ? 'No disponible'
                        : `${Math.round(
                            selectedAnalysis
                              .confidence,
                          )} %`}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Fecha de análisis
                    </dt>
                    <dd>
                      {formatDate(
                        selectedAnalysis
                          .createdAt,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Versión del documento
                    </dt>
                    <dd>
                      v
                      {
                        selectedAnalysis
                          .evidenceVersion
                      }
                    </dd>
                  </div>
                </dl>
              </section>

              {selectedAnalysis
                .humanReviewComment && (
                <section
                  className={
                    styles.resultSection
                  }
                >
                  <h3>
                    Comentario del
                    fiscalizador
                  </h3>

                  <p>
                    {
                      selectedAnalysis
                        .humanReviewComment
                    }
                  </p>
                </section>
              )}
            </div>

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
                  void openEvidence(
                    selectedAnalysis.evidenceId,
                    selectedAnalysis.storagePath,
                  )
                }
              >
                <FileSearch size={16} />

                Abrir evidencia
              </button>

              {selectedAnalysis
                .processingStatus ===
                'Completado' && (
                <PrimaryButton
                  onClick={() =>
                    openValidation(
                      selectedAnalysis,
                    )
                  }
                >
                  <ShieldCheck size={16} />

                  Validar resultado
                </PrimaryButton>
              )}
            </div>
          </aside>
        </div>
      )}

      {validationAnalysis && (
        <div
          className={
            styles.modalBackdrop
          }
        >
          <div className={styles.modal}>
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  Validación humana
                </span>

                <h2>
                  Validar resultado de IA
                </h2>
              </div>

              <button
                type="button"
                onClick={closeValidation}
                disabled={saving}
                aria-label="Cerrar validación"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={styles.modalForm}
              onSubmit={submitValidation}
            >
              <label>
                Estado de validación

                <select
                  value={
                    reviewForm.humanStatus
                  }
                  onChange={(event) =>
                    setReviewForm(
                      (current) => ({
                        ...current,

                        humanStatus:
                          event.currentTarget
                            .value as
                            AiHumanReviewForm[
                              'humanStatus'
                            ],
                      }),
                    )
                  }
                >
                  <option value="Validado">
                    Validado
                  </option>

                  <option value="Observado">
                    Observado
                  </option>

                  <option value="Rechazado">
                    Rechazado
                  </option>
                </select>
              </label>

              <label>
                Comentario del fiscalizador

                <textarea
                  rows={6}
                  value={
                    reviewForm.reviewComment
                  }
                  placeholder="Registra comentarios, precisiones o motivos de observación."
                  onChange={(event) =>
                    setReviewForm(
                      (current) => ({
                        ...current,

                        reviewComment:
                          event.currentTarget
                            .value,
                      }),
                    )
                  }
                />
              </label>

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
                  onClick={closeValidation}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <PrimaryButton
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? 'Guardando...'
                    : 'Guardar validación'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}