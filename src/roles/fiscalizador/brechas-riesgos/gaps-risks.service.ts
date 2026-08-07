import { supabase } from '../../../services/supabase';

import type {
  GapAiAnalysisOption,
  GapAiAnalysisRow,
  GapAssignmentContext,
  GapEvaluationOption,
  GapEvaluationRow,
  GapEvidenceOption,
  GapEvidenceRow,
  GapFormValues,
  GapRecord,
  GapRiskItem,
  GapRow,
} from './gapsRisks.types';

const EVIDENCE_BUCKET = 'evidences';

/* =========================================================
   TIPOS INTERNOS
========================================================= */

interface AssignmentDatabaseRow {
  id: string;
  company_id: string | null;
  operation_id: string;
  catalog_id: string;
  due_date: string | null;
  status: string;
  created_at: string;
}

interface CompanyDatabaseRow {
  id: string;
  legal_name: string;
}

interface OperationDatabaseRow {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  internal_code: string | null;
}

interface ObligationCatalogDatabaseRow {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string;
  criticality: 'Baja' | 'Media' | 'Alta';
  required_evidence: string;
  active: boolean | null;
}

/* =========================================================
   COLUMNAS DE LA TABLA GAPS
========================================================= */

const GAP_SELECT = `
  id,
  assignment_id,
  evaluation_id,
  evidence_id,
  ai_analysis_id,
  title,
  description,
  risk_level,
  status,
  source,
  priority,
  probability,
  impact,
  technical_basis,
  treatment_measure,
  responsible_name,
  due_date,
  detected_by,
  closed_by,
  closed_at,
  created_at,
  updated_at
`;

/* =========================================================
   UTILIDADES
========================================================= */

function parseNumber(
  value: number | string | null | undefined,
  fallback = 0,
): number {
  if (value === null || value === undefined) {
    return fallback;
  }

  const parsed =
    typeof value === 'number'
      ? value
      : Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : fallback;
}

function toStringArray(
  value: unknown,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter(
      (item): item is string =>
        typeof item === 'string',
    )
    .map((item) => item.trim())
    .filter(Boolean);
}

function getErrorMessage(
  error: {
    code?: string;
    message?: string;
  },
  fallback: string,
): string {
  if (error.code === '42501') {
    return 'No tienes permisos para realizar esta acción.';
  }

  if (error.code === '23503') {
    return 'Una de las relaciones seleccionadas ya no existe.';
  }

  if (error.code === '23505') {
    return 'Ya existe un registro con los mismos datos.';
  }

  if (error.code === '23514') {
    return 'Uno de los estados o niveles seleccionados no está permitido.';
  }

  if (error.code === '23502') {
    return 'Falta completar un dato obligatorio.';
  }

  if (error.code === 'PGRST116') {
    return 'La brecha solicitada no fue encontrada.';
  }

  return error.message
    ? `${fallback}: ${error.message}`
    : fallback;
}

/* =========================================================
   MAPEADORES
========================================================= */

