// =============================================================================
// /api/webhooks/r2-cleanup — Safety net para limpeza de arquivos R2 órfãos
//
// Configurar no Supabase Dashboard:
//   Database → Webhooks → Create new webhook
//   Table: questions | Events: DELETE, UPDATE
//   URL: https://treinaprova.com/api/webhooks/r2-cleanup
//   HTTP Headers: Authorization: Bearer <WEBHOOK_SECRET>
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { extractR2Keys, deleteR2Objects, diffR2Keys } from '@/lib/r2/cleanup';

interface SupabaseWebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: Record<string, unknown> | null;
  old_record: Record<string, unknown> | null;
}

export async function POST(req: NextRequest) {
  // 1. Verificar secret
  const authHeader = req.headers.get('authorization') ?? '';
  const secret = process.env.WEBHOOK_SECRET ?? '';

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: SupabaseWebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Só processa eventos da tabela questions
  if (payload.table !== 'questions' || payload.schema !== 'public') {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    let keysToDelete: string[] = [];

    if (payload.type === 'DELETE' && payload.old_record) {
      // Questão deletada — limpar todas as imagens do registro antigo
      const old = payload.old_record;
      keysToDelete = [
        ...extractR2Keys((old.text as string) ?? ''),
        ...extractR2Keys((old.general_explanation as string) ?? ''),
      ];

      // Compatibilidade com image_url legado
      if (old.image_url && typeof old.image_url === 'string') {
        const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
        const key = old.image_url.replace(`${base}/`, '');
        if (key && !key.startsWith('http')) keysToDelete.push(key);
      }
    } else if (payload.type === 'UPDATE' && payload.old_record && payload.record) {
      // Questão atualizada — limpar apenas imagens removidas
      const oldText = (payload.old_record.text as string) ?? '';
      const newText = (payload.record.text as string) ?? '';
      const oldExp = (payload.old_record.general_explanation as string) ?? '';
      const newExp = (payload.record.general_explanation as string) ?? '';

      keysToDelete = [
        ...diffR2Keys(oldText, newText),
        ...diffR2Keys(oldExp, newExp),
      ];
    }

    if (keysToDelete.length > 0) {
      await deleteR2Objects(keysToDelete);
      console.log(`[r2-cleanup webhook] Deleted ${keysToDelete.length} object(s):`, keysToDelete);
    }

    return NextResponse.json({ ok: true, deleted: keysToDelete.length });
  } catch (err) {
    console.error('[r2-cleanup webhook] Error:', err);
    // Retorna 200 para evitar retry infinito do Supabase
    return NextResponse.json({ ok: false, error: String(err) });
  }
}
