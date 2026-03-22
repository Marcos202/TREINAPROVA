// =============================================================================
// lib/r2/cleanup.ts — Utilitários de limpeza de arquivos órfãos no R2
// SERVIDOR APENAS — nunca importar em Client Components
// =============================================================================

import { DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET } from './client';

/**
 * Extrai chaves R2 (paths sem domínio) de um conteúdo HTML.
 * Identifica todas as imagens com src apontando para R2_PUBLIC_URL.
 *
 * Ex: "https://media.treinaprova.com/med/questions/uuid.jpg"
 *   → "med/questions/uuid.jpg"
 */
export function extractR2Keys(html: string): string[] {
  if (!html) return [];
  const base = (process.env.R2_PUBLIC_URL ?? '').replace(/\/+$/, '');
  if (!base) return [];

  // Escapa caracteres especiais do domínio para uso em regex
  const escapedBase = base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`${escapedBase}/([^"'\\s>]+)`, 'gi');

  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    keys.push(decodeURIComponent(m[1]));
  }

  return [...new Set(keys)]; // sem duplicatas
}

/**
 * Deleta um lote de chaves R2.
 * Silencia erros de chaves não encontradas (idempotente).
 * Suporta até 1000 chaves por lote (limite da API S3).
 */
export async function deleteR2Objects(keys: string[]): Promise<void> {
  if (!keys.length) return;

  // Divide em chunks de 1000 (limite S3/R2)
  const CHUNK = 1000;
  const chunks: string[][] = [];
  for (let i = 0; i < keys.length; i += CHUNK) {
    chunks.push(keys.slice(i, i + CHUNK));
  }

  await Promise.all(
    chunks.map((chunk) =>
      r2Client.send(
        new DeleteObjectsCommand({
          Bucket: R2_BUCKET,
          Delete: {
            Objects: chunk.map((Key) => ({ Key })),
            Quiet: true, // não retorna lista de deletados (otimização)
          },
        })
      )
    )
  );
}

/**
 * Calcula quais chaves foram removidas entre dois conteúdos HTML.
 * Usado em UPDATE: imagens presentes no texto antigo e ausentes no novo.
 */
export function diffR2Keys(oldHtml: string, newHtml: string): string[] {
  const oldKeys = new Set(extractR2Keys(oldHtml));
  const newKeys = new Set(extractR2Keys(newHtml));
  return [...oldKeys].filter((k) => !newKeys.has(k));
}
