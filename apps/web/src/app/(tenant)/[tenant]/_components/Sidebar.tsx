'use client';

import { usePathname } from 'next/navigation';
import { TENANT_THEME } from '@/config/tenants';

/* ──────────────────────────────────────────────────────────────────────────────
   SVG Icon components — compact, consistent, no emoji
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

function IconSettings(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.08a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconBack(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
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
  { label: 'Banco de Questões', path: '/questoes', icon: IconQuestions },
  { label: 'Simulados', path: '/simulados', icon: IconExams },
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
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 min-h-screen flex-col bg-white border-r border-slate-200/80">
        {/* Brand header */}
        <div className="px-5 h-[72px] flex items-center gap-3">
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

        {/* Divider */}
        <div className="px-5"><div className="h-px bg-slate-100" /></div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 pb-3 flex flex-col gap-0.5">
          <p className="px-3 mb-2 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">
            Menu
          </p>
          {NAV_ITEMS.map((item) => {
            const fullHref = `/${tenant}${item.path}`;
            const isActive =
              item.path === ''
                ? pathname === `/${tenant}` || pathname === `/${tenant}/`
                : pathname.startsWith(`/${tenant}${item.path}`);

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
                <Icon className="w-[18px] h-[18px]" />
                <span>{item.label}</span>
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                )}
              </a>
            );
          })}
        </nav>

        {/* Bottom section — settings + back */}
        <div className="px-3 pb-3 mt-auto space-y-0.5">
          <div className="h-px bg-slate-100 mx-2 mb-2" />
          <a
            href={`/${tenant}/configuracoes`}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 ${theme.sidebarHover} transition-all duration-150`}
          >
            <IconSettings className="w-[18px] h-[18px]" />
            <span>Configurações</span>
          </a>
          <a
            href="/aluno"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-400 ${theme.sidebarHover} transition-all duration-150`}
          >
            <IconBack className="w-[18px] h-[18px]" />
            <span>Voltar ao Hub</span>
          </a>
        </div>
      </aside>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-t border-slate-200/80 flex items-center justify-around px-2 py-1.5 safe-area-bottom">
        {NAV_ITEMS.slice(0, 4).map((item) => {
          const fullHref = `/${tenant}${item.path}`;
          const isActive =
            item.path === ''
              ? pathname === `/${tenant}` || pathname === `/${tenant}/`
              : pathname.startsWith(`/${tenant}${item.path}`);
          const Icon = item.icon;

          return (
            <a
              key={item.path}
              href={fullHref}
              className={`flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-medium transition-colors ${isActive ? 'text-slate-900' : 'text-slate-400'
                }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label.length > 10 ? item.label.substring(0, 10) + '…' : item.label}</span>
              {isActive && (
                <span className="w-1 h-1 rounded-full -mt-0.5" style={{ backgroundColor: theme.accent }} />
              )}
            </a>
          );
        })}
        <a
          href="/aluno"
          className="flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[10px] font-medium text-slate-400"
        >
          <IconLogout className="w-5 h-5" />
          <span>Sair</span>
        </a>
      </nav>
    </>
  );
}
