'use server';

import { createClient } from '@/lib/supabase/server';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

/**
 * Gera uma presigned PUT URL para upload direto ao Cloudflare R2.
 * Requer autenticação + is_admin = true.
 * O browser faz PUT diretamente para R2 sem passar pelo Next.js server.
 */
export async function generateUploadUrl(
  tenant: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  // 1. Verificar autenticação
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado.');

  // 2. Verificar is_admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin) {
    throw new Error('Apenas administradores podem fazer upload de imagens.');
  }

  // 3. Construir chave com UUID para evitar colisões e path traversal
  const ext = (filename.split('.').pop() ?? 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = `${tenant}/questions/${randomUUID()}.${ext}`;

  // 4. Gerar presigned PUT URL (expira em 5 minutos)
  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
