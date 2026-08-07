import type {
  AIAnalysis,
  Company,
  Evidence,
  Gap,
  Obligation,
  Observation,
  Operation,
  Recommendation,
} from '../../types';

export const companies: Company[] = [
  { id: 'cmp-001', legalName: 'Minera Andina del Sur', ruc: '20601234567', region: 'Arequipa', status: 'Activa', compliance: 76, risk: 'Alto' },
  { id: 'cmp-002', legalName: 'Operaciones Cerro Azul', ruc: '20504567891', region: 'Moquegua', status: 'Activa', compliance: 88, risk: 'Medio' },
  { id: 'cmp-003', legalName: 'Minería Responsable Perú', ruc: '20407894561', region: 'Cusco', status: 'Activa', compliance: 43, risk: 'Crítico' }
];

export const operations: Operation[] = [
  { id: 'op-001', companyId: 'cmp-001', code: 'OP-AND-001', name: 'Unidad Cerro Azul', region: 'Arequipa', operationType: 'Explotación', stage: 'Operación', profileComplete: true },
  { id: 'op-002', companyId: 'cmp-002', code: 'OP-CAZ-002', name: 'Unidad Quebrada Norte', region: 'Moquegua', operationType: 'Beneficio', stage: 'Operación', profileComplete: true },
  { id: 'op-003', companyId: 'cmp-003', code: 'OP-MRP-003', name: 'Proyecto Kuntur', region: 'Cusco', operationType: 'Exploración', stage: 'Exploración', profileComplete: false }
];

export const obligations: Obligation[] = [
  { id: 'obl-001', operationId: 'op-001', code: 'OB-001', title: 'Presentar informe trimestral de monitoreo de agua', category: 'Agua', criticality: 'Alta', dueDate: '2026-08-12', requiredEvidence: 'Informe de monitoreo firmado y anexos de laboratorio', status: 'En análisis' },
  { id: 'obl-002', operationId: 'op-001', code: 'OB-002', title: 'Actualizar registro de manejo de residuos peligrosos', category: 'Residuos', criticality: 'Alta', dueDate: '2026-08-05', requiredEvidence: 'Registro actualizado y manifiestos', status: 'Requiere subsanación' },
  { id: 'obl-003', operationId: 'op-001', code: 'OB-003', title: 'Mantener vigente autorización de vertimiento', category: 'Permisos', criticality: 'Alta', dueDate: '2026-11-20', requiredEvidence: 'Resolución o autorización vigente', status: 'Cumple' }
];

export const evidences: Evidence[] = [
  { id: 'ev-001', obligationId: 'obl-001', operationId: 'op-001', fileName: 'Monitoreo_Agua_Q2_2026.pdf', version: 1, status: 'En análisis', uploadedAt: '2026-08-03T10:30:00Z' },
  { id: 'ev-002', obligationId: 'obl-002', operationId: 'op-001', fileName: 'Registro_Residuos_Julio.xlsx', version: 2, status: 'Requiere subsanación', uploadedAt: '2026-08-02T16:00:00Z' },
  { id: 'ev-003', obligationId: 'obl-003', operationId: 'op-001', fileName: 'Autorizacion_Vertimiento.pdf', version: 1, status: 'Cumple', uploadedAt: '2026-07-28T09:00:00Z' }
];

export const analyses: AIAnalysis[] = [
  {
    id: 'ai-001',
    evidenceId: 'ev-001',
    complianceStatus: 'Cumple parcialmente',
    riskLevel: 'Alto',
    missingInformation: ['Firma del responsable técnico'],
    inconsistencies: ['Fecha de anexo distinta a la portada'],
    observations: ['La evidencia contiene resultados de monitoreo, pero la validación documental está incompleta.'],
    recommendations: ['Cargar la versión firmada y corregir la fecha del anexo.'],
    confidence: 0.89,
    humanStatus: 'Pendiente'
  }
];

export const gaps: Gap[] = [
  { id: 'gap-001', obligationId: 'obl-001', title: 'Documento sin firma técnica', riskLevel: 'Alto', status: 'Abierta' },
  { id: 'gap-002', obligationId: 'obl-002', title: 'Registro incompleto de residuos peligrosos', riskLevel: 'Crítico', status: 'En subsanación' }
];

export const observations: Observation[] = [
  { id: 'obs-001', obligationId: 'obl-001', source: 'IA', text: 'Falta firma del responsable técnico.', validated: false },
  { id: 'obs-002', obligationId: 'obl-002', source: 'Fiscalizador', text: 'Adjuntar manifiestos correspondientes al periodo evaluado.', validated: true }
];

export const recommendations: Recommendation[] = [
  { id: 'rec-001', obligationId: 'obl-001', text: 'Cargar el informe firmado y revisar la consistencia de fechas.', priority: 'Alta' },
  { id: 'rec-002', obligationId: 'obl-002', text: 'Completar el registro y anexar manifiestos de disposición.', priority: 'Alta' }
];
