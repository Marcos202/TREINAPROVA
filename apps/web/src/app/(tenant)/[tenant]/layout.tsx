import { TENANT_LABELS } from "@/config/tenants";
import Sidebar from "./_components/Sidebar";

export default async function TenantLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ tenant: string }>;
}) {
  const resolvedParams = await params;
  const tenant = resolvedParams.tenant;
  const tenantLabel = TENANT_LABELS[tenant] || tenant.toUpperCase();

  return (
    <div className="flex min-h-screen bg-[#f8f9fb]">
      <Sidebar tenant={tenant} tenantLabel={tenantLabel} />

      <main className="flex-1 min-w-0 overflow-auto pb-20 lg:pb-0">
        {/* Top bar — desktop */}
        <header className="sticky top-0 z-30 h-[72px] bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-6 lg:px-8">
          <div>
            <h2 className="text-[15px] font-semibold text-slate-900">{tenantLabel}</h2>
            <p className="text-[11px] text-slate-400 font-medium">Plataforma de Estudos</p>
          </div>

          {/* Right side — profile placeholder */}
          <div className="flex items-center gap-3">
            {/* Notification bell */}
            <button className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200/80 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
            </button>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-800 to-slate-600 flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">A</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </div>
      </main>
    </div>
  );
}