function mapGap(
  row: GapRow,
): GapRecord {
  return {
    id: row.id,
    assignmentId:
      row.assignment_id,

    evaluationId:
      row.evaluation_id ?? undefined,

    evidenceId:
      row.evidence_id ?? undefined,

    aiAnalysisId:
      row.ai_analysis_id ?? undefined,

    title:
      row.title,

    description:
      row.description ?? undefined,

    riskLevel:
      row.risk_level,

    status:
      row.status,

    source:
      row.source,

    priority:
      row.priority,

    probability:
      row.probability,

    impact:
      row.impact,

    technicalBasis:
      row.technical_basis ?? undefined,

    treatmentMeasure:
      row.treatment_measure ?? undefined,

    responsibleName:
      row.responsible_name ?? undefined,

    dueDate:
      row.due_date ?? undefined,

    detectedBy:
      row.detected_by ?? undefined,

    closedBy:
      row.closed_by ?? undefined,

    closedAt:
      row.closed_at ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

function mapEvidence(
  row: GapEvidenceRow,
): GapEvidenceOption {
  return {
    id:
      row.id,

    assignmentId:
      row.assignment_id,

    fileName:
      row.file_name,

    storagePath:
      row.storage_path,

    version:
      row.version,

    status:
      row.status,

    aiStatus:
      row.ai_status ?? 'Pendiente',

    uploadedAt:
      row.uploaded_at,
  };
}

function mapAiAnalysis(
  row: GapAiAnalysisRow,
): GapAiAnalysisOption {
  return {
    id:
      row.id,

    evidenceId:
      row.evidence_id,

    model:
      row.model,

    processingStatus:
      row.processing_status,

    complianceStatus:
      row.compliance_status,

    riskLevel:
      row.risk_level,

    confidence:
      row.confidence === null
        ? undefined
        : parseNumber(row.confidence),

    documentSummary:
      row.document_summary ?? undefined,

    breaches:
      toStringArray(row.breaches),

    observations:
      toStringArray(row.observations),

    recommendations:
      toStringArray(row.recommendations),

    humanStatus:
      row.human_status,

    createdAt:
      row.created_at,
  };
}

function mapEvaluation(
  row: GapEvaluationRow,
): GapEvaluationOption {
  return {
    id:
      row.id,

    assignmentId:
      row.assignment_id,

    evidenceId:
      row.evidence_id ?? undefined,

    aiAnalysisId:
      row.ai_analysis_id ?? undefined,

    complianceStatus:
      row.compliance_status,

    riskLevel:
      row.risk_level,

    score:
      parseNumber(row.score),

    validated:
      row.validated,

    evaluationComment:
      row.evaluation_comment ?? undefined,

    correctiveAction:
      row.corrective_action ?? undefined,

    createdAt:
      row.created_at,

    updatedAt:
      row.updated_at,
  };
}

/* =========================================================
   CONSULTAS OBLIGATORIAS
========================================================= */

async function listAssignments():
Promise<AssignmentDatabaseRow[]> {
  const { data, error } =
    await supabase
      .from('obligation_assignments')
      .select(`
        id,
        company_id,
        operation_id,
        catalog_id,
        due_date,
        status,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    console.error(
      '[Brechas] Error en obligation_assignments:',
      error,
    );

    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las obligaciones asignadas',
      ),
    );
  }

  return (
    data ?? []
  ) as AssignmentDatabaseRow[];
}

async function listCompanies():
Promise<CompanyDatabaseRow[]> {
  const { data, error } =
    await supabase
      .from('companies')
      .select(`
        id,
        legal_name
      `)
      .order('legal_name', {
        ascending: true,
      });

  if (error) {
    console.error(
      '[Brechas] Error en companies:',
      error,
    );

    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las empresas',
      ),
    );
  }

  return (
    data ?? []
  ) as CompanyDatabaseRow[];
}

async function listOperations():
Promise<OperationDatabaseRow[]> {
  const { data, error } =
    await supabase
      .from('mining_operations')
      .select(`
        id,
        company_id,
        name,
        code,
        internal_code
      `)
      .order('name', {
        ascending: true,
      });

  if (error) {
    console.error(
      '[Brechas] Error en mining_operations:',
      error,
    );

    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las operaciones',
      ),
    );
  }

  return (
    data ?? []
  ) as OperationDatabaseRow[];
}

async function listObligationCatalog():
Promise<ObligationCatalogDatabaseRow[]> {
  const { data, error } =
    await supabase
      .from('obligation_catalog')
      .select(`
        id,
        code,
        title,
        description,
        category,
        criticality,
        required_evidence,
        active
      `)
      .order('code', {
        ascending: true,
      });

  if (error) {
    console.error(
      '[Brechas] Error en obligation_catalog:',
      error,
    );

    throw new Error(
      getErrorMessage(
        error,
        'No se pudo cargar el catálogo de obligaciones',
      ),
    );
  }

  return (
    data ?? []
  ) as ObligationCatalogDatabaseRow[];
}

async function listGapRecords():
Promise<GapRecord[]> {
  const { data, error } =
    await supabase
      .from('gaps')
      .select(GAP_SELECT)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    console.error(
      '[Brechas] Error en gaps:',
      error,
    );

    throw new Error(
      getErrorMessage(
        error,
        'No se pudieron cargar las brechas',
      ),
    );
  }

  return (
    (data ?? []) as GapRow[]
  ).map(mapGap);
}

/* =========================================================
   CONSULTAS COMPLEMENTARIAS

   No bloquean la carga principal del módulo.
========================================================= */

async function listEvidenceRecords():
Promise<GapEvidenceOption[]> {
  const { data, error } =
    await supabase
      .from('evidence_documents')
      .select(`
        id,
        assignment_id,
        file_name,
        storage_path,
        version,
        status,
        ai_status,
        uploaded_at
      `)
      .order('uploaded_at', {
        ascending: false,
      });

  if (error) {
    console.warn(
      '[Brechas] No se cargaron evidencias:',
      error,
    );

    return [];
  }

  return (
    (data ?? []) as GapEvidenceRow[]
  ).map(mapEvidence);
}

async function listAiAnalysisRecords():
Promise<GapAiAnalysisOption[]> {
  const { data, error } =
    await supabase
      .from('ai_analyses')
      .select(`
        id,
        evidence_id,
        model,
        processing_status,
        compliance_status,
        risk_level,
        confidence,
        document_summary,
        breaches,
        observations,
        recommendations,
        human_status,
        created_at
      `)
      .order('created_at', {
        ascending: false,
      });

  if (error) {
    console.warn(
      '[Brechas] No se cargaron análisis IA:',
      error,
    );

    return [];
  }

  return (
    (data ?? []) as GapAiAnalysisRow[]
  ).map(mapAiAnalysis);
}

async function listEvaluationRecords():
Promise<GapEvaluationOption[]> {
  const { data, error } =
    await supabase
      .from('evaluations')
      .select(`
        id,
        assignment_id,
        evidence_id,
        ai_analysis_id,
        compliance_status,
        risk_level,
        score,
        validated,
        evaluation_comment,
        corrective_action,
        created_at,
        updated_at
      `)
      .order('updated_at', {
        ascending: false,
      });

  if (error) {
    console.warn(
      '[Brechas] No se cargaron evaluaciones:',
      error,
    );

    return [];
  }

  return (
    (data ?? []) as GapEvaluationRow[]
  ).map(mapEvaluation);
}

/* =========================================================
   CARGA PRINCIPAL
========================================================= */

export async function listGapsRisksData():
Promise<{
  contexts: GapAssignmentContext[];
  gaps: GapRiskItem[];
}> {
  console.log(
    '[Brechas] Ejecutando gaps-risks.service.ts',
  );

  /*
   * Primero cargamos las tablas obligatorias.
   * Si una de estas falla, sí debemos informar el error.
   */
  const [
    assignmentRows,
    companyRows,
    operationRows,
    obligationRows,
    gapRecords,
  ] = await Promise.all([
    listAssignments(),
    listCompanies(),
    listOperations(),
    listObligationCatalog(),
    listGapRecords(),
  ]);

  /*
   * Luego cargamos tablas complementarias.
   * Aunque estén vacías o tengan algún problema,
   * las brechas principales seguirán mostrándose.
   */
  const [
    evidences,
    aiAnalyses,
    evaluations,
  ] = await Promise.all([
    listEvidenceRecords(),
    listAiAnalysisRecords(),
    listEvaluationRecords(),
  ]);

  const companiesById =
    new Map(
      companyRows.map((company) => [
        company.id,
        company,
      ]),
    );

  const operationsById =
    new Map(
      operationRows.map((operation) => [
        operation.id,
        operation,
      ]),
    );

  const obligationsById =
    new Map(
      obligationRows.map((obligation) => [
        obligation.id,
        obligation,
      ]),
    );

  const evaluationsByAssignment =
    new Map(
      evaluations.map((evaluation) => [
        evaluation.assignmentId,
        evaluation,
      ]),
    );

  const evidencesByAssignment =
    new Map<
      string,
      GapEvidenceOption[]
    >();

  evidences.forEach((evidence) => {
    const current =
      evidencesByAssignment.get(
        evidence.assignmentId,
      ) ?? [];

    current.push(evidence);

    evidencesByAssignment.set(
      evidence.assignmentId,
      current,
    );
  });

  evidencesByAssignment.forEach(
    (assignmentEvidences) => {
      assignmentEvidences.sort(
        (first, second) =>
          new Date(
            second.uploadedAt,
          ).getTime() -
          new Date(
            first.uploadedAt,
          ).getTime(),
      );
    },
  );

  const analysesByEvidence =
    new Map<
      string,
      GapAiAnalysisOption[]
    >();

  aiAnalyses.forEach((analysis) => {
    const current =
      analysesByEvidence.get(
        analysis.evidenceId,
      ) ?? [];

    current.push(analysis);

    analysesByEvidence.set(
      analysis.evidenceId,
      current,
    );
  });

  analysesByEvidence.forEach(
    (evidenceAnalyses) => {
      evidenceAnalyses.sort(
        (first, second) =>
          new Date(
            second.createdAt,
          ).getTime() -
          new Date(
            first.createdAt,
          ).getTime(),
      );
    },
  );

  const contexts:
  GapAssignmentContext[] = [];

  assignmentRows.forEach((assignment) => {
    const operation =
      operationsById.get(
        assignment.operation_id,
      );

    const obligation =
      obligationsById.get(
        assignment.catalog_id,
      );

    if (!operation) {
      console.warn(
        '[Brechas] Operación no encontrada:',
        {
          assignmentId:
            assignment.id,

          operationId:
            assignment.operation_id,
        },
      );

      return;
    }

    if (!obligation) {
      console.warn(
        '[Brechas] Obligación no encontrada:',
        {
          assignmentId:
            assignment.id,

          catalogId:
            assignment.catalog_id,
        },
      );

      return;
    }

    /*
     * Solo se omite cuando active es exactamente false.
     * Los valores null no eliminan la obligación.
     */
    if (obligation.active === false) {
      console.warn(
        '[Brechas] Obligación inactiva:',
        obligation.code,
      );

      return;
    }

    const companyId =
      assignment.company_id ??
      operation.company_id;

    const company =
      companiesById.get(companyId);

    const assignmentEvidences =
      evidencesByAssignment.get(
        assignment.id,
      ) ?? [];

    const evidenceIds =
      new Set(
        assignmentEvidences.map(
          (evidence) => evidence.id,
        ),
      );

    const assignmentAnalyses =
      aiAnalyses
        .filter((analysis) =>
          evidenceIds.has(
            analysis.evidenceId,
          ),
        )
        .sort(
          (first, second) =>
            new Date(
              second.createdAt,
            ).getTime() -
            new Date(
              first.createdAt,
            ).getTime(),
        );

    const latestEvidence =
      assignmentEvidences[0];

    const latestAiAnalysis =
      latestEvidence
        ? analysesByEvidence.get(
            latestEvidence.id,
          )?.[0]
        : undefined;

    contexts.push({
      assignmentId:
        assignment.id,

      companyId,

      companyName:
        company?.legal_name ??
        'Empresa sin nombre',

      operationId:
        operation.id,

      operationName:
        operation.name,

      operationCode:
        operation.internal_code ??
        operation.code ??
        undefined,

      catalogId:
        obligation.id,

      obligationCode:
        obligation.code,

      obligationTitle:
        obligation.title,

      obligationDescription:
        obligation.description ??
        undefined,

      category:
        obligation.category,

      criticality:
        obligation.criticality,

      requiredEvidence:
        obligation.required_evidence,

      dueDate:
        assignment.due_date ??
        undefined,

      assignmentStatus:
        assignment.status,

      evidences:
        assignmentEvidences,

      aiAnalyses:
        assignmentAnalyses,

      evaluation:
        evaluationsByAssignment.get(
          assignment.id,
        ),

      latestEvidence,
      latestAiAnalysis,
    });
  });

  const contextsByAssignment =
    new Map(
      contexts.map((context) => [
        context.assignmentId,
        context,
      ]),
    );

  const gaps:
  GapRiskItem[] = [];

  gapRecords.forEach((gap) => {
    const context =
      contextsByAssignment.get(
        gap.assignmentId,
      );

    if (!context) {
      console.warn(
        '[Brechas] Brecha sin contexto:',
        {
          gapId:
            gap.id,

          assignmentId:
            gap.assignmentId,

          title:
            gap.title,
        },
      );

      return;
    }

    const evidence =
      gap.evidenceId
        ? context.evidences.find(
            (item) =>
              item.id === gap.evidenceId,
          )
        : undefined;

    const aiAnalysis =
      gap.aiAnalysisId
        ? context.aiAnalyses.find(
            (item) =>
              item.id ===
              gap.aiAnalysisId,
          )
        : undefined;

    const evaluation =
      gap.evaluationId &&
      context.evaluation?.id ===
        gap.evaluationId
        ? context.evaluation
        : undefined;

    gaps.push({
      ...gap,

      companyId:
        context.companyId,

      companyName:
        context.companyName,

      operationId:
        context.operationId,

      operationName:
        context.operationName,

      operationCode:
        context.operationCode,

      obligationCode:
        context.obligationCode,

      obligationTitle:
        context.obligationTitle,

      obligationDescription:
        context.obligationDescription,

      category:
        context.category,

      criticality:
        context.criticality,

      requiredEvidence:
        context.requiredEvidence,

      evidence,
      aiAnalysis,
      evaluation,
    });
  });

  console.log(
    '[Brechas] Asignaciones:',
    assignmentRows.length,
  );

  console.log(
    '[Brechas] Empresas:',
    companyRows.length,
  );

  console.log(
    '[Brechas] Operaciones:',
    operationRows.length,
  );

  console.log(
    '[Brechas] Catálogo:',
    obligationRows.length,
  );

  console.log(
    '[Brechas] Registros de gaps:',
    gapRecords.length,
  );

  console.log(
    '[Brechas] Evidencias:',
    evidences.length,
  );

  console.log(
    '[Brechas] Análisis IA:',
    aiAnalyses.length,
  );

  console.log(
    '[Brechas] Evaluaciones:',
    evaluations.length,
  );

  console.log(
    '[Brechas] Contextos construidos:',
    contexts.length,
  );

  console.log(
    '[Brechas] Brechas relacionadas:',
    gaps.length,
  );

  return {
    contexts,
    gaps,
  };
}

/* =========================================================
   VALIDACIÓN
========================================================= */

function validateGapForm(
  values: GapFormValues,
): void {
  if (!values.assignmentId) {
    throw new Error(
      'Selecciona una obligación asignada.',
    );
  }

  if (!values.title.trim()) {
    throw new Error(
      'El título de la brecha es obligatorio.',
    );
  }

  if (
    values.status === 'Cerrada' &&
    !values.treatmentMeasure.trim()
  ) {
    throw new Error(
      'Registra la medida aplicada antes de cerrar la brecha.',
    );
  }

  if (
    (
      values.priority === 'Alta' ||
      values.priority === 'Urgente'
    ) &&
    !values.dueDate
  ) {
    throw new Error(
      'Las brechas de prioridad alta o urgente deben tener una fecha límite.',
    );
  }
}

/* =========================================================
   GUARDAR O ACTUALIZAR
========================================================= */

export async function saveGapRisk(
  values: GapFormValues,
): Promise<GapRecord> {
  validateGapForm(values);

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    throw new Error(
      'No se pudo identificar al fiscalizador.',
    );
  }

  const isClosed =
    values.status === 'Cerrada';

  const payload = {
    assignment_id:
      values.assignmentId,

    evaluation_id:
      values.evaluationId || null,

    evidence_id:
      values.evidenceId || null,

    ai_analysis_id:
      values.aiAnalysisId || null,

    title:
      values.title.trim(),

    description:
      values.description.trim() ||
      null,

    risk_level:
      values.riskLevel,

    status:
      values.status,

    source:
      values.source,

    priority:
      values.priority,

    probability:
      values.probability,

    impact:
      values.impact,

    technical_basis:
      values.technicalBasis.trim() ||
      null,

    treatment_measure:
      values.treatmentMeasure.trim() ||
      null,

    responsible_name:
      values.responsibleName.trim() ||
      null,

    due_date:
      values.dueDate || null,

    closed_by:
      isClosed
        ? userData.user.id
        : null,

    closed_at:
      isClosed
        ? new Date().toISOString()
        : null,
  };

  if (values.id) {
    const { data, error } =
      await supabase
        .from('gaps')
        .update(payload)
        .eq('id', values.id)
        .select(GAP_SELECT)
        .single();

    if (error) {
      throw new Error(
        getErrorMessage(
          error,
          'No se pudo actualizar la brecha',
        ),
      );
    }

    return mapGap(
      data as GapRow,
    );
  }

  const { data, error } =
    await supabase
      .from('gaps')
      .insert({
        ...payload,

        detected_by:
          userData.user.id,
      })
      .select(GAP_SELECT)
      .single();

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo registrar la brecha',
      ),
    );
  }

  return mapGap(
    data as GapRow,
  );
}

/* =========================================================
   ELIMINAR
========================================================= */

export async function removeGapRisk(
  gapId: string,
): Promise<void> {
  if (!gapId) {
    throw new Error(
      'No se proporcionó el identificador de la brecha.',
    );
  }

  const { error } =
    await supabase
      .from('gaps')
      .delete()
      .eq('id', gapId);

  if (error) {
    throw new Error(
      getErrorMessage(
        error,
        'No se pudo eliminar la brecha',
      ),
    );
  }
}

/* =========================================================
   EVIDENCIAS
========================================================= */

export async function createGapEvidenceUrl(
  storagePath: string,
): Promise<string> {
  if (!storagePath) {
    throw new Error(
      'La evidencia no tiene una ruta válida.',
    );
  }

  const { data, error } =
    await supabase.storage
      .from(EVIDENCE_BUCKET)
      .createSignedUrl(
        storagePath,
        300,
      );

  if (error) {
    throw new Error(
      `No se pudo abrir la evidencia: ${error.message}`,
    );
  }

  if (!data.signedUrl) {
    throw new Error(
      'No se pudo generar el enlace de la evidencia.',
    );
  }

  return data.signedUrl;
}

export async function openGapEvidence(
  storagePath: string,
): Promise<void> {
  const signedUrl =
    await createGapEvidenceUrl(
      storagePath,
    );

  const openedWindow =
    window.open(
      signedUrl,
      '_blank',
      'noopener,noreferrer',
    );

  if (!openedWindow) {
    throw new Error(
      'El navegador bloqueó la apertura del archivo.',
    );
  }
}