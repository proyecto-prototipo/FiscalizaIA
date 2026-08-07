export type ReportType =
  | 'Ejecutivo'
  | 'Cumplimiento'
  | 'Brechas y riesgos'
  | 'Seguimiento';

export type ReportStatus =
  | 'Borrador'
  | 'Generado'
  | 'Emitido'
  | 'Archivado';

export type ReportComplianceLevel =
  | 'Pendiente'
  | 'Cumple'
  | 'Cumple parcialmente'
  | 'No cumple'
  | 'No aplica';

export type ReportRiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico'
  | 'No determinado';

export interface ReportResultSnapshot {
  obligation_code?: string;
  obligation_title?: string;

  compliance_status?: string;
  risk_level?: string;

  score?: number;
  conclusion?: string;
}

export interface ReportContext {
  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;

  totalResults: number;

  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;

  gapsCount: number;
  observationsCount: number;
  recommendationsCount: number;

  averageScore: number;

  complianceLevel:
    ReportComplianceLevel;

  riskLevel:
    ReportRiskLevel;

  resultsSnapshot:
    ReportResultSnapshot[];
}

export interface ReportRecord {
  id: string;

  companyId: string;
  operationId?: string;

  title: string;
  reportType: ReportType;

  periodStart?: string;
  periodEnd?: string;

  status: ReportStatus;

  executiveSummary?: string;
  conclusions?: string;

  overallScore: number;

  complianceLevel:
    ReportComplianceLevel;

  riskLevel:
    ReportRiskLevel;

  totalResults: number;
  compliantCount: number;
  partialCount: number;
  nonCompliantCount: number;

  gapsCount: number;
  observationsCount: number;
  recommendationsCount: number;

  complianceSnapshot:
    Record<string, unknown>;

  riskSnapshot:
    Record<string, unknown>;

  resultsSnapshot:
    ReportResultSnapshot[];

  generatedBy?: string;
  issuedBy?: string;
  issuedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ReportItem
  extends ReportRecord {
  companyName: string;
  operationName?: string;
}

export interface ReportFormValues {
  id?: string;

  companyId: string;
  operationId: string;

  title: string;
  reportType: ReportType;

  periodStart: string;
  periodEnd: string;

  status: ReportStatus;

  executiveSummary: string;
  conclusions: string;
}

export interface ReportFilters {
  search: string;

  companyId: string;
  operationId: string;

  reportType: ReportType | '';
  status: ReportStatus | '';

  complianceLevel:
    ReportComplianceLevel | '';
}

export interface ReportSummary {
  total: number;
  drafts: number;
  generated: number;
  issued: number;
  archived: number;
  critical: number;
  averageScore: number;
}

export interface ReportRow {
  id: string;

  company_id: string;
  operation_id: string | null;

  title: string;
  report_type: ReportType;

  period_start: string | null;
  period_end: string | null;

  status: ReportStatus;

  executive_summary: string | null;
  conclusions: string | null;

  overall_score: number | string;

  compliance_level:
    ReportComplianceLevel;

  risk_level:
    ReportRiskLevel;

  total_results: number;
  compliant_count: number;
  partial_count: number;
  non_compliant_count: number;

  gaps_count: number;
  observations_count: number;
  recommendations_count: number;

  compliance_snapshot: unknown;
  risk_snapshot: unknown;
  results_snapshot: unknown;

  generated_by: string | null;
  issued_by: string | null;
  issued_at: string | null;

  created_at: string;
  updated_at: string;
}