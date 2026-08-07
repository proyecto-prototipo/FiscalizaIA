export type ObservationType =
  | 'Técnica'
  | 'Documentaria'
  | 'Operativa'
  | 'Legal'
  | 'Ambiental'
  | 'Seguridad'
  | 'Otra';

export type ObservationSeverity =
  | 'Baja'
  | 'Media'
  | 'Alta'
  | 'Crítica';

export type ObservationStatus =
  | 'Abierta'
  | 'Notificada'
  | 'Respondida'
  | 'En verificación'
  | 'Subsanada'
  | 'No subsanada'
  | 'Cerrada'
  | 'Descartada';

export type ObservationSource =
  | 'Manual'
  | 'IA'
  | 'Evaluación'
  | 'Brecha';

export type ObservationCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export interface ObservationEvidenceOption {
  id: string;
  assignmentId: string;

  fileName: string;
  storagePath: string;
  version: number;

  status: string;
  aiStatus: string;
  uploadedAt: string;
}

export interface ObservationAiOption {
  id: string;
  evidenceId: string;

  model: string;
  processingStatus: string;
  complianceStatus: string;
  riskLevel: string;

  confidence?: number;
  documentSummary?: string;

  observations: string[];
  recommendations: string[];

  humanStatus: string;
  createdAt: string;
}

export interface ObservationEvaluationOption {
  id: string;
  assignmentId: string;

  evidenceId?: string;
  aiAnalysisId?: string;

  complianceStatus: string;
  riskLevel: string;
  score: number;
  validated: boolean;

  evaluationComment?: string;
  correctiveAction?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ObservationGapOption {
  id: string;
  assignmentId: string;

  evaluationId?: string;
  evidenceId?: string;
  aiAnalysisId?: string;

  title: string;
  description?: string;

  riskLevel: string;
  status: string;
  priority: string;

  technicalBasis?: string;
  treatmentMeasure?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ObservationAssignmentContext {
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
  criticality: ObservationCriticality;
  requiredEvidence: string;

  assignmentStatus: string;
  dueDate?: string;

  evidences: ObservationEvidenceOption[];
  aiAnalyses: ObservationAiOption[];
  gaps: ObservationGapOption[];

  evaluation?: ObservationEvaluationOption;

  latestEvidence?: ObservationEvidenceOption;
  latestAiAnalysis?: ObservationAiOption;
}

export interface ObservationRecord {
  id: string;
  assignmentId: string;

  evaluationId?: string;
  gapId?: string;
  evidenceId?: string;
  aiAnalysisId?: string;

  title: string;
  description?: string;

  /**
   * Campo heredado de la tabla original.
   * Se mantiene sincronizado con description.
   */
  text: string;

  observationType: ObservationType;
  severity: ObservationSeverity;
  status: ObservationStatus;
  source: ObservationSource;

  requiresResponse: boolean;
  validated: boolean;

  responsibleName?: string;
  dueDate?: string;

  companyResponse?: string;
  responseEvidencePath?: string;
  respondedBy?: string;
  respondedAt?: string;

  verificationComment?: string;

  createdBy?: string;
  verifiedBy?: string;
  verifiedAt?: string;

  closedBy?: string;
  closedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface ObservationItem
  extends ObservationRecord {
  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;
  operationCode?: string;

  obligationCode: string;
  obligationTitle: string;
  obligationDescription?: string;

  category: string;
  criticality: ObservationCriticality;
  requiredEvidence: string;

  evidence?: ObservationEvidenceOption;
  aiAnalysis?: ObservationAiOption;
  evaluation?: ObservationEvaluationOption;
  gap?: ObservationGapOption;
}

export interface ObservationFormValues {
  id?: string;

  assignmentId: string;

  evaluationId: string;
  gapId: string;
  evidenceId: string;
  aiAnalysisId: string;

  title: string;
  description: string;

  observationType: ObservationType;
  severity: ObservationSeverity;
  status: ObservationStatus;
  source: ObservationSource;

  requiresResponse: boolean;

  responsibleName: string;
  dueDate: string;

  verificationComment: string;
}

export interface ObservationFilters {
  search: string;

  companyId: string;
  operationId: string;

  observationType: ObservationType | '';
  severity: ObservationSeverity | '';
  status: ObservationStatus | '';
  source: ObservationSource | '';

  overdueOnly: boolean;
  pendingResponseOnly: boolean;
}

export interface ObservationSummary {
  total: number;
  open: number;
  notified: number;
  responded: number;
  pendingVerification: number;
  resolved: number;
  critical: number;
  overdue: number;
}

export interface ObservationAssignmentRow {
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
        criticality: ObservationCriticality;
        required_evidence: string;
        active: boolean | null;
      }
    | {
        id: string;
        code: string;
        title: string;
        description: string | null;
        category: string;
        criticality: ObservationCriticality;
        required_evidence: string;
        active: boolean | null;
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

export interface ObservationRow {
  id: string;
  assignment_id: string;

  evaluation_id: string | null;
  gap_id: string | null;
  evidence_id: string | null;
  ai_analysis_id: string | null;

  title: string | null;
  description: string | null;

  source: ObservationSource;
  text: string;
  validated: boolean;

  observation_type: ObservationType | null;
  severity: ObservationSeverity | null;
  status: ObservationStatus | null;

  requires_response: boolean | null;

  responsible_name: string | null;
  due_date: string | null;

  company_response: string | null;
  response_evidence_path: string | null;
  responded_by: string | null;
  responded_at: string | null;

  verification_comment: string | null;

  created_by: string | null;
  verified_by: string | null;
  verified_at: string | null;

  closed_by: string | null;
  closed_at: string | null;

  created_at: string;
  updated_at: string | null;
}

export interface ObservationEvidenceRow {
  id: string;
  assignment_id: string;

  file_name: string;
  storage_path: string;
  version: number;

  status: string;
  ai_status: string | null;

  uploaded_at: string;
}

export interface ObservationAiRow {
  id: string;
  evidence_id: string;

  model: string;
  processing_status: string;

  compliance_status: string;
  risk_level: string;

  confidence: number | string | null;
  document_summary: string | null;

  observations: unknown;
  recommendations: unknown;

  human_status: string;
  created_at: string;
}

export interface ObservationEvaluationRow {
  id: string;
  assignment_id: string;

  evidence_id: string | null;
  ai_analysis_id: string | null;

  compliance_status: string;
  risk_level: string;

  score: number | string;
  validated: boolean;

  evaluation_comment: string | null;
  corrective_action: string | null;

  created_at: string;
  updated_at: string;
}

export interface ObservationGapRow {
  id: string;
  assignment_id: string;

  evaluation_id: string | null;
  evidence_id: string | null;
  ai_analysis_id: string | null;

  title: string;
  description: string | null;

  risk_level: string;
  status: string;
  priority: string;

  technical_basis: string | null;
  treatment_measure: string | null;

  created_at: string;
  updated_at: string;
}