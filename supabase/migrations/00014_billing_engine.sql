-- ============================================================
-- Migration 00014: Billing Engine
-- Tables: payment_gateway_configs, billing_subscriptions,
--         billing_webhook_events
-- Extends: profiles (subscription_expires_at, daily quota)
-- Functions: set_active_gateway, check_and_increment_daily_quota
-- ============================================================
-- Encryption model: application-layer AES-256-GCM (same as
-- system_settings in migration 00011). The DB stores opaque
-- ciphertext only. SYSTEM_MASTER_KEY never touches the DB.
-- ============================================================

-- ── 1. payment_gateway_configs ────────────────────────────────
--
-- One row per gateway. The UNIQUE partial index on (is_active)
-- WHERE is_active = true is the DB-level enforcement that only
-- one gateway can be the "active" one at any time.

CREATE TABLE IF NOT EXISTS public.payment_gateway_configs (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_name        text        NOT NULL UNIQUE,  -- 'stripe' | 'asaas' | 'mercadopago'
  display_label       text        NOT NULL,
  is_active           boolean     NOT NULL DEFAULT false,
  -- AES-256-GCM ciphertext (iv:tag:data hex) — application layer encrypted
  secret_key_enc      text,       -- Secret key / API token
  pub_key_enc         text,       -- Publishable / public key (null for Asaas)
  webhook_secret_enc  text,       -- Webhook signing secret
  updated_at          timestamptz NOT NULL DEFAULT now(),
  updated_by          uuid        REFERENCES auth.users(id)
);

-- Unique partial index: at most ONE row may have is_active = true.
-- The set_active_gateway() function below handles the swap atomically.
CREATE UNIQUE INDEX IF NOT EXISTS unique_one_active_gateway
  ON public.payment_gateway_configs (is_active)
  WHERE (is_active = true);

-- ── 2. billing_subscriptions ──────────────────────────────────
--
-- Per-tenant billing record.  tenant_id is the vertical the
-- student subscribed to ('med' | 'oab' | 'enem' | 'vestibulares').
-- Switching the active gateway only routes NEW checkouts; existing
-- subscriptions remain with the gateway that created them.

