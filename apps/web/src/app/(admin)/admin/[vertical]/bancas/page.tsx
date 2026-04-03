import { notFound } from 'next/navigation';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';
import { createClient } from '@/lib/supabase/server';
import { BancaManager } from './_components/BancaManager';

interface Props {
  params: Promise<{ vertical: string }>;
}

export async function generateStaticParams() {
  return VALID_TENANTS.map((vertical) => ({ vertical }));
}

export const revalidate = 0;

export default async function AdminBancasPage({ params }: Props) {
  const { vertical } = await params;
  if (!VALID_TENANTS.includes(vertical)) notFound();

  const label = TENANT_LABELS[vertical] ?? vertical;
  const supabase = await createClient();

  const { data: bancas } = await supabase
    .from('exam_boards')
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
          <span className="text-zinc-700 font-medium">Bancas</span>
        </div>
        <p className="text-sm text-zinc-500 mt-1 max-w-xl">
          Gerencie as bancas organizadoras da vertical <strong>{label}</strong>.
          Bancas são usadas para classificar e filtrar questões.
        </p>
      </div>

      <BancaManager
        tenant={vertical}
        tenantLabel={label}
        initialBancas={(bancas ?? []) as { id: string; tenant_id: string; name: string; created_at: string }[]}
      />
    </div>
  );
}
