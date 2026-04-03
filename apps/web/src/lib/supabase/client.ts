import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname === '127.0.0.1' || hostname.includes('localhost');
  const cookieDomain = isLocal ? undefined : '.treinaprova.com';

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        path: '/',
        sameSite: 'lax',
        secure: !isLocal,
      },
      auth: {
        // Desliga o auto-refresh padrão — o SupabaseAuthGuard cuida
        // da limpeza de sessão inválida sem criar loops de requisição
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    }
  )

  return supabaseClient;
}

/**
 * Limpa o singleton do cliente Supabase.
 * Chamado pelo SupabaseAuthGuard após SIGNED_OUT para garantir que
 * a próxima chamada a createClient() receba uma instância limpa
 * sem timers de refresh pendentes.
 */
export function resetClient() {
  supabaseClient = undefined;
}
