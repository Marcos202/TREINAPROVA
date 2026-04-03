'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { VALID_TENANTS } from '@/config/tenants';
import { VerticalSwitcher } from './VerticalSwitcher';

function isActive(href: string, pathname: string) {
  return href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);
}

function navItemClass(active: boolean) {
  return (
    'flex items-center gap-2.5 px-3 py-2 text-[13px] rounded-md transition-all duration-150 group ' +
    (active
      ? 'bg-slate-100 text-slate-900 font-semibold'
      : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900')
  );
}

function sectionLabel(text: string) {
  return (
    <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-3 pt-4 pb-1.5">
      {text}
    </p>
  );
}

export function AdminSidebarNav() {
  const pathname = usePathname();

  // Detect active vertical from URL: /admin/[vertical]/...
  const segments = pathname.split('/');
  const adminIndex = segments.indexOf('admin');
  const currentSegment = adminIndex !== -1 ? segments[adminIndex + 1] : null;
  const activeVertical = VALID_TENANTS.includes(currentSegment as any) ? currentSegment : null;

  return (
    <nav className="px-2 space-y-0.5">
      {/* ── Vertical Switcher ── */}
      <VerticalSwitcher />

      <div className="mx-3 my-1 border-t border-slate-100" />

      {activeVertical ? (
        /* ── Per-vertical navigation ── */
        <>
          {sectionLabel('Navegação')}

          <Link
            href={`/admin/${activeVertical}`}
            className={navItemClass(pathname === `/admin/${activeVertical}`)}
          >
            <HomeIcon className={`w-4 h-4 shrink-0 ${pathname === `/admin/${activeVertical}` ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Dashboard
          </Link>

          {sectionLabel('Banco de Conteúdo')}

          <Link
            href={`/admin/${activeVertical}/questoes`}
            className={navItemClass(isActive(`/admin/${activeVertical}/questoes`, pathname))}
          >
            <DatabaseIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/questoes`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Questões
          </Link>

          <Link
            href={`/admin/${activeVertical}/disciplinas`}
            className={navItemClass(isActive(`/admin/${activeVertical}/disciplinas`, pathname))}
          >
            <BookOpenIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/disciplinas`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Disciplinas
          </Link>

          <Link
            href={`/admin/${activeVertical}/bancas`}
            className={navItemClass(isActive(`/admin/${activeVertical}/bancas`, pathname))}
          >
            <BuildingIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/bancas`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Bancas
          </Link>

          <Link
            href={`/admin/${activeVertical}/orgaos`}
            className={navItemClass(isActive(`/admin/${activeVertical}/orgaos`, pathname))}
          >
            <LandmarkIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/orgaos`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Órgãos
          </Link>

          <Link
            href={`/admin/${activeVertical}/provas`}
            className={navItemClass(isActive(`/admin/${activeVertical}/provas`, pathname))}
          >
            <ClipboardIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/provas`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Provas
          </Link>

          {sectionLabel('Treinamento')}

          <Link
            href={`/admin/${activeVertical}/simulados`}
            className={navItemClass(isActive(`/admin/${activeVertical}/simulados`, pathname))}
          >
            <FileTextIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/simulados`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Simulados
          </Link>

          <Link
            href={`/admin/${activeVertical}/cards`}
            className={navItemClass(isActive(`/admin/${activeVertical}/cards`, pathname))}
          >
            <LayoutGridIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/cards`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Cards
          </Link>

          {sectionLabel('Comercial')}

          <Link
            href={`/admin/${activeVertical}/planos`}
            className={navItemClass(isActive(`/admin/${activeVertical}/planos`, pathname))}
          >
            <TagIcon className={`w-4 h-4 shrink-0 ${isActive(`/admin/${activeVertical}/planos`, pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Planos e Preços
          </Link>

          {sectionLabel('Sistema')}

          <Link href="/admin/usuarios" className={navItemClass(isActive('/admin/usuarios', pathname))}>
            <UsersIcon className={`w-4 h-4 shrink-0 ${isActive('/admin/usuarios', pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Usuários
          </Link>
        </>
      ) : (
        /* ── Global /admin navigation ── */
        <>
          {sectionLabel('Gerenciamento')}

          <Link href="/admin" className={navItemClass(isActive('/admin', pathname))}>
            <HomeIcon className={`w-4 h-4 shrink-0 ${isActive('/admin', pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Dashboard Global
          </Link>

          {sectionLabel('Sistema')}

          <Link href="/admin/usuarios" className={navItemClass(isActive('/admin/usuarios', pathname))}>
            <UsersIcon className={`w-4 h-4 shrink-0 ${isActive('/admin/usuarios', pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Usuários
          </Link>

          <Link href="/admin/desenvolvedor" className={navItemClass(isActive('/admin/desenvolvedor', pathname))}>
            <BrainIcon className={`w-4 h-4 shrink-0 ${isActive('/admin/desenvolvedor', pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Motor de IA
          </Link>

          <Link href="/admin/financeiro" className={navItemClass(isActive('/admin/financeiro', pathname))}>
            <CreditCardIcon className={`w-4 h-4 shrink-0 ${isActive('/admin/financeiro', pathname) ? 'text-slate-900' : 'text-slate-500 group-hover:text-slate-700'}`} />
            Financeiro
          </Link>
        </>
      )}
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

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function BuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="16" height="20" x="4" y="2" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01M12 14h.01M8 14h.01M16 14h.01" />
    </svg>
  );
}

function LandmarkIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" x2="21" y1="22" y2="22" />
      <line x1="6" x2="6" y1="18" y2="11" />
      <line x1="10" x2="10" y1="18" y2="11" />
      <line x1="14" x2="14" y1="18" y2="11" />
      <line x1="18" x2="18" y1="18" y2="11" />
      <polygon points="12 2 20 7 4 7" />
    </svg>
  );
}

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
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

function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <path d="M2 10h20" />
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

function TagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
      <path d="M7 7h.01" />
    </svg>
  );
}

