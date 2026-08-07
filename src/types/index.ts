export type UserRole = 'fiscalizador' | 'empresa_evaluada';

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId?: string;
  companyName?: string;
}

export type RiskLevel = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
export type ComplianceStatus =
  | 'Pendiente'
  | 'En análisis'
  | 'Cumple'
  | 'Cumple parcialmente'
  | 'No cumple'
  | 'Requiere subsanación'
  | 'Validado';

export interface Company {
  id: string;
  legalName: string;
  ruc: string;
  region: string;
  status: 'Activa' | 'Inactiva';
  compliance: number;
  risk: RiskLevel;
}

export interface Operation {
  id: string;
  companyId: string;
  code: string;
  name: string;
  region: string;
  operationType: string;
  stage: string;
  profileComplete: boolean;
}

export interface Obligation {
  id: string;
  operationId: string;
  code: string;
  title: string;
  category: string;
  criticality: 'Alta' | 'Media' | 'Baja';
  dueDate: string;
  requiredEvidence: string;
  status: ComplianceStatus;
}

export interface Evidence {
  id: string;
  obligationId: string;
  operationId: string;
  fileName: string;
  version: number;
  status: ComplianceStatus;
  uploadedAt: string;
  storagePath?: string;
}

export interface AIAnalysis {
  id: string;
  evidenceId: string;
  complianceStatus: ComplianceStatus;
  riskLevel: RiskLevel;
  missingInformation: string[];
  inconsistencies: string[];
  observations: string[];
  recommendations: string[];
  confidence: number;
  humanStatus: 'Pendiente' | 'Aprobado' | 'Editado' | 'Rechazado';
}

export interface Gap {
  id: string;
  obligationId: string;
  title: string;
  riskLevel: RiskLevel;
  status: 'Abierta' | 'En subsanación' | 'Cerrada';
}

export interface Observation {
  id: string;
  obligationId: string;
  source: 'IA' | 'Fiscalizador';
  text: string;
  validated: boolean;
}

export interface Recommendation {
  id: string;
  obligationId: string;
  text: string;
  priority: 'Alta' | 'Media' | 'Baja';
}
