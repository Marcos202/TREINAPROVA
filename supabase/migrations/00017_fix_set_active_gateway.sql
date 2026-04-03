-- ============================================================
-- Migration 00017: Fix set_active_gateway — add WHERE clause
-- ============================================================
-- The original function (00014) ran:
--   UPDATE payment_gateway_configs SET is_active = false;
-- Supabase has pg_safeupdate enabled, which blocks any UPDATE
-- without an explicit WHERE clause, even inside PL/pgSQL functions.
-- This migration replaces the function with the corrected version.
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_active_gateway(p_gateway_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Step 1: deactivate the currently active gateway (if any).
  -- WHERE is_active = true satisfies pg_safeupdate and is semantically
  -- correct — at most one row matches due to the unique partial index.
  UPDATE payment_gateway_configs
  SET is_active = false
  WHERE is_active = true;

  -- Step 2: activate only the target gateway.
  UPDATE payment_gateway_configs
  SET is_active = true, updated_at = now()
  WHERE gateway_name = p_gateway_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gateway not found: %', p_gateway_name;
  END IF;
END;
$$;
