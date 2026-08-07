export type ObservationStatus =
  | 'Pendiente'
  | 'Respondida'
  | 'En verificación'
  | 'Cerrada'
  | string;


export interface CompanyObservation {
  id: string;

  assignmentId: string;

  operationId: string;
  operationName: string;

  catalogId: string;

  obligationCode: string;
  obligationTitle: string;

  title: string;
  description: string;

  source: string;

  severity: string;
  priority?: string;

  status: ObservationStatus;

  validated: boolean;

  dueDate?: string;

  response?: string;

  respondedAt?: string;

  createdAt: string;
  updatedAt?: string;

  expired: boolean;
}


export interface ObservationSummary {
  total: number;

  pending: number;

  responded: number;

  verifying: number;

  closed: number;

  critical: number;

  expired: number;
}


export interface ObservationFilters {
  search: string;

  operationId: string;

  status: string;

  severity: string;

  source: string;

  onlyExpired: boolean;
}


export interface ObservationOperationOption {
  id: string;
  name: string;
}


export interface ObservationsData {
  observations:
    CompanyObservation[];

  operations:
    ObservationOperationOption[];

  summary:
    ObservationSummary;

  lastUpdated: string;
}