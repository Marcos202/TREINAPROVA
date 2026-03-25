import { notFound } from "next/navigation";
import { TENANT_LABELS, TENANT_THEME, VALID_TENANTS } from "@/config/tenants";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./_components/Sidebar";
import MobileDrawer from "./_components/MobileDrawer";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const resolvedParams = await params;
  const tenant = resolvedParams.tenant;

  if (!VALID_TENANTS.includes(tenant)) notFound();

  const tenantLabel = TENANT_LABELS[tenant] || tenant.toUpperCase();
  const theme = TENANT_THEME[tenant] ?? TENANT_THEME['med'];

  // Fetch user for top bar + mobile drawer
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? '';
  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? 'Estudante';
  const userHandle = userEmail ? '@' + userEmail.split('@')[0] : '@estudante';

  return (
    <>
      {/* ── Desktop Sidebar: fixed, hidden < lg ──────────────────── */}
      <Sidebar tenant={tenant} tenantLabel={tenantLabel} />

      {/* ── Mobile Drawer + sticky mobile header (hidden ≥ lg) ───── */}
      <MobileDrawer
        tenant={tenant}
        tenantLabel={tenantLabel}
        theme={theme}
        userName={userName}
        userHandle={userHandle}
      />

      {/* ── Main wrapper ─────────────────────────────────────────── */}
      <div className="lg:ml-80 min-h-screen flex flex-col bg-[#F4F7FE]">

        {/* ── Mobile spacer for sticky header (h-14) ─────────────── */}
        <div className="lg:hidden h-14 flex-shrink-0" />

        {/* ── Desktop Top Bar (hidden < lg) ────────────────────────── */}
        <header className="hidden lg:flex items-center justify-between px-6 lg:px-8 h-[68px] bg-white border-b border-slate-200/70 flex-shrink-0">
          {/* Left: title + date */}
          <div>
            <h2 className="text-[17px] font-bold text-slate-900 leading-tight">Dashboard</h2>
            <p className="text-[11px] text-slate-400 font-medium capitalize mt-0.5">
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>

          {/* Right: actions + user */}
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>

            <div className="relative">
              <button className="w-9 h-9 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                  <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                </svg>
              </button>
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </div>

            <div className="w-px h-6 bg-slate-200" />

            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                style={{ background: theme.accentGradient }}
              >
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-slate-900 leading-tight">{userName}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{userHandle}</p>
              </div>
              <a
                href={`/${tenant}/configuracoes`}
                className="w-8 h-8 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/60 flex items-center justify-center transition-colors ml-1"
              >
                <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="4" x2="4" y1="21" y2="14" /><line x1="4" x2="4" y1="10" y2="3" />
                  <line x1="12" x2="12" y1="21" y2="12" /><line x1="12" x2="12" y1="8" y2="3" />
                  <line x1="20" x2="20" y1="21" y2="16" /><line x1="20" x2="20" y1="12" y2="3" />
                  <line x1="1" x2="7" y1="14" y2="14" /><line x1="9" x2="15" y1="8" y2="8" />
                  <line x1="17" x2="23" y1="16" y2="16" />
                </svg>
              </a>
            </div>
          </div>
        </header>

        {/* ── Page content ────────────────────────────────────────── */}
        <main className="flex-1">
          <div className="px-4 sm:px-6 lg:px-8 py-5 lg:py-6">
            {children}
          </div>
        </main>

      </div>
    </>
  );
}
