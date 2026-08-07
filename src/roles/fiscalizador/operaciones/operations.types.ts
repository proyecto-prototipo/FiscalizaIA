export type OperationType =
  | 'Mina subterránea'
  | 'Mina a cielo abierto'
  | 'Planta de beneficio'
  | 'Depósito de relaves'
  | 'Exploración'
  | 'Transporte'
  | 'Otra';

export type OperationStage =
  | 'Exploración'
  | 'Construcción'
  | 'Operación'
  | 'Cierre'
  | 'Postcierre';

export type OperationStatus =
  | 'Registrada'
  | 'En evaluación'
  | 'Observada'
  | 'Validada';

export type RiskLevel =
  | 'Bajo'
  | 'Medio'
  | 'Alto'
  | 'Crítico';

export interface Operation {
  id: string;
  companyId: string;
  companyName: string;

  name: string;
  internalCode?: string;
  operationType?: OperationType;
  stage?: OperationStage;

  region?: string;
  province?: string;
  district?: string;
  address?: string;

  latitude?: number;
  longitude?: number;

  responsibleName?: string;
  responsibleEmail?: string;
  responsiblePhone?: string;

  description?: string;

  status: OperationStatus;
  active: boolean;

  currentCompliance: number;
  currentRisk: RiskLevel;
  obligationsCount: number;

  createdAt: string;
  updatedAt: string;
}

export interface OperationRow {
  id: string;
  company_id: string;
  code: string;
  name: string;
  internal_code: string | null;
  operation_type: OperationType | null;
  stage: OperationStage | null;

  region: string | null;
  province: string | null;
  district: string | null;
  address: string | null;

  latitude: number | string | null;
  longitude: number | string | null;

  responsible_name: string | null;
  responsible_email: string | null;
  responsible_phone: string | null;

  description: string | null;

  status: OperationStatus | null;
  active: boolean;

  current_compliance: number | string | null;
  current_risk: RiskLevel | null;

  created_at: string;
  updated_at: string | null;

  companies:
    | {
        legal_name: string;
      }
    | {
        legal_name: string;
      }[]
    | null;

  obligation_assignments?:
    | {
        count: number;
      }[]
    | null;
}

export interface OperationFormValues {
  companyId: string;
  name: string;
  internalCode: string;
  operationType: OperationType | '';
  stage: OperationStage | '';

  region: string;
  province: string;
  district: string;
  address: string;

  latitude: string;
  longitude: string;

  responsibleName: string;
  responsibleEmail: string;
  responsiblePhone: string;

  description: string;
}