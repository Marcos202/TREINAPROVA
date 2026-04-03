'use server';

import { createClient } from '@/lib/supabase/server';

// ── getPersonalFlashcardsForDeck ───────────────────────────────────────────────
//
// Returns the individual personal flashcards for a specific deck (= subject_id
// grouping) belonging to the currently authenticated user.
// Called from ManageDeckModal to populate the card list.
// ─────────────────────────────────────────────────────────────────────────────

export interface PersonalFlashcardItem {
  id: string;
  subjectId: string | null;
  front: string;
  back: string;
}

export async function getPersonalFlashcardsForDeck(
  tenant: string,
  subjectId: string | null
): Promise<PersonalFlashcardItem[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  try {
    let query = supabase
      .from('user_flashcards')
      .select('id, subject_id, front, back')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant)
      .order('created_at', { ascending: false });

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    } else {
      query = query.is('subject_id', null);
    }

    const { data } = await query;

    return (data ?? []).map((card) => ({
      id: card.id as string,
      subjectId: (card.subject_id as string | null) ?? null,
      front: card.front as string,
      back: card.back as string,
    }));
  } catch {
    return [];
  }
}
