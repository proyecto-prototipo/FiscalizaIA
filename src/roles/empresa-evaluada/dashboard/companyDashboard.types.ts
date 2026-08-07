export interface CompanyDashboardSummary {
  operations: number;

  obligations: number;
  pendingObligations: number;
  completedObligations: number;

  evidences: number;
  pendingEvidences: number;
  approvedEvidences: number;

  observations: number;
  gaps: number;
  recommendations: number;

  results: number;

  averageScore: number;
  complianceRate: number;
}

export interface CompanyComplianceData {
  compliant: number;
  partial: number;
  nonCompliant: number;
  pending: number;
}

export interface CompanyRiskData {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface CompanyEvidenceData {
  pending: number;
  reviewing: number;
  approved: number;
  observed: number;
  rejected: number;
}

export interface CompanyObligationData {
  pending: number;
  inProgress: number;
  completed: number;
  expired: number;
}

export interface CompanyDashboardActivity {
  id: string;

  type:
    | 'Evidencia'
    | 'Evaluación'
    | 'Brecha'
    | 'Observación'
    | 'Recomendación';

  title: string;
  description: string;

  createdAt: string;
  route: string;

  severity:
    | 'normal'
    | 'success'
    | 'warning'
    | 'critical';
}

export interface CompanyDashboardData {
  companyId: string;

  companyName: string;

  summary: CompanyDashboardSummary;

  compliance: CompanyComplianceData;

  risks: CompanyRiskData;

  evidences: CompanyEvidenceData;

  obligations: CompanyObligationData;

  recentActivity:
    CompanyDashboardActivity[];

  lastUpdated: string;
}