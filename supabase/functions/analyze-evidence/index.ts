import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (request) => {
  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const { evidenceId } = await request.json();
    if (!evidenceId) throw new Error('evidenceId es obligatorio.');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: evidence, error } = await supabase
      .from('evidence_documents')
      .select('*, obligation_assignments(*, obligation_catalog(*))')
      .eq('id', evidenceId)
      .single();

    if (error) throw error;

    const prompt = `
Actúa como asistente documental ambiental minero.
Compara la evidencia con la obligación asignada.
No emitas certificaciones, opiniones legales ni decisiones definitivas.
Devuelve exclusivamente JSON válido con:
complianceStatus: "Cumple" | "Cumple parcialmente" | "No cumple" | "Información insuficiente",
riskLevel: "Bajo" | "Medio" | "Alto" | "Crítico",
missingInformation: string[],
inconsistencies: string[],
observations: string[],
recommendations: string[],
confidence: número entre 0 y 1.

Datos:
${JSON.stringify(evidence)}
`;

    const model = Deno.env.get('GOOGLE_AI_MODEL') ?? 'gemini-2.0-flash';
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');

    const aiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      },
    );

    if (!aiResponse.ok) throw new Error(await aiResponse.text());

    const payload = await aiResponse.json();
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    const result = JSON.parse(text);

    const { data: saved, error: saveError } = await supabase
      .from('ai_analyses')
      .insert({
        evidence_id: evidenceId,
        model,
        compliance_status: result.complianceStatus,
        risk_level: result.riskLevel,
        missing_information: result.missingInformation ?? [],
        inconsistencies: result.inconsistencies ?? [],
        observations: result.observations ?? [],
        recommendations: result.recommendations ?? [],
        confidence: result.confidence ?? null,
        human_status: 'Pendiente',
      })
      .select()
      .single();

    if (saveError) throw saveError;

    await supabase
      .from('evidence_documents')
      .update({ status: 'En análisis' })
      .eq('id', evidenceId);

    return new Response(JSON.stringify({
      id: saved.id,
      evidenceId,
      complianceStatus: saved.compliance_status,
      riskLevel: saved.risk_level,
      missingInformation: saved.missing_information,
      inconsistencies: saved.inconsistencies,
      observations: saved.observations,
      recommendations: saved.recommendations,
      confidence: saved.confidence,
      humanStatus: saved.human_status,
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Error inesperado',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
