export type EvaluationComplianceStatus =
  | 'Pendiente'
  | 'Cumple'
  | 'Cumple parcialmente'
  | 'No cumple'
  | 'No determinado';

export type EvaluationRiskLevel =
  | 'Pendiente'
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico'
  | 'No determinado';

export type EvaluationCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export type EvaluationEvidenceStatus =
  | 'Pendiente'
  | 'En revisión'
  | 'Aprobada'
  | 'Observada'
  | 'Rechazada';

export type EvaluationAiStatus =
  | 'Pendiente'
  | 'Procesando'
  | 'Completado'
  | 'Error';

export interface EvaluationEvidenceOption {
  id: string;
  assignmentId: string;

  fileName: string;
  storagePath: string;
  version: number;

  status: EvaluationEvidenceStatus;
  aiStatus: EvaluationAiStatus;

  uploadedAt: string;
}

export interface EvaluationAiOption {
  id: string;
  evidenceId: string;

  model: string;

  complianceStatus:
    EvaluationComplianceStatus;

  riskLevel:
    EvaluationRiskLevel;

  confidence?: number;

  processingStatus:
    EvaluationAiStatus;

  humanStatus: string;

  documentSummary?: string;

  createdAt: string;
}

export interface EvaluationRecord {
  id: string;
  assignmentId: string;

  evidenceId?: string;
  aiAnalysisId?: string;

  complianceStatus:
    EvaluationComplianceStatus;

  riskLevel:
    EvaluationRiskLevel;

  score: number;

  validated: boolean;
  validatedBy?: string;
  validatedAt?: string;

  evaluationComment?: string;
  correctiveAction?: string;

  createdAt: string;
  updatedAt: string;
}

export interface EvaluationItem {
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
  criticality: EvaluationCriticality;
  requiredEvidence: string;

  dueDate?: string;
  assignmentStatus: string;

  evidences: EvaluationEvidenceOption[];
  aiAnalyses: EvaluationAiOption[];

  latestEvidence?: EvaluationEvidenceOption;
  latestAiAnalysis?: EvaluationAiOption;

  evaluation?: EvaluationRecord;
}

export interface EvaluationFormValues {
  assignmentId: string;

  evidenceId: string;
  aiAnalysisId: string;

  complianceStatus:
    EvaluationComplianceStatus;

  riskLevel:
    EvaluationRiskLevel;

  score: number;

  evaluationComment: string;
  correctiveAction: string;

  validated: boolean;
}

export interface EvaluationFilters {
  search: string;
  companyId: string;
  operationId: string;

  complianceStatus:
    EvaluationComplianceStatus | '';

  riskLevel:
    EvaluationRiskLevel | '';

  validationStatus:
    | ''
    | 'Pendiente'
    | 'Validada';
}

export interface EvaluationSummary {
  total: number;
  pending: number;
  evaluated: number;
  validated: number;
  nonCompliant: number;
  highRisk: number;
  averageScore: number;
}

export interface EvaluationAssignmentRow {
  id: string;
  company_id: string;
  operation_id: string;
  catalog_id: string;

  due_date: string | null;
  status: string;

  mining_operations:
    | {
        id: string;
        name: string;
        code: string | null;
        internal_code: string | null;
        company_id: string;
      }
    | {
        id: string;
        name: string;
        code: string | null;
        internal_code: string | null;
        company_id: string;
      }[]
    | null;

  obligation_catalog:
    | {
        id: string;
        code: string;
        title: string;
        description: string | null;
        category: string;
        criticality: EvaluationCriticality;
        required_evidence: string;
        active: boolean;
      }
    | {
        id: string;
        code: string;
        title: string;
        description: string | null;
        category: string;
        criticality: EvaluationCriticality;
        required_evidence: string;
        active: boolean;
      }[]
    | null;

  companies:
    | {
        id: string;
        legal_name: string;
      }
    | {
        id: string;
        legal_name: string;
      }[]
    | null;
}

export interface EvaluationRow {
  id: string;
  assignment_id: string;

  evidence_id: string | null;
  ai_analysis_id: string | null;

  compliance_status:
    EvaluationComplianceStatus;

  risk_level:
    EvaluationRiskLevel;

  score: number | string;

  validated: boolean;

  validated_by: string | null;
  validated_at: string | null;

  evaluation_comment: string | null;
  corrective_action: string | null;

  created_at: string;
  updated_at: string;
}

export interface EvaluationEvidenceRow {
  id: string;
  assignment_id: string;

  file_name: string;
  storage_path: string;
  version: number;

  status: EvaluationEvidenceStatus;
  ai_status: EvaluationAiStatus | null;

  uploaded_at: string;
}

export interface EvaluationAiRow {
  id: string;
  evidence_id: string;

  model: string;

  compliance_status:
    EvaluationComplianceStatus;

  risk_level:
    EvaluationRiskLevel;

  confidence: number | string | null;

  processing_status:
    EvaluationAiStatus;

  human_status: string;

  document_summary: string | null;

  created_at: string;
}