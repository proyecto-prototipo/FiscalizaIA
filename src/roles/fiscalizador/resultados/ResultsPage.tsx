import {
  BarChart3,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Eye,
  FileText,
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
  useResults,
} from './useResults';

import type {
  ResultComplianceStatus,
  ResultContext,
  ResultFormValues,
  ResultItem,
  ResultRiskLevel,
  ResultStatus,
} from './results.types';

import styles from './ResultsPage.module.css';

const COMPLIANCE_OPTIONS:
ResultComplianceStatus[] = [
  'Pendiente',
  'Cumple',
  'Cumple parcialmente',
  'No cumple',
  'No aplica',
];

const RISK_OPTIONS:
ResultRiskLevel[] = [
  'Bajo',
  'Medio',
  'Alto',
  'Crítico',
  'No determinado',
];

const STATUS_OPTIONS:
ResultStatus[] = [
  'Borrador',
  'Finalizado',
  'Reabierto',
];

const EMPTY_FORM:
ResultFormValues = {
  assignmentId: '',
  evaluationId: '',

  complianceStatus: 'Pendiente',
  riskLevel: 'No determinado',
  score: 0,

  conclusion: '',
  executiveSummary: '',

  strengthsText: '',
  findingsText: '',
  pendingActionsText: '',

  status: 'Borrador',
};

function createFormFromContext(
  context: ResultContext,
): ResultFormValues {
  return {
    ...EMPTY_FORM,

    assignmentId:
      context.assignmentId,

    evaluationId:
      context.evaluationId ?? '',

    complianceStatus:
      (
        context.evaluationComplianceStatus as
          ResultComplianceStatus
      ) ?? 'Pendiente',

    riskLevel:
      (
        context.evaluationRiskLevel as
          ResultRiskLevel
      ) ?? 'No determinado',

    score:
      context.evaluationScore ?? 0,

    executiveSummary:
      `La obligación presenta ${context.gapsCount} brecha(s), ${context.observationsCount} observación(es) y ${context.recommendationsCount} recomendación(es).`,
  };
}

function createFormFromItem(
  item: ResultItem,
): ResultFormValues {
  return {
    id: item.id,

    assignmentId:
      item.assignmentId,

    evaluationId:
      item.evaluationId ?? '',

    complianceStatus:
      item.complianceStatus,

    riskLevel:
      item.riskLevel,

    score:
      item.score,

    conclusion:
      item.conclusion ?? '',

    executiveSummary:
      item.executiveSummary ?? '',

    strengthsText:
      item.strengths.join('\n'),

    findingsText:
      item.findings.join('\n'),

    pendingActionsText:
      item.pendingActions.join('\n'),

    status:
      item.status,
  };
}

