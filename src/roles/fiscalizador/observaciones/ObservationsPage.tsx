import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  FileCheck2,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
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
  useObservations,
} from './useObservations';

import type {
  ObservationAssignmentContext,
  ObservationFormValues,
  ObservationItem,
  ObservationSeverity,
  ObservationSource,
  ObservationStatus,
  ObservationType,
} from './observations.types';

import styles from './ObservationsPage.module.css';

const TYPE_OPTIONS:
ObservationType[] = [
  'Técnica',
  'Documentaria',
  'Operativa',
  'Legal',
  'Ambiental',
  'Seguridad',
  'Otra',
];

const SEVERITY_OPTIONS:
ObservationSeverity[] = [
  'Baja',
  'Media',
  'Alta',
  'Crítica',
];

const STATUS_OPTIONS:
ObservationStatus[] = [
  'Abierta',
  'Notificada',
  'Respondida',
  'En verificación',
  'Subsanada',
  'No subsanada',
  'Cerrada',
  'Descartada',
];

const SOURCE_OPTIONS:
ObservationSource[] = [
  'Manual',
  'IA',
  'Evaluación',
  'Brecha',
];

const EMPTY_FORM:
ObservationFormValues = {
  assignmentId: '',

  evaluationId: '',
  gapId: '',
  evidenceId: '',
  aiAnalysisId: '',

  title: '',
  description: '',

  observationType: 'Técnica',
  severity: 'Media',
  status: 'Abierta',
  source: 'Manual',

  requiresResponse: true,

  responsibleName: '',
  dueDate: '',

  verificationComment: '',
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

  if (Number.isNaN(date.getTime())) {
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

function createFormFromContext(
  context: ObservationAssignmentContext,
): ObservationFormValues {
  const ai =
    context.latestAiAnalysis;

  const evaluation =
    context.evaluation;

  const gap =
    context.gaps[0];

  const aiObservation =
    ai?.observations[0] ?? '';

  return {
    ...EMPTY_FORM,

    assignmentId:
      context.assignmentId,

    evaluationId:
      evaluation?.id ?? '',

    gapId:
      gap?.id ?? '',

    evidenceId:
      evaluation?.evidenceId ??
      gap?.evidenceId ??
      context.latestEvidence?.id ??
      '',

    aiAnalysisId:
      evaluation?.aiAnalysisId ??
      gap?.aiAnalysisId ??
      ai?.id ??
      '',

    title:
      aiObservation ||
      gap?.title ||
      `Observación sobre ${context.obligationCode}`,

    description:
      aiObservation ||
      gap?.description ||
      evaluation?.evaluationComment ||
      '',

    source:
      aiObservation
        ? 'IA'
        : gap
          ? 'Brecha'
          : evaluation
            ? 'Evaluación'
            : 'Manual',

    severity:
      gap?.riskLevel === 'Crítico'
        ? 'Crítica'
        : gap?.riskLevel === 'Alto'
          ? 'Alta'
          : 'Media',

    responsibleName:
      '',

    dueDate:
      gap?.status !== 'Cerrada'
        ? context.dueDate ?? ''
        : '',
  };
}

function createFormFromObservation(
  item: ObservationItem,
): ObservationFormValues {
  return {
    id: item.id,

    assignmentId:
      item.assignmentId,

    evaluationId:
      item.evaluationId ?? '',

    gapId:
      item.gapId ?? '',

    evidenceId:
      item.evidenceId ?? '',

    aiAnalysisId:
      item.aiAnalysisId ?? '',

    title:
      item.title,

    description:
      item.description ??
      item.text,

    observationType:
      item.observationType,

    severity:
      item.severity,

    status:
      item.status,

    source:
      item.source,

    requiresResponse:
      item.requiresResponse,

    responsibleName:
      item.responsibleName ?? '',

    dueDate:
      item.dueDate ?? '',

    verificationComment:
      item.verificationComment ?? '',
  };
}

export default function ObservationsPage() {
  const {
    contexts,
    filteredContexts,
    filteredObservations,

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
    submitObservation,
    deleteObservation,
    openEvidence,
    updateFilter,

    isOverdue,
    clearFilters,
    clearError,
  } = useObservations();

  const [
    selectedObservation,
    setSelectedObservation,
  ] = useState<ObservationItem | null>(
    null,
  );

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<ObservationFormValues>(
    EMPTY_FORM,
  );

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<ObservationItem | null>(
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
        filteredObservations.length;

      return total === 1
        ? '1 observación encontrada'
        : `${total} observaciones encontradas`;
    }, [
      filteredObservations.length,
    ]);

  function openNewObservation(
    context?: ObservationAssignmentContext,
  ) {
    setForm(
      context
        ? createFormFromContext(
            context,
          )
        : {
            ...EMPTY_FORM,
          },
    );

    setFormError('');
    setSelectedObservation(null);
    setFormOpen(true);
  }

  function openEditObservation(
    observation: ObservationItem,
  ) {
    setForm(
      createFormFromObservation(
        observation,
      ),
    );

    setFormError('');
    setSelectedObservation(null);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setForm({
      ...EMPTY_FORM,
    });
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

  function handleGapChange(
    gapId: string,
  ) {
    const gap =
      selectedContext?.gaps.find(
        (item) =>
          item.id === gapId,
      );

    setForm((current) => ({
      ...current,

      gapId,

      evaluationId:
        gap?.evaluationId ??
        current.evaluationId,

      evidenceId:
        gap?.evidenceId ??
        current.evidenceId,

      aiAnalysisId:
        gap?.aiAnalysisId ??
        current.aiAnalysisId,

      title:
        current.title ||
        gap?.title ||
        '',

      description:
        current.description ||
        gap?.description ||
        '',

      source:
        gap
          ? 'Brecha'
          : current.source,

      severity:
        gap?.riskLevel === 'Crítico'
          ? 'Crítica'
          : gap?.riskLevel === 'Alto'
            ? 'Alta'
            : current.severity,
    }));
  }

  function handleEvidenceChange(
    evidenceId: string,
  ) {
    const ai =
      selectedContext?.aiAnalyses.find(
        (item) =>
          item.evidenceId ===
          evidenceId,
      );

    setForm((current) => ({
      ...current,

      evidenceId,

      aiAnalysisId:
        ai?.id ?? '',

      source:
        ai
          ? 'IA'
          : current.source,

      title:
        current.title ||
        ai?.observations[0] ||
        '',

      description:
        current.description ||
        ai?.observations[0] ||
        '',

      verificationComment:
        current.verificationComment,
    }));
  }

  function handleAiChange(
    aiAnalysisId: string,
  ) {
    const ai =
      selectedContext
        ?.aiAnalyses.find(
          (item) =>
            item.id ===
            aiAnalysisId,
        );

    setForm((current) => ({
      ...current,

      aiAnalysisId,

      source:
        ai
          ? 'IA'
          : current.source,

      title:
        current.title ||
        ai?.observations[0] ||
        '',

      description:
        current.description ||
        ai?.observations.join(
          '\n',
        ) ||
        '',

      verificationComment:
        current.verificationComment,
    }));
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
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
        'El título es obligatorio.',
      );
      return;
    }

    if (!form.description.trim()) {
      setFormError(
        'La descripción es obligatoria.',
      );
      return;
    }

    if (
      form.requiresResponse &&
      (
        form.severity === 'Alta' ||
        form.severity === 'Crítica'
      ) &&
      !form.dueDate
    ) {
      setFormError(
        'Registra una fecha límite para esta observación.',
      );
      return;
    }

    if (
      (
        form.status === 'Subsanada' ||
        form.status ===
          'No subsanada'
      ) &&
      !form.verificationComment.trim()
    ) {
      setFormError(
        'Registra el comentario de verificación.',
      );
      return;
    }

    try {
      setFormError('');

      await submitObservation(
        form,
      );

      closeForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la observación.',
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteObservation(
        deleteTarget.id,
      );

      setDeleteTarget(null);
      setSelectedObservation(null);
    } catch {
      // El mensaje se muestra desde el hook.
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Observaciones"
        description="Registra, notifica y verifica las observaciones derivadas de evidencias, análisis, evaluaciones y brechas."
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
              onClick={() =>
                openNewObservation()
              }
            >
              <Plus size={17} />
              Nueva observación
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
          <MessageSquareText size={23} />
          <div>
            <span>Total</span>
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
          <BellRing size={23} />
          <div>
            <span>Notificadas</span>
            <strong>{summary.notified}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <MessageSquareText size={23} />
          <div>
            <span>Respondidas</span>
            <strong>{summary.responded}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <Clock3 size={23} />
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
            <span>Resueltas</span>
            <strong>{summary.resolved}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <ShieldAlert size={23} />
          <div>
            <span>Críticas</span>
            <strong>{summary.critical}</strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <Clock3 size={23} />
          <div>
            <span>Vencidas</span>
            <strong>{summary.overdue}</strong>
          </div>
        </article>
      </section>

      <Panel>
        <div className={styles.sectionHeader}>
          <h2>
            Obligaciones disponibles
          </h2>

          <p>
            Registra observaciones desde una
            obligación, evaluación, brecha o
            resultado de IA.
          </p>
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
            <MessageSquareText size={43} />

            <h3>
              No existen obligaciones disponibles
            </h3>

            <p>
              Primero deben existir obligaciones
              asignadas en el sistema.
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
                      Brechas:{' '}
                      {context.gaps.length}
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

                  <PrimaryButton
                    onClick={() =>
                      openNewObservation(
                        context,
                      )
                    }
                  >
                    <Plus size={16} />
                    Registrar observación
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
              placeholder="Buscar observación, empresa, operación u obligación"
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
            value={filters.observationType}
            onChange={(event) =>
              updateFilter(
                'observationType',
                event.currentTarget
                  .value as
                  | ObservationType
                  | '',
              )
            }
          >
            <option value="">
              Todos los tipos
            </option>

            {TYPE_OPTIONS.map((type) => (
              <option
                key={type}
                value={type}
              >
                {type}
              </option>
            ))}
          </select>

          <select
            value={filters.severity}
            onChange={(event) =>
              updateFilter(
                'severity',
                event.currentTarget
                  .value as
                  | ObservationSeverity
                  | '',
              )
            }
          >
            <option value="">
              Todas las severidades
            </option>

            {SEVERITY_OPTIONS.map(
              (severity) => (
                <option
                  key={severity}
                  value={severity}
                >
                  {severity}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                'status',
                event.currentTarget
                  .value as
                  | ObservationStatus
                  | '',
              )
            }
          >
            <option value="">
              Todos los estados
            </option>

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

          <select
            value={filters.source}
            onChange={(event) =>
              updateFilter(
                'source',
                event.currentTarget
                  .value as
                  | ObservationSource
                  | '',
              )
            }
          >
            <option value="">
              Todos los orígenes
            </option>

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

          <label className={styles.checkFilter}>
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

          <label className={styles.checkFilter}>
            <input
              type="checkbox"
              checked={
                filters.pendingResponseOnly
              }
              onChange={(event) =>
                updateFilter(
                  'pendingResponseOnly',
                  event.currentTarget.checked,
                )
              }
            />
            Pendientes de respuesta
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
          <h2>
            Registro de observaciones
          </h2>

          <span>{resultsLabel}</span>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            <RefreshCw
              size={31}
              className={styles.spinning}
            />
            Cargando observaciones...
          </div>
        ) : filteredObservations.length ===
          0 ? (
          <div className={styles.emptyState}>
            <MessageSquareText size={44} />

            <h3>
              Aún no existen observaciones
            </h3>

            <p>
              Registra una observación manual o
              créala desde una evaluación, brecha
              o resultado de IA.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Observación</th>
                  <th>Empresa</th>
                  <th>Obligación</th>
                  <th>Tipo</th>
                  <th>Severidad</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th>Respuesta</th>
                  <th>Fecha límite</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {filteredObservations.map(
                  (observation) => {
                    const overdue =
                      isOverdue(
                        observation,
                      );

                    return (
                      <tr
                        key={observation.id}
                        className={
                          overdue
                            ? styles.overdueRow
                            : undefined
                        }
                      >
                        <td>
                          <div
                            className={
                              styles.mainCell
                            }
                          >
                            <strong>
                              {observation.title}
                            </strong>

                            <span>
                              {
                                observation
                                  .operationName
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          {observation.companyName}
                        </td>

                        <td>
                          <div
                            className={
                              styles.mainCell
                            }
                          >
                            <strong>
                              {
                                observation
                                  .obligationCode
                              }
                            </strong>

                            <span>
                              {
                                observation
                                  .obligationTitle
                              }
                            </span>
                          </div>
                        </td>

                        <td>
                          <Badge
                            value={
                              observation
                                .observationType
                            }
                          />
                        </td>

                        <td>
                          <Badge
                            value={
                              observation
                                .severity
                            }
                          />
                        </td>

                        <td>
                          <Badge
                            value={
                              observation.source
                            }
                          />
                        </td>

                        <td>
                          <Badge
                            value={
                              observation.status
                            }
                          />
                        </td>

                        <td>
                          {observation
                            .requiresResponse
                            ? observation
                                .respondedAt
                              ? 'Recibida'
                              : 'Pendiente'
                            : 'No requerida'}
                        </td>

                        <td>
                          <div
                            className={
                              styles.dateCell
                            }
                          >
                            <span>
                              {formatDate(
                                observation
                                  .dueDate,
                              )}
                            </span>

                            {overdue && (
                              <small>
                                Vencida
                              </small>
                            )}
                          </div>
                        </td>

                        <td>
                          <div
                            className={
                              styles.rowActions
                            }
                          >
                            <button
                              type="button"
                              title="Ver detalle"
                              onClick={() =>
                                setSelectedObservation(
                                  observation,
                                )
                              }
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              title="Editar observación"
                              onClick={() =>
                                openEditObservation(
                                  observation,
                                )
                              }
                            >
                              <Pencil
                                size={17}
                              />
                            </button>

                            {observation.evidence && (
                              <button
                                type="button"
                                title="Abrir evidencia"
                                disabled={
                                  openingEvidenceId ===
                                  observation
                                    .evidence.id
                                }
                                onClick={() =>
                                  void openEvidence(
                                    observation
                                      .evidence!.id,

                                    observation
                                      .evidence!
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
                              title="Eliminar observación"
                              className={
                                styles.dangerButton
                              }
                              onClick={() =>
                                setDeleteTarget(
                                  observation,
                                )
                              }
                            >
                              <Trash2
                                size={17}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  },
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selectedObservation && (
        <div className={styles.drawerBackdrop}>
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <span>
                  Detalle de observación
                </span>

                <h2>
                  {selectedObservation.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedObservation(
                    null,
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.badges}>
                <Badge
                  value={
                    selectedObservation.status
                  }
                />

                <Badge
                  value={
                    selectedObservation
                      .severity
                  }
                />

                <Badge
                  value={
                    selectedObservation
                      .observationType
                  }
                />

                <Badge
                  value={
                    selectedObservation.source
                  }
                />
              </div>

              <dl className={styles.detailList}>
                <div>
                  <dt>Empresa</dt>
                  <dd>
                    {
                      selectedObservation
                        .companyName
                    }
                  </dd>
                </div>

                <div>
                  <dt>Operación</dt>
                  <dd>
                    {
                      selectedObservation
                        .operationName
                    }
                  </dd>
                </div>

                <div>
                  <dt>Obligación</dt>
                  <dd>
                    {
                      selectedObservation
                        .obligationCode
                    }
                    {' — '}
                    {
                      selectedObservation
                        .obligationTitle
                    }
                  </dd>
                </div>

                <div>
                  <dt>Descripción</dt>
                  <dd>
                    {selectedObservation
                      .description ??
                      selectedObservation.text}
                  </dd>
                </div>

                <div>
                  <dt>Responsable</dt>
                  <dd>
                    {selectedObservation
                      .responsibleName ??
                      'No asignado'}
                  </dd>
                </div>

                <div>
                  <dt>Fecha límite</dt>
                  <dd>
                    {formatDate(
                      selectedObservation
                        .dueDate,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Respuesta de la empresa</dt>
                  <dd>
                    {selectedObservation
                      .companyResponse ??
                      'Sin respuesta registrada.'}
                  </dd>
                </div>

                <div>
                  <dt>Comentario de verificación</dt>
                  <dd>
                    {selectedObservation
                      .verificationComment ??
                      'Sin verificación registrada.'}
                  </dd>
                </div>

                <div>
                  <dt>Brecha relacionada</dt>
                  <dd>
                    {selectedObservation.gap
                      ?.title ??
                      'Sin brecha relacionada.'}
                  </dd>
                </div>

                <div>
                  <dt>Resultado de evaluación</dt>
                  <dd>
                    {selectedObservation
                      .evaluation
                      ? `${selectedObservation.evaluation.complianceStatus} · ${selectedObservation.evaluation.score}/100`
                      : 'Sin evaluación relacionada.'}
                  </dd>
                </div>

                <div>
                  <dt>Fecha de registro</dt>
                  <dd>
                    {formatDateTime(
                      selectedObservation
                        .createdAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Fecha de respuesta</dt>
                  <dd>
                    {formatDateTime(
                      selectedObservation
                        .respondedAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Fecha de verificación</dt>
                  <dd>
                    {formatDateTime(
                      selectedObservation
                        .verifiedAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Fecha de cierre</dt>
                  <dd>
                    {formatDateTime(
                      selectedObservation
                        .closedAt,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.drawerFooter}>
              {selectedObservation.evidence && (
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={() =>
                    void openEvidence(
                      selectedObservation
                        .evidence!.id,

                      selectedObservation
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
                  openEditObservation(
                    selectedObservation,
                  )
                }
              >
                <Pencil size={17} />
                Editar observación
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
                  Gestión de observaciones
                </span>

                <h2>
                  {form.id
                    ? 'Editar observación'
                    : 'Registrar observación'}
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
                      {
                        selectedContext
                          .operationName
                      }
                    </strong>
                  </div>

                  <div>
                    <span>Obligación</span>
                    <strong>
                      {
                        selectedContext
                          .obligationCode
                      }
                      {' — '}
                      {
                        selectedContext
                          .obligationTitle
                      }
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
                          event.currentTarget
                            .value,
                      }))
                    }
                  >
                    <option value="">
                      Sin evaluación
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
                  Brecha relacionada

                  <select
                    value={form.gapId}
                    onChange={(event) =>
                      handleGapChange(
                        event.currentTarget.value,
                      )
                    }
                  >
                    <option value="">
                      Sin brecha relacionada
                    </option>

                    {selectedContext?.gaps.map(
                      (gap) => (
                        <option
                          key={gap.id}
                          value={gap.id}
                        >
                          {gap.title}
                          {' — '}
                          {gap.riskLevel}
                        </option>
                      ),
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
                      Sin evidencia
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
                      handleAiChange(
                        event.currentTarget.value,
                      )
                    }
                  >
                    <option value="">
                      Sin análisis IA
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
                          {
                            analysis
                              .complianceStatus
                          }
                        </option>
                      ))}
                  </select>
                </label>
              </div>

              <label>
                Título *

                <input
                  value={form.title}
                  placeholder="Ej.: Documento incompleto"
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
                Descripción *

                <textarea
                  rows={5}
                  value={form.description}
                  placeholder="Describe claramente la observación y el aspecto que debe ser subsanado."
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
                  Tipo *

                  <select
                    value={form.observationType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        observationType:
                          event.currentTarget
                            .value as
                            ObservationType,
                      }))
                    }
                  >
                    {TYPE_OPTIONS.map(
                      (type) => (
                        <option
                          key={type}
                          value={type}
                        >
                          {type}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Severidad *

                  <select
                    value={form.severity}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        severity:
                          event.currentTarget
                            .value as
                            ObservationSeverity,
                      }))
                    }
                  >
                    {SEVERITY_OPTIONS.map(
                      (severity) => (
                        <option
                          key={severity}
                          value={severity}
                        >
                          {severity}
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
                            ObservationStatus,
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
                            ObservationSource,
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

              <label className={styles.checkField}>
                <input
                  type="checkbox"
                  checked={form.requiresResponse}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      requiresResponse:
                        event.currentTarget.checked,
                    }))
                  }
                />

                <span>
                  La Empresa Evaluada debe responder esta observación
                </span>
              </label>

              <label>
                Comentario de verificación

                <textarea
                  rows={4}
                  value={
                    form.verificationComment
                  }
                  placeholder="Registra el resultado de la revisión de la respuesta presentada."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      verificationComment:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

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
                      Guardar observación
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

            <h2>
              Eliminar observación
            </h2>

            <p>
              Se eliminará la observación{' '}
              <strong>
                {deleteTarget.title}
              </strong>
              . Las relaciones asociadas no serán eliminadas.
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
                  : 'Eliminar observación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}