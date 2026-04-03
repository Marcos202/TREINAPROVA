import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )

  return supabaseClient;
}

/**
 * Reseta o singleton do cliente Supabase.
 * Chamado pelo SupabaseAuthGuard após SIGNED_OUT para encerrar
 * o timer interno de auto-refresh e recomeçar com estado limpo.
 */
export function resetClient() {
  supabaseClient = undefined;
}
