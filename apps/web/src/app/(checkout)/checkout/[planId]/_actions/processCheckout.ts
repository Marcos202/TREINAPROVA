'use server';

import { createHash, randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CheckoutFormSchema, RATE_LIMIT_MESSAGES, type CheckoutFormInput } from '@/lib/billing/checkoutSchema';
import {
  getActiveGateway,
  gatewayChargeCard,
  gatewayCreatePix,
  gatewayCreateBoleto,
  type ChargeCardParams,
  type PixParams,
} from '@/lib/billing/gatewayAdapter';

export interface ProcessCheckoutResult {
  success?: boolean;
  error?: string;
  blocked?: boolean;
  redirectTo?: string;
}

export async function processCheckout(
  raw: CheckoutFormInput,
): Promise<ProcessCheckoutResult> {
  // ── 1. Auth guard ─────────────────────────────────────────
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sessão expirada. Faça login novamente.' };

  // ── 2. Rate limit ─────────────────────────────────────────
  const reqHeaders = await headers();
  const ip = reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim()
           ?? reqHeaders.get('x-real-ip')
           ?? '0.0.0.0';
  const ipHash = createHash('sha256').update(ip).digest('hex');

  const service = createServiceClient();

  // Dev bypass: skip rate limit entirely in non-production environments
  if (process.env.NODE_ENV === 'production') {
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
  }

  // ── 3. Zod validation ────────────────────────────────────
  const parsed = CheckoutFormSchema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { error: first?.message ?? 'Dados inválidos.' };
  }
  const data = parsed.data;

  // ── 4. Fetch plan ─────────────────────────────────────────
  const { data: plan, error: planErr } = await service
    .from('subscription_plans')
    .select('id, name, price, billing_period, vertical_id')
    .eq('id', data.planId)
    .eq('is_active', true)
    .maybeSingle();

  if (planErr || !plan) {
    return { error: 'Plano não encontrado ou indisponível.' };
  }

  // ── 5. Fetch active gateway ───────────────────────────────
  const gateway = await getActiveGateway();
  if (!gateway) {
    return { error: 'Nenhum gateway de pagamento configurado. Contacte o suporte.' };
  }

  // ── 6. Create pending subscription row ───────────────────
  const orderKey    = randomUUID();
  const amountCents = Math.round(Number(plan.price) * 100);

  const { data: sub, error: subErr } = await service
    .from('billing_subscriptions')
    .insert({
      user_id:             user.id,
      tenant_id:           plan.vertical_id,
      gateway:             gateway.name,
      gateway_customer_id: 'pending',
      plan:                `${plan.vertical_id}_${plan.billing_period}`,
      status:              'pending',
      order_key:           orderKey,
      payment_method:      data.paymentMethod,
      plan_amount:         Number(plan.price),
    })
    .select('id')
    .single();

  if (subErr || !sub) {
    console.error('[checkout] subscription insert error:', subErr);
    return { error: 'Erro interno ao criar assinatura. Tente novamente.' };
  }

  const externalRef = sub.id;

  // ── 7. Process payment ────────────────────────────────────
  let result;

  if (data.paymentMethod === 'card') {
    const chargeParams: ChargeCardParams = {
      token:        data.gatewayToken!,
      email:        data.email,
      fullName:     data.fullName,
      document:     data.document,
      phone:        data.phone,
      amount:       amountCents,
      description:  `Treina Prova PRO — ${plan.name}`,
      installments: data.installments,
      planId:       plan.id,
      externalRef,
    };
    result = await gatewayChargeCard(gateway, chargeParams);

  } else if (data.paymentMethod === 'pix') {
    const pixParams: PixParams = {
      email:       data.email,
      fullName:    data.fullName,
      document:    data.document,
      phone:       data.phone,
      amount:      amountCents,
      description: `Treina Prova PRO — ${plan.name}`,
      externalRef,
    };
    result = await gatewayCreatePix(gateway, pixParams);

  } else {
    // Boleto
    const boletoParams: PixParams = {
      email:       data.email,
      fullName:    data.fullName,
      document:    data.document,
      phone:       data.phone,
      amount:      amountCents,
      description: `Treina Prova PRO — ${plan.name}`,
      externalRef,
    };
    result = await gatewayCreateBoleto(gateway, boletoParams);
  }

  // ── 8. Log attempt ────────────────────────────────────────
  await service.from('checkout_attempts').insert({
    user_id:        user.id,
    ip_hash:        ipHash,
    plan_id:        plan.id,
    gateway:        gateway.name,
    gateway_result: result.success ? 'succeeded' : 'declined',
  });

  // ── 9. Handle failure ─────────────────────────────────────
  if (!result.success) {
    await service
      .from('billing_subscriptions')
      .update({ status: 'expired' })
      .eq('id', externalRef);

    return { error: result.errorMessage ?? 'Pagamento recusado.' };
  }

  // ── 9A. PIX → redirect to order-received page ─────────────
  if (data.paymentMethod === 'pix') {
    await service
      .from('billing_subscriptions')
      .update({
        gateway_customer_id:  result.gatewayChargeId,
        gateway_payment_id:   result.gatewayChargeId,
        status:               'pending',
        current_period_start: new Date().toISOString(),
        pix_qr_code:          result.pixQrCode   ?? null,
        pix_copy_paste:       result.pixCopyPaste ?? null,
      })
      .eq('id', externalRef);

    return { success: true, redirectTo: `/checkout/order-received/${externalRef}?key=${orderKey}` };
  }

  // ── 9B. Boleto → redirect to order-received page ──────────
  if (data.paymentMethod === 'boleto') {
    await service
      .from('billing_subscriptions')
      .update({
        gateway_customer_id:  result.gatewayChargeId,
        gateway_payment_id:   result.gatewayChargeId,
        status:               'pending',
        current_period_start: new Date().toISOString(),
        boleto_url:           result.boletoUrl     ?? null,
        boleto_barcode:       result.boletoBarcode ?? null,
      })
      .eq('id', externalRef);

    return { success: true, redirectTo: `/checkout/order-received/${externalRef}?key=${orderKey}` };
  }

  // ── 9C. Card approved → activate + redirect to dashboard ──
  const now = new Date();
  const expiresAt = new Date(now);
  if      (plan.billing_period === 'monthly')    expiresAt.setMonth(now.getMonth() + 1);
  else if (plan.billing_period === 'quarterly')  expiresAt.setMonth(now.getMonth() + 3);
  else if (plan.billing_period === 'semiannual') expiresAt.setMonth(now.getMonth() + 6);
  else if (plan.billing_period === 'annual')     expiresAt.setFullYear(now.getFullYear() + 1);
  else                                           expiresAt.setMonth(now.getMonth() + 1);

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
      subscription_status:     'pro',
      subscription_expires_at: expiresAt.toISOString(),
    })
    .eq('id', user.id);

  return { success: true, redirectTo: `/${plan.vertical_id}?success=true` };
}
