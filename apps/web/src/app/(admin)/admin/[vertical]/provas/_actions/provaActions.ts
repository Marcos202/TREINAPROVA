'use server';

import { createClient } from '@/lib/supabase/server';

const PG_UNIQUE_VIOLATION = '23505';

type ProvaRow = { id: string; tenant_id: string; name: string; year: number | null; created_at: string };
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

export async function createProva(
  tenant: string,
  name: string,
  year: number | null
): Promise<ActionResult<ProvaRow>> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { data, error } = await supabase
    .from('exams_names')
    .insert({ tenant_id: tenant, name: trimmed, year: year || null })
    .select('id, tenant_id, name, year, created_at')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return { data: null, error: 'Prova com este nome e ano já cadastrada.' };
    return { data: null, error: error.message };
  }
  return { data: data as ProvaRow, error: null };
}

export async function renameProva(
  id: string,
  name: string,
  year: number | null
): Promise<ActionResult<ProvaRow>> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { data, error } = await supabase
    .from('exams_names')
    .update({ name: trimmed, year: year || null })
    .eq('id', id)
    .select('id, tenant_id, name, year, created_at')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return { data: null, error: 'Já existe uma prova com este nome e ano.' };
    return { data: null, error: error.message };
  }
  return { data: data as ProvaRow, error: null };
}

export async function deleteProva(id: string): Promise<ActionResult<{ id: string }>> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { error } = await supabase.from('exams_names').delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}