export default function ResultsPage() {
  const {
    contexts,
    filteredResults,

    companies,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    deleting,

    error,

    loadData,
    submitResult,
    deleteResult,
    updateFilter,

    clearFilters,
    clearError,
  } = useResults();

  const [
    selected,
    setSelected,
  ] = useState<ResultItem | null>(null);

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<ResultFormValues>({
    ...EMPTY_FORM,
  });

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<ResultItem | null>(null);

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
    context?: ResultContext,
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
    item: ResultItem,
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

      await submitResult(form);

      closeForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar el resultado.',
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteResult(
        deleteTarget.id,
      );

      setDeleteTarget(null);
    } catch {
      // Error mostrado desde el hook.
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Resultados"
        description="Consolida el resultado final de cumplimiento por cada obligación evaluada."
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
            >
              <RefreshCw size={17} />
              Actualizar
            </button>

            <PrimaryButton
              onClick={() => openNew()}
            >
              <Plus size={17} />
              Nuevo resultado
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
          <ClipboardCheck size={22} />
          <span>Total</span>
          <strong>{summary.total}</strong>
        </article>

        <article className={styles.summaryCard}>
          <FileText size={22} />
          <span>Borradores</span>
          <strong>{summary.drafts}</strong>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={22} />
          <span>Finalizados</span>
          <strong>{summary.finalized}</strong>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={22} />
          <span>Cumplen</span>
          <strong>{summary.compliant}</strong>
        </article>

        <article className={styles.summaryCard}>
          <BarChart3 size={22} />
          <span>Cumplimiento parcial</span>
          <strong>{summary.partial}</strong>
        </article>

        <article className={styles.summaryCard}>
          <CircleAlert size={22} />
          <span>No cumplen</span>
          <strong>
            {summary.nonCompliant}
          </strong>
        </article>

        <article className={styles.summaryCard}>
          <ShieldAlert size={22} />
          <span>Riesgo crítico</span>
          <strong>
            {summary.criticalRisk}
          </strong>
        </article>

        <article className={styles.summaryCard}>
          <BarChart3 size={22} />
          <span>Puntaje promedio</span>
          <strong>
            {summary.averageScore}
          </strong>
        </article>
      </section>

      <Panel>
        <div className={styles.sectionHeader}>
          <h2>
            Obligaciones disponibles
          </h2>

          <p>
            Consolida el resultado de una obligación
            a partir de evaluaciones, brechas,
            observaciones y recomendaciones.
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

                  <div className={styles.contextCounts}>
                    <span>
                      Brechas: {context.gapsCount}
                    </span>

                    <span>
                      Observaciones:{' '}
                      {context.observationsCount}
                    </span>

                    <span>
                      Recomendaciones:{' '}
                      {context.recommendationsCount}
                    </span>
                  </div>

                  <PrimaryButton
                    onClick={() =>
                      openNew(context)
                    }
                  >
                    <Plus size={16} />
                    Generar resultado
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
              placeholder="Buscar resultado, empresa u obligación"
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
                event.currentTarget.value as
                  | ResultComplianceStatus
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
                event.currentTarget.value as
                  | ResultRiskLevel
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
                  | ResultStatus
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

          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>

        {filteredResults.length === 0 ? (
          <div className={styles.emptyState}>
            <ClipboardCheck size={44} />

            <h3>
              No existen resultados
            </h3>

            <p>
              Genera un resultado para comenzar
              la consolidación del cumplimiento.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Empresa y operación</th>
                  <th>Obligación</th>
                  <th>Cumplimiento</th>
                  <th>Riesgo</th>
                  <th>Puntaje</th>
                  <th>Brechas</th>
                  <th>Observaciones</th>
                  <th>Recomendaciones</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredResults.map(
                  (item) => (
                    <tr key={item.id}>
                      <td>
                        <strong>
                          {item.companyName}
                        </strong>

                        <small>
                          {item.operationName}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {item.obligationCode}
                        </strong>

                        <small>
                          {item.obligationTitle}
                        </small>
                      </td>

                      <td>
                        <Badge
                          value={
                            item.complianceStatus
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={item.riskLevel}
                        />
                      </td>

                      <td>
                        <strong>
                          {item.score}/100
                        </strong>
                      </td>

                      <td>{item.gapsCount}</td>

                      <td>
                        {item.observationsCount}
                      </td>

                      <td>
                        {item.recommendationsCount}
                      </td>

                      <td>
                        <Badge
                          value={item.status}
                        />
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
                  ? 'Editar resultado'
                  : 'Nuevo resultado'}
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

                  <div className={styles.contextCounts}>
                    <span>
                      Brechas:{' '}
                      {selectedContext.gapsCount}
                    </span>

                    <span>
                      Observaciones:{' '}
                      {selectedContext.observationsCount}
                    </span>

                    <span>
                      Recomendaciones:{' '}
                      {selectedContext.recommendationsCount}
                    </span>
                  </div>
                </div>
              )}

              <div className={styles.formGrid}>
                <label>
                  Cumplimiento

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
                            ResultComplianceStatus,
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
                  Riesgo

                  <select
                    value={form.riskLevel}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        riskLevel:
                          event.currentTarget
                            .value as
                            ResultRiskLevel,
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
                  Estado

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        status:
                          event.currentTarget
                            .value as
                            ResultStatus,
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
                  Puntaje: {form.score}/100

                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={form.score}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        score:
                          Number(
                            event.currentTarget.value,
                          ),
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Resumen ejecutivo

                <textarea
                  rows={4}
                  value={
                    form.executiveSummary
                  }
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      executiveSummary:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <label>
                Conclusión

                <textarea
                  rows={4}
                  value={form.conclusion}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      conclusion:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              <div className={styles.formGrid}>
                <label>
                  Fortalezas

                  <textarea
                    rows={6}
                    value={form.strengthsText}
                    placeholder="Escribe una fortaleza por línea"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        strengthsText:
                          event.currentTarget.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Hallazgos

                  <textarea
                    rows={6}
                    value={form.findingsText}
                    placeholder="Escribe un hallazgo por línea"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        findingsText:
                          event.currentTarget.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Acciones pendientes

                  <textarea
                    rows={6}
                    value={
                      form.pendingActionsText
                    }
                    placeholder="Escribe una acción por línea"
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        pendingActionsText:
                          event.currentTarget.value,
                      }))
                    }
                  />
                </label>
              </div>

              {formError && (
                <div className={styles.formError}>
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
                    : 'Guardar resultado'}
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
              <h2>
                {selected.obligationCode}
                {' — '}
                {selected.obligationTitle}
              </h2>

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
              <div className={styles.badges}>
                <Badge
                  value={
                    selected.complianceStatus
                  }
                />

                <Badge
                  value={selected.riskLevel}
                />

                <Badge
                  value={selected.status}
                />
              </div>

              <div className={styles.scoreBox}>
                <span>Puntaje final</span>
                <strong>
                  {selected.score}/100
                </strong>
              </div>

              <h3>Resumen ejecutivo</h3>
              <p>
                {selected.executiveSummary ??
                  'Sin resumen registrado.'}
              </p>

              <h3>Conclusión</h3>
              <p>
                {selected.conclusion ??
                  'Sin conclusión registrada.'}
              </p>

              <h3>Fortalezas</h3>
              <ul>
                {selected.strengths.map(
                  (item) => (
                    <li key={item}>
                      {item}
                    </li>
                  ),
                )}
              </ul>

              <h3>Hallazgos</h3>
              <ul>
                {selected.findings.map(
                  (item) => (
                    <li key={item}>
                      {item}
                    </li>
                  ),
                )}
              </ul>

              <h3>Acciones pendientes</h3>
              <ul>
                {selected.pendingActions.map(
                  (item) => (
                    <li key={item}>
                      {item}
                    </li>
                  ),
                )}
              </ul>
            </div>

            <div className={styles.modalFooter}>
              <PrimaryButton
                onClick={() =>
                  openEdit(selected)
                }
              >
                <Pencil size={17} />
                Editar resultado
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}

      {deleteTarget && (
        <div className={styles.modalBackdrop}>
          <div className={styles.confirmModal}>
            <Trash2 size={28} />

            <h2>Eliminar resultado</h2>

            <p>
              Se eliminará el resultado de{' '}
              <strong>
                {deleteTarget.obligationCode}
              </strong>
              .
            </p>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setDeleteTarget(null)
                }
              >
                Cancelar
              </button>

              <button
                type="button"
                className={
                  styles.deleteButton
                }
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