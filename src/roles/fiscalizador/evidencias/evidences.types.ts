export type EvidenceStatus =
  | 'Pendiente'
  | 'En revisión'
  | 'Aprobada'
  | 'Observada'
  | 'Rechazada';

export type EvidenceAiStatus =
  | 'Pendiente'
  | 'Procesando'
  | 'Completado'
  | 'Error';

export type ObligationCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export interface EvidenceDocument {
  id: string;

  operationId: string;
  operationName: string;
  operationCode?: string;

  assignmentId: string;

  catalogId: string;
  obligationCode: string;
  obligationTitle: string;
  obligationCategory: string;
  obligationCriticality: ObligationCriticality;
  requiredEvidence: string;

  companyId?: string;
  companyName: string;

  fileName: string;
  storagePath: string;
  version: number;

  replacesEvidenceId?: string;

  status: EvidenceStatus;

  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt: string;

  reviewComment?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;

  aiStatus: EvidenceAiStatus;
  aiResult?: EvidenceAiResult;
  aiConfidence?: number;

  updatedAt?: string;
}

export interface EvidenceAiResult {
  summary?: string;
  findings?: string[];
  missingItems?: string[];
  recommendations?: string[];
  complianceLevel?: string;
  riskLevel?: string;
  rawResponse?: string;
}

export interface EvidenceReviewFormValues {
  status: EvidenceStatus;
  reviewComment: string;
}

export interface EvidenceFilters {
  search: string;
  companyId: string;
  operationId: string;
  assignmentId: string;
  status: EvidenceStatus | '';
  criticality: ObligationCriticality | '';
}

export interface EvidenceSummary {
  total: number;
  pending: number;
  inReview: number;
  approved: number;
  observed: number;
}

export interface EvidenceCompanyOption {
  id: string;
  name: string;
}

export interface EvidenceOperationOption {
  id: string;
  companyId?: string;
  companyName: string;
  name: string;
  internalCode?: string;
}

export interface EvidenceAssignmentOption {
  id: string;
  operationId: string;
  companyId?: string;

  obligationCode: string;
  obligationTitle: string;

  operationName: string;
  companyName: string;
}

export interface EvidenceDocumentRow {
  id: string;

  operation_id: string;
  assignment_id: string;

  file_name: string;
  storage_path: string;

  version: number;
  replaces_evidence_id: string | null;

  status: EvidenceStatus;

  uploaded_by: string | null;
  uploaded_at: string;

  review_comment: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;

  ai_status: EvidenceAiStatus | null;
  ai_result: EvidenceAiResult | null;
  ai_confidence: number | string | null;

  updated_at: string | null;

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
        catalog_id: string;
        company_id: string | null;

        obligation_catalog:
          | {
              id: string;
              code: string;
              title: string;
              category: string;
              criticality: ObligationCriticality;
              required_evidence: string;
            }
          | {
              id: string;
              code: string;
              title: string;
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
        catalog_id: string;
        company_id: string | null;

        obligation_catalog:
          | {
              id: string;
              code: string;
              title: string;
              category: string;
              criticality: ObligationCriticality;
              required_evidence: string;
            }
          | {
              id: string;
              code: string;
              title: string;
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

  uploader_profile:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;

  reviewer_profile:
    | {
        full_name: string | null;
      }
    | {
        full_name: string | null;
      }[]
    | null;
}