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
    <div className="flex min-h-screen bg-white dark:bg-slate-950">
      <Sidebar tenant={tenant} tenantLabel={tenantLabel} />

      <main className="flex-1 min-w-0 overflow-auto">
        {/* Top bar */}
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 flex items-center px-8">
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {tenantLabel}
          </p>
        </div>

        {/* Page content */}
        <div className="px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
