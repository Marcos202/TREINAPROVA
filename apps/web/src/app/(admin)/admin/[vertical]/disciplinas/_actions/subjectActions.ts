'use server';

import { createClient } from '@/lib/supabase/server';

// Código PostgreSQL para violação de unique constraint
const PG_UNIQUE_VIOLATION = '23505';

type SubjectRow = { id: string; tenant_id: string; name: string; created_at: string };
type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

/** Verifica autenticação + is_admin. Lança string de erro se falhar. */
async function assertAdmin(): Promise<ReturnType<typeof createClient>> {
  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Acesso negado. Apenas administradores.');

  return supabase;
}

// =============================================================================
// createSubject — Cria nova disciplina com verificação de unicidade
// =============================================================================
export async function createSubject(
  tenant: string,
  name: string
): Promise<ActionResult<SubjectRow>> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await assertAdmin();
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }

  const { data, error } = await supabase
    .from('subjects')
    .insert({ tenant_id: tenant, name: trimmed })
    .select('id, tenant_id, name, created_at')
    .single();

  if (error) {
    // Unique violation (23505) — índice subjects_tenant_name_unique
    if (error.code === PG_UNIQUE_VIOLATION) {
      return { data: null, error: 'Disciplina já cadastrada para esta vertical.' };
    }
    return { data: null, error: error.message };
  }

  return { data: data as SubjectRow, error: null };
}

// =============================================================================
// renameSubject — Renomeia disciplina (questions mantêm o mesmo subject_id)
// =============================================================================
export async function renameSubject(
  id: string,
  newName: string
): Promise<ActionResult<SubjectRow>> {
  const trimmed = newName.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await assertAdmin();
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }

  const { data, error } = await supabase
    .from('subjects')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, tenant_id, name, created_at')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      return { data: null, error: 'Já existe uma disciplina com este nome nesta vertical.' };
    }
    return { data: null, error: error.message };
  }

  return { data: data as SubjectRow, error: null };
}

// =============================================================================
// deleteSubject — Deleta disciplina APENAS se não houver questões vinculadas
// =============================================================================
export async function deleteSubject(id: string): Promise<ActionResult<{ id: string }>> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = await assertAdmin();
  } catch (e) {
    return { data: null, error: (e as Error).message };
  }

  // Verificar impacto antes de deletar
  const { count, error: countError } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('subject_id', id);

  if (countError) return { data: null, error: countError.message };

  if ((count ?? 0) > 0) {
    return {
      data: null,
      error: `Não é possível excluir: ${count} questão${count !== 1 ? 'ões' : ''} usa${count === 1 ? '' : 'm'} esta disciplina. Reatribua-as primeiro.`,
    };
  }

  const { error } = await supabase
    .from('subjects')
    .delete()
    .eq('id', id);

  if (error) return { data: null, error: error.message };

  return { data: { id }, error: null };
}
