'use server';

import { createClient } from '@/lib/supabase/server';
import { r2Client, R2_BUCKET, R2_PUBLIC_URL } from '@/lib/r2/client';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// ── generateFlashcardUploadUrl ────────────────────────────────────────────────
//
// Generates a presigned PUT URL for direct upload to Cloudflare R2.
// Unlike the admin version, this only requires a valid authenticated session
// (no is_admin check). Images are stored under /${tenant}/flashcards/${userId}/
// ─────────────────────────────────────────────────────────────────────────────

export async function generateFlashcardUploadUrl(
  tenant: string,
  filename: string,
  contentType: string
): Promise<{ uploadUrl: string; publicUrl: string }> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('Não autenticado.');

  const ext = (filename.split('.').pop() ?? 'jpg')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');

  const key = `${tenant}/flashcards/${session.user.id}/${randomUUID()}.${ext}`;

  const command = new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 300 });
  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  return { uploadUrl, publicUrl };
}
