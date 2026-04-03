'use server';

import { createClient } from '@/lib/supabase/server';
import { extractR2Keys, deleteR2Objects } from '@/lib/r2/cleanup';

/**
 * Deleta uma questão do Supabase e limpa suas imagens do R2.
 *
 * Fluxo:
 *  1. Verifica autenticação + is_admin
 *  2. Busca a questão (para extrair URLs de imagens do HTML)
 *  3. Deleta imagens do R2 (não bloqueia se falhar)
 *  4. Deleta a questão do Supabase
 *
 * Se o R2 falhar, a exclusão do Supabase ainda ocorre (o webhook
 * de safety net fará uma segunda tentativa de limpeza).
 */
export async function deleteQuestion(questionId: string): Promise<void> {
  const supabase = await createClient();

  // 1. Verificar autenticação
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado.');

  // 2. Verificar is_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Acesso negado.');

  // 3. Buscar a questão para extrair URLs de imagens
  const { data: question } = await supabase
    .from('questions')
    .select('text, general_explanation, image_url')
    .eq('id', questionId)
    .single();

  // 4. Limpar imagens do R2 (assíncrono — não bloqueia o delete principal)
  if (question) {
    const keys = [
      ...extractR2Keys(question.text ?? ''),
      ...extractR2Keys(question.general_explanation ?? ''),
      // Compatibilidade com image_url legado (migration 00007)
      ...(question.image_url
        ? [question.image_url.replace(`${process.env.R2_PUBLIC_URL}/`, '')]
        : []),
    ];

    // Fire-and-forget: não bloqueia o delete mesmo se R2 falhar
    deleteR2Objects(keys).catch((err) =>
      console.error('[deleteQuestion] R2 cleanup failed:', err)
    );
  }

  // 5. Deletar do Supabase
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', questionId);

  if (error) throw new Error(error.message);
}
