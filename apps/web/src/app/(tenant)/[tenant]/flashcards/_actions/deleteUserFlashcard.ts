'use server';

import { createClient } from '@/lib/supabase/server';
import { extractR2Keys, deleteR2Objects } from '@/lib/r2/cleanup';
import { revalidatePath } from 'next/cache';

// ── deleteUserFlashcard ────────────────────────────────────────────────────────
//
// Cenário C: Deletes a personal flashcard and all R2 images embedded in it.
// Order of operations:
//   1. Fetch card from DB (validates ownership via .eq('user_id', ...))
//   2. Extract R2 keys from front + back HTML
//   3. Delete R2 objects (best-effort; DB deletion continues on failure)
//   4. Delete DB row
//   5. Revalidate the flashcards page
// ─────────────────────────────────────────────────────────────────────────────

export interface DeleteFlashcardResult {
  success: boolean;
  error?: string;
}

export async function deleteUserFlashcard(
  id: string,
  tenant: string
): Promise<DeleteFlashcardResult> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: 'Sessão expirada.' };
  }

  // Fetch the card to get HTML content for R2 cleanup
  const { data: card } = await supabase
    .from('user_flashcards')
    .select('front, back')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (!card) {
    return { success: false, error: 'Card não encontrado.' };
  }

  // Extract and delete R2 images (best-effort)
  const r2Keys = [
    ...extractR2Keys(card.front as string ?? ''),
    ...extractR2Keys(card.back as string ?? ''),
  ];
  if (r2Keys.length) {
    try {
      await deleteR2Objects(r2Keys);
      console.log('[deleteUserFlashcard] Deleted R2 keys:', r2Keys);
    } catch (err) {
      console.error('[deleteUserFlashcard] R2 cleanup error:', err);
      // Continue with DB deletion — storage leak is preferable to DB inconsistency
    }
  }

  // Delete the DB row (RLS also enforces user_id = session.user.id)
  const { error } = await supabase
    .from('user_flashcards')
    .delete()
    .eq('id', id)
    .eq('user_id', session.user.id);

  if (error) {
    return { success: false, error: 'Erro ao deletar card. Tente novamente.' };
  }

  revalidatePath(`/${tenant}/flashcards`);
  return { success: true };
}
