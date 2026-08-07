import {
  Building2,
  CheckCircle2,
  CircleAlert,
  Edit3,
  Eye,
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

import type {
  Company,
  CompanyFormValues,
} from './companies.types';

import { useCompanies } from './useCompanies';

import styles from './CompaniesPage.module.css';

const EMPTY_FORM: CompanyFormValues = {
  legalName: '',
  tradeName: '',
  ruc: '',
  region: '',
  province: '',
  district: '',
  address: '',
  contactName: '',
  email: '',
  phone: '',
  environmentalResponsible: '',
};

function companyToForm(
  company: Company,
): CompanyFormValues {
  return {
    legalName: company.legalName,
    tradeName: company.tradeName ?? '',
    ruc: company.ruc,
    region: company.region ?? '',
    province: company.province ?? '',
    district: company.district ?? '',
    address: company.address ?? '',
    contactName: company.contactName ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    environmentalResponsible:
      company.environmentalResponsible ?? '',
  };
}

function formatDate(value: string): string {
  if (!value) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
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

export default function CompaniesPage() {
  const {
    filteredCompanies,
    summary,
    filters,

    loading,
    saving,
    error,
    lastUpdated,

    loadCompanies,
    createCompany,
    updateCompany,
    changeCompanyStatus,

    updateFilter,
    clearFilters,
    clearError,
  } = useCompanies();

  const [formOpen, setFormOpen] =
    useState(false);

  const [detailsOpen, setDetailsOpen] =
    useState(false);

  const [selectedCompany, setSelectedCompany] =
    useState<Company | null>(null);

  const [editingCompany, setEditingCompany] =
    useState<Company | null>(null);

  const [formValues, setFormValues] =
    useState<CompanyFormValues>(EMPTY_FORM);

  const [formError, setFormError] =
    useState('');

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  const resultLabel = useMemo(() => {
    const total = filteredCompanies.length;

    return total === 1
      ? '1 empresa encontrada'
      : `${total} empresas encontradas`;
  }, [filteredCompanies.length]);

  function openCreateForm() {
    clearError();
    setFormError('');
    setEditingCompany(null);
    setFormValues(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEditForm(company: Company) {
    clearError();
    setFormError('');
    setEditingCompany(company);
    setFormValues(companyToForm(company));
    setDetailsOpen(false);
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);
    setEditingCompany(null);
    setFormValues(EMPTY_FORM);
    setFormError('');
  }

  function openDetails(company: Company) {
    setSelectedCompany(company);
    setDetailsOpen(true);
  }

  function updateFormValue(
    field: keyof CompanyFormValues,
    value: string,
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function validateForm(): string {
    if (!formValues.legalName.trim()) {
      return 'Ingresa la razón social.';
    }

    if (!/^\d{11}$/.test(formValues.ruc)) {
      return 'El RUC debe contener exactamente 11 dígitos.';
    }

    if (!formValues.region.trim()) {
      return 'Selecciona o ingresa una región.';
    }

    if (
      formValues.email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formValues.email.trim(),
      )
    ) {
      return 'Ingresa un correo electrónico válido.';
    }

    return '';
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setFormError(validationMessage);
      return;
    }

    try {
      setFormError('');

      if (editingCompany) {
        await updateCompany(
          editingCompany.id,
          formValues,
        );
      } else {
        await createCompany(formValues);
      }

      closeForm();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : 'No se pudo guardar la empresa.',
      );
    }
  }

  async function handleActivityChange(
    company: Company,
  ) {
    const action = company.active
      ? 'desactivar'
      : 'activar';

    const confirmed = window.confirm(
      `¿Deseas ${action} a ${company.legalName}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await changeCompanyStatus(
        company.id,
        !company.active,
      );
    } catch {
      // El mensaje ya se gestiona desde el hook.
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        eyebrow="Administrador Fiscalizador"
        title="Gestión de empresas"
        description="Registra, consulta y administra las empresas que serán evaluadas dentro del proceso de fiscalización ambiental."
        action={
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => void loadCompanies()}
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
            >
              <Plus size={17} />
              Registrar empresa
            </PrimaryButton>
          </div>
        }
      />

      <div className={styles.realtimeBar}>
        <div className={styles.realtimeStatus}>
          <span className={styles.realtimeDot} />

          <span>Actualización en tiempo real</span>
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
            aria-label="Cerrar mensaje"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <Building2 size={21} />
          </div>

          <div>
            <span>Empresas registradas</span>
            <strong>{summary.total}</strong>
            <small>Total dentro del PMV</small>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Empresas activas</span>
            <strong>{summary.active}</strong>
            <small>Disponibles para evaluación</small>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <RefreshCw size={21} />
          </div>

          <div>
            <span>En evaluación</span>
            <strong>{summary.inEvaluation}</strong>
            <small>Con proceso iniciado</small>
          </div>
        </article>

        <article className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <ShieldAlert size={21} />
          </div>

          <div>
            <span>Observadas</span>
            <strong>{summary.observed}</strong>
            <small>Requieren seguimiento</small>
          </div>
        </article>
      </section>

      <Panel>
        <div className={styles.filters}>
          <div className={styles.searchField}>
            <Search size={18} />

            <input
              type="search"
              value={filters.search}
              placeholder="Buscar por razón social, nombre comercial, RUC o región"
              onChange={(event) =>
                updateFilter(
                  'search',
                  event.target.value,
                )
              }
            />
          </div>

          <select
            value={filters.status}
            onChange={(event) =>
              updateFilter(
                'status',
                event.target
                  .value as typeof filters.status,
              )
            }
          >
            <option value="Todos">
              Todos los estados
            </option>

            <option value="Registrada">
              Registrada
            </option>

            <option value="En evaluación">
              En evaluación
            </option>

            <option value="Observada">
              Observada
            </option>

            <option value="Validada">
              Validada
            </option>
          </select>

          <select
            value={filters.activity}
            onChange={(event) =>
              updateFilter(
                'activity',
                event.target
                  .value as typeof filters.activity,
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

        <div className={styles.tableHeader}>
          <div>
            <h3>Empresas evaluadas</h3>
            <span>{resultLabel}</span>
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingState}>
            <RefreshCw
              size={25}
              className={styles.spinning}
            />

            <span>Cargando empresas...</span>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className={styles.emptyState}>
            <Building2 size={38} />

            <h3>No se encontraron empresas</h3>

            <p>
              Registra una empresa o modifica los
              filtros de búsqueda.
            </p>

            <PrimaryButton
              onClick={openCreateForm}
            >
              <Plus size={17} />
              Registrar empresa
            </PrimaryButton>
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>RUC</th>
                  <th>Ubicación</th>
                  <th>Cumplimiento</th>
                  <th>Riesgo</th>
                  <th>Evaluación</th>
                  <th>Actividad</th>
                  <th>Registro</th>
                  <th aria-label="Acciones" />
                </tr>
              </thead>

              <tbody>
                {filteredCompanies.map(
                  (company) => (
                    <tr key={company.id}>
                      <td>
                        <div
                          className={
                            styles.companyCell
                          }
                        >
                          <div
                            className={
                              styles.companyAvatar
                            }
                          >
                            <Building2 size={17} />
                          </div>

                          <div>
                            <strong>
                              {company.legalName}
                            </strong>

                            <span>
                              {company.tradeName ||
                                'Sin nombre comercial'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span
                          className={styles.ruc}
                        >
                          {company.ruc}
                        </span>
                      </td>

                      <td>
                        <div
                          className={
                            styles.locationCell
                          }
                        >
                          <MapPin size={15} />

                          <span>
                            {company.region ||
                              'Sin ubicación'}
                          </span>
                        </div>
                      </td>

                      <td>
                        <div
                          className={
                            styles.complianceCell
                          }
                        >
                          <strong>
                            {
                              company.currentCompliance
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
                                width: `${Math.min(
                                  Math.max(
                                    company.currentCompliance,
                                    0,
                                  ),
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </td>

                      <td>
                        <Badge
                          value={
                            company.currentRisk
                          }
                        />
                      </td>

                      <td>
                        <Badge
                          value={company.status}
                        />
                      </td>

                      <td>
                        <span
                          className={
                            company.active
                              ? styles.activeStatus
                              : styles.inactiveStatus
                          }
                        >
                          {company.active
                            ? 'Activa'
                            : 'Inactiva'}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          company.createdAt,
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
                              openDetails(company)
                            }
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            title="Editar empresa"
                            onClick={() =>
                              openEditForm(company)
                            }
                          >
                            <Edit3 size={17} />
                          </button>

                          <button
                            type="button"
                            title={
                              company.active
                                ? 'Desactivar'
                                : 'Activar'
                            }
                            onClick={() =>
                              void handleActivityChange(
                                company,
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
          className={styles.modalBackdrop}
          role="presentation"
        >
          <div
            className={styles.modal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="company-form-title"
          >
            <div className={styles.modalHeader}>
              <div>
                <span>
                  {editingCompany
                    ? 'Editar registro'
                    : 'Nueva empresa'}
                </span>

                <h2 id="company-form-title">
                  {editingCompany
                    ? 'Actualizar empresa'
                    : 'Registrar empresa'}
                </h2>

                <p>
                  Completa la información principal
                  de la empresa evaluada.
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
              className={styles.companyForm}
              onSubmit={handleSubmit}
            >
              <div className={styles.formGrid}>
                <label
                  className={styles.fullField}
                >
                  Razón social *
                  <input
                    value={formValues.legalName}
                    onChange={(event) =>
                      updateFormValue(
                        'legalName',
                        event.target.value,
                      )
                    }
                    placeholder="Ej. Minera Andina del Sur S.A.C."
                    maxLength={180}
                  />
                </label>

                <label>
                  Nombre comercial
                  <input
                    value={formValues.tradeName}
                    onChange={(event) =>
                      updateFormValue(
                        'tradeName',
                        event.target.value,
                      )
                    }
                    placeholder="Nombre comercial"
                    maxLength={120}
                  />
                </label>

                <label>
                  RUC *
                  <input
                    value={formValues.ruc}
                    onChange={(event) =>
                      updateFormValue(
                        'ruc',
                        event.target.value
                          .replace(/\D/g, '')
                          .slice(0, 11),
                      )
                    }
                    placeholder="20601234567"
                    inputMode="numeric"
                    maxLength={11}
                  />
                </label>

                <label>
                  Región *
                  <input
                    value={formValues.region}
                    onChange={(event) =>
                      updateFormValue(
                        'region',
                        event.target.value,
                      )
                    }
                    placeholder="Ej. Arequipa"
                  />
                </label>

                <label>
                  Provincia
                  <input
                    value={formValues.province}
                    onChange={(event) =>
                      updateFormValue(
                        'province',
                        event.target.value,
                      )
                    }
                    placeholder="Provincia"
                  />
                </label>

                <label>
                  Distrito
                  <input
                    value={formValues.district}
                    onChange={(event) =>
                      updateFormValue(
                        'district',
                        event.target.value,
                      )
                    }
                    placeholder="Distrito"
                  />
                </label>

                <label>
                  Contacto principal
                  <input
                    value={formValues.contactName}
                    onChange={(event) =>
                      updateFormValue(
                        'contactName',
                        event.target.value,
                      )
                    }
                    placeholder="Nombre del contacto"
                  />
                </label>

                <label>
                  Correo
                  <input
                    type="email"
                    value={formValues.email}
                    onChange={(event) =>
                      updateFormValue(
                        'email',
                        event.target.value,
                      )
                    }
                    placeholder="contacto@empresa.pe"
                  />
                </label>

                <label>
                  Teléfono
                  <input
                    value={formValues.phone}
                    onChange={(event) =>
                      updateFormValue(
                        'phone',
                        event.target.value,
                      )
                    }
                    placeholder="+51 999 999 999"
                  />
                </label>

                <label>
                  Responsable ambiental
                  <input
                    value={
                      formValues.environmentalResponsible
                    }
                    onChange={(event) =>
                      updateFormValue(
                        'environmentalResponsible',
                        event.target.value,
                      )
                    }
                    placeholder="Responsable ambiental"
                  />
                </label>

                <label
                  className={styles.fullField}
                >
                  Dirección
                  <textarea
                    value={formValues.address}
                    onChange={(event) =>
                      updateFormValue(
                        'address',
                        event.target.value,
                      )
                    }
                    placeholder="Dirección fiscal u operativa"
                    rows={3}
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
                  {saving
                    ? 'Guardando...'
                    : editingCompany
                      ? 'Guardar cambios'
                      : 'Registrar empresa'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {detailsOpen && selectedCompany && (
        <div className={styles.drawerBackdrop}>
          <aside className={styles.drawer}>
            <div className={styles.drawerHeader}>
              <div>
                <span>Detalle de empresa</span>

                <h2>
                  {selectedCompany.legalName}
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setDetailsOpen(false)
                }
                aria-label="Cerrar detalle"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              <div
                className={styles.detailSummary}
              >
                <div
                  className={styles.detailIcon}
                >
                  <Building2 size={25} />
                </div>

                <div>
                  <Badge
                    value={selectedCompany.status}
                  />

                  <span>
                    RUC {selectedCompany.ruc}
                  </span>
                </div>
              </div>

              <dl className={styles.detailList}>
                <div>
                  <dt>Nombre comercial</dt>
                  <dd>
                    {selectedCompany.tradeName ||
                      'No registrado'}
                  </dd>
                </div>

                <div>
                  <dt>Ubicación</dt>
                  <dd>
                    {[
                      selectedCompany.district,
                      selectedCompany.province,
                      selectedCompany.region,
                    ]
                      .filter(Boolean)
                      .join(', ') ||
                      'No registrada'}
                  </dd>
                </div>

                <div>
                  <dt>Contacto</dt>
                  <dd>
                    {selectedCompany.contactName ||
                      'No registrado'}
                  </dd>
                </div>

                <div>
                  <dt>Correo</dt>
                  <dd>
                    {selectedCompany.email ||
                      'No registrado'}
                  </dd>
                </div>

                <div>
                  <dt>Teléfono</dt>
                  <dd>
                    {selectedCompany.phone ||
                      'No registrado'}
                  </dd>
                </div>

                <div>
                  <dt>Responsable ambiental</dt>
                  <dd>
                    {selectedCompany.environmentalResponsible ||
                      'No registrado'}
                  </dd>
                </div>

                <div>
                  <dt>Cumplimiento actual</dt>
                  <dd>
                    {
                      selectedCompany.currentCompliance
                    }
                    %
                  </dd>
                </div>

                <div>
                  <dt>Nivel de riesgo</dt>
                  <dd>
                    {selectedCompany.currentRisk}
                  </dd>
                </div>

                <div>
                  <dt>Dirección</dt>
                  <dd>
                    {selectedCompany.address ||
                      'No registrada'}
                  </dd>
                </div>
              </dl>
            </div>

            <div className={styles.drawerFooter}>
              <button
                type="button"
                className={
                  styles.secondaryButton
                }
                onClick={() =>
                  setDetailsOpen(false)
                }
              >
                Cerrar
              </button>

              <PrimaryButton
                onClick={() =>
                  openEditForm(
                    selectedCompany,
                  )
                }
              >
                <Edit3 size={17} />
                Editar empresa
              </PrimaryButton>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}