import {
  Archive,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Eye,
  FileText,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Send,
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
  useReports,
} from './useReports';

import type {
  ReportComplianceLevel,
  ReportContext,
  ReportFormValues,
  ReportItem,
  ReportStatus,
  ReportType,
} from './reports.types';

import styles from './ReportsPage.module.css';

const TYPE_OPTIONS:
ReportType[] = [
  'Ejecutivo',
  'Cumplimiento',
  'Brechas y riesgos',
  'Seguimiento',
];

const STATUS_OPTIONS:
ReportStatus[] = [
  'Borrador',
  'Generado',
  'Emitido',
  'Archivado',
];

const COMPLIANCE_OPTIONS:
ReportComplianceLevel[] = [
  'Pendiente',
  'Cumple',
  'Cumple parcialmente',
  'No cumple',
  'No aplica',
];

const EMPTY_FORM:
ReportFormValues = {
  companyId: '',
  operationId: '',

  title: '',
  reportType: 'Cumplimiento',

  periodStart: '',
  periodEnd: '',

  status: 'Borrador',

  executiveSummary: '',
  conclusions: '',
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
    new Date(
      `${value}T12:00:00`,
    ),
  );
}

function createFormFromContext(
  context: ReportContext,
): ReportFormValues {
  const currentDate =
    new Date()
      .toISOString()
      .slice(0, 10);

  const monthStart =
    `${currentDate.slice(0, 8)}01`;

  return {
    ...EMPTY_FORM,

    companyId:
      context.companyId,

    operationId:
      context.operationId,

    title:
      `Reporte de cumplimiento - ${context.operationName}`,

    periodStart:
      monthStart,

    periodEnd:
      currentDate,

    executiveSummary:
      `La operación registra ${context.totalResults} resultado(s), ${context.gapsCount} brecha(s), ${context.observationsCount} observación(es) y ${context.recommendationsCount} recomendación(es). El puntaje promedio de cumplimiento es ${context.averageScore}/100.`,

    conclusions:
      context.complianceLevel ===
      'Cumple'
        ? 'La operación presenta un nivel favorable de cumplimiento. Se recomienda mantener los controles y el seguimiento periódico.'
        : context.complianceLevel ===
          'Cumple parcialmente'
          ? 'La operación presenta avances, pero mantiene acciones pendientes que requieren seguimiento.'
          : context.complianceLevel ===
            'No cumple'
            ? 'La operación requiere implementar acciones correctivas prioritarias.'
            : 'Todavía no existe información suficiente para emitir una conclusión definitiva.',
  };
}

function createFormFromItem(
  item: ReportItem,
): ReportFormValues {
  return {
    id:
      item.id,

    companyId:
      item.companyId,

    operationId:
      item.operationId ?? '',

    title:
      item.title,

    reportType:
      item.reportType,

    periodStart:
      item.periodStart ?? '',

    periodEnd:
      item.periodEnd ?? '',

    status:
      item.status,

    executiveSummary:
      item.executiveSummary ?? '',

    conclusions:
      item.conclusions ?? '',
  };
}

