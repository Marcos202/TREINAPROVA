import { notFound } from 'next/navigation';
import { VALID_TENANTS, TENANT_LABELS } from '@/config/tenants';
import { createClient } from '@/lib/supabase/server';
import { DisciplinaManager } from './_components/DisciplinaManager';

interface Props {
  params: Promise<{ tenant: string }>;
}

export async function generateStaticParams() {
  return VALID_TENANTS.map((tenant) => ({ tenant }));
}

export const revalidate = 0; // Sempre fresh — admin precisa ver estado real

export default async function AdminDisciplinasPage({ params }: Props) {
  const { tenant } = await params;

  if (!VALID_TENANTS.includes(tenant)) notFound();

  const label = TENANT_LABELS[tenant] ?? tenant;
  const supabase = await createClient();

  // Busca subjects + contagem de questões por disciplina em paralelo
  const [subjectsResult, countsResult] = await Promise.all([
    supabase
      .from('subjects')
      .select('id, name, created_at')
      .eq('tenant_id', tenant)
      .order('name'),
    supabase
      .from('questions')
      .select('subject_id')
      .eq('tenant_id', tenant),
  ]);

  const rawSubjects = subjectsResult.data ?? [];
  const questions = countsResult.data ?? [];

  // Conta questões por subject_id no lado do servidor (evita N+1 queries)
  const countMap = new Map<string, number>();
  for (const q of questions) {
    if (q.subject_id) {
      countMap.set(q.subject_id, (countMap.get(q.subject_id) ?? 0) + 1);
    }
  }

  const subjects = rawSubjects.map((s) => ({
    ...s,
    questionCount: countMap.get(s.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-1">
          <span>Banco de Questões</span>
          <span>/</span>
          <span>{label}</span>
          <span>/</span>
          <span className="text-zinc-700 font-medium">Disciplinas</span>
        </div>
        <p className="text-sm text-zinc-500 mt-1 max-w-xl">
          Gerencie as disciplinas da vertical <strong>{label}</strong>.
          Disciplinas são usadas para organizar e filtrar questões.
          Não é possível excluir uma disciplina que possua questões vinculadas.
        </p>
      </div>

      <DisciplinaManager
        tenant={tenant}
        tenantLabel={label}
        initialSubjects={subjects}
      />
    </div>
  );
}
