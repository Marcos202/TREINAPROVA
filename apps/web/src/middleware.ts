import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 🔍 DEBUG: Log de toda rota interceptada pelo middleware
  console.log(`[MIDDLEWARE] Rota interceptada: ${request.nextUrl.pathname}`);
  
  // Middleware desligado temporariamente para testes de autenticação.
  // Apenas permite que a requisição siga seu fluxo normal.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
