import {
  Activity,
  Building2,
  CheckCircle2,
  CircleAlert,
  ClipboardList,
  Edit3,
  Eye,
  Factory,
  MapPin,
  Plus,
  Power,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';

import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  Badge,
  PageHeader,
  Panel,
  PrimaryButton,
} from '../../../shared/components/Ui';

import { listCompanies } from '../empresas/companies.service';

import type { Company } from '../empresas/companies.types';

import type {
  Operation,
  OperationFormValues,
  OperationStage,
  OperationType,
  RiskLevel,
} from './operations.types';

import { useOperations } from './useOperations';

import styles from './OperationsPage.module.css';

/* =========================================================
   VALORES INICIALES
   ========================================================= */

const EMPTY_FORM: OperationFormValues = {
  companyId: '',
  name: '',
  internalCode: '',
  operationType: '',
  stage: '',
  region: '',
  province: '',
  district: '',
  address: '',
  latitude: '',
  longitude: '',
  responsibleName: '',
  responsibleEmail: '',
  responsiblePhone: '',
  description: '',
};

const OPERATION_TYPES: OperationType[] = [
  'Mina subterránea',
  'Mina a cielo abierto',
  'Planta de beneficio',
  'Depósito de relaves',
  'Exploración',
  'Transporte',
  'Otra',
];

const OPERATION_STAGES: OperationStage[] = [
  'Exploración',
  'Construcción',
  'Operación',
  'Cierre',
  'Postcierre',
];

const RISK_LEVELS: RiskLevel[] = [
  'Bajo',
  'Medio',
  'Alto',
  'Crítico',
];

/* =========================================================
   FUNCIONES AUXILIARES
   ========================================================= */

function operationToForm(
  operation: Operation,
): OperationFormValues {
  return {
    companyId: operation.companyId,
    name: operation.name,
    internalCode: operation.internalCode ?? '',
    operationType: operation.operationType ?? '',
    stage: operation.stage ?? '',
    region: operation.region ?? '',
    province: operation.province ?? '',
    district: operation.district ?? '',
    address: operation.address ?? '',

    latitude:
      operation.latitude !== undefined
        ? String(operation.latitude)
        : '',

    longitude:
      operation.longitude !== undefined
        ? String(operation.longitude)
        : '',

    responsibleName:
      operation.responsibleName ?? '',

    responsibleEmail:
      operation.responsibleEmail ?? '',

    responsiblePhone:
      operation.responsiblePhone ?? '',

    description:
      operation.description ?? '',
  };
}

