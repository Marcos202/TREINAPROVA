import { createBrowserClient } from '@supabase/ssr'

let supabaseClient: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (supabaseClient) return supabaseClient;

  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = hostname === '127.0.0.1' || hostname.includes('localhost');
  const cookieDomain = isLocal ? hostname : '.treinaprova.com';

  supabaseClient = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        path: '/',
        sameSite: 'lax',
        secure: !isLocal,
      }
    }
  )

  return supabaseClient;
}
