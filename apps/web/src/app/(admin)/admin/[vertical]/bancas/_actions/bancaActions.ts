'use server';

import { createClient } from '@/lib/supabase/server';

const PG_UNIQUE_VIOLATION = '23505';

type BancaRow = { id: string; tenant_id: string; name: string; created_at: string };
type ActionResult<T> = { data: T; error: null } | { data: null; error: string };

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

export async function createBanca(
  tenant: string,
  name: string
): Promise<ActionResult<BancaRow>> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { data, error } = await supabase
    .from('exam_boards')
    .insert({ tenant_id: tenant, name: trimmed })
    .select('id, tenant_id, name, created_at')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return { data: null, error: 'Banca já cadastrada para esta vertical.' };
    return { data: null, error: error.message };
  }
  return { data: data as BancaRow, error: null };
}

export async function renameBanca(
  id: string,
  newName: string
): Promise<ActionResult<BancaRow>> {
  const trimmed = newName.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { data, error } = await supabase
    .from('exam_boards')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, tenant_id, name, created_at')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return { data: null, error: 'Já existe uma banca com este nome.' };
    return { data: null, error: error.message };
  }
  return { data: data as BancaRow, error: null };
}

export async function deleteBanca(id: string): Promise<ActionResult<{ id: string }>> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { count } = await supabase
    .from('questions')
    .select('*', { count: 'exact', head: true })
    .eq('exam_board_id', id);

  const { error } = await supabase.from('exam_boards').delete().eq('id', id);
  if (error) return { data: null, error: error.message };

  // count info only for auditing — FK is SET NULL so delete is always safe
  void count;
  return { data: { id }, error: null };
}
