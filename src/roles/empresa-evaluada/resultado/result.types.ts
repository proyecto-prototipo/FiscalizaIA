export interface CompanyEvaluationResult {
  id: string;

  assignmentId: string;

  operationId: string;
  operationName: string;

  catalogId: string;

  obligationCode: string;
  obligationTitle: string;

  complianceStatus: string;

  riskLevel: string;

  score: number;

  validated: boolean;

  validatedAt?: string;

  evaluationComment?: string;

  correctiveAction?: string;

  createdAt: string;

  gapsCount: number;

  observationsCount: number;

  recommendationsCount: number;
}


export interface ResultSummary {
  total: number;

  validated: number;

  compliant: number;

  partial: number;

  nonCompliant: number;

  pending: number;

  averageScore: number;

  highRisk: number;

  gaps: number;

  observations: number;

  recommendations: number;
}


export interface ResultFilters {
  search: string;

  operationId: string;

  complianceStatus: string;

  riskLevel: string;

  onlyValidated: boolean;
}


export interface ResultOperationOption {
  id: string;

  name: string;
}


export interface CompanyResultData {
  results:
    CompanyEvaluationResult[];

  operations:
    ResultOperationOption[];

  summary:
    ResultSummary;

  overallCompliance: string;

  overallRisk: string;

  lastUpdated: string;
}