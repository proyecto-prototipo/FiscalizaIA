export type CompanyObligationCriticality =
  | 'Alta'
  | 'Media'
  | 'Baja'
  | string;

export interface CompanyObligation {
  id: string;

  operationId: string;
  operationName: string;

  catalogId: string;

  code: string;
  title: string;

  description?: string;

  category: string;
  criticality: CompanyObligationCriticality;

  requiredEvidence: string;

  dueDate?: string;

  status: string;

  assignedAt?: string;
  createdAt: string;

  notes?: string;

  evidenceCount: number;

  latestEvidenceStatus?: string;

  expired: boolean;
}

export interface CompanyObligationFilters {
  search: string;

  operationId: string;

  status: string;

  criticality: string;

  category: string;

  onlyExpired: boolean;
}

export interface CompanyObligationSummary {
  total: number;

  pending: number;

  inProgress: number;

  completed: number;

  expired: number;

  highCriticality: number;

  withEvidence: number;

  withoutEvidence: number;
}

export interface CompanyOperationOption {
  id: string;
  name: string;
}

export interface CompanyObligationsData {
  obligations:
    CompanyObligation[];

  operations:
    CompanyOperationOption[];

  summary:
    CompanyObligationSummary;

  lastUpdated: string;
}