"use client";

import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { label: "Dashboard",         path: "",            icon: "📊" },
  { label: "Banco de Questões",  path: "/questoes",   icon: "📝" },
  { label: "Simulados",         path: "/simulados",  icon: "🎯" },
  { label: "Estatísticas",      path: "/estatisticas", icon: "📈" },
  { label: "Comunidade",        path: "/comunidade", icon: "💬" },
];

interface SidebarProps {
  tenant: string;
  tenantLabel: string;
}

export default function Sidebar({ tenant, tenantLabel }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-64 flex-shrink-0 min-h-screen bg-white border-r border-slate-200 flex flex-col">
      {/* Tenant Branding */}
      <div className="px-5 h-16 flex items-center border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
            <span className="text-white font-bold text-xs tracking-tight">
              {tenant.substring(0, 3).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 leading-tight">
              {tenantLabel}
            </p>
            <p className="text-[11px] text-slate-400 leading-tight">
              Treina Prova
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 flex flex-col gap-0.5">
        {NAV_ITEMS.map((item) => {
          const fullHref = `/${tenant}${item.path}`;
          const isActive =
            item.path === ""
              ? pathname === `/${tenant}` || pathname === `/${tenant}/`
              : pathname.startsWith(`/${tenant}${item.path}`);

          return (
            <a
              key={item.path}
              href={fullHref}
              className={`
                flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors duration-100
                ${
                  isActive
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }
              `}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-slate-200">
        <a
          href="/aluno"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-colors duration-100"
        >
          <span className="text-base leading-none">←</span>
          <span>Voltar ao Hub</span>
        </a>
      </div>
    </aside>
  );
}
