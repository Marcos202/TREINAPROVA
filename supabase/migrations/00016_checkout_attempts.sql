-- ============================================================
-- Migration 00016: Checkout Attempts (Anti-Card-Testing)
-- ============================================================
-- Tracks payment attempts per user/IP to prevent card testing attacks.
-- The check_checkout_rate_limit() function enforces limits atomically.
-- IP is stored as SHA-256 hash (GDPR-safe, never plaintext).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.checkout_attempts (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash          text        NOT NULL,
  plan_id          uuid,
  gateway          text,
  gateway_result   text        NOT NULL DEFAULT 'pending',
  -- 'succeeded' | 'declined' | 'error' | 'pending'
  attempted_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_user_time
  ON public.checkout_attempts (user_id, attempted_at DESC);

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_ip_time
  ON public.checkout_attempts (ip_hash, attempted_at DESC);

ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;
-- No client access — service_role only via Server Actions

-- ── check_checkout_rate_limit ─────────────────────────────────
--
-- O(1) atomic rate-limit check for checkout attempts.
--
-- Rules:
--   R1: max 5 total attempts per user in the last 15 minutes
--   R2: max 3 declined attempts per user in the last 24 hours
--   R3: max 10 total attempts per ip_hash in the last 60 minutes
--
-- Returns:
--   allowed     boolean  — whether the attempt may proceed
--   reason      text     — 'ok' | 'rate_limit' | 'too_many_declines' | 'ip_blocked'

CREATE OR REPLACE FUNCTION public.check_checkout_rate_limit(
  p_user_id uuid,
  p_ip_hash text
)
RETURNS TABLE (allowed boolean, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_15m    int;
  v_user_declines_24h int;
  v_ip_1h       int;
BEGIN
  -- R1: total attempts by this user in last 15 minutes
  SELECT COUNT(*) INTO v_user_15m
  FROM checkout_attempts
  WHERE user_id = p_user_id
    AND attempted_at > now() - interval '15 minutes';

  IF v_user_15m >= 5 THEN
    RETURN QUERY SELECT false, 'rate_limit'::text;
    RETURN;
  END IF;

  -- R2: declined attempts by this user in last 24 hours
  SELECT COUNT(*) INTO v_user_declines_24h
  FROM checkout_attempts
  WHERE user_id = p_user_id
    AND gateway_result = 'declined'
    AND attempted_at > now() - interval '24 hours';

  IF v_user_declines_24h >= 3 THEN
    RETURN QUERY SELECT false, 'too_many_declines'::text;
    RETURN;
  END IF;

  -- R3: total attempts from this IP in last 60 minutes
  SELECT COUNT(*) INTO v_ip_1h
  FROM checkout_attempts
  WHERE ip_hash = p_ip_hash
    AND attempted_at > now() - interval '60 minutes';

  IF v_ip_1h >= 10 THEN
    RETURN QUERY SELECT false, 'ip_blocked'::text;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'ok'::text;
END;
$$;
