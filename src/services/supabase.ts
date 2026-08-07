import { createClient } from '@supabase/supabase-js';

import { demoMode } from '../config/env';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!demoMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error(
    'Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en el archivo .env.',
  );
}

export { demoMode };

export const supabase = createClient(
  supabaseUrl || 'https://demo.supabase.co',
  supabaseAnonKey || 'demo-anon-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);