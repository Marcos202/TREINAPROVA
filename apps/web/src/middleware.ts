import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { VALID_TENANTS } from '@/config/tenants';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Identificar contexto da rota
  const firstSegment = pathname.split('/')[1];
  const isTenantRoute = VALID_TENANTS.includes(firstSegment);
  const isTenantLoginRoute  = isTenantRoute && pathname === `/${firstSegment}/login`;
  // Página de planos é pública — qualquer visitante pode ver os preços
  const isTenantPlanosRoute = isTenantRoute && pathname === `/${firstSegment}/planos`;
  // Checkout requer autenticação (protegido abaixo, fora do bloco de tenant)
  const isCheckoutRoute = pathname.startsWith('/checkout');
  const isAlunoRoute = pathname.startsWith('/aluno');
  const isAdminRoute = pathname.startsWith('/admin');

  // Raiz `/` redireciona para /login
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rotas não protegidas passam sem verificação
  if (!isTenantRoute && !isAlunoRoute && !isAdminRoute && !isCheckoutRoute) {
    return NextResponse.next();
  }

  // Criar cliente Supabase para verificar sessão (apenas getSession — sem query ao banco)
  let supabaseResponse = NextResponse.next({ request });
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
            request.cookies.set({ name, value, ...options });
            supabaseResponse.cookies.set({ name, value, ...options });
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // /admin route check
  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (!profile?.is_admin) {
      return NextResponse.redirect(new URL('/aluno', request.url));
    }
  }

  // Checkout sem sessão → /login (com returnTo para voltar após autenticação)
  if (isCheckoutRoute && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // /aluno sem sessão → /login
  if (isAlunoRoute && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Rota de tenant sem sessão (e não é login nem planos) → /[tenant]/login?redirectedFrom=...
  if (isTenantRoute && !session && !isTenantLoginRoute && !isTenantPlanosRoute) {
    const loginUrl = new URL(`/${firstSegment}/login`, request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Usuário autenticado acessando /[tenant]/login → redireciona para destino ou /[tenant]
  if (isTenantLoginRoute && session) {
    const redirectedFrom = request.nextUrl.searchParams.get('redirectedFrom');
    const destination = redirectedFrom ?? `/${firstSegment}`;
    return NextResponse.redirect(new URL(destination, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
