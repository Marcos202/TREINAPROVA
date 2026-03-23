import { notFound } from 'next/navigation';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';
import { createClient } from '@/lib/supabase/server';
import type { Subject } from './_components/types';
import { QuestionManager } from './_components/QuestionManager';

interface Props {
  params: Promise<{ tenant: string }>;
}

export async function generateStaticParams() {
  return VALID_TENANTS.map((tenant) => ({ tenant }));
}

export default async function AdminQuestoesTenantPage({ params }: Props) {
  const { tenant } = await params;

  if (!VALID_TENANTS.includes(tenant)) {
    notFound();
  }

  const label = TENANT_LABELS[tenant] ?? tenant;
  const supabase = await createClient();

  // Fetch subjects and question count in parallel
  const [subjectsResult, countResult] = await Promise.all([
    supabase
      .from('subjects')
      .select('id, name, tenant_id, created_at')
      .eq('tenant_id', tenant)
      .order('name'),
    supabase
      .from('questions')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenant),
  ]);

  const subjects = (subjectsResult.data ?? []) as Subject[];
  const questionCount = countResult.count ?? 0;

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Questões" value={questionCount} suffix="cadastradas" />
        <StatCard label="Disciplinas" value={subjects.length} suffix="disponíveis" />
        <StatCard label="Vertical" value={label} suffix={tenant} isText />
      </div>

      {/* Subject warning — only when truly empty */}
      {subjects.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 mt-0.5 shrink-0">⚠</span>
          <p className="text-sm text-amber-800">
            Nenhuma disciplina cadastrada para <strong>{label}</strong>. Adicione registros na tabela{' '}
            <code className="font-mono bg-amber-100 px-1 rounded text-xs">subjects</code> com{' '}
            <code className="font-mono bg-amber-100 px-1 rounded text-xs">tenant_id = &apos;{tenant}&apos;</code>.
          </p>
        </div>
      )}

      {/* Main manager — handles list ↔ form views */}
      <QuestionManager
        tenant={tenant}
        tenantLabel={label}
        subjects={subjects}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  isText,
}: {
  label: string;
  value: string | number;
  suffix: string;
  isText?: boolean;
}) {
  return (
    <div className="bg-white border border-zinc-200 rounded-lg px-3 sm:px-4 py-3 shadow-sm">
      <p className="text-[10px] sm:text-xs font-medium text-zinc-500 uppercase tracking-wider truncate">{label}</p>
      <p className={`font-bold mt-0.5 truncate ${isText ? 'text-sm sm:text-base text-zinc-800' : 'text-xl sm:text-2xl text-zinc-900'}`}>
        {value}
      </p>
      <p className="text-[10px] sm:text-xs text-zinc-400 mt-0.5 truncate">{suffix}</p>
    </div>
  );
}
