import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client with service_role key.
 * Bypasses RLS — use ONLY in Server Actions and server-side code.
 * Never expose this client to the browser.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env variables.'
    );
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
}
