import {
  AlertTriangle,
  BrainCircuit,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileCheck2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  Target,
  Trash2,
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

import {
  useGapsRisks,
} from './useGapsRisks';

import type {
  GapAssignmentContext,
  GapFormValues,
  GapImpact,
  GapPriority,
  GapProbability,
  GapRiskItem,
  GapRiskLevel,
  GapSource,
  GapStatus,
} from './gapsRisks.types';

import styles from './GapsRisksPage.module.css';

const RISK_OPTIONS:
GapRiskLevel[] = [
  'Bajo',
  'Medio',
  'Alto',
  'Crítico',
  'No determinado',
];

const STATUS_OPTIONS:
GapStatus[] = [
  'Abierta',
  'En tratamiento',
  'Pendiente de verificación',
  'Cerrada',
  'Descartada',
];

const SOURCE_OPTIONS:
GapSource[] = [
  'Manual',
  'IA',
  'Evaluación',
];

const PRIORITY_OPTIONS:
GapPriority[] = [
  'Baja',
  'Media',
  'Alta',
  'Urgente',
];

const PROBABILITY_OPTIONS:
GapProbability[] = [
  'Baja',
  'Media',
  'Alta',
];

const IMPACT_OPTIONS:
GapImpact[] = [
  'Bajo',
  'Medio',
  'Alto',
  'Crítico',
];

const EMPTY_FORM:
GapFormValues = {
  assignmentId: '',

  evaluationId: '',
  evidenceId: '',
  aiAnalysisId: '',

  title: '',
  description: '',

  riskLevel:
    'No determinado',

  status:
    'Abierta',

  source:
    'Manual',

  priority:
    'Media',

  probability:
    'Media',

  impact:
    'Medio',

  technicalBasis: '',
  treatmentMeasure: '',
  responsibleName: '',
  dueDate: '',
};

function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Sin fecha';
  }

  const date =
    value.length === 10
      ? new Date(
          `${value}T12:00:00`,
        )
      : new Date(value);

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

  const date = new Date(value);

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

function createFormFromContext(
  context: GapAssignmentContext,
): GapFormValues {
  const aiAnalysis =
    context.latestAiAnalysis;

  const evaluation =
    context.evaluation;

  const suggestedBreach =
    aiAnalysis?.breaches[0] ?? '';

  return {
    ...EMPTY_FORM,

    assignmentId:
      context.assignmentId,

    evaluationId:
      evaluation?.id ?? '',

    evidenceId:
      evaluation?.evidenceId ??
      context.latestEvidence?.id ??
      '',

    aiAnalysisId:
      evaluation?.aiAnalysisId ??
      aiAnalysis?.id ??
      '',

    title:
      suggestedBreach ||
      `Brecha en ${context.obligationCode}`,

    description:
      suggestedBreach,

    riskLevel:
      evaluation?.riskLevel ??
      aiAnalysis?.riskLevel ??
      'No determinado',

    source:
      suggestedBreach
        ? 'IA'
        : evaluation
          ? 'Evaluación'
          : 'Manual',

    technicalBasis:
      evaluation?.evaluationComment ??
      aiAnalysis?.documentSummary ??
      '',

    treatmentMeasure:
      evaluation?.correctiveAction ??
      aiAnalysis?.recommendations
        .join('\n') ??
      '',
  };
}

function createFormFromGap(
  gap: GapRiskItem,
): GapFormValues {
  return {
    id: gap.id,

    assignmentId:
      gap.assignmentId,

    evaluationId:
      gap.evaluationId ?? '',

    evidenceId:
      gap.evidenceId ?? '',

    aiAnalysisId:
      gap.aiAnalysisId ?? '',

    title:
      gap.title,

    description:
      gap.description ?? '',

    riskLevel:
      gap.riskLevel,

    status:
      gap.status,

    source:
      gap.source,

    priority:
      gap.priority,

    probability:
      gap.probability,

    impact:
      gap.impact,

    technicalBasis:
      gap.technicalBasis ?? '',

    treatmentMeasure:
      gap.treatmentMeasure ?? '',

    responsibleName:
      gap.responsibleName ?? '',

    dueDate:
      gap.dueDate ?? '',
  };
}

