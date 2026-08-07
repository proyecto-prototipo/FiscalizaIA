export interface CompanyRecommendation {
  id: string;

  assignmentId: string;

  operationId: string;
  operationName: string;

  catalogId: string;

  obligationCode: string;
  obligationTitle: string;

  title: string;
  description: string;

  recommendationType: string;

  priority: string;

  status: string;

  source: string;

  progress: number;

  dueDate?: string;

  implementedAt?: string;

  createdAt: string;
  updatedAt?: string;

  expired: boolean;
}


export interface RecommendationSummary {
  total: number;

  pending: number;

  inProgress: number;

  implemented: number;

  highPriority: number;

  expired: number;

  averageProgress: number;
}


export interface RecommendationFilters {
  search: string;

  operationId: string;

  status: string;

  priority: string;

  source: string;

  onlyExpired: boolean;
}


export interface RecommendationOperationOption {
  id: string;

  name: string;
}


export interface RecommendationsData {
  recommendations:
    CompanyRecommendation[];

  operations:
    RecommendationOperationOption[];

  summary:
    RecommendationSummary;

  lastUpdated: string;
}