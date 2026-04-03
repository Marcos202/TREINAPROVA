'use server';

import { createClient } from '@/lib/supabase/server';

const PG_UNIQUE_VIOLATION = '23505';

type OrgaoRow = { id: string; tenant_id: string; name: string; created_at: string };
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

export async function createOrgao(
  tenant: string,
  name: string
): Promise<ActionResult<OrgaoRow>> {
  const trimmed = name.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { data, error } = await supabase
    .from('institutions')
    .insert({ tenant_id: tenant, name: trimmed })
    .select('id, tenant_id, name, created_at')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return { data: null, error: 'Órgão já cadastrado para esta vertical.' };
    return { data: null, error: error.message };
  }
  return { data: data as OrgaoRow, error: null };
}

export async function renameOrgao(
  id: string,
  newName: string
): Promise<ActionResult<OrgaoRow>> {
  const trimmed = newName.trim();
  if (!trimmed) return { data: null, error: 'Nome é obrigatório.' };

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { data, error } = await supabase
    .from('institutions')
    .update({ name: trimmed })
    .eq('id', id)
    .select('id, tenant_id, name, created_at')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) return { data: null, error: 'Já existe um órgão com este nome.' };
    return { data: null, error: error.message };
  }
  return { data: data as OrgaoRow, error: null };
}

export async function deleteOrgao(id: string): Promise<ActionResult<{ id: string }>> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  try { supabase = await assertAdmin(); } catch (e) { return { data: null, error: (e as Error).message }; }

  const { error } = await supabase.from('institutions').delete().eq('id', id);
  if (error) return { data: null, error: error.message };
  return { data: { id }, error: null };
}
