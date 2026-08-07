export type ResultComplianceStatus =
  | 'Pendiente'
  | 'Cumple'
  | 'Cumple parcialmente'
  | 'No cumple'
  | 'No aplica';

export type ResultRiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico'
  | 'No determinado';

export type ResultStatus =
  | 'Borrador'
  | 'Finalizado'
  | 'Reabierto';

export type ResultCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export interface ResultContext {
  assignmentId: string;

  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;

  obligationCode: string;
  obligationTitle: string;

  category: string;
  criticality: ResultCriticality;

  evaluationId?: string;
  evaluationScore?: number;
  evaluationComplianceStatus?: string;
  evaluationRiskLevel?: string;

  gapsCount: number;
  observationsCount: number;
  recommendationsCount: number;
}

export interface ResultRecord {
  id: string;
  assignmentId: string;
  evaluationId?: string;

  complianceStatus:
    ResultComplianceStatus;

  riskLevel:
    ResultRiskLevel;

  score: number;

  conclusion?: string;
  executiveSummary?: string;

  strengths: string[];
  findings: string[];
  pendingActions: string[];

  gapsCount: number;
  observationsCount: number;
  recommendationsCount: number;

  status: ResultStatus;

  generatedBy?: string;
  finalizedBy?: string;
  finalizedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ResultItem
  extends ResultRecord {
  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;

  obligationCode: string;
  obligationTitle: string;

  category: string;
  criticality: ResultCriticality;
}

export interface ResultFormValues {
  id?: string;

  assignmentId: string;
  evaluationId: string;

  complianceStatus:
    ResultComplianceStatus;

  riskLevel:
    ResultRiskLevel;

  score: number;

  conclusion: string;
  executiveSummary: string;

  strengthsText: string;
  findingsText: string;
  pendingActionsText: string;

  status: ResultStatus;
}

export interface ResultFilters {
  search: string;

  companyId: string;
  operationId: string;

  complianceStatus:
    ResultComplianceStatus | '';

  riskLevel:
    ResultRiskLevel | '';

  status:
    ResultStatus | '';
}

export interface ResultSummary {
  total: number;
  drafts: number;
  finalized: number;
  compliant: number;
  partial: number;
  nonCompliant: number;
  criticalRisk: number;
  averageScore: number;
}

export interface ResultRow {
  id: string;
  assignment_id: string;
  evaluation_id: string | null;

  compliance_status:
    ResultComplianceStatus;

  risk_level:
    ResultRiskLevel;

  score: number | string;

  conclusion: string | null;
  executive_summary: string | null;

  strengths: unknown;
  findings: unknown;
  pending_actions: unknown;

  gaps_count: number;
  observations_count: number;
  recommendations_count: number;

  status: ResultStatus;

  generated_by: string | null;
  finalized_by: string | null;
  finalized_at: string | null;

  created_at: string;
  updated_at: string;
}