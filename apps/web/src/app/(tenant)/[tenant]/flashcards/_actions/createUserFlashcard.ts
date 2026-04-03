'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import {
  sanitizeFlashcardHtml,
  stripHtmlForCount,
  FLASHCARD_FRONT_LIMIT,
  FLASHCARD_BACK_LIMIT,
} from '@/lib/flashcard-sanitize';

// ── createUserFlashcard ────────────────────────────────────────────────────────
//
// Server Action: persists a new personal flashcard.
// Called from CreateFlashcardModal after the student fills in front/back.
// ─────────────────────────────────────────────────────────────────────────────

interface Params {
  tenant: string;
  subjectId: string | null;
  front: string;
  back: string;
}

export interface CreateFlashcardResult {
  success: boolean;
  error?: string;
  rateLimited?: boolean;
}

export async function createUserFlashcard({
  tenant,
  subjectId,
  front,
  back,
}: Params): Promise<CreateFlashcardResult> {
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

  // ── Rate limiting: max 10 cards per 5 minutes per user ───────────────────
  const RATE_LIMIT_MAX      = 10;
  const RATE_LIMIT_MINUTES  = 5;
  const windowStart = new Date(
    Date.now() - RATE_LIMIT_MINUTES * 60 * 1000
  ).toISOString();

  const { count: recentCount } = await supabase
    .from('user_flashcards')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', session.user.id)
    .gte('created_at', windowStart);

  if ((recentCount ?? 0) >= RATE_LIMIT_MAX) {
    return {
      success: false,
      rateLimited: true,
      error: `Você está criando cards muito rápido. Aguarde ${RATE_LIMIT_MINUTES} minutos.`,
    };
  }
  // ─────────────────────────────────────────────────────────────────────────

  const { error } = await supabase.from('user_flashcards').insert({
    user_id: session.user.id,
    tenant_id: tenant,
    subject_id: subjectId || null,
    front: cleanFront,
    back: cleanBack,
  });

  if (error) {
    return { success: false, error: 'Erro ao salvar. Tente novamente.' };
  }

  revalidatePath(`/${tenant}/flashcards`);
  return { success: true };
}
