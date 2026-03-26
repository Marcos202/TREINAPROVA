'use server';

import { createClient } from '@/lib/supabase/server';
import { VALID_TENANTS } from '@/config/tenants';

export interface CreateSessionResult {
  sessionId?: string;
  error?: string;
}

/**
 * Cria uma sessão de treino:
 * 1. Chama a RPC `build_balanced_question_pool` para sortear questões
 * 2. Insere o resultado em `question_sessions`
 * 3. Retorna o ID da sessão criada
 */
export async function createTestSession(
  tenant: string,
  selectedSubjectIds: string[] | null
): Promise<CreateSessionResult> {
  console.log('🚀 [sessionActions] Action iniciada', { tenant, selectedSubjectIds });

  if (!VALID_TENANTS.includes(tenant)) {
    console.error('[sessionActions] Tenant inválido:', tenant);
    return { error: 'Tenant inválido.' };
  }

  const supabase = await createClient();

  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    console.error('[sessionActions] Usuário não autenticado');
    return { error: 'Você precisa estar logado para gerar um teste.' };
  }

  // ── 1. Tentar RPC; fallback para query direta se função não existir ──────
  let questionIds: string[] | null = null;

  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'build_balanced_question_pool',
    { p_tenant_id: tenant, p_subject_ids: selectedSubjectIds ?? null, p_limit: 10 }
  );

  console.log('[sessionActions] RPC resultado:', { rpcData, rpcError });

  if (!rpcError && rpcData) {
    // RPC disponível e funcionou
    questionIds = rpcData as string[];
  } else {
    // RPC não existe ainda — fallback: query direta com shuffle no JS
    console.warn('[sessionActions] RPC indisponível, usando query direta. Erro:', rpcError?.message);

    let q = supabase
      .from('questions')
      .select('id')
      .eq('tenant_id', tenant);

    if (selectedSubjectIds && selectedSubjectIds.length > 0) {
      q = q.in('subject_id', selectedSubjectIds);
    }

    const { data: rows, error: qErr } = await q;

    console.log('[sessionActions] Query direta resultado:', { count: rows?.length, qErr });

    if (qErr) {
      console.error('[sessionActions] Query direta falhou:', qErr);
      return { error: `Erro ao buscar questões: ${qErr.message}` };
    }

    if (!rows || rows.length === 0) {
      return {
        error:
          'Nenhuma questão encontrada para as disciplinas selecionadas. ' +
          'Selecione outras disciplinas ou verifique se há questões cadastradas neste tenant.',
      };
    }

    // Fisher-Yates shuffle + slice dos primeiros 10
    const ids = rows.map((r) => r.id as string);
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    questionIds = ids.slice(0, 10);
  }

  if (!questionIds || questionIds.length === 0) {
    return {
      error: 'Nenhuma questão encontrada para as disciplinas selecionadas.',
    };
  }

  console.log(`[sessionActions] ${questionIds.length} questões selecionadas.`);

  // ── 2. Inserir sessão ────────────────────────────────────────────────────
  const { data: sessionData, error: insertError } = await supabase
    .from('question_sessions')
    .insert({
      user_id: session.user.id,
      tenant_id: tenant,
      question_ids: questionIds,
      current_index: 0,
      total: questionIds.length,
      filters: selectedSubjectIds ? { subject_ids: selectedSubjectIds } : {},
    })
    .select('id')
    .single();

  console.log('[sessionActions] INSERT resultado:', { sessionData, insertError });

  if (insertError || !sessionData) {
    console.error('[sessionActions] INSERT falhou:', insertError);
    return { error: `Erro ao criar sessão: ${insertError?.message ?? 'unknown'}` };
  }

  console.log('✅ [sessionActions] Sessão criada com ID:', sessionData.id);
  return { sessionId: sessionData.id };
}
