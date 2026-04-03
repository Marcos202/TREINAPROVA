/**
 * POST /api/webhooks/asaas
 *
 * Receives Asaas payment events, validates the access token,
 * stores the raw payload (idempotency), normalizes to BillingEvent,
 * and calls handleBillingEvent to update subscriptions + profiles.
 *
 * Asaas docs: https://docs.asaas.com/reference/webhooks
 * Token header: asaas-access-token (set in Asaas Dashboard → Integrações → Webhooks)
 */

import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { decryptApiKey } from '@/lib/ai/crypto';
import { handleBillingEvent, type BillingEvent, type BillingEventType } from '@/lib/billing/handleBillingEvent';

// ── Asaas event → BillingEventType mapping ────────────────────

const EVENT_MAP: Record<string, BillingEventType> = {
  PAYMENT_RECEIVED:   'subscription.activated',
  PAYMENT_CONFIRMED:  'subscription.activated',
  PAYMENT_OVERDUE:    'subscription.expired',
  PAYMENT_DELETED:    'subscription.expired',
  PAYMENT_REFUNDED:   'subscription.expired',
  PAYMENT_CHARGEBACK: 'subscription.expired',
  PAYMENT_AWAITING_RISK_ANALYSIS: 'subscription.pending',
  PAYMENT_CREATED:    'subscription.pending',
};

// ── Constant-time string comparison (prevents timing attacks) ──

function safeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      // Still run comparison on fixed-length buffers to avoid length leaks
      timingSafeEqual(Buffer.alloc(32), Buffer.alloc(32));
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

// ── Route handler ─────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  const service = createServiceClient();

  // 1) Parse body — do this before auth to capture raw payload
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // 2) Validate asaas-access-token header ─────────────────────
  const incomingToken = req.headers.get('asaas-access-token') ?? '';

  const { data: gatewayRow } = await service
    .from('payment_gateway_configs')
    .select('webhook_secret_enc')
    .eq('gateway_name', 'asaas')
    .limit(1)
    .maybeSingle();

  if (!gatewayRow?.webhook_secret_enc) {
    // Gateway not configured — reject silently (200 to avoid Asaas retries)
    console.warn('[asaas-webhook] webhook_secret_enc not configured');
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const expectedToken = decryptApiKey(gatewayRow.webhook_secret_enc);

  if (!safeEqual(incomingToken, expectedToken)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 3) Extract event metadata ──────────────────────────────────
  const eventType   = (body.event as string | undefined) ?? '';
  const payment     = (body.payment as Record<string, unknown> | undefined) ?? {};
  const chargeId    = (payment.id as string | undefined) ?? String(body.id ?? '');
  const externalRef = (payment.externalReference as string | undefined) ?? undefined;

  // Use payment ID + event type as idempotency key
  const gatewayEventId = `${eventType}:${chargeId}`;

  // 4) Idempotent insert into billing_webhook_events ──────────
  const { error: insertErr } = await service
    .from('billing_webhook_events')
    .insert({
      gateway:          'asaas',
      gateway_event_id: gatewayEventId,
      event_type:       eventType,
      raw_payload:      body,
      processed:        false,
    });

  if (insertErr) {
    // Unique constraint violation = already processed → acknowledge
    if (insertErr.code === '23505') {
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    console.error('[asaas-webhook] insert error:', insertErr);
    // Return 200 anyway — Asaas would retry indefinitely on non-2xx
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // 5) Normalize to BillingEvent ───────────────────────────────
  const billingType = EVENT_MAP[eventType];

  if (billingType && chargeId) {
    const event: BillingEvent = {
      type:            billingType,
      gatewayName:     'asaas',
      gatewayEventId,
      gatewayChargeId: chargeId,
      externalRef,
      rawPayload:      body,
    };

    try {
      await handleBillingEvent(event);

      // Mark as processed
      await service
        .from('billing_webhook_events')
        .update({ processed: true })
        .eq('gateway', 'asaas')
        .eq('gateway_event_id', gatewayEventId);
    } catch (err) {
      console.error('[asaas-webhook] handleBillingEvent error:', err);
      // Still return 200 — raw event is stored, can be reprocessed manually
    }
  }

  // 6) Always acknowledge ──────────────────────────────────────
  return NextResponse.json({ received: true }, { status: 200 });
}
