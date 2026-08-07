import { supabase } from '../../../services/supabase';
import { companies as demoCompanies } from '../../../shared/demo/data';

import type {
  Company,
  CompanyFormValues,
  CompanyRow,
} from './companies.types';

const demoMode =
  import.meta.env.VITE_DEMO_MODE === 'true';

/**
 * Convierte la estructura de Supabase a la estructura
 * utilizada por el frontend.
 */
function mapCompany(row: CompanyRow): Company {
  return {
    id: row.id,
    legalName: row.legal_name,
    tradeName: row.trade_name ?? undefined,
    ruc: row.ruc,
    region: row.region ?? undefined,
    province: row.province ?? undefined,
    district: row.district ?? undefined,
    address: row.address ?? undefined,
    contactName: row.contact_name ?? undefined,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    environmentalResponsible:
      row.environmental_responsible ?? undefined,
    status: row.status ?? 'Registrada',
    active: row.active,
    currentCompliance: Number(
      row.current_compliance ?? 0,
    ),
    currentRisk: row.current_risk ?? 'Bajo',
    createdAt: row.created_at,
    updatedAt:
      row.updated_at ?? row.created_at,
  };
}

/**
 * Adapta los datos demostrativos antiguos al nuevo
 * modelo del módulo Empresas.
 */
function mapDemoCompanies(): Company[] {
  return demoCompanies.map((company) => ({
    id: company.id,
    legalName: company.legalName,
    tradeName: undefined,
    ruc: company.ruc,
    region: company.region,
    province: undefined,
    district: undefined,
    address: undefined,
    contactName: undefined,
    email: undefined,
    phone: undefined,
    environmentalResponsible: undefined,
    status:
      company.status === 'Activa'
        ? 'Registrada'
        : 'Observada',
    active: company.status === 'Activa',
    currentCompliance:
      Number(company.compliance ?? 0),
    currentRisk:
      company.risk ?? 'Bajo',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
}

/**
 * Obtiene todas las empresas registradas.
 */
export async function listCompanies(): Promise<Company[]> {
  if (demoMode) {
    return mapDemoCompanies();
  }

  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      legal_name,
      trade_name,
      ruc,
      region,
      province,
      district,
      address,
      contact_name,
      email,
      phone,
      environmental_responsible,
      status,
      active,
      current_compliance,
      current_risk,
      created_at,
      updated_at
    `)
    .order('created_at', {
      ascending: false,
    });

  if (error) {
    throw new Error(
      `No se pudieron cargar las empresas: ${error.message}`,
    );
  }

  return (data as CompanyRow[]).map(mapCompany);
}

/**
 * Obtiene una empresa mediante su identificador.
 */
export async function getCompanyById(
  companyId: string,
): Promise<Company> {
  if (demoMode) {
    const company = mapDemoCompanies().find(
      (item) => item.id === companyId,
    );

    if (!company) {
      throw new Error(
        'No se encontró la empresa solicitada.',
      );
    }

    return company;
  }

  const { data, error } = await supabase
    .from('companies')
    .select(`
      id,
      legal_name,
      trade_name,
      ruc,
      region,
      province,
      district,
      address,
      contact_name,
      email,
      phone,
      environmental_responsible,
      status,
      active,
      current_compliance,
      current_risk,
      created_at,
      updated_at
    `)
    .eq('id', companyId)
    .single();

  if (error) {
    throw new Error(
      `No se pudo obtener la empresa: ${error.message}`,
    );
  }

  return mapCompany(data as CompanyRow);
}

/**
 * Registra una nueva empresa.
 */
export async function createCompany(
  input: CompanyFormValues,
): Promise<Company> {
  if (demoMode) {
    const now = new Date().toISOString();

    return {
      id: crypto.randomUUID(),
      legalName: input.legalName.trim(),
      tradeName:
        input.tradeName.trim() || undefined,
      ruc: input.ruc.trim(),
      region:
        input.region.trim() || undefined,
      province:
        input.province.trim() || undefined,
      district:
        input.district.trim() || undefined,
      address:
        input.address.trim() || undefined,
      contactName:
        input.contactName.trim() || undefined,
      email:
        input.email.trim() || undefined,
      phone:
        input.phone.trim() || undefined,
      environmentalResponsible:
        input.environmentalResponsible.trim() ||
        undefined,
      status: 'Registrada',
      active: true,
      currentCompliance: 0,
      currentRisk: 'Bajo',
      createdAt: now,
      updatedAt: now,
    };
  }

  const { data, error } = await supabase
    .from('companies')
    .insert({
      legal_name: input.legalName.trim(),
      trade_name:
        input.tradeName.trim() || null,
      ruc: input.ruc.trim(),
      region:
        input.region.trim() || null,
      province:
        input.province.trim() || null,
      district:
        input.district.trim() || null,
      address:
        input.address.trim() || null,
      contact_name:
        input.contactName.trim() || null,
      email:
        input.email.trim() || null,
      phone:
        input.phone.trim() || null,
      environmental_responsible:
        input.environmentalResponsible.trim() ||
        null,
      status: 'Registrada',
      active: true,
      current_compliance: 0,
      current_risk: 'Bajo',
    })
    .select(`
      id,
      legal_name,
      trade_name,
      ruc,
      region,
      province,
      district,
      address,
      contact_name,
      email,
      phone,
      environmental_responsible,
      status,
      active,
      current_compliance,
      current_risk,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'Ya existe una empresa registrada con ese RUC.',
      );
    }

    throw new Error(
      `No se pudo registrar la empresa: ${error.message}`,
    );
  }

  return mapCompany(data as CompanyRow);
}

