import { demoMode, supabase } from './supabase';

export async function uploadEvidenceFile(
  operationId: string,
  obligationId: string,
  file: File,
) {
  if (demoMode) {
    return {
      path: `demo/${operationId}/${obligationId}/${Date.now()}-${file.name}`,
    };
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${operationId}/${obligationId}/${crypto.randomUUID()}-${safeName}`;

  const { data, error } = await supabase!.storage
    .from('evidences')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;
  return data;
}

export async function createSignedEvidenceUrl(path: string) {
  if (demoMode) return '#';

  const { data, error } = await supabase!.storage
    .from('evidences')
    .createSignedUrl(path, 60 * 10);

  if (error) throw error;
  return data.signedUrl;
}
