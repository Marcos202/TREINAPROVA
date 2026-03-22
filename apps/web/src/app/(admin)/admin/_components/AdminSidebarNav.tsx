'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';

export function AdminSidebarNav() {
  const pathname = usePathname();
  const [questoesOpen, setQuestoesOpen] = useState(
    pathname.startsWith('/admin/questoes')
  );

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  const linkClass = (href: string) =>
    `flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors group ${
      isActive(href)
        ? 'bg-zinc-800 text-white'
        : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
    }`;

  return (
    <nav className="p-4 space-y-1">
      <div className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 px-2 mt-2">
        Gerenciamento
      </div>

      {/* Dashboard */}
      <Link href="/admin" className={linkClass('/admin')}>
        <HomeIcon className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-zinc-300 shrink-0" />
        Dashboard
      </Link>

      {/* Banco de Questões — accordion */}
      <div>
        <button
          onClick={() => setQuestoesOpen((o) => !o)}
          className={`w-full flex items-center justify-between px-2 py-2 text-sm font-medium rounded-md transition-colors group ${
            pathname.startsWith('/admin/questoes')
              ? 'bg-zinc-800 text-white'
              : 'text-zinc-400 hover:bg-zinc-900 hover:text-white'
          }`}
        >
          <span className="flex items-center">
            <DatabaseIcon className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-zinc-300 shrink-0" />
            Banco de Questões
          </span>
          <ChevronIcon
            className={`h-4 w-4 text-zinc-500 transition-transform duration-200 ${
              questoesOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        {questoesOpen && (
          <div className="mt-1 ml-8 space-y-0.5">
            {VALID_TENANTS.map((tenant) => {
              const href = `/admin/questoes/${tenant}`;
              return (
                <Link
                  key={tenant}
                  href={href}
                  className={`flex items-center px-2 py-1.5 text-sm rounded-md transition-colors ${
                    pathname.startsWith(href)
                      ? 'text-white bg-zinc-800'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mr-2.5 shrink-0" />
                  {TENANT_LABELS[tenant]}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Simulados */}
      <Link href="/admin/simulados" className={linkClass('/admin/simulados')}>
        <FileTextIcon className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-zinc-300 shrink-0" />
        Simulados
      </Link>

      {/* Usuários */}
      <Link href="/admin/usuarios" className={linkClass('/admin/usuarios')}>
        <UsersIcon className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-zinc-300 shrink-0" />
        Usuários
      </Link>

      {/* Cards */}
      <Link href="/admin/cards" className={linkClass('/admin/cards')}>
        <LayoutGridIcon className="mr-3 h-5 w-5 text-zinc-400 group-hover:text-zinc-300 shrink-0" />
        Cards
      </Link>
    </nav>
  );
}

function HomeIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function DatabaseIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5V19A9 3 0 0 0 21 19V5" />
      <path d="M3 12A9 3 0 0 0 21 12" />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  );
}

function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function LayoutGridIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="3" rx="1" />
      <rect width="7" height="7" x="14" y="14" rx="1" />
      <rect width="7" height="7" x="3" y="14" rx="1" />
    </svg>
  );
}

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24"
      viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