export default function ReportsPage() {
  const {
    contexts,
    filteredReports,

    companies,
    filteredOperations,

    filters,
    summary,

    loading,
    saving,
    deleting,

    error,

    loadData,
    submitReport,
    deleteReport,
    updateFilter,

    clearFilters,
    clearError,
  } = useReports();

  const [
    selected,
    setSelected,
  ] = useState<ReportItem | null>(
    null,
  );

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    form,
    setForm,
  ] = useState<ReportFormValues>({
    ...EMPTY_FORM,
  });

  const [
    formError,
    setFormError,
  ] = useState('');

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState<ReportItem | null>(
    null,
  );

  const selectedContext =
    useMemo(
      () =>
        contexts.find(
          (context) =>
            context.operationId ===
            form.operationId,
        ),
      [
        contexts,
        form.operationId,
      ],
    );

  const availableOperations =
    useMemo(() => {
      if (!form.companyId) {
        return contexts;
      }

      return contexts.filter(
        (context) =>
          context.companyId ===
          form.companyId,
      );
    }, [
      contexts,
      form.companyId,
    ]);

  function openNew(
    context?: ReportContext,
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
    item: ReportItem,
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

  function handleOperation(
    operationId: string,
  ) {
    const context =
      contexts.find(
        (item) =>
          item.operationId ===
          operationId,
      );

    setForm(
      context
        ? createFormFromContext(
            context,
          )
        : {
            ...EMPTY_FORM,
            companyId:
              form.companyId,
            operationId,
          },
    );
  }

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    try {
      setFormError('');

      await submitReport(form);

      closeForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar el reporte.',
      );
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteReport(
        deleteTarget.id,
      );

      setDeleteTarget(null);
      setSelected(null);
    } catch {
      // El error se muestra desde el hook.
    }
  }

  function printReport(
    report: ReportItem,
  ) {
    setSelected(report);

    window.setTimeout(() => {
      window.print();
    }, 100);
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Reportes"
        description="Genera y administra reportes consolidados de cumplimiento, brechas, observaciones y recomendaciones."
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
              Nuevo reporte
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
          <FileText size={22} />
          <span>Total</span>
          <strong>{summary.total}</strong>
        </article>

        <article className={styles.summaryCard}>
          <Pencil size={22} />
          <span>Borradores</span>
          <strong>{summary.drafts}</strong>
        </article>

        <article className={styles.summaryCard}>
          <BarChart3 size={22} />
          <span>Generados</span>
          <strong>{summary.generated}</strong>
        </article>

        <article className={styles.summaryCard}>
          <Send size={22} />
          <span>Emitidos</span>
          <strong>{summary.issued}</strong>
        </article>

        <article className={styles.summaryCard}>
          <Archive size={22} />
          <span>Archivados</span>
          <strong>{summary.archived}</strong>
        </article>

        <article className={styles.summaryCard}>
          <CircleAlert size={22} />
          <span>Riesgo crítico</span>
          <strong>{summary.critical}</strong>
        </article>

        <article className={styles.summaryCard}>
          <CheckCircle2 size={22} />
          <span>Puntaje promedio</span>
          <strong>
            {summary.averageScore}
          </strong>
        </article>
      </section>

      <Panel>
        <div className={styles.sectionHeader}>
          <h2>Operaciones disponibles</h2>

          <p>
            Genera un reporte consolidado desde
            una operación minera.
          </p>
        </div>

        {loading ? (
          <div className={styles.emptyState}>
            Cargando operaciones...
          </div>
        ) : contexts.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={44} />

            <h3>
              No existen operaciones disponibles
            </h3>
          </div>
        ) : (
          <div className={styles.contextGrid}>
            {contexts
              .slice(0, 6)
              .map((context) => (
                <article
                  key={context.operationId}
                  className={
                    styles.contextCard
                  }
                >
                  <Badge
                    value={
                      context.complianceLevel
                    }
                  />

                  <h3>
                    {context.operationName}
                  </h3>

                  <p>
                    {context.companyName}
                  </p>

                  <div
                    className={
                      styles.contextMetrics
                    }
                  >
                    <span>
                      Puntaje:{' '}
                      {context.averageScore}
                    </span>

                    <span>
                      Resultados:{' '}
                      {context.totalResults}
                    </span>

                    <span>
                      Brechas:{' '}
                      {context.gapsCount}
                    </span>
                  </div>

                  <PrimaryButton
                    onClick={() =>
                      openNew(context)
                    }
                  >
                    <Plus size={16} />
                    Generar reporte
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
              placeholder="Buscar reporte, empresa u operación"
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
            value={filters.reportType}
            onChange={(event) =>
              updateFilter(
                'reportType',
                event.currentTarget
                  .value as
                  | ReportType
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
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                'status',
                event.currentTarget
                  .value as
                  | ReportStatus
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
            value={
              filters.complianceLevel
            }
            onChange={(event) =>
              updateFilter(
                'complianceLevel',
                event.currentTarget
                  .value as
                  | ReportComplianceLevel
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

        {filteredReports.length === 0 ? (
          <div className={styles.emptyState}>
            <FileText size={44} />

            <h3>
              No existen reportes
            </h3>

            <p>
              Genera un reporte para comenzar
              su administración.
            </p>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Reporte</th>
                  <th>Empresa</th>
                  <th>Operación</th>
                  <th>Tipo</th>
                  <th>Cumplimiento</th>
                  <th>Riesgo</th>
                  <th>Puntaje</th>
                  <th>Periodo</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredReports.map(
                  (report) => (
                    <tr key={report.id}>
                      <td>
                        <strong>
                          {report.title}
                        </strong>

                        <small>
                          Resultados:{' '}
                          {report.totalResults}
                        </small>
                      </td>

                      <td>
                        {report.companyName}
                      </td>

                      <td>
                        {report.operationName ??
                          'Todas'}
                      </td>

                      <td>
                        <Badge
                          value={
                            report.reportType
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={
                            report.complianceLevel
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={
                            report.riskLevel
                          }
                        />
                      </td>

                      <td>
                        <strong>
                          {report.overallScore}/100
                        </strong>
                      </td>

                      <td>
                        {formatDate(
                          report.periodStart,
                        )}
                        {' — '}
                        {formatDate(
                          report.periodEnd,
                        )}
                      </td>

                      <td>
                        <Badge
                          value={
                            report.status
                          }
                        />
                      </td>

                      <td>
                        <div
                          className={
                            styles.actions
                          }
                        >
                          <button
                            type="button"
                            title="Ver reporte"
                            onClick={() =>
                              setSelected(
                                report,
                              )
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Imprimir o guardar PDF"
                            onClick={() =>
                              printReport(
                                report,
                              )
                            }
                          >
                            <Printer size={17} />
                          </button>

                          <button
                            type="button"
                            title="Editar reporte"
                            onClick={() =>
                              openEdit(report)
                            }
                          >
                            <Pencil size={17} />
                          </button>

                          <button
                            type="button"
                            title="Eliminar reporte"
                            onClick={() =>
                              setDeleteTarget(
                                report,
                              )
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
                  ? 'Editar reporte'
                  : 'Nuevo reporte'}
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
              <div className={styles.formGrid}>
                <label>
                  Empresa *

                  <select
                    value={form.companyId}
                    disabled={Boolean(form.id)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        companyId:
                          event.currentTarget.value,

                        operationId: '',
                      }))
                    }
                  >
                    <option value="">
                      Selecciona una empresa
                    </option>

                    {companies.map(
                      (company) => (
                        <option
                          key={company.id}
                          value={company.id}
                        >
                          {company.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Operación *

                  <select
                    value={form.operationId}
                    disabled={Boolean(form.id)}
                    onChange={(event) =>
                      handleOperation(
                        event.currentTarget.value,
                      )
                    }
                  >
                    <option value="">
                      Selecciona una operación
                    </option>

                    {availableOperations.map(
                      (context) => (
                        <option
                          key={
                            context.operationId
                          }
                          value={
                            context.operationId
                          }
                        >
                          {
                            context.operationName
                          }
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>

              {selectedContext && (
                <div
                  className={
                    styles.contextInfo
                  }
                >
                  <strong>
                    {
                      selectedContext
                        .companyName
                    }
                  </strong>

                  <span>
                    {
                      selectedContext
                        .operationName
                    }
                  </span>

                  <div
                    className={
                      styles.contextMetrics
                    }
                  >
                    <span>
                      Puntaje:{' '}
                      {
                        selectedContext
                          .averageScore
                      }
                    </span>

                    <span>
                      Cumplimiento:{' '}
                      {
                        selectedContext
                          .complianceLevel
                      }
                    </span>

                    <span>
                      Riesgo:{' '}
                      {
                        selectedContext
                          .riskLevel
                      }
                    </span>
                  </div>
                </div>
              )}

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

              <div className={styles.formGrid}>
                <label>
                  Tipo de reporte

                  <select
                    value={form.reportType}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        reportType:
                          event.currentTarget
                            .value as
                            ReportType,
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
                  Estado

                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        status:
                          event.currentTarget
                            .value as
                            ReportStatus,
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
                  Fecha inicial

                  <input
                    type="date"
                    value={form.periodStart}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        periodStart:
                          event.currentTarget.value,
                      }))
                    }
                  />
                </label>

                <label>
                  Fecha final

                  <input
                    type="date"
                    value={form.periodEnd}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,

                        periodEnd:
                          event.currentTarget.value,
                      }))
                    }
                  />
                </label>
              </div>

              <label>
                Resumen ejecutivo

                <textarea
                  rows={5}
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
                Conclusiones

                <textarea
                  rows={5}
                  value={form.conclusions}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,

                      conclusions:
                        event.currentTarget.value,
                    }))
                  }
                />
              </label>

              {formError && (
                <div
                  className={
                    styles.formError
                  }
                >
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
                    : 'Guardar reporte'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div
          className={
            styles.drawerBackdrop
          }
        >
          <aside className={styles.drawer}>
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span
                  className={
                    styles.reportLabel
                  }
                >
                  FiscalizaIA Minera
                </span>

                <h2>
                  {selected.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelected(null)
                }
              >
                <X size={20} />
              </button>
            </div>

            <div
              className={
                styles.reportDocument
              }
            >
              <header
                className={
                  styles.printHeader
                }
              >
                <div
                  className={
                    styles.printLogo
                  }
                >
                  FI
                </div>

                <div>
                  <strong>
                    FiscalizaIA Minera
                  </strong>

                  <span>
                    Reporte de fiscalización
                    ambiental
                  </span>
                </div>
              </header>

              <div className={styles.badges}>
                <Badge
                  value={
                    selected.reportType
                  }
                />

                <Badge
                  value={
                    selected.status
                  }
                />

                <Badge
                  value={
                    selected.complianceLevel
                  }
                />

                <Badge
                  value={
                    selected.riskLevel
                  }
                />
              </div>

              <dl className={styles.reportInfo}>
                <div>
                  <dt>Empresa</dt>
                  <dd>
                    {selected.companyName}
                  </dd>
                </div>

                <div>
                  <dt>Operación</dt>
                  <dd>
                    {selected.operationName ??
                      'No especificada'}
                  </dd>
                </div>

                <div>
                  <dt>Periodo</dt>
                  <dd>
                    {formatDate(
                      selected.periodStart,
                    )}
                    {' — '}
                    {formatDate(
                      selected.periodEnd,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Puntaje</dt>
                  <dd>
                    {selected.overallScore}
                    /100
                  </dd>
                </div>
              </dl>

              <section
                className={
                  styles.reportSection
                }
              >
                <h3>
                  Resumen ejecutivo
                </h3>

                <p>
                  {selected.executiveSummary ??
                    'Sin resumen ejecutivo.'}
                </p>
              </section>

              <section
                className={
                  styles.reportMetricsGrid
                }
              >
                <article>
                  <span>Resultados</span>
                  <strong>
                    {selected.totalResults}
                  </strong>
                </article>

                <article>
                  <span>Cumplen</span>
                  <strong>
                    {
                      selected
                        .compliantCount
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Cumplimiento parcial
                  </span>
                  <strong>
                    {selected.partialCount}
                  </strong>
                </article>

                <article>
                  <span>No cumplen</span>
                  <strong>
                    {
                      selected
                        .nonCompliantCount
                    }
                  </strong>
                </article>

                <article>
                  <span>Brechas</span>
                  <strong>
                    {selected.gapsCount}
                  </strong>
                </article>

                <article>
                  <span>Observaciones</span>
                  <strong>
                    {
                      selected
                        .observationsCount
                    }
                  </strong>
                </article>

                <article>
                  <span>
                    Recomendaciones
                  </span>
                  <strong>
                    {
                      selected
                        .recommendationsCount
                    }
                  </strong>
                </article>
              </section>

              <section
                className={
                  styles.reportSection
                }
              >
                <h3>
                  Resultados por obligación
                </h3>

                {selected
                  .resultsSnapshot.length ===
                0 ? (
                  <p>
                    No existen resultados
                    asociados.
                  </p>
                ) : (
                  <div
                    className={
                      styles.resultsList
                    }
                  >
                    {selected
                      .resultsSnapshot
                      .map(
                        (
                          result,
                          index,
                        ) => (
                          <article
                            key={`${result.obligation_code}-${index}`}
                          >
                            <div>
                              <strong>
                                {
                                  result.obligation_code
                                }
                              </strong>

                              <span>
                                {
                                  result.obligation_title
                                }
                              </span>
                            </div>

                            <div>
                              <Badge
                                value={
                                  result.compliance_status ??
                                  'Pendiente'
                                }
                              />

                              <strong>
                                {result.score ??
                                  0}
                                /100
                              </strong>
                            </div>

                            {result.conclusion && (
                              <p>
                                {
                                  result.conclusion
                                }
                              </p>
                            )}
                          </article>
                        ),
                      )}
                  </div>
                )}
              </section>

              <section
                className={
                  styles.reportSection
                }
              >
                <h3>Conclusiones</h3>

                <p>
                  {selected.conclusions ??
                    'Sin conclusiones registradas.'}
                </p>
              </section>

              <footer
                className={
                  styles.printFooter
                }
              >
                <span>
                  Generado por FiscalizaIA
                  Minera
                </span>

                <span>
                  Fecha:{' '}
                  {formatDate(
                    selected.createdAt.slice(
                      0,
                      10,
                    ),
                  )}
                </span>
              </footer>
            </div>

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
                onClick={() =>
                  window.print()
                }
              >
                <Printer size={17} />
                Imprimir / Guardar PDF
              </button>

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
          <div
            className={
              styles.confirmModal
            }
          >
            <Trash2 size={28} />

            <h2>Eliminar reporte</h2>

            <p>
              Se eliminará{' '}
              <strong>
                {deleteTarget.title}
              </strong>
              .
            </p>

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