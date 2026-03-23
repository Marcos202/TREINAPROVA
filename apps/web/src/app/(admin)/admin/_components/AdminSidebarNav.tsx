'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';

// Funções puras fora do componente — não recriadas a cada render
function isActive(href: string, pathname: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

// Classe para itens principais do nav
function navItemClass(active: boolean) {
  return (
    'flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium rounded-md transition-all duration-150 group ' +
    (active
      ? 'bg-zinc-800/80 text-white'
      : 'text-zinc-500 hover:bg-zinc-900/60 hover:text-zinc-200')
  );
}

// Tenant badge colors
const TENANT_COLORS: Record<string, { dot: string; active: string }> = {
  med:          { dot: 'bg-blue-500',   active: 'text-blue-400' },
  oab:          { dot: 'bg-emerald-500', active: 'text-emerald-400' },
  enem:         { dot: 'bg-orange-400', active: 'text-orange-400' },
  vestibulares: { dot: 'bg-violet-500', active: 'text-violet-400' },
};

export function AdminSidebarNav() {
  const pathname = usePathname();
  const [questoesOpen, setQuestoesOpen] = useState(
    pathname.startsWith('/admin/questoes')
  );

  return (
    <nav className="px-2 space-y-0.5">

      {/* ── Seção Principal ── */}
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-3 pb-1.5">
        Gerenciamento
      </p>

      {/* Dashboard */}
      <Link href="/admin" className={navItemClass(isActive('/admin', pathname))}>
        <HomeIcon className={`w-4 h-4 shrink-0 ${isActive('/admin', pathname) ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
        Dashboard
      </Link>

      {/* Banco de Questões — accordion */}
      <div>
        <button
          onClick={() => setQuestoesOpen((o) => !o)}
          className={navItemClass(pathname.startsWith('/admin/questoes')) + ' w-full justify-between'}
        >
          <span className="flex items-center gap-2.5">
            <DatabaseIcon className={`w-4 h-4 shrink-0 ${pathname.startsWith('/admin/questoes') ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
            Banco de Questões
          </span>
          <ChevronIcon
            className={`w-3.5 h-3.5 text-zinc-600 transition-transform duration-200 shrink-0 ${questoesOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {questoesOpen && (
          <div className="mt-0.5 ml-3 pl-3 border-l border-zinc-800 space-y-0.5 py-1">
            {VALID_TENANTS.map((tenant) => {
              const href = `/admin/questoes/${tenant}`;
              const active = pathname.startsWith(href);
              const colors = TENANT_COLORS[tenant] ?? { dot: 'bg-zinc-500', active: 'text-zinc-300' };
              return (
                <Link
                  key={tenant}
                  href={href}
                  className={`flex items-center gap-2 px-2 py-1.5 text-[12px] rounded-md transition-all duration-150 ${
                    active
                      ? `${colors.active} font-semibold bg-zinc-800/60`
                      : 'text-zinc-600 hover:text-zinc-300 hover:bg-zinc-900/40'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? colors.dot : 'bg-zinc-700'}`} />
                  {TENANT_LABELS[tenant]}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Conteúdo ── */}
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1.5">
        Conteúdo
      </p>

      <Link href="/admin/simulados" className={navItemClass(isActive('/admin/simulados', pathname))}>
        <FileTextIcon className={`w-4 h-4 shrink-0 ${isActive('/admin/simulados', pathname) ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
        Simulados
      </Link>

      <Link href="/admin/cards" className={navItemClass(isActive('/admin/cards', pathname))}>
        <LayoutGridIcon className={`w-4 h-4 shrink-0 ${isActive('/admin/cards', pathname) ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
        Cards
      </Link>

      {/* ── Sistema ── */}
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest px-3 pt-4 pb-1.5">
        Sistema
      </p>

      <Link href="/admin/usuarios" className={navItemClass(isActive('/admin/usuarios', pathname))}>
        <UsersIcon className={`w-4 h-4 shrink-0 ${isActive('/admin/usuarios', pathname) ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-300'}`} />
        Usuários
      </Link>
    </nav>
  );
}

/* ── Icons ────────────────────────────────────────────── */

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LayoutGridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
