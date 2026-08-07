export type RecommendationType =
  | 'Correctiva'
  | 'Preventiva'
  | 'Mejora'
  | 'Documentaria'
  | 'Operativa';

export type RecommendationPriority =
  | 'Baja'
  | 'Media'
  | 'Alta'
  | 'Urgente';

export type RecommendationStatus =
  | 'Pendiente'
  | 'En ejecución'
  | 'Implementada'
  | 'Verificada'
  | 'Descartada';

export type RecommendationSource =
  | 'Manual'
  | 'IA'
  | 'Evaluación'
  | 'Brecha'
  | 'Observación';

export type RecommendationCriticality =
  | 'Baja'
  | 'Media'
  | 'Alta';

export interface RecommendationContext {
  assignmentId: string;

  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;

  obligationCode: string;
  obligationTitle: string;

  category: string;
  criticality: RecommendationCriticality;

  evaluationId?: string;

  gaps: {
    id: string;
    title: string;
    riskLevel: string;
  }[];

  observations: {
    id: string;
    title: string;
    severity: string;
  }[];
}

export interface RecommendationRecord {
  id: string;
  assignmentId: string;

  evaluationId?: string;
  gapId?: string;
  observationId?: string;
  aiAnalysisId?: string;

  title: string;
  description?: string;
  text: string;

  recommendationType: RecommendationType;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  source: RecommendationSource;

  responsibleName?: string;
  dueDate?: string;

  progress: number;

  expectedResult?: string;
  implementationComment?: string;
  verificationComment?: string;

  createdBy?: string;
  implementedBy?: string;
  implementedAt?: string;

  verifiedBy?: string;
  verifiedAt?: string;

  createdAt: string;
  updatedAt: string;
}

export interface RecommendationItem
  extends RecommendationRecord {
  companyId: string;
  companyName: string;

  operationId: string;
  operationName: string;

  obligationCode: string;
  obligationTitle: string;

  category: string;
  criticality: RecommendationCriticality;

  gapTitle?: string;
  observationTitle?: string;
}

export interface RecommendationFormValues {
  id?: string;

  assignmentId: string;
  evaluationId: string;
  gapId: string;
  observationId: string;
  aiAnalysisId: string;

  title: string;
  description: string;

  recommendationType: RecommendationType;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  source: RecommendationSource;

  responsibleName: string;
  dueDate: string;

  progress: number;

  expectedResult: string;
  implementationComment: string;
  verificationComment: string;
}

export interface RecommendationFilters {
  search: string;
  companyId: string;
  operationId: string;

  recommendationType: RecommendationType | '';
  priority: RecommendationPriority | '';
  status: RecommendationStatus | '';
  source: RecommendationSource | '';

  overdueOnly: boolean;
}

export interface RecommendationSummary {
  total: number;
  pending: number;
  inProgress: number;
  implemented: number;
  verified: number;
  urgent: number;
  overdue: number;
  averageProgress: number;
}

export interface RecommendationRow {
  id: string;
  assignment_id: string;

  evaluation_id: string | null;
  gap_id: string | null;
  observation_id: string | null;
  ai_analysis_id: string | null;

  title: string;
  description: string | null;
  text: string;

  recommendation_type: RecommendationType;
  priority: RecommendationPriority;
  status: RecommendationStatus;
  source: RecommendationSource;

  responsible_name: string | null;
  due_date: string | null;

  progress: number | string;

  expected_result: string | null;
  implementation_comment: string | null;
  verification_comment: string | null;

  created_by: string | null;
  implemented_by: string | null;
  implemented_at: string | null;

  verified_by: string | null;
  verified_at: string | null;

  created_at: string;
  updated_at: string;
}