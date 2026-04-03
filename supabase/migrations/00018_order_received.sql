-- ============================================================
-- Migration 00018: Order receipt columns on billing_subscriptions
-- ============================================================
-- Adds the columns needed for:
--   • /checkout/order-received/[id]?key=[order_key] security
--   • PIX QR code + copia-e-cola persistence
--   • Boleto URL + linha digitável persistence
--   • Denormalized amount + payment_method for receipt display
-- All columns are nullable — existing rows unaffected.
-- ============================================================

ALTER TABLE public.billing_subscriptions
  ADD COLUMN IF NOT EXISTS order_key       TEXT,
  ADD COLUMN IF NOT EXISTS payment_method  TEXT,
  ADD COLUMN IF NOT EXISTS plan_amount     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS pix_qr_code     TEXT,
  ADD COLUMN IF NOT EXISTS pix_copy_paste  TEXT,
  ADD COLUMN IF NOT EXISTS boleto_url      TEXT,
  ADD COLUMN IF NOT EXISTS boleto_barcode  TEXT;

-- Fast lookup by order_key (used on every page load / polling tick)
CREATE INDEX IF NOT EXISTS idx_billing_subs_order_key
  ON public.billing_subscriptions (order_key)
  WHERE order_key IS NOT NULL;
