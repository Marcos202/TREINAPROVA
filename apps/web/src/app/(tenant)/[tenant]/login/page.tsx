import { notFound } from 'next/navigation';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';
import VerticalLoginForm from '../_components/VerticalLoginForm';

export default async function TenantLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ tenant: string }>;
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const { tenant } = await params;

  if (!VALID_TENANTS.includes(tenant)) {
    notFound();
  }

  const tenantLabel = TENANT_LABELS[tenant] ?? tenant.toUpperCase();
  const { redirectedFrom } = await searchParams;
  const redirectTo = redirectedFrom ?? `/${tenant}`;

  return (
    // fixed inset-0 cobre a sidebar do layout pai sem alterar a estrutura existente
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 px-4">
      <VerticalLoginForm tenant={tenant} tenantLabel={tenantLabel} redirectTo={redirectTo} />
    </div>
  );
}
