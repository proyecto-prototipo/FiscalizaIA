export type EvidenceStatus =
  | 'Pendiente'
  | 'En revisión'
  | 'Aprobada'
  | 'Observada'
  | 'Rechazada'
  | string;

export type EvidenceAIStatus =
  | 'Pendiente'
  | 'Procesando'
  | 'Completado'
  | 'Error'
  | string;


export interface EvidenceAssignmentOption {
  id: string;

  operationId: string;
  operationName: string;

  catalogId: string;

  code: string;
  title: string;

  criticality: string;

  requiredEvidence: string;

  dueDate?: string;
  status: string;
}


export interface CompanyEvidence {
  id: string;

  assignmentId: string;
  operationId: string;

  obligationCode: string;
  obligationTitle: string;

  operationName: string;

  fileName: string;
  storagePath: string;

  version: number;

  status: EvidenceStatus;

  aiStatus: EvidenceAIStatus;
  aiConfidence?: number;

  reviewComment?: string;

  uploadedAt: string;
  reviewedAt?: string;
}


export interface EvidenceSummary {
  total: number;

  pending: number;

  reviewing: number;

  approved: number;

  observed: number;

  rejected: number;
}


export interface EvidenceFilters {
  search: string;

  operationId: string;

  assignmentId: string;

  status: string;

  aiStatus: string;
}


export interface CompanyOperationOption {
  id: string;
  name: string;
}


export interface EvidencesData {
  evidences:
    CompanyEvidence[];

  assignments:
    EvidenceAssignmentOption[];

  operations:
    CompanyOperationOption[];

  summary:
    EvidenceSummary;

  lastUpdated: string;
}


export interface UploadEvidencePayload {
  assignmentId: string;

  file: File;
}