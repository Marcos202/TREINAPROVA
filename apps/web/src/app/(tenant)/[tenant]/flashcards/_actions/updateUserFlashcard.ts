'use server';

import { createClient } from '@/lib/supabase/server';
import { diffR2Keys, deleteR2Objects } from '@/lib/r2/cleanup';
import { revalidatePath } from 'next/cache';
import {
  sanitizeFlashcardHtml,
  stripHtmlForCount,
  FLASHCARD_FRONT_LIMIT,
  FLASHCARD_BACK_LIMIT,
} from '@/lib/flashcard-sanitize';

// ── updateUserFlashcard ────────────────────────────────────────────────────────
//
// Server Action: updates an existing personal flashcard.
// RLS on user_flashcards ensures the student can only update their own rows,
// but we also add .eq('user_id', ...) for belt-and-suspenders safety.
// ─────────────────────────────────────────────────────────────────────────────

interface Params {
  id: string;
  tenant: string;
  subjectId: string | null;
  front: string;
  back: string;
}

export interface UpdateFlashcardResult {
  success: boolean;
  error?: string;
}

export async function updateUserFlashcard({
  id,
  tenant,
  subjectId,
  front,
  back,
}: Params): Promise<UpdateFlashcardResult> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return { success: false, error: 'Sessão expirada. Faça login novamente.' };
  }

  // ── Sanitize inputs (XSS defense-in-depth) ───────────────────────────────
  const cleanFront = sanitizeFlashcardHtml(front);
  const cleanBack  = sanitizeFlashcardHtml(back);
  // ─────────────────────────────────────────────────────────────────────────

  if (!cleanFront.trim() || cleanFront === '<p></p>') {
    return { success: false, error: 'A frente do card não pode estar vazia.' };
  }
  if (!cleanBack.trim() || cleanBack === '<p></p>') {
    return { success: false, error: 'O verso do card não pode estar vazio.' };
  }

  // ── Server-side character-count guard ─────────────────────────────────────
  if (stripHtmlForCount(cleanFront).length > FLASHCARD_FRONT_LIMIT) {
    return { success: false, error: `A frente excede ${FLASHCARD_FRONT_LIMIT} caracteres.` };
  }
  if (stripHtmlForCount(cleanBack).length > FLASHCARD_BACK_LIMIT) {
    return { success: false, error: `O verso excede ${FLASHCARD_BACK_LIMIT} caracteres.` };
  }
  // ─────────────────────────────────────────────────────────────────────────

  // ── Cenário B: Cleanup R2 images that were removed during editing ─────────
  const { data: currentCard } = await supabase
    .from('user_flashcards')
    .select('front, back')
    .eq('id', id)
    .eq('user_id', session.user.id)
    .single();

  if (currentCard) {
    const orphanKeys = [
      ...diffR2Keys(currentCard.front as string ?? '', cleanFront),
      ...diffR2Keys(currentCard.back as string ?? '', cleanBack),
    ];
    if (orphanKeys.length) {
      // Fire-and-forget: don't block the save on R2 cleanup
      deleteR2Objects(orphanKeys).catch((err) =>
        console.error('[updateUserFlashcard] R2 cleanup error:', err)
      );
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { error } = await supabase
    .from('user_flashcards')
    .update({
      subject_id: subjectId || null,
      front: cleanFront,
      back: cleanBack,
    })
    .eq('id', id)
    .eq('user_id', session.user.id); // belt-and-suspenders; RLS also enforces this

  if (error) {
    return { success: false, error: 'Erro ao salvar alterações. Tente novamente.' };
  }

  revalidatePath(`/${tenant}/flashcards`);
  return { success: true };
}
