import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { VALID_TENANTS } from '@/config/tenants';

// Rotas explicitamente públicas
const PUBLIC_ROUTES = ['/login', '/cadastro', '/'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Extract Hostname & Construct domains
  const hostname = request.headers.get('host') || '';
  const port = hostname.split(':')[1] || '3000';
  const isLocalhost = hostname.includes('localhost');
  const baseDomain = isLocalhost ? `localhost:${port}` : 'treinaprova.com';
  const cookieDomain = isLocalhost ? '.localhost' : '.treinaprova.com';

  let subdomain = '';
  const hostWithoutPort = hostname.split(':')[0];
  
  if (hostWithoutPort.endsWith('.localhost')) {
    subdomain = hostWithoutPort.replace('.localhost', '');
  } else if (hostWithoutPort.endsWith('.treinaprova.com')) {
    subdomain = hostWithoutPort.replace('.treinaprova.com', '');
  } else if (hostWithoutPort === 'localhost') {
    subdomain = '';
  }

  const urlPath = request.nextUrl.pathname;
  
  console.log(`\n[Middleware] --- Nova Requisição ---`);
  console.log(`[Middleware] Acesso: ${hostname}${urlPath}`);
  console.log(`[Middleware] Subdomain Resolvido: '${subdomain}'`);

  // 1. First Pass - Setup the theoretical Rewrite rules for our Edge Networking
  if (subdomain === 'conta') {
    supabaseResponse = NextResponse.next({ request });
  } else if (VALID_TENANTS.includes(subdomain)) {
    const tenantUrl = new URL(`/${subdomain}${urlPath === '/' ? '' : urlPath}`, request.url);
    supabaseResponse = NextResponse.rewrite(tenantUrl);
  } else {
    // Redirect to root if unknown subdomain
    console.log(`[Middleware] Ação: Subdomínio desconhecido. Redirecionando para Hub.`);
    const redirectUrl = new URL(urlPath, `http${isLocalhost ? '' : 's'}://conta.${baseDomain}`);
    return NextResponse.redirect(redirectUrl);
  }

  // 2. Wrap Supabase Auth Logic using the created response
  /* --- COMENTADO TEMPORARIAMENTE PARA EVITAR LOOP DE REFRESH TOKEN ---
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            options.domain = cookieDomain; // Mapeamento FORÇADO de wildcard como solicitado
            request.cookies.set({
              name,
              value,
              ...options,
            });
            supabaseResponse.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log(`[Middleware] Estado Auth: User Logado = ${!!user ? `SIM (${user.email})` : 'NÃO'}`);

  // 3. Auth Guard logic
  const isTenantRoute = VALID_TENANTS.includes(subdomain);
  const isHubRoute = subdomain === 'conta';
  
  const isPublicRoute = PUBLIC_ROUTES.includes(urlPath);
  console.log(`[Middleware] Info da Rota: Pública? ${isPublicRoute}`);

  const redirectWithCookies = (url: URL) => {
    console.log(`[Middleware] Ação: Redirecionando para -> ${url.toString()}`);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(cookie => {
      redirectResponse.cookies.set({ ...cookie, domain: cookieDomain });
    });
    return redirectResponse;
  };

  // Lógica Tenants
  if (isTenantRoute) {
    if (!user) {
      console.log(`[Middleware] Interceptado: Tenant sem auth. Vai para /login`);
      return redirectWithCookies(new URL('/login', `http${isLocalhost ? '' : 's'}://conta.${baseDomain}`));
    }
    return supabaseResponse;
  }

  // Lógica Hub (conta)
  if (isHubRoute) {
    // 1. Acesso à raiz
    if (urlPath === '/' || urlPath === '') {
      const targetUrl = user ? '/aluno' : '/login';
      return redirectWithCookies(new URL(targetUrl, `http${isLocalhost ? '' : 's'}://conta.${baseDomain}`));
    }

    // 2. Se a rota for /login e usuário estiver logado -> redirect('/aluno')
    if (urlPath.startsWith('/login') && user) {
      console.log(`[Middleware] Interceptado: Usuário logado acessando /login. Vai para /aluno`);
      return redirectWithCookies(new URL('/aluno', `http${isLocalhost ? '' : 's'}://conta.${baseDomain}`));
    }

    // 3. Se a rota for /aluno e usuário NÃO estiver logado -> redirect('/login')
    if (urlPath.startsWith('/aluno') && !user) {
      console.log(`[Middleware] Interceptado: Usuário deslogado acessando /aluno. Vai para /login`);
      return redirectWithCookies(new URL('/login', `http${isLocalhost ? '' : 's'}://conta.${baseDomain}`));
    }
  }
  --- FIM DO COMENTÁRIO TEMPORÁRIO --- */

  console.log(`[Middleware] Ação: Pass-through (Permitido = Auth Desativado Temporariamente)`);
  return supabaseResponse;
}
