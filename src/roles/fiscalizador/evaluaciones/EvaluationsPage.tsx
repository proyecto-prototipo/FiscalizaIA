import {
  AlertTriangle,
  BrainCircuit,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Eye,
  FileCheck2,
  Pencil,
  RefreshCw,
  Save,
  Search,
  ShieldAlert,
  ShieldCheck,
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

import type {
  EvaluationComplianceStatus,
  EvaluationFormValues,
  EvaluationItem,
  EvaluationRiskLevel,
} from './evaluations.types';

import {
  useEvaluations,
} from './useEvaluations';

import styles from './EvaluationsPage.module.css';

const COMPLIANCE_OPTIONS:
EvaluationComplianceStatus[] = [
  'Pendiente',
  'Cumple',
  'Cumple parcialmente',
  'No cumple',
  'No determinado',
];

const RISK_OPTIONS:
EvaluationRiskLevel[] = [
  'Pendiente',
  'Bajo',
  'Medio',
  'Alto',
  'Crítico',
  'No determinado',
];

const EMPTY_FORM:
EvaluationFormValues = {
  assignmentId: '',
  evidenceId: '',
  aiAnalysisId: '',

  complianceStatus:
    'Pendiente',

  riskLevel:
    'Pendiente',

  score: 0,

  evaluationComment: '',
  correctiveAction: '',

  validated: false,
};

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

function createFormFromItem(
  item: EvaluationItem,
): EvaluationFormValues {
  const evaluation =
    item.evaluation;

  return {
    assignmentId:
      item.assignmentId,

    evidenceId:
      evaluation?.evidenceId ??
      item.latestEvidence?.id ??
      '',

    aiAnalysisId:
      evaluation?.aiAnalysisId ??
      item.latestAiAnalysis?.id ??
      '',

    complianceStatus:
      evaluation
        ?.complianceStatus ??
      item.latestAiAnalysis
        ?.complianceStatus ??
      'Pendiente',

    riskLevel:
      evaluation?.riskLevel ??
      item.latestAiAnalysis
        ?.riskLevel ??
      'Pendiente',

    score:
      evaluation?.score ??
      Math.round(
        item.latestAiAnalysis
          ?.confidence ?? 0,
      ),

    evaluationComment:
      evaluation
        ?.evaluationComment ??
      '',

    correctiveAction:
      evaluation
        ?.correctiveAction ??
      '',

    validated:
      evaluation?.validated ??
      false,
  };
}

export default function EvaluationsPage() {
  const {
    filteredItems,

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
    submitEvaluation,
    deleteEvaluation,
    openEvidence,
    updateFilter,
    clearFilters,
    clearError,
  } = useEvaluations();

  const [
    selectedItem,
    setSelectedItem,
  ] = useState<EvaluationItem | null>(
    null,
  );

  const [
    editingItem,
    setEditingItem,
  ] = useState<EvaluationItem | null>(
    null,
  );

  const [
    form,
    setForm,
  ] = useState<EvaluationFormValues>(
    EMPTY_FORM,
  );

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    deleteItem,
    setDeleteItem,
  ] = useState<EvaluationItem | null>(
    null,
  );

  const resultsLabel =
    useMemo(() => {
      const total =
        filteredItems.length;

      return total === 1
        ? '1 obligación encontrada'
        : `${total} obligaciones encontradas`;
    }, [filteredItems.length]);

  function openEvaluationForm(
    item: EvaluationItem,
  ) {
    setEditingItem(item);
    setForm(
      createFormFromItem(item),
    );
    setFormError('');
    setSelectedItem(null);
  }

  function closeEvaluationForm() {
    if (saving) {
      return;
    }

    setEditingItem(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function handleEvidenceChange(
    evidenceId: string,
  ) {
    if (!editingItem) {
      return;
    }

    const evidence =
      editingItem.evidences.find(
        (item) =>
          item.id === evidenceId,
      );

    const latestAnalysis =
      editingItem.aiAnalyses.find(
        (analysis) =>
          analysis.evidenceId ===
          evidenceId,
      );

    setForm((current) => ({
      ...current,

      evidenceId,

      aiAnalysisId:
        latestAnalysis?.id ?? '',

      complianceStatus:
        latestAnalysis
          ?.complianceStatus ??
        current.complianceStatus,

      riskLevel:
        latestAnalysis?.riskLevel ??
        current.riskLevel,

      score:
        latestAnalysis
          ?.confidence === undefined
          ? current.score
          : Math.round(
              latestAnalysis.confidence,
            ),
    }));

    if (!evidenceId || !evidence) {
      setForm((current) => ({
        ...current,
        aiAnalysisId: '',
      }));
    }
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!editingItem) {
      return;
    }

    if (
      form.score < 0 ||
      form.score > 100
    ) {
      setFormError(
        'El puntaje debe estar entre 0 y 100.',
      );

      return;
    }

    if (
      form.validated &&
      (
        form.complianceStatus ===
          'Pendiente' ||
        form.riskLevel ===
          'Pendiente'
      )
    ) {
      setFormError(
        'Selecciona el cumplimiento y el nivel de riesgo antes de validar.',
      );

      return;
    }

    try {
      setFormError('');

      await submitEvaluation(
        form,
      );

      closeEvaluationForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la evaluación.',
      );
    }
  }

  async function confirmDelete() {
    if (!deleteItem?.evaluation) {
      return;
    }

    try {
      await deleteEvaluation(
        deleteItem.evaluation.id,
      );

      setDeleteItem(null);
      setSelectedItem(null);
    } catch {
      // El hook muestra el mensaje.
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Evaluaciones"
        description="Evalúa el cumplimiento de cada obligación, relacionando evidencias, resultados de IA, riesgo y validación del fiscalizador."
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
          <ClipboardCheck size={23} />

          <div>
            <span>
              Obligaciones totales
            </span>

            <strong>
              {summary.total}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <RefreshCw size={23} />

          <div>
            <span>
              Pendientes de evaluar
            </span>

            <strong>
              {summary.pending}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={23} />

          <div>
            <span>
              Evaluadas
            </span>

            <strong>
              {summary.evaluated}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <ShieldCheck size={23} />

          <div>
            <span>
              Validadas
            </span>

            <strong>
              {summary.validated}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <AlertTriangle size={23} />

          <div>
            <span>
              No cumplen
            </span>

            <strong>
              {summary.nonCompliant}
            </strong>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <ShieldAlert size={23} />

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
          <BrainCircuit size={23} />

          <div>
            <span>
              Puntaje promedio
            </span>

            <strong>
              {Math.round(
                summary.averageScore,
              )}
            </strong>
          </div>
        </article>
      </section>

      <Panel>
        <div className={styles.filters}>
          <div className={styles.searchField}>
            <Search size={18} />

            <input
              value={filters.search}
              placeholder="Buscar empresa, operación, obligación o comentario"
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
              filters.complianceStatus
            }
            onChange={(event) =>
              updateFilter(
                'complianceStatus',
                event.currentTarget
                  .value as
                  | EvaluationComplianceStatus
                  | '',
              )
            }
          >
            <option value="">
              Todos los cumplimientos
            </option>

            {COMPLIANCE_OPTIONS.map(
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
                  | EvaluationRiskLevel
                  | '',
              )
            }
          >
            <option value="">
              Todos los riesgos
            </option>

            {RISK_OPTIONS.map(
              (risk) => (
                <option
                  key={risk}
                  value={risk}
                >
                  {risk}
                </option>
              ),
            )}
          </select>

          <select
            value={
              filters.validationStatus
            }
            onChange={(event) =>
              updateFilter(
                'validationStatus',
                event.currentTarget
                  .value as
                  | ''
                  | 'Pendiente'
                  | 'Validada',
              )
            }
          >
            <option value="">
              Todas las validaciones
            </option>

            <option value="Pendiente">
              Pendiente
            </option>

            <option value="Validada">
              Validada
            </option>
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
              Evaluación por obligación
            </h2>

            <span>
              {resultsLabel}
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
              Cargando evaluaciones...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardCheck size={44} />

            <h3>
              No existen obligaciones para evaluar
            </h3>

            <p>
              Las obligaciones asignadas aparecerán en este módulo.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Operación</th>
                  <th>Obligación</th>
                  <th>Evidencia</th>
                  <th>Cumplimiento</th>
                  <th>Riesgo</th>
                  <th>Puntaje</th>
                  <th>Validación</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {filteredItems.map(
                  (item) => (
                    <tr
                      key={
                        item.assignmentId
                      }
                    >
                      <td>
                        {item.companyName}
                      </td>

                      <td>
                        <div className={styles.mainCell}>
                          <strong>
                            {item.operationName}
                          </strong>

                          <span>
                            {item.operationCode ??
                              'Sin código'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div className={styles.mainCell}>
                          <strong>
                            {item.obligationCode}
                          </strong>

                          <span>
                            {item.obligationTitle}
                          </span>
                        </div>
                      </td>

                      <td>
                        {item.latestEvidence ? (
                          <div className={styles.mainCell}>
                            <strong>
                              {
                                item.latestEvidence
                                  .fileName
                              }
                            </strong>

                            <span>
                              Versión{' '}
                              {
                                item.latestEvidence
                                  .version
                              }
                            </span>
                          </div>
                        ) : (
                          <Badge value="Pendiente" />
                        )}
                      </td>

                      <td>
                        <Badge
                          value={
                            item.evaluation
                              ?.complianceStatus ??
                            'Pendiente'
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={
                            item.evaluation
                              ?.riskLevel ??
                            'Pendiente'
                          }
                        />
                      </td>

                      <td>
                        {item.evaluation
                          ? `${Math.round(
                              item.evaluation
                                .score,
                            )}/100`
                          : '—'}
                      </td>

                      <td>
                        <Badge
                          value={
                            item.evaluation
                              ?.validated
                              ? 'Validada'
                              : 'Pendiente'
                          }
                        />
                      </td>

                      <td>
                        <div className={styles.rowActions}>
                          <button
                            type="button"
                            title="Ver detalle"
                            onClick={() =>
                              setSelectedItem(
                                item,
                              )
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title={
                              item.evaluation
                                ? 'Editar evaluación'
                                : 'Registrar evaluación'
                            }
                            onClick={() =>
                              openEvaluationForm(
                                item,
                              )
                            }
                          >
                            <Pencil size={17} />
                          </button>

                          {item.latestEvidence && (
                            <button
                              type="button"
                              title="Abrir evidencia"
                              disabled={
                                openingEvidenceId ===
                                item.latestEvidence.id
                              }
                              onClick={() =>
                                void openEvidence(
                                  item.latestEvidence!
                                    .id,

                                  item.latestEvidence!
                                    .storagePath,
                                )
                              }
                            >
                              <FileCheck2
                                size={17}
                              />
                            </button>
                          )}

                          {item.evaluation && (
                            <button
                              type="button"
                              title="Eliminar evaluación"
                              className={
                                styles.dangerButton
                              }
                              onClick={() =>
                                setDeleteItem(
                                  item,
                                )
                              }
                            >
                              <Trash2 size={17} />
                            </button>
                          )}
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

      {selectedItem && (
        <div className={styles.drawerBackdrop}>
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <span>
                  Detalle de evaluación
                </span>

                <h2>
                  {selectedItem.obligationCode}
                  {' — '}
                  {selectedItem.obligationTitle}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedItem(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div className={styles.badges}>
                <Badge
                  value={
                    selectedItem.criticality
                  }
                />

                <Badge
                  value={
                    selectedItem.evaluation
                      ?.complianceStatus ??
                    'Pendiente'
                  }
                />

                <Badge
                  value={
                    selectedItem.evaluation
                      ?.riskLevel ??
                    'Pendiente'
                  }
                />
              </div>

              <dl className={styles.detailList}>
                <div>
                  <dt>Empresa</dt>
                  <dd>
                    {selectedItem.companyName}
                  </dd>
                </div>

                <div>
                  <dt>Operación</dt>
                  <dd>
                    {selectedItem.operationName}
                  </dd>
                </div>

                <div>
                  <dt>Categoría</dt>
                  <dd>
                    {selectedItem.category}
                  </dd>
                </div>

                <div>
                  <dt>
                    Evidencia requerida
                  </dt>
                  <dd>
                    {
                      selectedItem
                        .requiredEvidence
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Evidencia seleccionada
                  </dt>
                  <dd>
                    {selectedItem.evaluation
                      ?.evidenceId
                      ? selectedItem.evidences
                          .find(
                            (evidence) =>
                              evidence.id ===
                              selectedItem
                                .evaluation
                                ?.evidenceId,
                          )
                          ?.fileName ??
                        'Archivo no disponible'
                      : 'Sin evidencia seleccionada'}
                  </dd>
                </div>

                <div>
                  <dt>Puntaje</dt>
                  <dd>
                    {selectedItem.evaluation
                      ? `${selectedItem.evaluation.score}/100`
                      : 'Sin evaluación'}
                  </dd>
                </div>

                <div>
                  <dt>
                    Comentario del fiscalizador
                  </dt>
                  <dd>
                    {selectedItem.evaluation
                      ?.evaluationComment ??
                      'Sin comentario registrado.'}
                  </dd>
                </div>

                <div>
                  <dt>
                    Acción correctiva
                  </dt>
                  <dd>
                    {selectedItem.evaluation
                      ?.correctiveAction ??
                      'Sin acción correctiva registrada.'}
                  </dd>
                </div>

                <div>
                  <dt>
                    Estado de validación
                  </dt>
                  <dd>
                    {selectedItem.evaluation
                      ?.validated
                      ? 'Validada'
                      : 'Pendiente'}
                  </dd>
                </div>

                <div>
                  <dt>
                    Última actualización
                  </dt>
                  <dd>
                    {formatDate(
                      selectedItem.evaluation
                        ?.updatedAt,
                    )}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.drawerFooter}>
              {selectedItem.latestEvidence && (
                <button
                  type="button"
                  className={
                    styles.secondaryButton
                  }
                  onClick={() =>
                    void openEvidence(
                      selectedItem
                        .latestEvidence!.id,

                      selectedItem
                        .latestEvidence!
                        .storagePath,
                    )
                  }
                >
                  <FileCheck2 size={17} />
                  Abrir evidencia
                </button>
              )}

              <PrimaryButton
                onClick={() =>
                  openEvaluationForm(
                    selectedItem,
                  )
                }
              >
                <Pencil size={17} />

                {selectedItem.evaluation
                  ? 'Editar evaluación'
                  : 'Registrar evaluación'}
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}

      {editingItem && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <div>
                <span>
                  Evaluación de cumplimiento
                </span>

                <h2>
                  {editingItem.evaluation
                    ? 'Editar evaluación'
                    : 'Registrar evaluación'}
                </h2>
              </div>

              <button
                type="button"
                onClick={
                  closeEvaluationForm
                }
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={styles.modalForm}
              onSubmit={handleSubmit}
            >
              <div className={styles.formContext}>
                <div>
                  <span>Empresa</span>
                  <strong>
                    {editingItem.companyName}
                  </strong>
                </div>

                <div>
                  <span>Operación</span>
                  <strong>
                    {editingItem.operationName}
                  </strong>
                </div>

                <div>
                  <span>Obligación</span>
                  <strong>
                    {editingItem.obligationCode}
                    {' — '}
                    {editingItem.obligationTitle}
                  </strong>
                </div>
              </div>

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

                  {editingItem.evidences.map(
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
                  value={
                    form.aiAnalysisId
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      aiAnalysisId:
                        event.currentTarget
                          .value,
                    }))
                  }
                >
                  <option value="">
                    Sin análisis IA relacionado
                  </option>

                  {editingItem.aiAnalyses
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
                        {' — '}
                        {
                          analysis
                            .riskLevel
                        }
                      </option>
                    ))}
                </select>
              </label>

              <div className={styles.formGrid}>
                <label>
                  Cumplimiento *

                  <select
                    value={
                      form.complianceStatus
                    }
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        complianceStatus:
                          event.currentTarget
                            .value as
                            EvaluationComplianceStatus,
                      }))
                    }
                  >
                    {COMPLIANCE_OPTIONS.map(
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
                  Nivel de riesgo *

                  <select
                    value={form.riskLevel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        riskLevel:
                          event.currentTarget
                            .value as
                            EvaluationRiskLevel,
                      }))
                    }
                  >
                    {RISK_OPTIONS.map(
                      (risk) => (
                        <option
                          key={risk}
                          value={risk}
                        >
                          {risk}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Puntaje de cumplimiento *

                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={form.score}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        score:
                          Number(
                            event.currentTarget
                              .value,
                          ) || 0,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Comentario de evaluación

                <textarea
                  rows={5}
                  value={
                    form.evaluationComment
                  }
                  placeholder="Describe las conclusiones de la evaluación."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      evaluationComment:
                        event.currentTarget
                          .value,
                    }))
                  }
                />
              </label>

              <label>
                Acción correctiva

                <textarea
                  rows={4}
                  value={
                    form.correctiveAction
                  }
                  placeholder="Indica las medidas que deberá implementar la empresa."
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      correctiveAction:
                        event.currentTarget
                          .value,
                    }))
                  }
                />
              </label>

              <label className={styles.checkField}>
                <input
                  type="checkbox"
                  checked={form.validated}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      validated:
                        event.currentTarget
                          .checked,
                    }))
                  }
                />

                <span>
                  Validar esta evaluación como resultado final del fiscalizador
                </span>
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
                  onClick={
                    closeEvaluationForm
                  }
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
                      Guardar evaluación
                    </>
                  )}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteItem?.evaluation && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmModal}>
            <div className={styles.confirmIcon}>
              <Trash2 size={25} />
            </div>

            <h2>
              Eliminar evaluación
            </h2>

            <p>
              Se eliminará la evaluación de la obligación{' '}
              <strong>
                {deleteItem.obligationCode}
              </strong>
              . La obligación, evidencia y análisis IA no serán eliminados.
            </p>

            <div className={styles.confirmActions}>
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setDeleteItem(null)
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
                  : 'Eliminar evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}