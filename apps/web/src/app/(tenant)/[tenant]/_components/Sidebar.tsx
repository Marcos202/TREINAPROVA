'use client';

import { usePathname } from 'next/navigation';
import { TENANT_THEME } from '@/config/tenants';

/* ──────────────────────────────────────────────────────────────────────────────
   SVG Icon components
   ────────────────────────────────────────────────────────────────────────────── */

function IconDashboard(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function IconQuestions(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <path d="M9 15h6" />
      <path d="M9 11h6" />
    </svg>
  );
}

function IconExams(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconStats(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="m19 9-5 5-4-4-3 3" />
    </svg>
  );
}

function IconCommunity(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconPlan(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconFlashcards(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9h20" />
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M10 14h4" />
    </svg>
  );
}

function IconLogout(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

/* ──────────────────────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  { label: 'Dashboard', path: '', icon: IconDashboard },
  { label: 'Plano de Aprovação', path: '/plano', icon: IconPlan },
  { label: 'Banco de Questões', path: '/questoes', icon: IconQuestions },
  { label: 'Simulados', path: '/simulados', icon: IconExams },
  { label: 'Flashcards', path: '/flashcards', icon: IconFlashcards },
  { label: 'Estatísticas', path: '/estatisticas', icon: IconStats },
  { label: 'Comunidade', path: '/comunidade', icon: IconCommunity },
];

interface SidebarProps {
  tenant: string;
  tenantLabel: string;
}

export default function Sidebar({ tenant, tenantLabel }: SidebarProps) {
  const pathname = usePathname();
  const theme = TENANT_THEME[tenant] ?? TENANT_THEME['med'];

  return (
    <>
      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-50 w-80 flex-col bg-white border-r border-slate-200/80">

        {/* Brand header — height matches top bar (68px) */}
        <div className="px-5 h-[68px] flex items-center gap-3 border-b border-slate-200/70 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
            style={{ background: theme.accentGradient }}
          >
            <span className="text-white font-bold text-xs tracking-tight">
              {tenant.substring(0, 2).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-[14px] font-semibold text-slate-900 leading-tight">
              {tenantLabel}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight font-medium">
              Treina Prova
            </p>
          </div>
        </div>

        {/* Navigation — flex-1 + overflow-y-auto para scroll interno */}
        <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-2 flex flex-col gap-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const fullHref = `/${tenant}${item.path}`;
            const itemHref = `/${tenant}${item.path}`;
            const isActive =
              item.path === ''
                ? pathname === `/${tenant}` || pathname === `/${tenant}/`
                : pathname === itemHref ||
                  pathname.startsWith(`${itemHref}/`) ||
                  (item.path === '/questoes' && pathname.startsWith(`/${tenant}/treino`));

            const Icon = item.icon;

            return (
              <a
                key={item.path}
                href={fullHref}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150
                  ${isActive
                    ? theme.sidebarActive + ' shadow-sm'
                    : 'text-slate-500 ' + theme.sidebarHover
                  }
                `}
              >
                <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                )}
              </a>
            );
          })}
        </nav>

        {/* ── Promo Card — FORA do scroll, sempre visível ─────────── */}
        <div className="px-3 pb-2 flex-shrink-0">
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-4">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shadow-sm mb-3">
              <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
              </svg>
            </div>
            <p className="text-[13px] font-semibold text-slate-800 leading-tight mb-1">
              Treina Prova Premium
            </p>
            <p className="text-[11px] text-slate-500 leading-relaxed mb-3">
              Desbloqueie estatísticas avançadas e simulados infinitos.
            </p>
            <a
              href={`/${tenant}/planos`}
              className="block w-full py-2 rounded-lg text-[12px] font-semibold text-white text-center transition-opacity hover:opacity-90"
              style={{ background: theme.accentGradient }}
            >
              Fazer Upgrade
            </a>
          </div>
        </div>

        {/* ── Logout — minimalista ─────────────────────────────────── */}
        <div className="px-3 pb-4 flex-shrink-0">
          <div className="h-px bg-slate-100 mb-2" />
          <a
            href="/aluno"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
          >
            <IconLogout className="w-[18px] h-[18px]" />
            <span>Sair</span>
          </a>
        </div>
      </aside>

    </>
  );
}

