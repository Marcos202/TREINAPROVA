/**
 * handleBillingEvent — agnostic billing event handler.
 *
 * Called by each gateway webhook route after normalizing the raw payload
 * into a BillingEvent. Updates billing_subscriptions and profiles tables.
 */

import { createServiceClient } from '@/lib/supabase/service';

// ── Normalized event types ─────────────────────────────────────

export type BillingEventType =
  | 'subscription.activated'   // payment confirmed / received
  | 'subscription.expired'     // payment overdue / chargeback / refund
  | 'subscription.pending';    // PIX / boleto awaiting payment

export interface BillingEvent {
  type:             BillingEventType;
  gatewayName:      string;       // 'asaas' | 'stripe' | 'mercadopago'
  gatewayEventId:   string;       // unique event ID from gateway (idempotency key)
  gatewayChargeId:  string;       // payment / charge ID from gateway
  externalRef?:     string;       // our billing_subscription.id
  rawPayload:       unknown;      // original JSON body (stored verbatim)
}

// ── Handler ───────────────────────────────────────────────────

export async function handleBillingEvent(event: BillingEvent): Promise<void> {
  const service = createServiceClient();

  // 1) Find subscription by gateway_payment_id or external_ref
  let subQuery = service
    .from('billing_subscriptions')
    .select('id, user_id, tenant_id, status')
    .limit(1);

  if (event.externalRef) {
    subQuery = subQuery.eq('id', event.externalRef);
  } else {
    subQuery = subQuery.eq('gateway_payment_id', event.gatewayChargeId);
  }

  const { data: sub } = await subQuery.maybeSingle();

  if (!sub) {
    // Unknown subscription — nothing to update, webhook already stored
    return;
  }

  if (event.type === 'subscription.activated') {
    // Calculate period end based on current period start
    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1); // default monthly; adjust if needed

    await Promise.all([
      service
        .from('billing_subscriptions')
        .update({
          status:               'active',
          gateway_payment_id:   event.gatewayChargeId,
          current_period_start: now.toISOString(),
          current_period_end:   expiresAt.toISOString(),
        })
        .eq('id', sub.id),

      service
        .from('profiles')
        .update({
          subscription_status:     'pro',
          subscription_expires_at: expiresAt.toISOString(),
        })
        .eq('id', sub.user_id),
    ]);
  } else if (event.type === 'subscription.expired') {
    await Promise.all([
      service
        .from('billing_subscriptions')
        .update({ status: 'expired' })
        .eq('id', sub.id),

      service
        .from('profiles')
        .update({ subscription_status: 'free' })
        .eq('id', sub.user_id),
    ]);
  } else if (event.type === 'subscription.pending') {
    await service
      .from('billing_subscriptions')
      .update({
        status:             'pending',
        gateway_payment_id: event.gatewayChargeId,
      })
      .eq('id', sub.id);
  }
}
