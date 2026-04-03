'use server';

import { createClient } from '@/lib/supabase/server';

export type FlashcardRating = 'again' | 'hard' | 'medium' | 'easy';

// ── SM-2 algorithm ────────────────────────────────────────────────────────────
//
// Simplified SM-2:
//   again  → interval = 1 day,   ef -= 0.20
//   hard   → interval *= 1.2,    ef -= 0.15
//   medium → interval *= ef
//   easy   → interval *= ef*1.3, ef += 0.10
//
// ef is clamped to [1.3, 4.0].
// ─────────────────────────────────────────────────────────────────────────────

function sm2(
  rating: FlashcardRating,
  easeFactor: number,
  intervalDays: number
): { easeFactor: number; intervalDays: number; nextReview: string } {
  let ef = easeFactor;
  let interval = intervalDays;

  switch (rating) {
    case 'again':
      interval = 1;
      ef = Math.max(1.3, ef - 0.2);
      break;
    case 'hard':
      interval = Math.max(1, Math.round(interval * 1.2));
      ef = Math.max(1.3, ef - 0.15);
      break;
    case 'medium':
      interval = Math.max(1, Math.round(interval * ef));
      break;
    case 'easy':
      interval = Math.max(1, Math.round(interval * ef * 1.3));
      ef = Math.min(4.0, ef + 0.1);
      break;
  }

  const next = new Date();
  next.setDate(next.getDate() + interval);

  return {
    easeFactor: parseFloat(ef.toFixed(2)),
    intervalDays: interval,
    nextReview: next.toISOString().split('T')[0],
  };
}

// ── Server Action ─────────────────────────────────────────────────────────────

export async function recordFlashcardResult({
  questionId,
  userFlashcardId,
  rating,
  tenant,
}: {
  questionId?: string | null;
  userFlashcardId?: string | null;
  rating: FlashcardRating;
  tenant: string;
}): Promise<void> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // ── Retrieve last SM-2 state for this card ──
    let prevEaseFactor = 2.5;
    let prevIntervalDays = 1;

    const idField = questionId ? 'question_id' : 'user_flashcard_id';
    const idValue = questionId ?? userFlashcardId;

    if (idValue) {
      const { data: last } = await supabase
        .from('user_flashcard_reviews')
        .select('ease_factor, interval_days')
        .eq('user_id', user.id)
        .eq(idField, idValue)
        .order('reviewed_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (last) {
        prevEaseFactor = Number(last.ease_factor);
        prevIntervalDays = Number(last.interval_days);
      }
    }

    // ── Compute new SM-2 values ──
    const { easeFactor, intervalDays, nextReview } = sm2(
      rating,
      prevEaseFactor,
      prevIntervalDays
    );

    // ── Persist review ──
    await supabase.from('user_flashcard_reviews').insert({
      user_id: user.id,
      tenant_id: tenant,
      question_id: questionId ?? null,
      user_flashcard_id: userFlashcardId ?? null,
      rating,
      ease_factor: easeFactor,
      interval_days: intervalDays,
      next_review: nextReview,
    });
  } catch {
    // Fire-and-forget — never block the UI on persistence errors
  }
}
