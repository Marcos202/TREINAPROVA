import { notFound } from 'next/navigation';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';
import { createClient } from '@/lib/supabase/server';
import { OrgaoManager } from './_components/OrgaoManager';

interface Props {
  params: Promise<{ vertical: string }>;
}

export async function generateStaticParams() {
  return VALID_TENANTS.map((vertical) => ({ vertical }));
}

export const revalidate = 0;

export default async function AdminOrgaosPage({ params }: Props) {
  const { vertical } = await params;
  if (!VALID_TENANTS.includes(vertical)) notFound();

  const label = TENANT_LABELS[vertical] ?? vertical;
  const supabase = await createClient();

  const { data: orgaos } = await supabase
    .from('institutions')
    .select('id, name, tenant_id, created_at')
    .eq('tenant_id', vertical)
    .order('name');

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <span>Banco de Questões</span>
          <span>/</span>
          <span>{label}</span>
          <span>/</span>
          <span className="text-zinc-700 font-medium">Órgãos</span>
        </div>
        <p className="text-sm text-zinc-500 mt-1 max-w-xl">
          Gerencie os órgãos e instituições da vertical <strong>{label}</strong>.
          Órgãos são usados para classificar e filtrar questões.
        </p>
      </div>

      <OrgaoManager
        tenant={vertical}
        tenantLabel={label}
        initialOrgaos={(orgaos ?? []) as { id: string; tenant_id: string; name: string; created_at: string }[]}
      />
    </div>
  );
}
