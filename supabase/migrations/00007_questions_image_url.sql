-- =============================================================================
-- Migration 00007: Adiciona coluna image_url à tabela questions
-- Para armazenar URLs públicas de imagens hospedadas no Cloudflare R2.
-- =============================================================================

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT NULL;

COMMENT ON COLUMN public.questions.image_url IS
  'URL pública da imagem no Cloudflare R2. Formato: {tenant}/questions/{uuid}.{ext}';