/**
 * Actualiza los datos de una empresa.
 */
export async function updateCompany(
  companyId: string,
  input: CompanyFormValues,
): Promise<Company> {
  if (demoMode) {
    return {
      id: companyId,
      legalName: input.legalName.trim(),
      tradeName:
        input.tradeName.trim() || undefined,
      ruc: input.ruc.trim(),
      region:
        input.region.trim() || undefined,
      province:
        input.province.trim() || undefined,
      district:
        input.district.trim() || undefined,
      address:
        input.address.trim() || undefined,
      contactName:
        input.contactName.trim() || undefined,
      email:
        input.email.trim() || undefined,
      phone:
        input.phone.trim() || undefined,
      environmentalResponsible:
        input.environmentalResponsible.trim() ||
        undefined,
      status: 'Registrada',
      active: true,
      currentCompliance: 0,
      currentRisk: 'Bajo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const { data, error } = await supabase
    .from('companies')
    .update({
      legal_name: input.legalName.trim(),
      trade_name:
        input.tradeName.trim() || null,
      ruc: input.ruc.trim(),
      region:
        input.region.trim() || null,
      province:
        input.province.trim() || null,
      district:
        input.district.trim() || null,
      address:
        input.address.trim() || null,
      contact_name:
        input.contactName.trim() || null,
      email:
        input.email.trim() || null,
      phone:
        input.phone.trim() || null,
      environmental_responsible:
        input.environmentalResponsible.trim() ||
        null,
    })
    .eq('id', companyId)
    .select(`
      id,
      legal_name,
      trade_name,
      ruc,
      region,
      province,
      district,
      address,
      contact_name,
      email,
      phone,
      environmental_responsible,
      status,
      active,
      current_compliance,
      current_risk,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'Ya existe una empresa registrada con ese RUC.',
      );
    }

    throw new Error(
      `No se pudo actualizar la empresa: ${error.message}`,
    );
  }

  return mapCompany(data as CompanyRow);
}

/**
 * Activa o desactiva una empresa.
 * No elimina registros de manera física.
 */
export async function changeCompanyStatus(
  companyId: string,
  active: boolean,
): Promise<Company | null> {
  if (demoMode) {
    return null;
  }

  const { data, error } = await supabase
    .from('companies')
    .update({
      active,
    })
    .eq('id', companyId)
    .select(`
      id,
      legal_name,
      trade_name,
      ruc,
      region,
      province,
      district,
      address,
      contact_name,
      email,
      phone,
      environmental_responsible,
      status,
      active,
      current_compliance,
      current_risk,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(
      `No se pudo cambiar el estado de la empresa: ${error.message}`,
    );
  }

  return mapCompany(data as CompanyRow);
}

/**
 * Actualiza la etapa de evaluación de una empresa.
 */
export async function updateCompanyEvaluationStatus(
  companyId: string,
  status: Company['status'],
): Promise<Company | null> {
  if (demoMode) {
    return null;
  }

  const { data, error } = await supabase
    .from('companies')
    .update({
      status,
    })
    .eq('id', companyId)
    .select(`
      id,
      legal_name,
      trade_name,
      ruc,
      region,
      province,
      district,
      address,
      contact_name,
      email,
      phone,
      environmental_responsible,
      status,
      active,
      current_compliance,
      current_risk,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    throw new Error(
      `No se pudo actualizar el estado de evaluación: ${error.message}`,
    );
  }

  return mapCompany(data as CompanyRow);
}