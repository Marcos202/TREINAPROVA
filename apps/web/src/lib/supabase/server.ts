import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const headerStore = await headers()

  // Mesmo critério do browser client e middleware — domínio consistente
  const hostname = headerStore.get('host') || ''
  const isProd = !hostname.includes('localhost') && !hostname.includes('127.0.0.1')
  const cookieDomain = isProd ? '.treinaprova.com' : undefined

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                ...(cookieDomain ? { domain: cookieDomain } : {}),
              })
            )
          } catch {
            // Ignorado em Server Components (read-only cookie store)
          }
        },
      },
    }
  )
}
