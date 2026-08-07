export interface DashboardSummary {
  companies: number;
  operations: number;
  obligations: number;

  evidences: number;
  pendingEvidences: number;

  aiAnalyses: number;

  evaluations: number;
  validatedEvaluations: number;

  gaps: number;
  criticalGaps: number;
  openGaps: number;

  observations: number;
  recommendations: number;

  results: number;
  reports: number;

  averageScore: number;
  complianceRate: number;
}

export interface DashboardComplianceData {
  compliant: number;
  partial: number;
  nonCompliant: number;
  pending: number;
}

export interface DashboardRiskData {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface DashboardEvidenceData {
  pending: number;
  reviewing: number;
  approved: number;
  observed: number;
  rejected: number;
}

export interface DashboardGapStatusData {
  open: number;
  treatment: number;
  verifying: number;
  closed: number;
}

export interface DashboardOperationItem {
  id: string;

  companyName: string;
  operationName: string;

  obligations: number;
  evidences: number;
  gaps: number;

  averageScore: number;

  riskLevel:
    | 'Bajo'
    | 'Medio'
    | 'Alto'
    | 'Crítico'
    | 'No determinado';
}

export interface DashboardRecentActivity {
  id: string;

  type:
    | 'Evidencia'
    | 'Evaluación'
    | 'Brecha'
    | 'Observación'
    | 'Recomendación'
    | 'Reporte';

  title: string;
  description: string;

  route: string;

  createdAt: string;

  severity:
    | 'normal'
    | 'success'
    | 'warning'
    | 'critical';
}

export interface DashboardData {
  summary: DashboardSummary;

  compliance: DashboardComplianceData;

  risks: DashboardRiskData;

  evidences: DashboardEvidenceData;

  gapStatus: DashboardGapStatusData;

  operations: DashboardOperationItem[];

  recentActivity: DashboardRecentActivity[];

  lastUpdated: string;
}