CREATE TABLE IF NOT EXISTS public.billing_subscriptions (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id               text        NOT NULL,
  gateway                 text        NOT NULL,  -- 'stripe' | 'asaas' | 'mercadopago'
  gateway_customer_id     text        NOT NULL,
  gateway_subscription_id text,                  -- recurring subscription ID
  gateway_payment_id      text,                  -- one-off PIX payment ID
  plan                    text        NOT NULL,  -- 'pro_monthly' | 'pro_annual'
  status                  text        NOT NULL DEFAULT 'active',
  -- 'active' | 'canceled' | 'past_due' | 'expired'
  current_period_start    timestamptz,
  current_period_end      timestamptz,
  canceled_at             timestamptz,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_billing_subs_user_tenant_status
  ON public.billing_subscriptions (user_id, tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_billing_subs_gateway_sub_id
  ON public.billing_subscriptions (gateway, gateway_subscription_id)
  WHERE gateway_subscription_id IS NOT NULL;

-- ── 3. billing_webhook_events ─────────────────────────────────
--
-- Immutable audit log.  UNIQUE(gateway, gateway_event_id) is the
-- idempotency key — re-delivered webhooks are silently skipped.

CREATE TABLE IF NOT EXISTS public.billing_webhook_events (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway          text        NOT NULL,
  gateway_event_id text        NOT NULL,
  event_type       text        NOT NULL,   -- normalized BillingEventType
  raw_payload      jsonb       NOT NULL DEFAULT '{}',
  processed        boolean     NOT NULL DEFAULT false,
  processed_at     timestamptz,
  error_message    text,
  received_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT unique_gateway_event UNIQUE (gateway, gateway_event_id)
);

CREATE INDEX IF NOT EXISTS idx_billing_webhook_received_at
  ON public.billing_webhook_events (received_at DESC);

-- Partial index to quickly find unprocessed events for re-processing
CREATE INDEX IF NOT EXISTS idx_billing_webhook_unprocessed
  ON public.billing_webhook_events (received_at DESC)
  WHERE processed = false;

-- ── 4. Extend profiles ────────────────────────────────────────
--
-- subscription_status already exists (migration 00003).
-- We normalize its DEFAULT and add the billing-specific columns.

ALTER TABLE public.profiles
  ALTER COLUMN subscription_status SET DEFAULT 'free';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at  timestamptz,
  ADD COLUMN IF NOT EXISTS daily_question_count     int  NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_question_reset_at  date NOT NULL DEFAULT current_date;

-- ── 5. RLS ────────────────────────────────────────────────────

ALTER TABLE public.payment_gateway_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_subscriptions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_webhook_events  ENABLE ROW LEVEL SECURITY;

-- payment_gateway_configs: no client access (service_role only via Server Actions)
-- billing_webhook_events:  no client access (service_role only)
-- (No explicit policies = implicit deny for anon/authenticated roles)

-- billing_subscriptions: users may read their own rows
-- (write access is service_role only via webhook handler)
CREATE POLICY "Users can view own subscriptions"
  ON public.billing_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- ── 6. set_active_gateway — atomic gateway swap ───────────────
--
-- Deactivates all gateways then activates the target in a single
-- PL/pgSQL transaction, safely bypassing the unique partial index
-- (index is checked at statement end, not mid-transaction).

CREATE OR REPLACE FUNCTION public.set_active_gateway(p_gateway_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Step 1: deactivate all (temporarily clears the unique constraint)
  UPDATE payment_gateway_configs SET is_active = false;

  -- Step 2: activate only the target
  UPDATE payment_gateway_configs
  SET is_active = true, updated_at = now()
  WHERE gateway_name = p_gateway_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gateway not found: %', p_gateway_name;
  END IF;
END;
$$;

-- ── 7. check_and_increment_daily_quota ───────────────────────
--
-- O(1) atomic check-and-increment for Free-tier question quota.
-- Uses FOR UPDATE (row-level lock) to prevent race conditions
-- under concurrent requests from the same user.
--
-- Returns:
--   allowed      boolean  — whether the user may answer
--   count_after  int      — count after this call (informational)
--   limit_reached boolean — true when count == limit (to show warning)

CREATE OR REPLACE FUNCTION public.check_and_increment_daily_quota(p_user_id uuid)
RETURNS TABLE (allowed boolean, count_after int, limit_reached boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
  v_count  int;
  v_reset  date;
  v_limit  constant int := 10;
BEGIN
  -- Acquire row-level lock — prevents duplicate increments under concurrency
  SELECT subscription_status,
         daily_question_count,
         daily_question_reset_at
  INTO   v_status, v_count, v_reset
  FROM   profiles
  WHERE  id = p_user_id
  FOR UPDATE;

  -- User not found (should not happen in practice)
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, true;
    RETURN;
  END IF;

  -- PRO users bypass quota entirely (supports both legacy 'active' and new 'pro')
  IF v_status IN ('pro', 'active') THEN
    RETURN QUERY SELECT true, v_count, false;
    RETURN;
  END IF;

  -- New day → reset counter before checking
  IF v_reset < current_date THEN
    UPDATE profiles
    SET daily_question_count    = 1,
        daily_question_reset_at = current_date
    WHERE id = p_user_id;
    RETURN QUERY SELECT true, 1, false;
    RETURN;
  END IF;

  -- Hard limit reached → deny
  IF v_count >= v_limit THEN
    RETURN QUERY SELECT false, v_count, true;
    RETURN;
  END IF;

  -- Increment and return updated count
  UPDATE profiles
  SET daily_question_count = daily_question_count + 1
  WHERE id = p_user_id;

  RETURN QUERY SELECT true, v_count + 1, (v_count + 1) >= v_limit;
END;
$$;

-- ── 8. Seed initial gateway rows (all inactive, no keys) ─────

INSERT INTO public.payment_gateway_configs (gateway_name, display_label, is_active)
VALUES
  ('stripe',      'Stripe',       false),
  ('asaas',       'Asaas',        false),
  ('mercadopago', 'Mercado Pago', false)
ON CONFLICT (gateway_name) DO NOTHING;
