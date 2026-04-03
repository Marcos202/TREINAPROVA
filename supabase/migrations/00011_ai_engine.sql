-- ============================================================
-- Migration 00011: AI Engine — system_settings, audit, logs
-- ============================================================
-- Requires: SYSTEM_MASTER_KEY env var (32-byte hex, 64 chars)
-- Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
-- API keys are encrypted in application layer (AES-256-GCM) before insert.
-- The database only stores opaque ciphertext — it cannot decrypt.
-- ============================================================

-- ── 1. Provider settings (one row per provider) ──────────────

CREATE TABLE IF NOT EXISTS public.system_settings (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider      text        NOT NULL UNIQUE,       -- 'gemini' | 'openrouter'
  encrypted_key text,                              -- AES-256-GCM ciphertext (iv:tag:data hex)
  default_model text,
  is_enabled    boolean     NOT NULL DEFAULT false,
  priority      smallint    NOT NULL DEFAULT 1,    -- 1 = primary, 2 = fallback
  extra_config  jsonb       NOT NULL DEFAULT '{}', -- base_url, available_models list, etc.
  updated_at    timestamptz NOT NULL DEFAULT now(),
  updated_by    uuid        REFERENCES auth.users(id)
);

-- ── 2. Audit trail ───────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.system_settings_audit (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  provider    text        NOT NULL,
  action      text        NOT NULL, -- 'key_updated' | 'model_changed' | 'enabled' | 'disabled' | 'priority_changed' | 'fallback_toggled'
  changed_by  uuid        REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── 3. AI request logs (health monitor & cost tracking) ──────

CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  feature        text        NOT NULL,  -- 'question-parser' | 'tutor' | 'flashcard' | 'study-plan'
  provider_used  text        NOT NULL,
  model_used     text        NOT NULL,
  fallback_used  boolean     NOT NULL DEFAULT false,
  tokens_input   integer,
  tokens_output  integer,
  latency_ms     integer,
  success        boolean     NOT NULL DEFAULT true,
  error_code     text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ── 4. Indexes ───────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_created_at
  ON public.ai_request_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_request_logs_provider
  ON public.ai_request_logs (provider_used, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_settings_audit_created_at
  ON public.system_settings_audit (created_at DESC);

-- ── 5. RLS — block all client access ─────────────────────────
-- service_role bypasses RLS automatically.
-- Server Actions use createServiceClient() with service_role key.
-- No client (anon / authenticated) can read encrypted keys.

ALTER TABLE public.system_settings        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings_audit  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_request_logs        ENABLE ROW LEVEL SECURITY;

-- Explicit deny-all (default when no policies exist, but make it explicit)
-- Admins interacting via dashboard go through Server Actions → service_role only.

-- ── 6. Seed initial providers (disabled, no keys) ────────────

INSERT INTO public.system_settings (provider, default_model, is_enabled, priority, extra_config)
VALUES
  (
    'gemini',
    'gemini-1.5-flash',
    false,
    1,
    '{"available_models": ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"]}'
  ),
  (
    'openrouter',
    'z-ai/glm-4.5-air:free',
    false,
    2,
    '{"base_url": "https://openrouter.ai/api/v1", "model_input_type": "free_text"}'
  )
ON CONFLICT (provider) DO NOTHING;
