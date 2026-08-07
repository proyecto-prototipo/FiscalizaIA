import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  Edit3,
  Eye,
  FileCheck2,
  Plus,
  RefreshCw,
  Search,
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
  AssignmentFormValues,
  AssignmentStatus,
  CatalogFormValues,
  ObligationAssignment,
  ObligationCriticality,
} from './obligations.types';

import { useObligations } from './useObligations';

import styles from './ObligationsPage.module.css';

/* =========================================================
   OPCIONES
   ========================================================= */

const CRITICALITIES: ObligationCriticality[] = [
  'Baja',
  'Media',
  'Alta',
];

const ASSIGNMENT_STATUSES: AssignmentStatus[] = [
  'Pendiente',
  'En proceso',
  'Con evidencia',
  'Observada',
  'Cumplida',
  'Vencida',
];

/* =========================================================
   FORMULARIOS INICIALES
   ========================================================= */

const EMPTY_CATALOG_FORM: CatalogFormValues = {
  code: '',
  title: '',
  description: '',
  category: '',
  criticality: 'Media',
  requiredEvidence: '',
};

const EMPTY_ASSIGNMENT_FORM: AssignmentFormValues = {
  catalogId: '',
  operationId: '',
  dueDate: '',
  status: 'Pendiente',
  notes: '',
};

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function formatDate(value?: string): string {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function formatDateTime(value?: string): string {
  if (!value) {
    return 'Sin fecha';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatTime(value: Date | null): string {
  if (!value) {
    return 'Pendiente';
  }

  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function ObligationsPage() {
  const {
    catalog,
    filteredAssignments,

    operations,
    filteredOperationOptions,
    companies,

    filters,
    summary,

    loading,
    saving,
    error,
    lastUpdated,

    loadData,
    createCatalogItem,
    createAssignment,
    updateAssignment,

    updateFilter,
    clearFilters,
    clearError,
  } = useObligations();

  const [
    catalogModalOpen,
    setCatalogModalOpen,
  ] = useState(false);

  const [
    assignmentModalOpen,
    setAssignmentModalOpen,
  ] = useState(false);

  const [
    detailAssignment,
    setDetailAssignment,
  ] = useState<ObligationAssignment | null>(
    null,
  );

  const [
    editingAssignment,
    setEditingAssignment,
  ] = useState<ObligationAssignment | null>(
    null,
  );

  const [
    catalogForm,
    setCatalogForm,
  ] = useState<CatalogFormValues>(
    EMPTY_CATALOG_FORM,
  );

  const [
    assignmentForm,
    setAssignmentForm,
  ] = useState<AssignmentFormValues>(
    EMPTY_ASSIGNMENT_FORM,
  );

  const [
    formError,
    setFormError,
  ] = useState('');

  /* =======================================================
     TEXTO DE RESULTADOS
     ======================================================= */

  const resultsLabel = useMemo(() => {
    const total = filteredAssignments.length;

    return total === 1
      ? '1 obligación asignada'
      : `${total} obligaciones asignadas`;
  }, [filteredAssignments.length]);

  /* =======================================================
     CATÁLOGO
     ======================================================= */

  function openCatalogModal() {
    clearError();
    setFormError('');
    setCatalogForm(EMPTY_CATALOG_FORM);
    setCatalogModalOpen(true);
  }

  function closeCatalogModal() {
    if (saving) {
      return;
    }

    setCatalogModalOpen(false);
    setCatalogForm(EMPTY_CATALOG_FORM);
    setFormError('');
  }

  async function handleCatalogSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!catalogForm.code.trim()) {
      setFormError(
        'Ingresa el código de la obligación.',
      );
      return;
    }

    if (!catalogForm.title.trim()) {
      setFormError(
        'Ingresa el nombre de la obligación.',
      );
      return;
    }

    if (!catalogForm.category.trim()) {
      setFormError(
        'Ingresa la categoría.',
      );
      return;
    }

    if (
      !catalogForm.requiredEvidence.trim()
    ) {
      setFormError(
        'Ingresa la evidencia requerida.',
      );
      return;
    }

    try {
      setFormError('');

      await createCatalogItem(
        catalogForm,
      );

      closeCatalogModal();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo registrar la obligación.',
      );
    }
  }

  /* =======================================================
     ASIGNACIÓN
     ======================================================= */

  function openCreateAssignment() {
    clearError();
    setFormError('');
    setEditingAssignment(null);
    setAssignmentForm(
      EMPTY_ASSIGNMENT_FORM,
    );
    setAssignmentModalOpen(true);
  }

  function openEditAssignment(
    assignment: ObligationAssignment,
  ) {
    clearError();
    setFormError('');

    setEditingAssignment(
      assignment,
    );

    setAssignmentForm({
      catalogId:
        assignment.catalogId,

      operationId:
        assignment.operationId,

      dueDate:
        assignment.dueDate ?? '',

      status:
        assignment.status,

      notes:
        assignment.notes ?? '',
    });

    setDetailAssignment(null);
    setAssignmentModalOpen(true);
  }

  function closeAssignmentModal() {
    if (saving) {
      return;
    }

    setAssignmentModalOpen(false);
    setEditingAssignment(null);
    setAssignmentForm(
      EMPTY_ASSIGNMENT_FORM,
    );
    setFormError('');
  }

  async function handleAssignmentSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!assignmentForm.catalogId) {
      setFormError(
        'Selecciona una obligación.',
      );
      return;
    }

    if (!assignmentForm.operationId) {
      setFormError(
        'Selecciona una operación minera.',
      );
      return;
    }

    try {
      setFormError('');

      if (editingAssignment) {
        await updateAssignment(
          editingAssignment.id,
          assignmentForm,
        );
      } else {
        await createAssignment(
          assignmentForm,
        );
      }

      closeAssignmentModal();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la asignación.',
      );
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Gestión de obligaciones"
        description="Registra, asigna y realiza seguimiento a las obligaciones ambientales de cada operación minera."
        action={
          <div
            className={
              styles.headerActions
            }
          >
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

            <button
              type="button"
              className={
                styles.secondaryButton
              }
              onClick={
                openCatalogModal
              }
            >
              <BookOpen size={17} />
              Nueva obligación
            </button>

            <PrimaryButton
              onClick={
                openCreateAssignment
              }
              disabled={
                catalog.length === 0 ||
                operations.length === 0
              }
            >
              <Plus size={17} />
              Asignar obligación
            </PrimaryButton>
          </div>
        }
      />

      <div className={styles.realtimeBar}>
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
          {formatTime(lastUpdated)}
        </span>
      </div>

      {error && (
        <div
          className={
            styles.errorBanner
          }
        >
          <CircleAlert size={18} />

          <span>{error}</span>

          <button
            type="button"
            onClick={clearError}
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
            <ClipboardCheck size={21} />
          </div>

          <div>
            <span>
              Obligaciones asignadas
            </span>

            <strong>
              {summary.total}
            </strong>

            <small>
              Total dentro del PMV
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
            <CalendarDays size={21} />
          </div>

          <div>
            <span>Pendientes</span>

            <strong>
              {summary.pending}
            </strong>

            <small>
              Requieren atención
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
            <FileCheck2 size={21} />
          </div>

          <div>
            <span>
              En seguimiento
            </span>

            <strong>
              {summary.inProcess}
            </strong>

            <small>
              En proceso o con evidencia
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
            <AlertTriangle size={21} />
          </div>

          <div>
            <span>
              Alta prioridad o vencidas
            </span>

            <strong>
              {summary.highPriority}
            </strong>

            <small>
              Requieren seguimiento
            </small>
          </div>
        </article>
      </section>

      <Panel>
        <div className={styles.filters}>
          <div
            className={
              styles.searchField
            }
          >
            <Search size={18} />

            <input
              type="search"
              value={filters.search}
              placeholder="Buscar obligación, operación o empresa"
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

            {filteredOperationOptions.map(
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
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                'status',
                event.currentTarget.value as
                  | AssignmentStatus
                  | '',
              )
            }
          >
            <option value="">
              Todos los estados
            </option>

            {ASSIGNMENT_STATUSES.map(
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
              filters.criticality
            }
            onChange={(event) =>
              updateFilter(
                'criticality',
                event.currentTarget.value as
                  | ObligationCriticality
                  | '',
              )
            }
          >
            <option value="">
              Todas las criticidades
            </option>

            {CRITICALITIES.map(
              (criticality) => (
                <option
                  key={criticality}
                  value={criticality}
                >
                  {criticality}
                </option>
              ),
            )}
          </select>

          <button
            type="button"
            className={
              styles.clearButton
            }
            onClick={clearFilters}
          >
            Limpiar filtros
          </button>
        </div>

        <div
          className={
            styles.tableHeader
          }
        >
          <div>
            <h3>
              Obligaciones ambientales
            </h3>

            <span>
              {resultsLabel}
            </span>
          </div>
        </div>

        {loading ? (
          <div
            className={
              styles.loadingState
            }
          >
            <RefreshCw
              size={26}
              className={
                styles.spinning
              }
            />

            <span>
              Cargando obligaciones...
            </span>
          </div>
        ) : filteredAssignments.length ===
          0 ? (
          <div
            className={
              styles.emptyState
            }
          >
            <ClipboardCheck size={38} />

            <h3>
              No se encontraron obligaciones
            </h3>

            <p>
              Registra una obligación y
              asígnala a una operación minera.
            </p>

            <PrimaryButton
              onClick={
                openCreateAssignment
              }
              disabled={
                catalog.length === 0 ||
                operations.length === 0
              }
            >
              <Plus size={17} />
              Asignar obligación
            </PrimaryButton>
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
                  <th>Obligación</th>
                  <th>Empresa</th>
                  <th>Operación</th>
                  <th>Categoría</th>
                  <th>Criticidad</th>
                  <th>Fecha límite</th>
                  <th>Estado</th>
                  <th>Asignación</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map(
                  (assignment) => (
                    <tr
                      key={
                        assignment.id
                      }
                    >
                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {
                              assignment.catalogTitle
                            }
                          </strong>

                          <span>
                            {
                              assignment.catalogCode
                            }
                          </span>
                        </div>
                      </td>

                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {
                              assignment.companyName
                            }
                          </strong>

                          <span>
                            Empresa evaluada
                          </span>
                        </div>
                      </td>

                      <td>
                        <div
                          className={
                            styles.mainCell
                          }
                        >
                          <strong>
                            {
                              assignment.operationName
                            }
                          </strong>

                          <span>
                            {assignment.operationCode ||
                              'Sin código'}
                          </span>
                        </div>
                      </td>

                      <td>
                        {assignment.category}
                      </td>

                      <td>
                        <Badge
                          value={
                            assignment.criticality
                          }
                        />
                      </td>

                      <td>
                        {formatDate(
                          assignment.dueDate,
                        )}
                      </td>

                      <td>
                        <Badge
                          value={
                            assignment.status
                          }
                        />
                      </td>

                      <td>
                        {formatDate(
                          assignment.assignedAt,
                        )}
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
                              setDetailAssignment(
                                assignment,
                              )
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Editar asignación"
                            onClick={() =>
                              openEditAssignment(
                                assignment,
                              )
                            }
                          >
                            <Edit3 size={17} />
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

      {catalogModalOpen && (
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
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>Catálogo</span>

                <h2>
                  Registrar obligación
                </h2>

                <p>
                  Agrega una obligación
                  ambiental al catálogo.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeCatalogModal
                }
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={
                styles.modalForm
              }
              onSubmit={
                handleCatalogSubmit
              }
            >
              <div
                className={
                  styles.formGrid
                }
              >
                <label>
                  Código *

                  <input
                    value={
                      catalogForm.code
                    }
                    onChange={(event) =>
                      setCatalogForm(
                        (current) => ({
                          ...current,
                          code:
                            event.currentTarget
                              .value
                              .toUpperCase(),
                        }),
                      )
                    }
                    placeholder="OBL-AMB-001"
                  />
                </label>

                <label>
                  Criticidad *

                  <select
                    value={
                      catalogForm.criticality
                    }
                    onChange={(event) =>
                      setCatalogForm(
                        (current) => ({
                          ...current,
                          criticality:
                            event.currentTarget
                              .value as
                              ObligationCriticality,
                        }),
                      )
                    }
                  >
                    {CRITICALITIES.map(
                      (criticality) => (
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
                </label>

                <label
                  className={
                    styles.fullField
                  }
                >
                  Nombre de la obligación *

                  <input
                    value={
                      catalogForm.title
                    }
                    onChange={(event) =>
                      setCatalogForm(
                        (current) => ({
                          ...current,
                          title:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label
                  className={
                    styles.fullField
                  }
                >
                  Categoría *

                  <input
                    value={
                      catalogForm.category
                    }
                    onChange={(event) =>
                      setCatalogForm(
                        (current) => ({
                          ...current,
                          category:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                    placeholder="Ej. Monitoreo ambiental"
                  />
                </label>

                <label
                  className={
                    styles.fullField
                  }
                >
                  Evidencia requerida *

                  <textarea
                    rows={3}
                    value={
                      catalogForm.requiredEvidence
                    }
                    onChange={(event) =>
                      setCatalogForm(
                        (current) => ({
                          ...current,
                          requiredEvidence:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label
                  className={
                    styles.fullField
                  }
                >
                  Descripción

                  <textarea
                    rows={4}
                    value={
                      catalogForm.description
                    }
                    onChange={(event) =>
                      setCatalogForm(
                        (current) => ({
                          ...current,
                          description:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>

              {formError && (
                <div
                  className={
                    styles.formError
                  }
                >
                  <CircleAlert size={17} />
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
                  onClick={
                    closeCatalogModal
                  }
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
                    : 'Registrar obligación'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignmentModalOpen && (
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
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>Asignación</span>

                <h2>
                  {editingAssignment
                    ? 'Editar asignación'
                    : 'Asignar obligación'}
                </h2>

                <p>
                  Relaciona una obligación
                  con una operación minera.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeAssignmentModal
                }
                disabled={saving}
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={
                styles.modalForm
              }
              onSubmit={
                handleAssignmentSubmit
              }
            >
              <div
                className={
                  styles.formGrid
                }
              >
                <label
                  className={
                    styles.fullField
                  }
                >
                  Obligación *

                  <select
                    value={
                      assignmentForm.catalogId
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          catalogId:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                  >
                    <option value="">
                      Selecciona una obligación
                    </option>

                    {catalog
                      .filter(
                        (item) =>
                          item.active,
                      )
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.id}
                        >
                          {item.code} —{' '}
                          {item.title}
                        </option>
                      ))}
                  </select>
                </label>

                <label
                  className={
                    styles.fullField
                  }
                >
                  Operación minera *

                  <select
                    value={
                      assignmentForm.operationId
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          operationId:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                  >
                    <option value="">
                      Selecciona una operación
                    </option>

                    {operations.map(
                      (operation) => (
                        <option
                          key={operation.id}
                          value={operation.id}
                        >
                          {operation.companyName}
                          {' — '}
                          {operation.name}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label>
                  Fecha límite

                  <input
                    type="date"
                    value={
                      assignmentForm.dueDate
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          dueDate:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                  />
                </label>

                <label>
                  Estado

                  <select
                    value={
                      assignmentForm.status
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          status:
                            event.currentTarget
                              .value as
                              AssignmentStatus,
                        }),
                      )
                    }
                  >
                    {ASSIGNMENT_STATUSES.map(
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

                <label
                  className={
                    styles.fullField
                  }
                >
                  Notas

                  <textarea
                    rows={4}
                    value={
                      assignmentForm.notes
                    }
                    onChange={(event) =>
                      setAssignmentForm(
                        (current) => ({
                          ...current,
                          notes:
                            event.currentTarget
                              .value,
                        }),
                      )
                    }
                  />
                </label>
              </div>

              {formError && (
                <div
                  className={
                    styles.formError
                  }
                >
                  <CircleAlert size={17} />
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
                  onClick={
                    closeAssignmentModal
                  }
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
                    : editingAssignment
                      ? 'Guardar cambios'
                      : 'Asignar obligación'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailAssignment && (
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
            <div
              className={
                styles.drawerHeader
              }
            >
              <div>
                <span>
                  Detalle de obligación
                </span>

                <h2>
                  {
                    detailAssignment.catalogTitle
                  }
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDetailAssignment(
                    null,
                  )
                }
              >
                <X size={20} />
              </button>
            </div>

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
                    detailAssignment.status
                  }
                />

                <Badge
                  value={
                    detailAssignment.criticality
                  }
                />
              </div>

              <dl
                className={
                  styles.detailList
                }
              >
                <div>
                  <dt>Código</dt>

                  <dd>
                    {
                      detailAssignment.catalogCode
                    }
                  </dd>
                </div>

                <div>
                  <dt>Empresa</dt>

                  <dd>
                    {
                      detailAssignment.companyName
                    }
                  </dd>
                </div>

                <div>
                  <dt>Operación</dt>

                  <dd>
                    {
                      detailAssignment.operationName
                    }
                  </dd>
                </div>

                <div>
                  <dt>Categoría</dt>

                  <dd>
                    {
                      detailAssignment.category
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    Evidencia requerida
                  </dt>

                  <dd>
                    {
                      detailAssignment.requiredEvidence
                    }
                  </dd>
                </div>

                <div>
                  <dt>Fecha límite</dt>

                  <dd>
                    {formatDate(
                      detailAssignment.dueDate,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    Fecha de asignación
                  </dt>

                  <dd>
                    {formatDateTime(
                      detailAssignment.assignedAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Descripción</dt>

                  <dd>
                    {detailAssignment.catalogDescription ||
                      'No registrada'}
                  </dd>
                </div>

                <div>
                  <dt>Notas</dt>

                  <dd>
                    {detailAssignment.notes ||
                      'Sin notas'}
                  </dd>
                </div>
              </dl>
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
                  setDetailAssignment(
                    null,
                  )
                }
              >
                Cerrar
              </button>

              <PrimaryButton
                onClick={() =>
                  openEditAssignment(
                    detailAssignment,
                  )
                }
              >
                <Edit3 size={17} />
                Editar asignación
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}