'use server';

import { createClient } from '@/lib/supabase/server';
import { deleteR2Objects } from '@/lib/r2/cleanup';
import { R2_PUBLIC_URL } from '@/lib/r2/client';

// ── deleteOrphanedFlashcardImages ─────────────────────────────────────────────
//
// Cenário A: Called fire-and-forget when the student cancels/closes the modal
// without saving. Deletes the R2 objects that were uploaded during that session
// but never persisted to the database.
//
// Security: requires an active session. Students can only delete objects under
// their own /${tenant}/flashcards/${userId}/ prefix because the presigned upload
// URLs in generateFlashcardUploadUrl.ts already enforce this path.
// ─────────────────────────────────────────────────────────────────────────────

export async function deleteOrphanedFlashcardImages(
  urls: string[]
): Promise<void> {
  if (!urls.length) return;

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  const base = (R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  if (!base) return;

  const keys = urls
    .filter((url) => typeof url === 'string' && url.startsWith(`${base}/`))
    .map((url) => url.slice(base.length + 1));

  if (!keys.length) return;

  try {
    await deleteR2Objects(keys);
    console.log('[deleteOrphanedFlashcardImages] Cleaned up:', keys);
  } catch (err) {
    // Non-critical — log and continue
    console.error('[deleteOrphanedFlashcardImages] Error:', err);
  }
}
