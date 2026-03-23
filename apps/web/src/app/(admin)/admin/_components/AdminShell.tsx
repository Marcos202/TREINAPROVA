'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AdminSidebarNav } from './AdminSidebarNav';

/* Mapeamento de rotas → título no header */
const ROUTE_TITLES: Record<string, string> = {
  '/admin':           'Dashboard',
  '/admin/usuarios':  'Usuários',
  '/admin/simulados': 'Simulados',
  '/admin/cards':     'Cards',
};

function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/admin/questoes/')) return 'Banco de Questões';
  return ROUTE_TITLES[pathname] ?? 'Admin';
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  /* Fechar sidebar ao trocar de rota */
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  /* Bloquear scroll do body enquanto sidebar estiver aberta no mobile */
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  const pageTitle = getPageTitle(pathname);

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-slate-50">

      {/* ── Backdrop (mobile apenas) ─────────────── */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 lg:hidden transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />

      {/* ── Sidebar ────────────────────────────────── */}
      <aside
        className={`
          fixed lg:relative inset-y-0 left-0 z-50
          w-56 flex-shrink-0 bg-zinc-950 flex flex-col h-full border-r border-zinc-800/60
          transition-transform duration-300 ease-in-out will-change-transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-zinc-800/60 shrink-0">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/50">
            <span className="text-white font-bold text-xs">TP</span>
          </div>
          <span className="text-white font-semibold text-sm tracking-tight flex-1 min-w-0 truncate">
            TreinaPro
          </span>
          <span className="text-[9px] font-bold tracking-widest text-blue-400/70 uppercase bg-blue-950/50 px-1.5 py-0.5 rounded border border-blue-900/40">
            ADM
          </span>
          {/* Fechar — mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-1 p-1 rounded-md text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            aria-label="Fechar menu"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 overscroll-contain">
          <AdminSidebarNav />
        </div>

        {/* User footer */}
        <div className="shrink-0 border-t border-zinc-800/60 p-3 space-y-1">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-zinc-600 to-zinc-800 flex items-center justify-center shrink-0 ring-1 ring-zinc-700">
              <span className="text-zinc-200 text-[10px] font-bold">AD</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-200 text-xs font-medium leading-none">Administrador</p>
              <p className="text-zinc-600 text-[10px] mt-0.5">Sistema</p>
            </div>
          </div>
          <Link
            href="/aluno"
            className="flex items-center gap-2 w-full px-2 py-2 rounded-md text-xs text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors group"
          >
            <LogOutIcon className="w-3.5 h-3.5 shrink-0" />
            Sair do Admin
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-6 shrink-0 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Hamburger — mobile apenas */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0 p-2 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors touch-manipulation"
              aria-label="Abrir menu"
            >
              <MenuIcon className="w-5 h-5" />
            </button>

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="hidden sm:block text-sm text-gray-400 font-medium shrink-0">Admin</span>
              <ChevronRightIcon className="hidden sm:block w-3.5 h-3.5 text-gray-300 shrink-0" />
              <span className="text-sm text-gray-800 font-semibold truncate">{pageTitle}</span>
            </div>
          </div>

          {/* Right — avatar */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center ring-2 ring-zinc-700/50">
              <span className="text-white text-[10px] font-bold">AD</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto overscroll-contain">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── Icons ─────────────────────────────────────── */

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="6" y2="6" />
      <line x1="4" x2="20" y1="12" y2="12" />
      <line x1="4" x2="20" y1="18" y2="18" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}

function LogOutIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
