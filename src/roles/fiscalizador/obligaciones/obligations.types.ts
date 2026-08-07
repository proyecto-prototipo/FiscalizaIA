export type ObligationCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export type AssignmentStatus =
  | 'Pendiente'
  | 'En proceso'
  | 'Con evidencia'
  | 'Observada'
  | 'Cumplida'
  | 'Vencida';

export interface ObligationCatalog {
  id: string;
  code: string;
  title: string;
  description?: string;
  category: string;
  criticality: ObligationCriticality;
  requiredEvidence: string;
  active: boolean;
  createdAt: string;
}

export interface ObligationAssignment {
  id: string;

  catalogId: string;
  catalogCode: string;
  catalogTitle: string;
  catalogDescription?: string;
  category: string;
  criticality: ObligationCriticality;
  requiredEvidence: string;

  operationId: string;
  operationName: string;
  operationCode?: string;

  companyId?: string;
  companyName: string;

  assignedBy?: string;
  assignedAt?: string;
  dueDate?: string;

  status: AssignmentStatus;
  notes?: string;

  createdAt: string;
  updatedAt?: string;
}

export interface CatalogFormValues {
  code: string;
  title: string;
  description: string;
  category: string;
  criticality: ObligationCriticality;
  requiredEvidence: string;
}

export interface AssignmentFormValues {
  catalogId: string;
  operationId: string;
  dueDate: string;
  status: AssignmentStatus;
  notes: string;
}

export interface OperationOption {
  id: string;
  companyId: string;
  companyName: string;
  name: string;
  internalCode?: string;
}

export interface CatalogRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  criticality: ObligationCriticality;
  required_evidence: string;
  active: boolean;
  created_at: string;
}

export interface AssignmentRow {
  id: string;

  operation_id: string;
  catalog_id: string;
  due_date: string | null;
  status: AssignmentStatus;
  assigned_by: string | null;
  created_at: string;

  obligation_id: string | null;
  company_id: string | null;
  assigned_at: string | null;
  notes: string | null;
  updated_at: string | null;

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

  mining_operations:
    | {
        name: string;
        code: string | null;
        internal_code: string | null;
        company_id: string;
      }
    | {
        name: string;
        code: string | null;
        internal_code: string | null;
        company_id: string;
      }[]
    | null;

  companies:
    | {
        legal_name: string;
      }
    | {
        legal_name: string;
      }[]
    | null;
}