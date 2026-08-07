export type CompanyStatus =
  | 'Registrada'
  | 'En evaluación'
  | 'Observada'
  | 'Validada';

export type RiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico';

export interface Company {
  id: string;
  legalName: string;
  tradeName?: string;
  ruc: string;
  region?: string;
  province?: string;
  district?: string;
  address?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  environmentalResponsible?: string;
  status: CompanyStatus;
  active: boolean;
  currentCompliance: number;
  currentRisk: RiskLevel;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyRow {
  id: string;
  legal_name: string;
  trade_name: string | null;
  ruc: string;
  region: string | null;
  province: string | null;
  district: string | null;
  address: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  environmental_responsible: string | null;
  status: CompanyStatus | null;
  active: boolean;
  current_compliance: number | string | null;
  current_risk: RiskLevel | null;
  created_at: string;
  updated_at: string;
}

export interface CompanyFormValues {
  legalName: string;
  tradeName: string;
  ruc: string;
  region: string;
  province: string;
  district: string;
  address: string;
  contactName: string;
  email: string;
  phone: string;
  environmentalResponsible: string;
}