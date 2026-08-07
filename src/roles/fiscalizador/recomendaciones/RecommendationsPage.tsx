import {
  AlertTriangle,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Eye,
  Lightbulb,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  TrendingUp,
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
  useRecommendations,
} from './useRecommendations';

import type {
  RecommendationContext,
  RecommendationFormValues,
  RecommendationItem,
  RecommendationPriority,
  RecommendationSource,
  RecommendationStatus,
  RecommendationType,
} from './recommendations.types';

import styles from './RecommendationsPage.module.css';

const TYPE_OPTIONS:
RecommendationType[] = [
  'Correctiva',
  'Preventiva',
  'Mejora',
  'Documentaria',
  'Operativa',
];

const PRIORITY_OPTIONS:
RecommendationPriority[] = [
  'Baja',
  'Media',
  'Alta',
  'Urgente',
];

const STATUS_OPTIONS:
RecommendationStatus[] = [
  'Pendiente',
  'En ejecución',
  'Implementada',
  'Verificada',
  'Descartada',
];

const SOURCE_OPTIONS:
RecommendationSource[] = [
  'Manual',
  'IA',
  'Evaluación',
  'Brecha',
  'Observación',
];

const EMPTY_FORM:
RecommendationFormValues = {
  assignmentId: '',
  evaluationId: '',
  gapId: '',
  observationId: '',
  aiAnalysisId: '',

  title: '',
  description: '',

  recommendationType: 'Correctiva',
  priority: 'Media',
  status: 'Pendiente',
  source: 'Manual',

  responsibleName: '',
  dueDate: '',

  progress: 0,

  expectedResult: '',
  implementationComment: '',
  verificationComment: '',
};

function formatDate(
  value?: string,
): string {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat(
    'es-PE',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    },
  ).format(
    new Date(`${value}T12:00:00`),
  );
}

function createFormFromContext(
  context: RecommendationContext,
): RecommendationFormValues {
  const gap =
    context.gaps[0];

  const observation =
    context.observations[0];

  return {
    ...EMPTY_FORM,

    assignmentId:
      context.assignmentId,

    evaluationId:
      context.evaluationId ?? '',

    gapId:
      gap?.id ?? '',

    observationId:
      observation?.id ?? '',

    title:
      observation
        ? `Atender: ${observation.title}`
        : gap
          ? `Corregir: ${gap.title}`
          : `Recomendación para ${context.obligationCode}`,

    description:
      observation?.title ??
      gap?.title ??
      '',

    source:
      observation
        ? 'Observación'
        : gap
          ? 'Brecha'
          : context.evaluationId
            ? 'Evaluación'
            : 'Manual',

    priority:
      gap?.riskLevel === 'Crítico'
        ? 'Urgente'
        : gap?.riskLevel === 'Alto'
          ? 'Alta'
          : 'Media',
  };
}

function createFormFromItem(
  item: RecommendationItem,
): RecommendationFormValues {
  return {
    id: item.id,

    assignmentId:
      item.assignmentId,

    evaluationId:
      item.evaluationId ?? '',

    gapId:
      item.gapId ?? '',

    observationId:
      item.observationId ?? '',

    aiAnalysisId:
      item.aiAnalysisId ?? '',

    title:
      item.title,

    description:
      item.description ??
      item.text,

    recommendationType:
      item.recommendationType,

    priority:
      item.priority,

    status:
      item.status,

    source:
      item.source,

    responsibleName:
      item.responsibleName ?? '',

    dueDate:
      item.dueDate ?? '',

    progress:
      item.progress,

    expectedResult:
      item.expectedResult ?? '',

    implementationComment:
      item.implementationComment ?? '',

    verificationComment:
      item.verificationComment ?? '',
  };
}

