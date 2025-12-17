import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
// Use service role key for server-side uploads if available (bypasses RLS)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

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

// Log configuration on server startup (without exposing keys)
if (typeof window === 'undefined') {
  console.log('Supabase Storage Configuration:', {
    configured: !!supabase,
    hasUrl: !!supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    hasServiceKey: !!supabaseServiceKey,
    usingServiceKey: !!supabaseServiceKey,
    url: supabaseUrl ? new URL(supabaseUrl).origin : 'missing'
  });
  
  if (supabase && !supabaseServiceKey) {
    console.warn('⚠️  WARNING: Using anon key for storage uploads. RLS policies may block uploads.');
    console.warn('   To fix: Add SUPABASE_SERVICE_ROLE_KEY to Vercel environment variables.');
    console.warn('   Get it from: Supabase Dashboard > Settings > API > service_role key');
  }
}

