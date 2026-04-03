import { createClient } from '@/lib/supabase/server';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface OfficialDeck {
  subjectId: string;
  subjectName: string;
  count: number;
}

export interface PersonalDeck {
  /** null → card sem disciplina associada */
  subjectId: string | null;
  subjectName: string;
  count: number;
}

// ── Official decks ────────────────────────────────────────────────────────────

/**
 * Retorna todas as disciplinas que possuem pelo menos uma questão com
 * flashcard_front preenchido para o tenant.
 * Executa 2 queries: uma para os subject_ids, outra para os nomes.
 */
export async function getOfficialDecks(tenant: string): Promise<OfficialDeck[]> {
  const supabase = await createClient();

  // Apenas os subject_ids — evita buscar todos os campos de questões
  const { data: rows, error } = await supabase
    .from('questions')
    .select('subject_id')
    .eq('tenant_id', tenant)
    .not('flashcard_front', 'is', null)
    .not('subject_id', 'is', null);

  if (error || !rows || rows.length === 0) return [];

  // Agrupar por subject_id em JS — evita RPC customizada
  const countMap = new Map<string, number>();
  for (const row of rows) {
    if (row.subject_id) {
      countMap.set(row.subject_id, (countMap.get(row.subject_id) ?? 0) + 1);
    }
  }
  if (countMap.size === 0) return [];

  // Buscar nomes das disciplinas
  const { data: subjects } = await supabase
    .from('subjects')
    .select('id, name')
    .in('id', [...countMap.keys()]);

  if (!subjects) return [];

  return subjects
    .map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      count: countMap.get(s.id) ?? 0,
    }))
    .filter((d) => d.count > 0)
    .sort((a, b) => a.subjectName.localeCompare(b.subjectName, 'pt-BR'));
}

// ── Personal decks ────────────────────────────────────────────────────────────

/**
 * Retorna os baralhos pessoais do aluno autenticado, agrupados por disciplina.
 * Falha silenciosamente se a tabela não existir (migration ainda não aplicada).
 */
export async function getPersonalDecks(tenant: string): Promise<PersonalDeck[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  try {
    const { data: cards } = await supabase
      .from('user_flashcards')
      .select('subject_id, subjects(name)')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant);

    if (!cards || cards.length === 0) return [];

    // Agrupar por subject_id em JS
    const groupMap = new Map<
      string,
      { subjectId: string | null; subjectName: string; count: number }
    >();

    for (const card of cards) {
      const key = card.subject_id ?? '__none__';
      const subjectName =
        (card.subjects as unknown as { name: string } | null)?.name ?? 'Sem disciplina';
      const current = groupMap.get(key) ?? {
        subjectId: card.subject_id ?? null,
        subjectName,
        count: 0,
      };
      groupMap.set(key, { ...current, count: current.count + 1 });
    }

    return [...groupMap.values()].sort((a, b) =>
      a.subjectName.localeCompare(b.subjectName, 'pt-BR')
    );
  } catch {
    // Tabela ainda não existe (migration não aplicada) — retorna vazio graciosamente
    return [];
  }
}
