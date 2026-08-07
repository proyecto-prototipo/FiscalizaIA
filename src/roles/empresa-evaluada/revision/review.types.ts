export interface ReviewEvidenceInfo {
  id: string;

  fileName: string;

  status: string;

  aiStatus: string;

  aiConfidence?: number;

  reviewComment?: string;

  uploadedAt: string;

  reviewedAt?: string;
}


export interface ReviewEvaluationInfo {
  id: string;

  complianceStatus: string;

  riskLevel: string;

  score: number;

  validated: boolean;

  createdAt: string;
}


export interface ReviewTrackingItem {
  assignmentId: string;

  operationId: string;
  operationName: string;

  catalogId: string;

  obligationCode: string;
  obligationTitle: string;

  criticality: string;

  assignmentStatus: string;

  dueDate?: string;

  evidence?: ReviewEvidenceInfo;

  evaluation?: ReviewEvaluationInfo;

  evidencePresented: boolean;

  aiCompleted: boolean;

  fiscalizerReviewed: boolean;

  evaluationValidated: boolean;

  progress: number;

  currentStage:
    | 'Sin evidencia'
    | 'Evidencia presentada'
    | 'Análisis IA'
    | 'Revisión fiscalizadora'
    | 'Finalizado';

  lastUpdated: string;
}


export interface ReviewStatusSummary {
  total: number;

  withoutEvidence: number;

  pending: number;

  reviewing: number;

  aiCompleted: number;

  finalized: number;
}


export interface ReviewStatusFilters {
  search: string;

  operationId: string;

  stage: string;

  evidenceStatus: string;

  criticality: string;
}


export interface ReviewOperationOption {
  id: string;

  name: string;
}


export interface ReviewStatusData {
  items:
    ReviewTrackingItem[];

  operations:
    ReviewOperationOption[];

  summary:
    ReviewStatusSummary;

  lastUpdated: string;
}