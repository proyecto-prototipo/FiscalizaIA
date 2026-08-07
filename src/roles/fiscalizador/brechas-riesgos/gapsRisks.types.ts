export type GapRiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico'
  | 'No determinado';

export type GapStatus =
  | 'Abierta'
  | 'En tratamiento'
  | 'Pendiente de verificación'
  | 'Cerrada'
  | 'Descartada';

export type GapSource =
  | 'Manual'
  | 'IA'
  | 'Evaluación';

export type GapPriority =
  | 'Baja'
  | 'Media'
  | 'Alta'
  | 'Urgente';

export type GapProbability =
  | 'Baja'
  | 'Media'
  | 'Alta';

export type GapImpact =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico';

export type GapCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export interface GapEvidenceOption {
  id: string;
  assignmentId: string;

  fileName: string;
  storagePath: string;
  version: number;

  status: string;
  aiStatus: string;

  uploadedAt: string;
}

export interface GapAiAnalysisOption {
  id: string;
  evidenceId: string;

  model: string;
  processingStatus: string;

  complianceStatus: string;
  riskLevel: GapRiskLevel;

  confidence?: number;
  documentSummary?: string;

  breaches: string[];
  observations: string[];
  recommendations: string[];

  humanStatus: string;
  createdAt: string;
}

export interface GapEvaluationOption {
  id: string;
  assignmentId: string;

  evidenceId?: string;
  aiAnalysisId?: string;

  complianceStatus: string;
  riskLevel: GapRiskLevel;

  score: number;
  validated: boolean;

  evaluationComment?: string;
  correctiveAction?: string;

  createdAt: string;
  updatedAt: string;
}

export interface GapAssignmentContext {
  assignmentId: string;

  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;
  operationCode?: string;

  catalogId: string;
  obligationCode: string;
  obligationTitle: string;
  obligationDescription?: string;

  category: string;
  criticality: GapCriticality;
  requiredEvidence: string;

  dueDate?: string;
  assignmentStatus: string;

  evidences: GapEvidenceOption[];
  aiAnalyses: GapAiAnalysisOption[];
  evaluation?: GapEvaluationOption;

  latestEvidence?: GapEvidenceOption;
  latestAiAnalysis?: GapAiAnalysisOption;
}

export interface GapRecord {
  id: string;
  assignmentId: string;

  evaluationId?: string;
  evidenceId?: string;
  aiAnalysisId?: string;

  title: string;
  description?: string;

  riskLevel: GapRiskLevel;
  status: GapStatus;

  source: GapSource;
  priority: GapPriority;
  probability: GapProbability;
  impact: GapImpact;

  technicalBasis?: string;
  treatmentMeasure?: string;
  responsibleName?: string;
  dueDate?: string;

  detectedBy?: string;

  closedBy?: string;
  closedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface GapRiskItem extends GapRecord {
  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;
  operationCode?: string;

  obligationCode: string;
  obligationTitle: string;
  obligationDescription?: string;

  category: string;
  criticality: GapCriticality;
  requiredEvidence: string;

  evidence?: GapEvidenceOption;
  aiAnalysis?: GapAiAnalysisOption;
  evaluation?: GapEvaluationOption;
}

export interface GapFormValues {
  id?: string;

  assignmentId: string;

  evaluationId: string;
  evidenceId: string;
  aiAnalysisId: string;

  title: string;
  description: string;

  riskLevel: GapRiskLevel;
  status: GapStatus;

  source: GapSource;
  priority: GapPriority;
  probability: GapProbability;
  impact: GapImpact;

  technicalBasis: string;
  treatmentMeasure: string;
  responsibleName: string;
  dueDate: string;
}

export interface GapFilters {
  search: string;

  companyId: string;
  operationId: string;

  riskLevel: GapRiskLevel | '';
  status: GapStatus | '';
  source: GapSource | '';
  priority: GapPriority | '';

  overdueOnly: boolean;
}

export interface GapSummary {
  total: number;
  open: number;
  inTreatment: number;
  pendingVerification: number;
  closed: number;
  highRisk: number;
  urgent: number;
  overdue: number;
}

export interface GapAssignmentRow {
  id: string;
  company_id: string;
  operation_id: string;
  catalog_id: string;

  due_date: string | null;
  status: string;


}

export interface GapRow {
  id: string;
  assignment_id: string;

  evaluation_id: string | null;
  evidence_id: string | null;
  ai_analysis_id: string | null;

  title: string;
  description: string | null;

  risk_level: GapRiskLevel;
  status: GapStatus;

  source: GapSource;
  priority: GapPriority;
  probability: GapProbability;
  impact: GapImpact;

  technical_basis: string | null;
  treatment_measure: string | null;
  responsible_name: string | null;
  due_date: string | null;

  detected_by: string | null;

  closed_by: string | null;
  closed_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface GapEvidenceRow {
  id: string;
  assignment_id: string;

  file_name: string;
  storage_path: string;
  version: number;

  status: string;
  ai_status: string | null;

  uploaded_at: string;
}

export interface GapAiAnalysisRow {
  id: string;
  evidence_id: string;

  model: string;
  processing_status: string;

  compliance_status: string;
  risk_level: GapRiskLevel;

  confidence: number | string | null;
  document_summary: string | null;

  breaches: unknown;
  observations: unknown;
  recommendations: unknown;

  human_status: string;
  created_at: string;
}

export interface GapEvaluationRow {
  id: string;
  assignment_id: string;

  evidence_id: string | null;
  ai_analysis_id: string | null;

  compliance_status: string;
  risk_level: GapRiskLevel;

  score: number | string;
  validated: boolean;

  evaluation_comment: string | null;
  corrective_action: string | null;

  created_at: string;
  updated_at: string;
}