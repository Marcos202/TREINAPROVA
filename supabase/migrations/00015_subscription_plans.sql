-- ============================================================
-- Migration 00015: Multi-Vertical Subscription Plans
-- Enables per-vertical pricing (e.g., PRO Medicina ≠ PRO ENEM)
-- ============================================================

-- ── 1. subscription_plans ────────────────────────────────────
--
-- Each row = one purchasable plan within a specific vertical.
-- Admins define name, price, gateway links, and feature bullets
-- per vertical. Students see only active plans for their vertical.

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical_id          varchar        NOT NULL,     -- 'med' | 'oab' | 'enem' | 'vestibulares'
  name                 varchar        NOT NULL,     -- 'Mensal', 'Semestral', 'Anual'
  price                numeric(10,2)  NOT NULL,     -- Display price in BRL
  original_price       numeric(10,2),               -- Crossed-out "from" price (optional)
  billing_period       varchar        NOT NULL DEFAULT 'monthly',  -- 'monthly' | 'quarterly' | 'semiannual' | 'annual'
  features             jsonb          NOT NULL DEFAULT '[]',       -- Array of feature strings

  -- Payment gateway IDs / links (one per gateway the admin might use)
  stripe_price_id      varchar,                     -- Stripe Price ID (price_xxx)
  asaas_payment_link   varchar,                     -- Asaas checkout URL
  mercadopago_link     varchar,                     -- Mercado Pago payment link

  is_active            boolean        NOT NULL DEFAULT true,
  is_highlighted       boolean        NOT NULL DEFAULT false,      -- "Mais Popular" badge
  sort_order           int            NOT NULL DEFAULT 0,          -- Display order (lower = first)

  created_at           timestamptz    NOT NULL DEFAULT now(),
  updated_at           timestamptz    NOT NULL DEFAULT now()
);

-- Index for fast lookup of plans by vertical
CREATE INDEX IF NOT EXISTS idx_subscription_plans_vertical_active
  ON public.subscription_plans (vertical_id, is_active, sort_order);

-- ── 2. RLS ────────────────────────────────────────────────────

ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Public read: anyone (even anonymous) can see active plans
-- This enables the Paywall page to work for logged-out users too
CREATE POLICY "Anyone can view active plans"
  ON public.subscription_plans
  FOR SELECT
  USING (is_active = true);

-- Admin full access via service_role (Server Actions bypass RLS)
-- No explicit INSERT/UPDATE/DELETE policies for authenticated role
-- ensures only service_role can write (via Server Actions with requireAdmin guard)

-- ── 3. Updated_at trigger ─────────────────────────────────────

CREATE OR REPLACE FUNCTION public.update_subscription_plans_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscription_plans_updated_at();
