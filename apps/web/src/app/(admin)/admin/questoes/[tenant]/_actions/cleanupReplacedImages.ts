'use server';

import { diffR2Keys, deleteR2Objects } from '@/lib/r2/cleanup';

/**
 * Compara o HTML antigo e novo de uma questão e remove do R2
 * as imagens que foram descartadas durante a edição.
 *
 * Chamado de forma fire-and-forget no QuestionForm antes do UPDATE.
 * Não lança erros — falhas são apenas logadas.
 */
export async function cleanupReplacedImages(
  oldText: string,
  oldExplanation: string,
  newText: string,
  newExplanation: string
): Promise<void> {
  const keysToDelete = [
    ...diffR2Keys(oldText, newText),
    ...diffR2Keys(oldExplanation, newExplanation),
  ];

  if (keysToDelete.length === 0) return;

  await deleteR2Objects(keysToDelete);
  console.log('[cleanupReplacedImages] Deleted orphan keys:', keysToDelete);
}