export default function RecommendationsPage() {
  const {
    contexts,
    filteredRecommendations,

    companies,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    deleting,

    error,

    loadData,
    submitRecommendation,
    deleteRecommendation,
    updateFilter,

    isOverdue,

    clearFilters,
    clearError,
  } = useRecommendations();

  const [
    selected,
    setSelected,
  ] = useState<RecommendationItem | null>(
    null,
  );

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<RecommendationFormValues>({
    ...EMPTY_FORM,
  });

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<RecommendationItem | null>(
    null,
  );

  const selectedContext =
    useMemo(
      () =>
        contexts.find(
          (context) =>
            context.assignmentId ===
            form.assignmentId,
        ),
      [
        contexts,
        form.assignmentId,
      ],
    );

  function openNew(
    context?: RecommendationContext,
  ) {
    setForm(
      context
        ? createFormFromContext(context)
        : {
            ...EMPTY_FORM,
          },
    );

    setFormError('');
    setFormOpen(true);
  }

  function openEdit(
    item: RecommendationItem,
  ) {
    setForm(
      createFormFromItem(item),
    );

    setSelected(null);
    setFormError('');
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

  function handleAssignment(
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
        ? createFormFromContext(context)
        : {
            ...EMPTY_FORM,
            assignmentId,
          },
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setFormError('');

      await submitRecommendation(form);

      closeForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la recomendación.',
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteRecommendation(
        deleteTarget.id,
      );

      setDeleteTarget(null);
    } catch {
      // El error se muestra desde el hook.
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Recomendaciones"
        description="Define y supervisa las acciones recomendadas para mejorar el cumplimiento de las obligaciones."
        action={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() =>
                void loadData()
              }
            >
              <RefreshCw size={17} />
              Actualizar
            </button>

            <PrimaryButton
              onClick={() => openNew()}
            >
              <Plus size={17} />
              Nueva recomendación
            </PrimaryButton>
          </div>
        }
      />

      {error && (
        <div className={styles.errorBanner}>
          <CircleAlert size={18} />
          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
          >
            <X size={17} />
          </button>
        </div>
      )}

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <Lightbulb size={22} />
          <span>Total</span>
          <strong>{summary.total}</strong>
        </article>

        <article className={styles.summaryCard}>
          <Clock3 size={22} />
          <span>Pendientes</span>
          <strong>{summary.pending}</strong>
        </article>

        <article className={styles.summaryCard}>
          <TrendingUp size={22} />
          <span>En ejecución</span>
          <strong>{summary.inProgress}</strong>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={22} />
          <span>Implementadas</span>
          <strong>{summary.implemented}</strong>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={22} />
          <span>Verificadas</span>
          <strong>{summary.verified}</strong>
        </article>

        <article className={styles.summaryCard}>
          <AlertTriangle size={22} />
          <span>Urgentes</span>
          <strong>{summary.urgent}</strong>
        </article>

        <article className={styles.summaryCard}>
          <Clock3 size={22} />
          <span>Vencidas</span>
          <strong>{summary.overdue}</strong>
        </article>

        <article className={styles.summaryCard}>
          <TrendingUp size={22} />
          <span>Avance promedio</span>
          <strong>
            {summary.averageProgress}%
          </strong>
        </article>
      </section>

      <Panel>
        <div className={styles.sectionHeader}>
          <h2>Obligaciones disponibles</h2>
          <p>
            Registra recomendaciones a partir de
            obligaciones, brechas u observaciones.
          </p>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            Cargando obligaciones...
          </div>
        ) : (
          <div className={styles.contextGrid}>
            {contexts.slice(0, 6).map(
              (context) => (
                <article
                  key={context.assignmentId}
                  className={styles.contextCard}
                >
                  <Badge
                    value={context.criticality}
                  />

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

                  <span>
                    Brechas: {context.gaps.length}
                    {' · '}
                    Observaciones:{' '}
                    {context.observations.length}
                  </span>

                  <PrimaryButton
                    onClick={() =>
                      openNew(context)
                    }
                  >
                    <Plus size={16} />
                    Crear recomendación
                  </PrimaryButton>
                </article>
              ),
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
              placeholder="Buscar recomendación"
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
            value={filters.priority}
            onChange={(event) =>
              updateFilter(
                'priority',
                event.currentTarget.value as
                  | RecommendationPriority
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

          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                'status',
                event.currentTarget.value as
                  | RecommendationStatus
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

          <button
            type="button"
            className={styles.secondaryButton}
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>

        {filteredRecommendations.length === 0 ? (
          <div className={styles.emptyState}>
            <Lightbulb size={44} />

            <h3>
              No existen recomendaciones
            </h3>

            <p>
              Registra una recomendación para
              comenzar su seguimiento.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Recomendación</th>
                  <th>Empresa</th>
                  <th>Obligación</th>
                  <th>Tipo</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Avance</th>
                  <th>Responsable</th>
                  <th>Fecha límite</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredRecommendations.map(
                  (item) => (
                    <tr
                      key={item.id}
                      className={
                        isOverdue(item)
                          ? styles.overdueRow
                          : undefined
                      }
                    >
                      <td>
                        <strong>{item.title}</strong>
                        <small>
                          {item.operationName}
                        </small>
                      </td>

                      <td>{item.companyName}</td>

                      <td>
                        {item.obligationCode}
                        <small>
                          {item.obligationTitle}
                        </small>
                      </td>

                      <td>
                        <Badge
                          value={
                            item.recommendationType
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={item.priority}
                        />
                      </td>

                      <td>
                        <Badge
                          value={item.status}
                        />
                      </td>

                      <td>
                        <div
                          className={
                            styles.progressCell
                          }
                        >
                          <div>
                            <span
                              style={{
                                width:
                                  `${item.progress}%`,
                              }}
                            />
                          </div>

                          <strong>
                            {item.progress}%
                          </strong>
                        </div>
                      </td>

                      <td>
                        {item.responsibleName ??
                          'No asignado'}
                      </td>

                      <td>
                        {formatDate(item.dueDate)}
                      </td>

                      <td>
                        <div className={styles.actions}>
                          <button
                            type="button"
                            onClick={() =>
                              setSelected(item)
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              openEdit(item)
                            }
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setDeleteTarget(item)
                            }
                          >
                            <Trash2 size={17} />
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

      {formOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h2>
                {form.id
                  ? 'Editar recomendación'
                  : 'Nueva recomendación'}
              </h2>

              <button
                type="button"
                onClick={closeForm}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >
              <label>
                Obligación asignada *

                <select
                  value={form.assignmentId}
                  disabled={Boolean(form.id)}
                  onChange={(event) =>
                    handleAssignment(
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
                <div className={styles.contextInfo}>
                  <strong>
                    {selectedContext.companyName}
                  </strong>

                  <span>
                    {selectedContext.operationName}
                  </span>

                  <span>
                    {selectedContext.obligationCode}
                    {' — '}
                    {selectedContext.obligationTitle}
                  </span>
                </div>
              )}

              <div className={styles.formGrid}>
                <label>
                  Brecha relacionada

                  <select
                    value={form.gapId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        gapId:
                          event.currentTarget.value,

                        source:
                          event.currentTarget.value
                            ? 'Brecha'
                            : current.source,
                      }))
                    }
                  >
                    <option value="">
                      Sin brecha
                    </option>

                    {selectedContext?.gaps.map(
                      (gap) => (
                        <option
                          key={gap.id}
                          value={gap.id}
                        >
                          {gap.title}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Observación relacionada

                  <select
                    value={form.observationId}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        observationId:
                          event.currentTarget.value,

                        source:
                          event.currentTarget.value
                            ? 'Observación'
                            : current.source,
                      }))
                    }
                  >
                    <option value="">
                      Sin observación
                    </option>

                    {selectedContext
                      ?.observations.map(
                        (observation) => (
                          <option
                            key={observation.id}
                            value={observation.id}
                          >
                            {observation.title}
                          </option>
                        ),
                      )}
                  </select>
                </label>
              </div>

              <label>
                Título *

                <input
                  value={form.title}
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
                  rows={4}
                  value={form.description}
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
                  Tipo

                  <select
                    value={
                      form.recommendationType
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        recommendationType:
                          event.currentTarget
                            .value as
                            RecommendationType,
                      }))
                    }
                  >
                    {TYPE_OPTIONS.map((type) => (
                      <option
                        key={type}
                        value={type}
                      >
                        {type}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Prioridad

                  <select
                    value={form.priority}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        priority:
                          event.currentTarget
                            .value as
                            RecommendationPriority,
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
                  Estado

                  <select
                    value={form.status}
                    onChange={(event) => {
                      const status =
                        event.currentTarget
                          .value as
                          RecommendationStatus;

                      setForm((current) => ({
                        ...current,
                        status,

                        progress:
                          status ===
                            'Implementada' ||
                          status === 'Verificada'
                            ? 100
                            : current.progress,
                      }));
                    }}
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
                  Responsable

                  <input
                    value={form.responsibleName}
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

                <label>
                  Avance: {form.progress}%

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.progress}
                    disabled={
                      form.status ===
                        'Implementada' ||
                      form.status ===
                        'Verificada'
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        progress:
                          Number(
                            event.currentTarget.value,
                          ),
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Resultado esperado

                <textarea
                  rows={3}
                  value={form.expectedResult}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      expectedResult:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <label>
                Comentario de implementación

                <textarea
                  rows={3}
                  value={
                    form.implementationComment
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      implementationComment:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <label>
                Comentario de verificación

                <textarea
                  rows={3}
                  value={
                    form.verificationComment
                  }
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
                  {formError}
                </div>
              )}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryButton}
                  onClick={closeForm}
                >
                  Cancelar
                </button>

                <PrimaryButton
                  type="submit"
                  disabled={saving}
                >
                  <Save size={17} />

                  {saving
                    ? 'Guardando...'
                    : 'Guardar recomendación'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className={styles.drawerBackdrop}>
          <aside className={styles.drawer}>
            <div className={styles.modalHeader}>
              <h2>{selected.title}</h2>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <Badge value={selected.status} />

              <h3>Descripción</h3>
              <p>
                {selected.description ??
                  selected.text}
              </p>

              <h3>Resultado esperado</h3>
              <p>
                {selected.expectedResult ??
                  'Sin resultado registrado.'}
              </p>

              <h3>Responsable</h3>
              <p>
                {selected.responsibleName ??
                  'No asignado'}
              </p>

              <h3>Avance</h3>
              <p>{selected.progress}%</p>

              <h3>Brecha relacionada</h3>
              <p>
                {selected.gapTitle ??
                  'Sin brecha relacionada.'}
              </p>

              <h3>Observación relacionada</h3>
              <p>
                {selected.observationTitle ??
                  'Sin observación relacionada.'}
              </p>
            </div>

            <div className={styles.modalFooter}>
              <PrimaryButton
                onClick={() =>
                  openEdit(selected)
                }
              >
                <Pencil size={17} />
                Editar
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmModal}>
            <Trash2 size={28} />

            <h2>Eliminar recomendación</h2>

            <p>
              Se eliminará{' '}
              <strong>
                {deleteTarget.title}
              </strong>
              .
            </p>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={styles.deleteButton}
                disabled={deleting}
                onClick={() =>
                  void confirmDelete()
                }
              >
                {deleting
                  ? 'Eliminando...'
                  : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}