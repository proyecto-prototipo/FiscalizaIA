import { demoMode, supabase } from './supabase';
import type { AIAnalysis } from '../types';

export async function analyzeEvidence(
  evidenceId: string,
): Promise<AIAnalysis> {
  if (demoMode) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return {
      id: `ai-${Date.now()}`,
      evidenceId,
      complianceStatus: 'Cumple parcialmente',
      riskLevel: 'Alto',
      missingInformation: ['Firma del responsable técnico'],
      inconsistencies: ['La fecha del anexo no coincide con la portada'],
      observations: [
        'La evidencia contiene información útil, pero requiere completar datos de validación.',
      ],
      recommendations: [
        'Cargar una versión firmada y verificar la fecha del anexo.',
      ],
      confidence: 0.89,
      humanStatus: 'Pendiente',
    };
  }

  const { data, error } = await supabase!.functions.invoke(
    'analyze-evidence',
    { body: { evidenceId } },
  );

  if (error) throw error;
  return data as AIAnalysis;
}
