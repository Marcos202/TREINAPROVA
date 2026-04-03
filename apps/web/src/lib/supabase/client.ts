import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isProd = !hostname.includes('localhost') && !hostname.includes('127.0.0.1');
  const cookieDomain = isProd ? '.treinaprova.com' : undefined;

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        ...(cookieDomain ? { domain: cookieDomain } : {}),
        path: '/',
        sameSite: 'lax',
        secure: isProd,
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
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