function formatDate(value: string): string {
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

function formatDateTime(value: string): string {
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

function formatTime(date: Date | null): string {
  if (!date) {
    return 'Pendiente';
  }

  return new Intl.DateTimeFormat('es-PE', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getLocation(operation: Operation): string {
  return (
    [
      operation.district,
      operation.province,
      operation.region,
    ]
      .filter(Boolean)
      .join(', ') || 'Sin ubicación'
  );
}

function clampPercentage(value: number): number {
  return Math.min(
    Math.max(value, 0),
    100,
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
   ========================================================= */

export default function OperationsPage() {
  const {
    filteredOperations,
    summary,
    filters,

    loading,
    saving,
    error,
    lastUpdated,

    loadOperations,
    createOperation,
    updateOperation,
    changeOperationStatus,

    updateFilter,
    clearFilters,
    clearError,
  } = useOperations();

  const [companies, setCompanies] =
    useState<Company[]>([]);

  const [
    companiesLoading,
    setCompaniesLoading,
  ] = useState(true);

  const [
    companiesError,
    setCompaniesError,
  ] = useState('');

  const [formOpen, setFormOpen] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [
    selectedOperation,
    setSelectedOperation,
  ] = useState<Operation | null>(null);

  const [
    editingOperation,
    setEditingOperation,
  ] = useState<Operation | null>(null);

  const [
    formValues,
    setFormValues,
  ] = useState<OperationFormValues>(
    EMPTY_FORM,
  );

  const [formError, setFormError] =
    useState('');

  /* =======================================================
     CARGA DE EMPRESAS
     ======================================================= */

  useEffect(() => {
    async function loadAvailableCompanies() {
      try {
        setCompaniesLoading(true);
        setCompaniesError('');

        const result =
          await listCompanies();

        setCompanies(
          result.filter(
            (company) => company.active,
          ),
        );
      } catch (loadError) {
        setCompaniesError(
          loadError instanceof Error
            ? loadError.message
            : 'No se pudieron cargar las empresas.',
        );
      } finally {
        setCompaniesLoading(false);
      }
    }

    void loadAvailableCompanies();
  }, []);

  /* =======================================================
     TEXTO DE RESULTADOS
     ======================================================= */

  const resultLabel = useMemo(() => {
    const total =
      filteredOperations.length;

    return total === 1
      ? '1 operación encontrada'
      : `${total} operaciones encontradas`;
  }, [filteredOperations.length]);

  /* =======================================================
     FORMULARIO
     ======================================================= */

  function openCreateForm() {
    clearError();
    setFormError('');
    setEditingOperation(null);
    setFormValues(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEditForm(
    operation: Operation,
  ) {
    clearError();
    setFormError('');
    setEditingOperation(operation);
    setFormValues(
      operationToForm(operation),
    );
    setDetailsOpen(false);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingOperation(null);
    setFormValues(EMPTY_FORM);
    setFormError('');
  }

  /* =======================================================
     DETALLE
     ======================================================= */

  function openDetails(
    operation: Operation,
  ) {
    setSelectedOperation(operation);
    setDetailsOpen(true);
  }

  function closeDetails() {
    setDetailsOpen(false);
    setSelectedOperation(null);
  }

  /* =======================================================
     ACTUALIZAR CAMPOS
     ======================================================= */

  function updateFormValue<
    Field extends keyof OperationFormValues,
  >(
    field: Field,
    value: OperationFormValues[Field],
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  /* =======================================================
     VALIDACIONES
     ======================================================= */

  function validateForm(): string {
    if (!formValues.companyId) {
      return 'Selecciona la empresa asociada.';
    }

    if (!formValues.name.trim()) {
      return 'Ingresa el nombre de la operación.';
    }

    if (!formValues.internalCode.trim()) {
      return 'Ingresa el código interno de la operación.';
    }

    if (!formValues.operationType) {
      return 'Selecciona el tipo de operación.';
    }

    if (!formValues.stage) {
      return 'Selecciona la etapa de la operación.';
    }

    if (!formValues.region.trim()) {
      return 'Ingresa la región de la operación.';
    }

    if (
      formValues.responsibleEmail.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formValues.responsibleEmail.trim(),
      )
    ) {
      return 'Ingresa un correo válido para el responsable.';
    }

    if (formValues.latitude.trim()) {
      const latitude = Number(
        formValues.latitude,
      );

      if (
        Number.isNaN(latitude) ||
        latitude < -90 ||
        latitude > 90
      ) {
        return 'La latitud debe estar entre -90 y 90.';
      }
    }

    if (formValues.longitude.trim()) {
      const longitude = Number(
        formValues.longitude,
      );

      if (
        Number.isNaN(longitude) ||
        longitude < -180 ||
        longitude > 180
      ) {
        return 'La longitud debe estar entre -180 y 180.';
      }
    }

    return '';
  }

  /* =======================================================
     GUARDAR
     ======================================================= */

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setFormError('');

      if (editingOperation) {
        await updateOperation(
          editingOperation.id,
          formValues,
        );
      } else {
        await createOperation(
          formValues,
        );
      }

      closeForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la operación.',
      );
    }
  }

  /* =======================================================
     ACTIVAR O DESACTIVAR
     ======================================================= */

  async function handleActivityChange(
    operation: Operation,
  ) {
    const action = operation.active
      ? 'desactivar'
      : 'activar';

    const confirmed = window.confirm(
      `¿Deseas ${action} la operación "${operation.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await changeOperationStatus(
        operation.id,
        !operation.active,
      );

      if (
        selectedOperation?.id ===
        operation.id
      ) {
        setSelectedOperation(
          (current) =>
            current
              ? {
                  ...current,
                  active:
                    !operation.active,
                }
              : null,
        );
      }
    } catch {
      // El hook muestra el error.
    }
  }

  /* =======================================================
     RENDER
     ======================================================= */

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Gestión de operaciones"
        description="Registra y administra las unidades, plantas y demás operaciones mineras asociadas a las empresas evaluadas."
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
                void loadOperations()
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
              onClick={openCreateForm}
              disabled={
                companiesLoading ||
                companies.length === 0
              }
            >
              <Plus size={17} />
              Registrar operación
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

          <span>
            Actualización en tiempo real
          </span>
        </div>

        <span>
          Última actualización:{' '}
          {formatTime(lastUpdated)}
        </span>
      </div>

      {(error || companiesError) && (
        <div
          className={
            styles.errorBanner
          }
        >
          <CircleAlert size={18} />

          <span>
            {error || companiesError}
          </span>

          <button
            type="button"
            onClick={() => {
              clearError();
              setCompaniesError('');
            }}
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section
        className={styles.summaryGrid}
      >
        <article
          className={styles.summaryCard}
        >
          <div
            className={styles.summaryIcon}
          >
            <Factory size={21} />
          </div>

          <div>
            <span>
              Operaciones registradas
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
          className={styles.summaryCard}
        >
          <div
            className={styles.summaryIcon}
          >
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>
              Operaciones activas
            </span>

            <strong>
              {summary.active}
            </strong>

            <small>
              Disponibles para evaluación
            </small>
          </div>
        </article>

        <article
          className={styles.summaryCard}
        >
          <div
            className={styles.summaryIcon}
          >
            <Activity size={21} />
          </div>

          <div>
            <span>En evaluación</span>

            <strong>
              {summary.inEvaluation}
            </strong>

            <small>
              Con proceso iniciado
            </small>
          </div>
        </article>

        <article
          className={styles.summaryCard}
        >
          <div
            className={styles.summaryIcon}
          >
            <ShieldAlert size={21} />
          </div>

          <div>
            <span>
              Riesgo alto o crítico
            </span>

            <strong>
              {summary.highRisk}
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
            className={styles.searchField}
          >
            <Search size={18} />

            <input
              type="search"
              value={filters.search}
              placeholder="Buscar operación, código, empresa o región"
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
                {company.legalName}
              </option>
            ))}
          </select>

          <select
            value={filters.operationType}
            onChange={(event) =>
              updateFilter(
                'operationType',
                event.currentTarget.value as
                  | OperationType
                  | '',
              )
            }
          >
            <option value="">
              Todos los tipos
            </option>

            {OPERATION_TYPES.map(
              (operationType) => (
                <option
                  key={operationType}
                  value={operationType}
                >
                  {operationType}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.stage}
            onChange={(event) =>
              updateFilter(
                'stage',
                event.currentTarget.value as
                  | OperationStage
                  | '',
              )
            }
          >
            <option value="">
              Todas las etapas
            </option>

            {OPERATION_STAGES.map(
              (stage) => (
                <option
                  key={stage}
                  value={stage}
                >
                  {stage}
                </option>
              ),
            )}
          </select>

          <select
            value={filters.risk}
            onChange={(event) =>
              updateFilter(
                'risk',
                event.currentTarget.value as
                  | RiskLevel
                  | '',
              )
            }
          >
            <option value="">
              Todos los riesgos
            </option>

            {RISK_LEVELS.map(
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
            value={filters.activity}
            onChange={(event) =>
              updateFilter(
                'activity',
                event.currentTarget.value as
                  typeof filters.activity,
              )
            }
          >
            <option value="Todas">
              Todas
            </option>

            <option value="Activas">
              Activas
            </option>

            <option value="Inactivas">
              Inactivas
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

        <div
          className={styles.tableHeader}
        >
          <div>
            <h3>
              Operaciones mineras
            </h3>

            <span>{resultLabel}</span>
          </div>
        </div>

        {loading ? (
          <div
            className={styles.loadingState}
          >
            <RefreshCw
              size={25}
              className={styles.spinning}
            />

            <span>
              Cargando operaciones...
            </span>
          </div>
        ) : filteredOperations.length ===
          0 ? (
          <div
            className={styles.emptyState}
          >
            <Factory size={38} />

            <h3>
              No se encontraron operaciones
            </h3>

            <p>
              Registra una operación minera o
              modifica los filtros.
            </p>

            <PrimaryButton
              onClick={openCreateForm}
              disabled={
                companies.length === 0
              }
            >
              <Plus size={17} />
              Registrar operación
            </PrimaryButton>
          </div>
        ) : (
          <div
            className={styles.tableWrapper}
          >
            <table
              className={styles.table}
            >
              <thead>
                <tr>
                  <th>Operación</th>
                  <th>Empresa</th>
                  <th>Tipo</th>
                  <th>Etapa</th>
                  <th>Ubicación</th>
                  <th>Obligaciones</th>
                  <th>Cumplimiento</th>
                  <th>Riesgo</th>
                  <th>Evaluación</th>
                  <th>Actividad</th>
                  <th>Registro</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {filteredOperations.map(
                  (operation: Operation) => (
                    <tr key={operation.id}>
                      <td>
                        <div
                          className={
                            styles.operationCell
                          }
                        >
                          <div
                            className={
                              styles.operationAvatar
                            }
                          >
                            <Factory size={17} />
                          </div>

                          <div>
                            <strong>
                              {operation.name}
                            </strong>

                            <span>
                              {operation.internalCode ||
                                'Sin código interno'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div
                          className={
                            styles.companyCell
                          }
                        >
                          <strong>
                            {operation.companyName}
                          </strong>

                          <span>
                            Empresa evaluada
                          </span>
                        </div>
                      </td>

                      <td>
                        <div
                          className={
                            styles.typeCell
                          }
                        >
                          <strong>
                            {operation.operationType ||
                              'No definido'}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div
                          className={
                            styles.stageCell
                          }
                        >
                          <strong>
                            {operation.stage ||
                              'No definida'}
                          </strong>
                        </div>
                      </td>

                      <td>
                        <div
                          className={
                            styles.locationCell
                          }
                        >
                          <MapPin size={15} />

                          <span>
                            {operation.region ||
                              'Sin ubicación'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={
                            styles.obligationsCell
                          }
                        >
                          <ClipboardList
                            size={13}
                          />

                          {
                            operation.obligationsCount
                          }
                        </span>
                      </td>

                      <td>
                        <div
                          className={
                            styles.complianceCell
                          }
                        >
                          <strong>
                            {
                              operation.currentCompliance
                            }
                            %
                          </strong>

                          <div
                            className={
                              styles.progressTrack
                            }
                          >
                            <span
                              style={{
                                width: `${clampPercentage(
                                  operation.currentCompliance,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge
                          value={
                            operation.currentRisk
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={operation.status}
                        />
                      </td>

                      <td>
                        <span
                          className={
                            operation.active
                              ? styles.activeStatus
                              : styles.inactiveStatus
                          }
                        >
                          {operation.active
                            ? 'Activa'
                            : 'Inactiva'}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          operation.createdAt,
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
                              openDetails(
                                operation,
                              )
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Editar operación"
                            onClick={() =>
                              openEditForm(
                                operation,
                              )
                            }
                          >
                            <Edit3 size={17} />
                          </button>

                          <button
                            type="button"
                            title={
                              operation.active
                                ? 'Desactivar'
                                : 'Activar'
                            }
                            onClick={() =>
                              void handleActivityChange(
                                operation,
                              )
                            }
                          >
                            <Power size={17} />
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
        <div
          className={
            styles.modalBackdrop
          }
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="operation-form-title"
          >
            <div
              className={
                styles.modalHeader
              }
            >
              <div>
                <span>
                  {editingOperation
                    ? 'Editar registro'
                    : 'Nueva operación'}
                </span>

                <h2 id="operation-form-title">
                  {editingOperation
                    ? 'Actualizar operación'
                    : 'Registrar operación'}
                </h2>

                <p>
                  Completa la información de
                  la unidad o instalación minera.
                </p>
              </div>

              <button
                type="button"
                onClick={closeForm}
                disabled={saving}
                aria-label="Cerrar formulario"
              >
                <X size={20} />
              </button>
            </div>

            <form
              className={
                styles.operationForm
              }
              onSubmit={handleSubmit}
            >
              <section
                className={
                  styles.formSection
                }
              >
                <div
                  className={
                    styles.formSectionTitle
                  }
                >
                  <Building2 size={16} />
                  Información general
                </div>

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
                    Empresa asociada *

                    <select
                      value={
                        formValues.companyId
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'companyId',
                          event.currentTarget
                            .value,
                        )
                      }
                      disabled={
                        companiesLoading
                      }
                    >
                      <option value="">
                        {companiesLoading
                          ? 'Cargando empresas...'
                          : 'Selecciona una empresa'}
                      </option>

                      {companies.map(
                        (company) => (
                          <option
                            key={company.id}
                            value={company.id}
                          >
                            {
                              company.legalName
                            }
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
                    Nombre de la operación *

                    <input
                      value={formValues.name}
                      onChange={(event) =>
                        updateFormValue(
                          'name',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="Ej. Unidad Minera Cerro Azul"
                      maxLength={180}
                    />
                  </label>

                  <label>
                    Código interno *

                    <input
                      value={
                        formValues.internalCode
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'internalCode',
                          event.currentTarget
                            .value
                            .toUpperCase(),
                        )
                      }
                      placeholder="Ej. OPE-001"
                      maxLength={60}
                    />
                  </label>

                  <label>
                    Tipo de operación *

                    <select
                      value={
                        formValues.operationType
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'operationType',
                          event.currentTarget
                            .value as
                            | OperationType
                            | '',
                        )
                      }
                    >
                      <option value="">
                        Selecciona un tipo
                      </option>

                      {OPERATION_TYPES.map(
                        (operationType) => (
                          <option
                            key={
                              operationType
                            }
                            value={
                              operationType
                            }
                          >
                            {
                              operationType
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label>
                    Etapa *

                    <select
                      value={
                        formValues.stage
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'stage',
                          event.currentTarget
                            .value as
                            | OperationStage
                            | '',
                        )
                      }
                    >
                      <option value="">
                        Selecciona una etapa
                      </option>

                      {OPERATION_STAGES.map(
                        (stage) => (
                          <option
                            key={stage}
                            value={stage}
                          >
                            {stage}
                          </option>
                        ),
                      )}
                    </select>
                  </label>
                </div>
              </section>

              <section
                className={
                  styles.formSection
                }
              >
                <div
                  className={
                    styles.formSectionTitle
                  }
                >
                  <MapPin size={16} />
                  Ubicación
                </div>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <label>
                    Región *

                    <input
                      value={
                        formValues.region
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'region',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="Ej. Arequipa"
                    />
                  </label>

                  <label>
                    Provincia

                    <input
                      value={
                        formValues.province
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'province',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="Provincia"
                    />
                  </label>

                  <label>
                    Distrito

                    <input
                      value={
                        formValues.district
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'district',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="Distrito"
                    />
                  </label>

                  <label>
                    Dirección o referencia

                    <input
                      value={
                        formValues.address
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'address',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="Dirección o referencia"
                    />
                  </label>

                  <label>
                    Latitud

                    <input
                      type="number"
                      step="any"
                      value={
                        formValues.latitude
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'latitude',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="-16.3989"
                    />
                  </label>

                  <label>
                    Longitud

                    <input
                      type="number"
                      step="any"
                      value={
                        formValues.longitude
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'longitude',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="-71.5350"
                    />
                  </label>
                </div>
              </section>

              <section
                className={
                  styles.formSection
                }
              >
                <div
                  className={
                    styles.formSectionTitle
                  }
                >
                  <Activity size={16} />
                  Responsable de la operación
                </div>

                <div
                  className={
                    styles.formGrid
                  }
                >
                  <label>
                    Responsable

                    <input
                      value={
                        formValues.responsibleName
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'responsibleName',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="Nombre del responsable"
                    />
                  </label>

                  <label>
                    Correo

                    <input
                      type="email"
                      value={
                        formValues.responsibleEmail
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'responsibleEmail',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="responsable@empresa.pe"
                    />
                  </label>

                  <label>
                    Teléfono

                    <input
                      value={
                        formValues.responsiblePhone
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'responsiblePhone',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="+51 999 999 999"
                    />
                  </label>

                  <label
                    className={
                      styles.fullField
                    }
                  >
                    Descripción

                    <textarea
                      value={
                        formValues.description
                      }
                      onChange={(event) =>
                        updateFormValue(
                          'description',
                          event.currentTarget
                            .value,
                        )
                      }
                      placeholder="Descripción general de la operación minera"
                      rows={4}
                    />
                  </label>
                </div>
              </section>

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
                  onClick={closeForm}
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
                    : editingOperation
                      ? 'Guardar cambios'
                      : 'Registrar operación'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsOpen &&
        selectedOperation && (
          <div
            className={
              styles.drawerBackdrop
            }
          >
            <aside
              className={styles.drawer}
            >
              <div
                className={
                  styles.drawerHeader
                }
              >
                <div>
                  <span>
                    Detalle de operación
                  </span>

                  <h2>
                    {
                      selectedOperation.name
                    }
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeDetails}
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
                <div
                  className={
                    styles.detailSummary
                  }
                >
                  <div
                    className={
                      styles.detailIcon
                    }
                  >
                    <Factory size={25} />
                  </div>

                  <div>
                    <Badge
                      value={
                        selectedOperation.status
                      }
                    />

                    <span>
                      {selectedOperation.internalCode ||
                        'Sin código interno'}
                    </span>
                  </div>
                </div>

                <dl
                  className={
                    styles.detailList
                  }
                >
                  <div>
                    <dt>Empresa</dt>
                    <dd>
                      {
                        selectedOperation.companyName
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Tipo</dt>
                    <dd>
                      {selectedOperation.operationType ||
                        'No registrado'}
                    </dd>
                  </div>

                  <div>
                    <dt>Etapa</dt>
                    <dd>
                      {selectedOperation.stage ||
                        'No registrada'}
                    </dd>
                  </div>

                  <div>
                    <dt>Ubicación</dt>
                    <dd>
                      {getLocation(
                        selectedOperation,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Dirección</dt>
                    <dd>
                      {selectedOperation.address ||
                        'No registrada'}
                    </dd>
                  </div>

                  <div>
                    <dt>Coordenadas</dt>
                    <dd>
                      {selectedOperation.latitude !==
                        undefined &&
                      selectedOperation.longitude !==
                        undefined
                        ? `${selectedOperation.latitude}, ${selectedOperation.longitude}`
                        : 'No registradas'}
                    </dd>
                  </div>

                  <div>
                    <dt>Responsable</dt>
                    <dd>
                      {selectedOperation.responsibleName ||
                        'No registrado'}
                    </dd>
                  </div>

                  <div>
                    <dt>Correo</dt>
                    <dd>
                      {selectedOperation.responsibleEmail ||
                        'No registrado'}
                    </dd>
                  </div>

                  <div>
                    <dt>Teléfono</dt>
                    <dd>
                      {selectedOperation.responsiblePhone ||
                        'No registrado'}
                    </dd>
                  </div>

                  <div>
                    <dt>Obligaciones</dt>
                    <dd>
                      {
                        selectedOperation.obligationsCount
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Cumplimiento</dt>
                    <dd>
                      {
                        selectedOperation.currentCompliance
                      }
                      %
                    </dd>
                  </div>

                  <div>
                    <dt>Riesgo</dt>
                    <dd>
                      {
                        selectedOperation.currentRisk
                      }
                    </dd>
                  </div>

                  <div>
                    <dt>Actividad</dt>
                    <dd>
                      {selectedOperation.active
                        ? 'Activa'
                        : 'Inactiva'}
                    </dd>
                  </div>

                  <div>
                    <dt>Registro</dt>
                    <dd>
                      {formatDateTime(
                        selectedOperation.createdAt,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>
                      Última actualización
                    </dt>
                    <dd>
                      {formatDateTime(
                        selectedOperation.updatedAt,
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt>Descripción</dt>
                    <dd>
                      {selectedOperation.description ||
                        'No registrada'}
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
                  onClick={closeDetails}
                >
                  Cerrar
                </button>

                <PrimaryButton
                  onClick={() =>
                    openEditForm(
                      selectedOperation,
                    )
                  }
                >
                  <Edit3 size={17} />
                  Editar operación
                </PrimaryButton>
              </div>
            </aside>
          </div>
        )}
    </div>
  );
}