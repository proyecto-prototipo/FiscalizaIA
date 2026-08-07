export type AiProcessingStatus =
  | 'Pendiente'
  | 'Procesando'
  | 'Completado'
  | 'Error';

export type AiComplianceStatus =
  | 'Pendiente'
  | 'Cumple'
  | 'Cumple parcialmente'
  | 'No cumple'
  | 'No determinado';

export type AiRiskLevel =
  | 'Pendiente'
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico'
  | 'No determinado';

export type AiHumanStatus =
  | 'Pendiente'
  | 'Validado'
  | 'Observado'
  | 'Rechazado';

export type EvidenceAiStatus =
  | 'Pendiente'
  | 'Procesando'
  | 'Completado'
  | 'Error';

export type ObligationCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export interface AiAnalysis {
  id: string;
  evidenceId: string;

  model: string;
  processingStatus: AiProcessingStatus;

  complianceStatus: AiComplianceStatus;
  riskLevel: AiRiskLevel;

  documentSummary?: string;
  documentType?: string;

  missingInformation: string[];
  inconsistencies: string[];
  breaches: string[];
  observations: string[];
  recommendations: string[];

  confidence?: number;

  humanStatus: AiHumanStatus;
  humanReviewComment?: string;
  reviewedBy?: string;
  reviewedAt?: string;

  errorMessage?: string;
  promptVersion?: string;

  createdAt: string;
  updatedAt: string;

  fileName: string;
  storagePath: string;
  evidenceVersion: number;
  evidenceStatus: string;
  evidenceAiStatus: EvidenceAiStatus;
  uploadedAt: string;

  operationId: string;
  operationName: string;
  operationCode?: string;

  assignmentId: string;

  companyId?: string;
  companyName: string;

  obligationCode: string;
  obligationTitle: string;
  obligationDescription?: string;
  obligationCategory: string;
  obligationCriticality: ObligationCriticality;
  requiredEvidence: string;
}

export interface AiCandidateEvidence {
  id: string;

  fileName: string;
  storagePath: string;
  version: number;
  status: string;
  aiStatus: EvidenceAiStatus;
  uploadedAt: string;

  operationId: string;
  operationName: string;
  operationCode?: string;

  assignmentId: string;

  companyId?: string;
  companyName: string;

  obligationCode: string;
  obligationTitle: string;
  obligationDescription?: string;
  obligationCategory: string;
  obligationCriticality: ObligationCriticality;
  requiredEvidence: string;

  latestAnalysisId?: string;
  latestProcessingStatus?: AiProcessingStatus;
}

export interface AiReviewFilters {
  search: string;
  companyId: string;
  operationId: string;
  processingStatus: AiProcessingStatus | '';
  complianceStatus: AiComplianceStatus | '';
  riskLevel: AiRiskLevel | '';
  humanStatus: AiHumanStatus | '';
}

export interface AiReviewSummary {
  totalEvidences: number;
  pending: number;
  processing: number;
  completed: number;
  errors: number;
  highRisk: number;
  pendingValidation: number;
}

export interface AiHumanReviewForm {
  humanStatus: Exclude<
    AiHumanStatus,
    'Pendiente'
  >;

  reviewComment: string;
}

export interface AnalyzeEvidenceResponse {
  success: boolean;
  analysisId?: string;
  evidenceId?: string;

  result?: {
    summary: string;
    documentType: string;
    complianceStatus: AiComplianceStatus;
    riskLevel: AiRiskLevel;
    confidence: number;
    missingInformation: string[];
    inconsistencies: string[];
    breaches: string[];
    observations: string[];
    recommendations: string[];
  };

  error?: string;
}

export interface AiAnalysisRow {
  id: string;
  evidence_id: string;

  model: string;
  processing_status: AiProcessingStatus;

  compliance_status: AiComplianceStatus;
  risk_level: AiRiskLevel;

  document_summary: string | null;
  document_type: string | null;

  missing_information: unknown;
  inconsistencies: unknown;
  breaches: unknown;
  observations: unknown;
  recommendations: unknown;

  confidence: number | string | null;

  human_status: AiHumanStatus;
  human_review_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;

  error_message: string | null;
  prompt_version: string | null;

  created_at: string;
  updated_at: string;

  evidence_documents:
    | {
        id: string;
        file_name: string;
        storage_path: string;
        version: number;
        status: string;
        ai_status: EvidenceAiStatus | null;
        uploaded_at: string;
        operation_id: string;
        assignment_id: string;

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

        obligation_assignments:
          | {
              id: string;
              company_id: string | null;

              obligation_catalog:
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
                  }
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
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
          | {
              id: string;
              company_id: string | null;

              obligation_catalog:
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
                  }
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
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
            }[]
          | null;
      }
    | {
        id: string;
        file_name: string;
        storage_path: string;
        version: number;
        status: string;
        ai_status: EvidenceAiStatus | null;
        uploaded_at: string;
        operation_id: string;
        assignment_id: string;

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

        obligation_assignments:
          | {
              id: string;
              company_id: string | null;

              obligation_catalog:
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
                  }
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
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
          | {
              id: string;
              company_id: string | null;

              obligation_catalog:
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
                  }
                | {
                    code: string;
                    title: string;
                    description: string | null;
                    category: string;
                    criticality: ObligationCriticality;
                    required_evidence: string;
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
            }[]
          | null;
      }[]
    | null;
}