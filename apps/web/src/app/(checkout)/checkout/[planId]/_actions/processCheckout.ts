'use server';

import { createHash } from 'crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CheckoutFormSchema, RATE_LIMIT_MESSAGES, type CheckoutFormInput } from '@/lib/billing/checkoutSchema';
import {
  getActiveGateway,
  gatewayChargeCard,
  gatewayCreatePix,
  type ChargeCardParams,
  type PixParams,
} from '@/lib/billing/gatewayAdapter';

export interface ProcessCheckoutResult {
  success?: boolean;
  error?: string;
  blocked?: boolean;
  redirectTo?: string;
  // PIX / Boleto pending state
  pending?: boolean;
  pixQrCode?: string;
  pixCopyPaste?: string;
  boletoUrl?: string;
}

export async function processCheckout(
  raw: CheckoutFormInput,
): Promise<ProcessCheckoutResult> {
  // ── 1. Auth guard ─────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  // ── 2. Rate limit (via RPC — O(1), row-level lock) ────────
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? reqHeaders.get('x-real-ip')
           ?? '0.0.0.0';
  const ipHash = createHash('sha256').update(ip).digest('hex');

  const service = createServiceClient();
  const { data: limitData } = await service.rpc('check_checkout_rate_limit', {
    p_user_id: user.id,
    p_ip_hash: ipHash,
  });

  const limitRow = Array.isArray(limitData) ? limitData[0] : limitData;
  if (limitRow && !limitRow.allowed) {
    return {
      error:   RATE_LIMIT_MESSAGES[limitRow.reason] ?? 'Limite de tentativas atingido.',
      blocked: true,
    };
  }

  // ── 3. Zod validation (server-side re-validation) ─────────
  const parsed = CheckoutFormSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  // ── 4. Fetch plan ──────────────────────────────────────────
  const { data: plan, error: planErr } = await service
    .from('subscription_plans')
    .select('id, name, price, billing_period, vertical_id')
    .eq('id', data.planId)
    .eq('is_active', true)
    .maybeSingle();

  if (planErr || !plan) {
    return { error: 'Plano não encontrado ou indisponível.' };
  }

  // ── 5. Fetch active gateway ────────────────────────────────
  const gateway = await getActiveGateway();
  if (!gateway) {
    return { error: 'Nenhum gateway de pagamento configurado. Contacte o suporte.' };
  }

  // ── 6. Create billing_subscription row (pending) ──────────
  const { data: sub, error: subErr } = await service
    .from('billing_subscriptions')
    .insert({
      user_id:   user.id,
      tenant_id: plan.vertical_id,
      gateway:   gateway.name,
      gateway_customer_id: 'pending',
      plan:      `${plan.vertical_id}_${plan.billing_period}`,
      status:    'pending',
    })
    .select('id')
    .single();

  if (subErr || !sub) {
    return { error: 'Erro interno ao criar assinatura. Tente novamente.' };
  }

  const externalRef = sub.id;
  const amountCents = Math.round(Number(plan.price) * 100);

  // ── 7. Process payment ────────────────────────────────────
  let result;

  if (data.paymentMethod === 'card') {
    const chargeParams: ChargeCardParams = {
      token:       data.gatewayToken!,
      email:       data.email,
      fullName:    data.fullName,
      document:    data.document,
      phone:       data.phone,
      amount:      amountCents,
      description: `Treina Prova PRO — ${plan.name}`,
      installments: data.installments,
      planId:      plan.id,
      externalRef,
    };
    result = await gatewayChargeCard(gateway, chargeParams);
  } else if (data.paymentMethod === 'pix') {
    const pixParams: PixParams = {
      email:       data.email,
      fullName:    data.fullName,
      document:    data.document,
      amount:      amountCents,
      description: `Treina Prova PRO — ${plan.name}`,
      externalRef,
    };
    result = await gatewayCreatePix(gateway, pixParams);
  } else {
    // Boleto
    return { error: 'Boleto via este gateway será implementado em breve.' };
  }

  // ── 8. Log attempt ────────────────────────────────────────
  await service.from('checkout_attempts').insert({
    user_id:        user.id,
    ip_hash:        ipHash,
    plan_id:        plan.id,
    gateway:        gateway.name,
    gateway_result: result.success ? 'succeeded' : 'declined',
  });

  // ── 9. Handle result ──────────────────────────────────────
  if (!result.success) {
    await service
      .from('billing_subscriptions')
      .update({ status: 'expired' })
      .eq('id', externalRef);

    return { error: result.errorMessage ?? 'Pagamento recusado.' };
  }

  // ── 9A. PIX pending ───────────────────────────────────────
  if (data.paymentMethod === 'pix') {
    await service
      .from('billing_subscriptions')
      .update({
        gateway_customer_id:      result.gatewayChargeId,
        gateway_payment_id:       result.gatewayChargeId,
        status:                   'pending',
        current_period_start:     new Date().toISOString(),
      })
      .eq('id', externalRef);

    return {
      success:      true,
      pending:      true,
      pixQrCode:    result.pixQrCode,
      pixCopyPaste: result.pixCopyPaste,
    };
  }

  // ── 9B. Card paid ─────────────────────────────────────────
  const now = new Date();
  const expiresAt = new Date(now);
  if (plan.billing_period === 'monthly')    expiresAt.setMonth(now.getMonth() + 1);
  else if (plan.billing_period === 'quarterly') expiresAt.setMonth(now.getMonth() + 3);
  else if (plan.billing_period === 'semiannual') expiresAt.setMonth(now.getMonth() + 6);
  else if (plan.billing_period === 'annual')    expiresAt.setFullYear(now.getFullYear() + 1);
  else expiresAt.setMonth(now.getMonth() + 1);

  await service
    .from('billing_subscriptions')
    .update({
      gateway_customer_id:  result.gatewayChargeId,
      gateway_payment_id:   result.gatewayChargeId,
      status:               'active',
      current_period_start: now.toISOString(),
      current_period_end:   expiresAt.toISOString(),
    })
    .eq('id', externalRef);

  await service
    .from('profiles')
    .update({
      subscription_status:      'pro',
      subscription_expires_at:  expiresAt.toISOString(),
    })
    .eq('id', user.id);

  return { success: true, redirectTo: `/checkout/success?plan=${plan.name}&tenant=${plan.vertical_id}` };
}