export default function GapsRisksPage() {
  const {
    contexts,
    filteredContexts,
    filteredGaps,

    companies,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    deleting,
    openingEvidenceId,

    error,
    lastUpdated,

    loadData,
    submitGap,
    deleteGap,
    openEvidence,
    updateFilter,

    isOverdue,
    clearFilters,
    clearError,
  } = useGapsRisks();

  const [
    selectedGap,
    setSelectedGap,
  ] = useState<GapRiskItem | null>(
    null,
  );

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<GapFormValues>(
    EMPTY_FORM,
  );

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<GapRiskItem | null>(
    null,
  );

  const selectedContext =
    useMemo(() => {
      return contexts.find(
        (context) =>
          context.assignmentId ===
          form.assignmentId,
      );
    }, [
      contexts,
      form.assignmentId,
    ]);

  const resultsLabel =
    useMemo(() => {
      const total =
        filteredGaps.length;

      return total === 1
        ? '1 brecha encontrada'
        : `${total} brechas encontradas`;
    }, [filteredGaps.length]);

  function openNewGap(
  context?: GapAssignmentContext,
) {
  if (!context && contexts.length === 0) {
    setFormError(
      'No existen obligaciones asignadas disponibles para registrar una brecha.',
    );

    setForm({
      ...EMPTY_FORM,
    });

    setSelectedGap(null);
    setFormOpen(true);
    return;
  }

  setForm(
    context
      ? createFormFromContext(context)
      : {
          ...EMPTY_FORM,
        },
  );

  setFormError('');
  setSelectedGap(null);
  setFormOpen(true);
}

  function openEditGap(
    gap: GapRiskItem,
  ) {
    setForm(
      createFormFromGap(gap),
    );

    setFormError('');
    setSelectedGap(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function handleAssignmentChange(
    assignmentId: string,
  ) {
    const context =
      contexts.find(
        (item) =>
          item.assignmentId ===
          assignmentId,
      );

    setForm(
      context
        ? createFormFromContext(
            context,
          )
        : {
            ...EMPTY_FORM,
            assignmentId,
          },
    );
  }

  function handleEvidenceChange(
    evidenceId: string,
  ) {
    if (!selectedContext) {
      return;
    }

    const latestAnalysis =
      selectedContext.aiAnalyses.find(
        (analysis) =>
          analysis.evidenceId ===
          evidenceId,
      );

    setForm((current) => ({
      ...current,

      evidenceId,

      aiAnalysisId:
        latestAnalysis?.id ?? '',

      riskLevel:
        latestAnalysis?.riskLevel ??
        current.riskLevel,

      source:
        latestAnalysis
          ? 'IA'
          : current.source,
    }));
  }

  function handleAiAnalysisChange(
    aiAnalysisId: string,
  ) {
    const aiAnalysis =
      selectedContext
        ?.aiAnalyses.find(
          (analysis) =>
            analysis.id ===
            aiAnalysisId,
        );

    setForm((current) => ({
      ...current,

      aiAnalysisId,

      source:
        aiAnalysis
          ? 'IA'
          : current.source,

      riskLevel:
        aiAnalysis?.riskLevel ??
        current.riskLevel,

      description:
        current.description ||
        aiAnalysis?.breaches[0] ||
        '',

      technicalBasis:
        current.technicalBasis ||
        aiAnalysis?.documentSummary ||
        '',

      treatmentMeasure:
        current.treatmentMeasure ||
        aiAnalysis?.recommendations
          .join('\n') ||
        '',
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!form.assignmentId) {
      setFormError(
        'Selecciona una obligación asignada.',
      );
      return;
    }

    if (!form.title.trim()) {
      setFormError(
        'El título de la brecha es obligatorio.',
      );
      return;
    }

    if (
      form.status === 'Cerrada' &&
      !form.treatmentMeasure.trim()
    ) {
      setFormError(
        'Registra la medida aplicada antes de cerrar la brecha.',
      );
      return;
    }

    if (
      (
        form.priority === 'Alta' ||
        form.priority === 'Urgente'
      ) &&
      !form.dueDate
    ) {
      setFormError(
        'Registra una fecha límite para esta prioridad.',
      );
      return;
    }

    try {
      setFormError('');

      await submitGap(form);

      closeForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la brecha.',
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteGap(
        deleteTarget.id,
      );

      setDeleteTarget(null);
      setSelectedGap(null);
    } catch {
      // El mensaje se muestra desde el hook.
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Brechas y riesgos"
        description="Registra, clasifica y da seguimiento a las brechas detectadas durante la evaluación de cumplimiento."
        action={
          <div className={styles.headerActions}>
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

            <PrimaryButton
             onClick={() => openNewGap()}
            >
             <Plus size={17} />
             Nueva brecha
            </PrimaryButton>
          </div>
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
          <Target size={23} />
          <div>
            <span>Total de brechas</span>
            <strong>{summary.total}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <AlertTriangle size={23} />
          <div>
            <span>Abiertas</span>
            <strong>{summary.open}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <RefreshCw size={23} />
          <div>
            <span>En tratamiento</span>
            <strong>
              {summary.inTreatment}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <BrainCircuit size={23} />
          <div>
            <span>Por verificar</span>
            <strong>
              {summary.pendingVerification}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={23} />
          <div>
            <span>Cerradas</span>
            <strong>{summary.closed}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <ShieldAlert size={23} />
          <div>
            <span>Riesgo alto o crítico</span>
            <strong>{summary.highRisk}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <CircleAlert size={23} />
          <div>
            <span>Prioridad urgente</span>
            <strong>{summary.urgent}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <CalendarClock size={23} />
          <div>
            <span>Vencidas</span>
            <strong>{summary.overdue}</strong>
          </div>
        </article>
      </section>

      <Panel>
        <div className={styles.quickHeader}>
          <div>
            <h2>
              Obligaciones disponibles
            </h2>

            <p>
              Registra una brecha a partir de una evaluación,
              evidencia o análisis de IA.
            </p>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <RefreshCw
              size={31}
              className={styles.spinning}
            />
            Cargando obligaciones...
          </div>
        ) : filteredContexts.length === 0 ? (
          <div className={styles.emptyState}>
            <Target size={43} />

            <h3>
              No existen obligaciones disponibles
            </h3>

            <p>
              Primero deben existir obligaciones asignadas
              en el sistema.
            </p>
          </div>
        ) : (
          <div className={styles.contextGrid}>
            {filteredContexts
              .slice(0, 6)
              .map((context) => (
                <article
                  key={context.assignmentId}
                  className={styles.contextCard}
                >
                  <div className={styles.cardTop}>
                    <Badge
                      value={context.criticality}
                    />

                    <span>
                      {context.evaluation
                        ? 'Con evaluación'
                        : 'Sin evaluación'}
                    </span>
                  </div>

                  <h3>
                    {context.obligationCode}
                    {' — '}
                    {context.obligationTitle}
                  </h3>

                  <p>
                    {context.companyName}
                    {' · '}
                    {context.operationName}
                  </p>

                  <div className={styles.contextMeta}>
                    <span>
                      Evidencias:{' '}
                      {context.evidences.length}
                    </span>

                    <span>
                      Análisis IA:{' '}
                      {context.aiAnalyses.length}
                    </span>
                  </div>

                  <PrimaryButton
                    onClick={() =>
                      openNewGap(context)
                    }
                  >
                    <Plus size={16} />
                    Registrar brecha
                  </PrimaryButton>
                </article>
              ))}
          </div>
        )}
      </Panel>

      <Panel>
        <div className={styles.filters}>
          <div className={styles.searchField}>
            <Search size={18} />

            <input
              value={filters.search}
              placeholder="Buscar brecha, empresa, operación u obligación"
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
            value={filters.riskLevel}
            onChange={(event) =>
              updateFilter(
                'riskLevel',
                event.currentTarget.value as
                  | GapRiskLevel
                  | '',
              )
            }
          >
            <option value="">
              Todos los riesgos
            </option>

            {RISK_OPTIONS.map((risk) => (
              <option
                key={risk}
                value={risk}
              >
                {risk}
              </option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                'status',
                event.currentTarget.value as
                  | GapStatus
                  | '',
              )
            }
          >
            <option value="">
              Todos los estados
            </option>

            {STATUS_OPTIONS.map((status) => (
              <option
                key={status}
                value={status}
              >
                {status}
              </option>
            ))}
          </select>

          <select
            value={filters.source}
            onChange={(event) =>
              updateFilter(
                'source',
                event.currentTarget.value as
                  | GapSource
                  | '',
              )
            }
          >
            <option value="">
              Todos los orígenes
            </option>

            {SOURCE_OPTIONS.map((source) => (
              <option
                key={source}
                value={source}
              >
                {source}
              </option>
            ))}
          </select>

          <select
            value={filters.priority}
            onChange={(event) =>
              updateFilter(
                'priority',
                event.currentTarget.value as
                  | GapPriority
                  | '',
              )
            }
          >
            <option value="">
              Todas las prioridades
            </option>

            {PRIORITY_OPTIONS.map(
              (priority) => (
                <option
                  key={priority}
                  value={priority}
                >
                  {priority}
                </option>
              ),
            )}
          </select>

          <label className={styles.overdueFilter}>
            <input
              type="checkbox"
              checked={filters.overdueOnly}
              onChange={(event) =>
                updateFilter(
                  'overdueOnly',
                  event.currentTarget.checked,
                )
              }
            />

            Solo vencidas
          </label>

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
            <h2>Registro de brechas</h2>
            <span>{resultsLabel}</span>
          </div>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <RefreshCw
              size={31}
              className={styles.spinning}
            />
            Cargando brechas...
          </div>
        ) : filteredGaps.length === 0 ? (
          <div className={styles.emptyState}>
            <Target size={44} />

            <h3>
              Aún no existen brechas registradas
            </h3>

            <p>
              Registra manualmente una brecha o créala
              desde un resultado de IA o evaluación.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Brecha</th>
                  <th>Empresa</th>
                  <th>Obligación</th>
                  <th>Origen</th>
                  <th>Riesgo</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Fecha límite</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {filteredGaps.map((gap) => {
                  const overdue =
                    isOverdue(gap);

                  return (
                    <tr
                      key={gap.id}
                      className={
                        overdue
                          ? styles.overdueRow
                          : undefined
                      }
                    >
                      <td>
                        <div className={styles.mainCell}>
                          <strong>{gap.title}</strong>
                          <span>
                            {gap.operationName}
                          </span>
                        </div>
                      </td>

                      <td>{gap.companyName}</td>

                      <td>
                        <div className={styles.mainCell}>
                          <strong>
                            {gap.obligationCode}
                          </strong>
                          <span>
                            {gap.obligationTitle}
                          </span>
                        </div>
                      </td>

                      <td>
                        <Badge value={gap.source} />
                      </td>

                      <td>
                        <Badge
                          value={gap.riskLevel}
                        />
                      </td>

                      <td>
                        <Badge
                          value={gap.priority}
                        />
                      </td>

                      <td>
                        <Badge value={gap.status} />
                      </td>

                      <td>
                        {gap.responsibleName ??
                          'No asignado'}
                      </td>

                      <td>
                        <div className={styles.dateCell}>
                          <span>
                            {formatDate(
                              gap.dueDate,
                            )}
                          </span>

                          {overdue && (
                            <small>Vencida</small>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            title="Ver detalle"
                            onClick={() =>
                              setSelectedGap(gap)
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Editar brecha"
                            onClick={() =>
                              openEditGap(gap)
                            }
                          >
                            <Pencil size={17} />
                          </button>

                          {gap.evidence && (
                            <button
                              type="button"
                              title="Abrir evidencia"
                              disabled={
                                openingEvidenceId ===
                                gap.evidence.id
                              }
                              onClick={() =>
                                void openEvidence(
                                  gap.evidence!.id,
                                  gap.evidence!
                                    .storagePath,
                                )
                              }
                            >
                              <FileCheck2
                                size={17}
                              />
                            </button>
                          )}

                          <button
                            type="button"
                            title="Eliminar brecha"
                            className={
                              styles.dangerButton
                            }
                            onClick={() =>
                              setDeleteTarget(gap)
                            }
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selectedGap && (
        <div className={styles.drawerBackdrop}>
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <span>
                  Detalle de brecha y riesgo
                </span>

                <h2>{selectedGap.title}</h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedGap(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.badges}>
                <Badge
                  value={selectedGap.status}
                />
                <Badge
                  value={selectedGap.riskLevel}
                />
                <Badge
                  value={selectedGap.priority}
                />
                <Badge
                  value={selectedGap.source}
                />
              </div>

              <dl className={styles.detailList}>
                <div>
                  <dt>Empresa</dt>
                  <dd>{selectedGap.companyName}</dd>
                </div>

                <div>
                  <dt>Operación</dt>
                  <dd>
                    {selectedGap.operationName}
                  </dd>
                </div>

                <div>
                  <dt>Obligación</dt>
                  <dd>
                    {selectedGap.obligationCode}
                    {' — '}
                    {selectedGap.obligationTitle}
                  </dd>
                </div>

                <div>
                  <dt>Descripción</dt>
                  <dd>
                    {selectedGap.description ??
                      'Sin descripción registrada.'}
                  </dd>
                </div>

                <div>
                  <dt>Probabilidad</dt>
                  <dd>{selectedGap.probability}</dd>
                </div>

                <div>
                  <dt>Impacto</dt>
                  <dd>{selectedGap.impact}</dd>
                </div>

                <div>
                  <dt>Fundamento técnico</dt>
                  <dd>
                    {selectedGap.technicalBasis ??
                      'Sin fundamento registrado.'}
                  </dd>
                </div>

                <div>
                  <dt>Medida de tratamiento</dt>
                  <dd>
                    {selectedGap.treatmentMeasure ??
                      'Sin medida registrada.'}
                  </dd>
                </div>

                <div>
                  <dt>Responsable</dt>
                  <dd>
                    {selectedGap.responsibleName ??
                      'No asignado'}
                  </dd>
                </div>

                <div>
                  <dt>Fecha límite</dt>
                  <dd>
                    {formatDate(
                      selectedGap.dueDate,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Fecha de registro</dt>
                  <dd>
                    {formatDateTime(
                      selectedGap.createdAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Fecha de cierre</dt>
                  <dd>
                    {formatDateTime(
                      selectedGap.closedAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Resumen del análisis IA</dt>
                  <dd>
                    {selectedGap.aiAnalysis
                      ?.documentSummary ??
                      'Sin análisis IA relacionado.'}
                  </dd>
                </div>

                <div>
                  <dt>Resultado de evaluación</dt>
                  <dd>
                    {selectedGap.evaluation
                      ? `${selectedGap.evaluation.complianceStatus} · ${selectedGap.evaluation.score}/100`
                      : 'Sin evaluación relacionada.'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.drawerFooter}>
              {selectedGap.evidence && (
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={() =>
                    void openEvidence(
                      selectedGap
                        .evidence!.id,

                      selectedGap
                        .evidence!.storagePath,
                    )
                  }
                >
                  <FileCheck2 size={17} />
                  Abrir evidencia
                </button>
              )}

              <PrimaryButton
                onClick={() =>
                  openEditGap(selectedGap)
                }
              >
                <Pencil size={17} />
                Editar brecha
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}

      {formOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <span>
                  Gestión de brechas
                </span>

                <h2>
                  {form.id
                    ? 'Editar brecha'
                    : 'Registrar brecha'}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={styles.modalForm}
              onSubmit={handleSubmit}
            >
              <label>
                Obligación asignada *

                <select
                  value={form.assignmentId}
                  disabled={Boolean(form.id)}
                  onChange={(event) =>
                    handleAssignmentChange(
                      event.currentTarget.value,
                    )
                  }
                >
                  <option value="">
                    Selecciona una obligación
                  </option>

                  {contexts.map((context) => (
                    <option
                      key={context.assignmentId}
                      value={context.assignmentId}
                    >
                      {context.companyName}
                      {' — '}
                      {context.operationName}
                      {' — '}
                      {context.obligationCode}
                    </option>
                  ))}
                </select>
              </label>

              {selectedContext && (
                <div className={styles.formContext}>
                  <div>
                    <span>Empresa</span>
                    <strong>
                      {selectedContext.companyName}
                    </strong>
                  </div>

                  <div>
                    <span>Operación</span>
                    <strong>
                      {selectedContext.operationName}
                    </strong>
                  </div>

                  <div>
                    <span>Obligación</span>
                    <strong>
                      {selectedContext.obligationCode}
                      {' — '}
                      {selectedContext.obligationTitle}
                    </strong>
                  </div>
                </div>
              )}

              <div className={styles.formGrid}>
                <label>
                  Evaluación relacionada

                  <select
                    value={form.evaluationId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        evaluationId:
                          event.currentTarget.value,
                      }))
                    }
                  >
                    <option value="">
                      Sin evaluación relacionada
                    </option>

                    {selectedContext
                      ?.evaluation && (
                      <option
                        value={
                          selectedContext
                            .evaluation.id
                        }
                      >
                        {
                          selectedContext
                            .evaluation
                            .complianceStatus
                        }
                        {' — '}
                        {
                          selectedContext
                            .evaluation.score
                        }
                        /100
                      </option>
                    )}
                  </select>
                </label>

                <label>
                  Evidencia relacionada

                  <select
                    value={form.evidenceId}
                    onChange={(event) =>
                      handleEvidenceChange(
                        event.currentTarget.value,
                      )
                    }
                  >
                    <option value="">
                      Sin evidencia relacionada
                    </option>

                    {selectedContext
                      ?.evidences.map(
                        (evidence) => (
                          <option
                            key={evidence.id}
                            value={evidence.id}
                          >
                            v{evidence.version}
                            {' — '}
                            {evidence.fileName}
                          </option>
                        ),
                      )}
                  </select>
                </label>

                <label>
                  Análisis IA relacionado

                  <select
                    value={form.aiAnalysisId}
                    onChange={(event) =>
                      handleAiAnalysisChange(
                        event.currentTarget.value,
                      )
                    }
                  >
                    <option value="">
                      Sin análisis IA relacionado
                    </option>

                    {selectedContext
                      ?.aiAnalyses
                      .filter(
                        (analysis) =>
                          !form.evidenceId ||
                          analysis.evidenceId ===
                            form.evidenceId,
                      )
                      .map((analysis) => (
                        <option
                          key={analysis.id}
                          value={analysis.id}
                        >
                          {analysis.model}
                          {' — '}
                          {analysis.riskLevel}
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <label>
                Título de la brecha *

                <input
                  value={form.title}
                  placeholder="Ej.: Falta de registro mensual de monitoreo"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <label>
                Descripción

                <textarea
                  rows={4}
                  value={form.description}
                  placeholder="Describe el incumplimiento, diferencia o información faltante."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <div className={styles.formGrid}>
                <label>
                  Nivel de riesgo *

                  <select
                    value={form.riskLevel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        riskLevel:
                          event.currentTarget
                            .value as
                            GapRiskLevel,
                      }))
                    }
                  >
                    {RISK_OPTIONS.map((risk) => (
                      <option
                        key={risk}
                        value={risk}
                      >
                        {risk}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Probabilidad *

                  <select
                    value={form.probability}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        probability:
                          event.currentTarget
                            .value as
                            GapProbability,
                      }))
                    }
                  >
                    {PROBABILITY_OPTIONS.map(
                      (probability) => (
                        <option
                          key={probability}
                          value={probability}
                        >
                          {probability}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Impacto *

                  <select
                    value={form.impact}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        impact:
                          event.currentTarget
                            .value as
                            GapImpact,
                      }))
                    }
                  >
                    {IMPACT_OPTIONS.map(
                      (impact) => (
                        <option
                          key={impact}
                          value={impact}
                        >
                          {impact}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Prioridad *

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        priority:
                          event.currentTarget
                            .value as
                            GapPriority,
                      }))
                    }
                  >
                    {PRIORITY_OPTIONS.map(
                      (priority) => (
                        <option
                          key={priority}
                          value={priority}
                        >
                          {priority}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Estado *

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status:
                          event.currentTarget
                            .value as
                            GapStatus,
                      }))
                    }
                  >
                    {STATUS_OPTIONS.map(
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
                </label>

                <label>
                  Origen *

                  <select
                    value={form.source}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        source:
                          event.currentTarget
                            .value as
                            GapSource,
                      }))
                    }
                  >
                    {SOURCE_OPTIONS.map(
                      (source) => (
                        <option
                          key={source}
                          value={source}
                        >
                          {source}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              <label>
                Fundamento técnico

                <textarea
                  rows={4}
                  value={form.technicalBasis}
                  placeholder="Explica los criterios, evidencias o resultados que sustentan la brecha."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      technicalBasis:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <label>
                Medida de tratamiento

                <textarea
                  rows={4}
                  value={form.treatmentMeasure}
                  placeholder="Indica la medida correctiva o preventiva requerida."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      treatmentMeasure:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <div className={styles.formGrid}>
                <label>
                  Responsable

                  <input
                    value={form.responsibleName}
                    placeholder="Nombre o área responsable"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        responsibleName:
                          event.currentTarget.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Fecha límite

                  <input
                    type="date"
                    value={form.dueDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        dueDate:
                          event.currentTarget.value,
                      }))
                    }
                  />
                </label>
              </div>

              {formError && (
                <div className={styles.formError}>
                  <CircleAlert size={17} />
                  {formError}
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancelar
                </button>

                <PrimaryButton
                  type="submit"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <RefreshCw
                        size={17}
                        className={
                          styles.spinning
                        }
                      />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Guardar brecha
                    </>
                  )}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmIcon}>
              <Trash2 size={25} />
            </div>

            <h2>Eliminar brecha</h2>

            <p>
              Se eliminará la brecha{' '}
              <strong>
                {deleteTarget.title}
              </strong>
              . La evaluación, evidencia y análisis IA
              relacionados no serán eliminados.
            </p>

            <div className={styles.confirmActions}>
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  styles.deleteConfirmButton
                }
                onClick={() =>
                  void confirmDelete()
                }
                disabled={deleting}
              >
                {deleting
                  ? 'Eliminando...'
                  : 'Eliminar brecha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}