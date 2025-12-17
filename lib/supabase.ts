import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Use service role key for server-side uploads if available (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Log configuration (without exposing keys)
console.log('Supabase configuration:', {
  hasUrl: !!supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
  hasServiceKey: !!supabaseServiceKey,
  url: supabaseUrl ? new URL(supabaseUrl).origin : 'missing'
});

export const supabase = supabaseUrl && (supabaseServiceKey || supabaseAnonKey)
  ? createClient(
      supabaseUrl, 
      supabaseServiceKey || supabaseAnonKey, // Prefer service role key for server-side operations
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null;

