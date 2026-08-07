export type GapRiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico'
  | 'No determinado'
  | string;


export type GapPriority =
  | 'Baja'
  | 'Media'
  | 'Alta'
  | 'Urgente'
  | string;


export interface CompanyGapRisk {
  id: string;

  assignmentId: string;

  operationId: string;
  operationName: string;

  catalogId: string;

  obligationCode: string;
  obligationTitle: string;

  title: string;

  description: string;

  riskLevel:
    GapRiskLevel;

  status: string;

  source: string;

  priority:
    GapPriority;

  probability: string;

  impact?: string;

  treatment?: string;

  responsible?: string;

  dueDate?: string;

  closedAt?: string;

  createdAt: string;

  updatedAt?: string;

  expired: boolean;
}


export interface GapRiskSummary {
  total: number;

  open: number;

  treatment: number;

  verifying: number;

  closed: number;

  highRisk: number;

  urgent: number;

  expired: number;
}


export interface GapRiskFilters {
  search: string;

  operationId: string;

  riskLevel: string;

  status: string;

  source: string;

  priority: string;

  onlyExpired: boolean;
}


export interface GapOperationOption {
  id: string;

  name: string;
}


export interface GapsRisksData {
  gaps:
    CompanyGapRisk[];

  operations:
    GapOperationOption[];

  summary:
    GapRiskSummary;

  lastUpdated: string;
}