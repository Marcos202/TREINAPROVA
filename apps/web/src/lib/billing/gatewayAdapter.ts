/**
 * Server-side Gateway Adapter Facade
 *
 * Abstracts Stripe, Asaas, and Mercado Pago behind a common interface.
 * All API keys are decrypted here from the DB using SYSTEM_MASTER_KEY.
 * Raw card data never touches this file — only opaque tokens from the frontend.
 */

import { createServiceClient } from '@/lib/supabase/service';
import { decryptApiKey } from '@/lib/ai/crypto';

// ── Types ─────────────────────────────────────────────────────

export type GatewayName = 'stripe' | 'asaas' | 'mercadopago';

export interface ActiveGateway {
  name:       GatewayName;
  secretKey:  string;
  pubKey:     string | null;
}

export interface ChargeCardParams {
  token:          string;   // gateway payment token (pm_xxx, creditCardToken, mp_token)
  customerId?:    string;   // gateway customer ID (if already registered)
  email:          string;
  fullName:       string;
  document:       string;   // CPF/CNPJ digits only
  phone:          string;
  amount:         number;   // BRL cents
  description:    string;
  installments:   number;
  planId:         string;
  externalRef:    string;   // our billing_subscription ID (for idempotency)
}

export interface PixParams {
  customerId?:    string;
  email:          string;
  fullName:       string;
  document:       string;
  amount:         number;
  description:    string;
  externalRef:    string;
}

export interface GatewayChargeResult {
  success:         boolean;
  gatewayChargeId: string;
  status:          'paid' | 'pending' | 'failed';
  pixQrCode?:      string;   // base64 QR code image (PIX only)
  pixCopyPaste?:   string;   // PIX copia-e-cola string
  boletoUrl?:      string;   // boleto PDF URL
  boletoBarcode?:  string;   // barcode string
  errorMessage?:   string;
}

// ── Load active gateway from DB ───────────────────────────────

export async function getActiveGateway(): Promise<ActiveGateway | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from('payment_gateway_configs')
    .select('gateway_name, secret_key_enc, pub_key_enc')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!data?.secret_key_enc) return null;

  return {
    name:      data.gateway_name as GatewayName,
    secretKey: decryptApiKey(data.secret_key_enc),
    pubKey:    data.pub_key_enc ? decryptApiKey(data.pub_key_enc) : null,
  };
}

// ── Stripe Adapter ────────────────────────────────────────────

async function chargeStripe(
  secretKey: string,
  params: ChargeCardParams,
): Promise<GatewayChargeResult> {
  // Dynamic import so Stripe SDK is only loaded when needed
  const Stripe = (await import('stripe')).default;
  const stripe = new Stripe(secretKey, { apiVersion: '2025-03-31.basil' });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount:               params.amount,
      currency:             'brl',
      payment_method:       params.token,
      confirm:              true,
      description:          params.description,
      receipt_email:        params.email,
      metadata:             { planId: params.planId, externalRef: params.externalRef },
      automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
    });

    if (paymentIntent.status === 'succeeded') {
      return { success: true, gatewayChargeId: paymentIntent.id, status: 'paid' };
    }

    return {
      success: false,
      gatewayChargeId: paymentIntent.id,
      status: 'failed',
      errorMessage: 'Pagamento não confirmado pelo Stripe.',
    };
  } catch (err: any) {
    return {
      success: false,
      gatewayChargeId: '',
      status: 'failed',
      errorMessage: translateStripeError(err?.code),
    };
  }
}

async function createStripePixCharge(_secretKey: string, _params: PixParams): Promise<GatewayChargeResult> {
  // Stripe does not natively support PIX in Brazil for recurring subscriptions.
  // Return a specific error to guide the frontend to hide PIX for Stripe.
  return {
    success: false,
    gatewayChargeId: '',
    status: 'failed',
    errorMessage: 'PIX não disponível com o gateway atual. Use Cartão de Crédito.',
  };
}

function translateStripeError(code?: string): string {
  const map: Record<string, string> = {
    card_declined:           'Cartão recusado pelo banco emissor.',
    insufficient_funds:      'Saldo insuficiente no cartão.',
    expired_card:            'Cartão vencido. Use outro cartão.',
    incorrect_cvc:           'CVV incorreto.',
    processing_error:        'Erro no processamento. Tente novamente.',
    invalid_number:          'Número de cartão inválido.',
  };
  return map[code ?? ''] ?? 'Pagamento recusado. Verifique os dados do cartão.';
}

// ── Asaas Adapter ─────────────────────────────────────────────

const ASAAS_BASE = 'https://api.asaas.com/v3';

async function chargeAsaas(
  secretKey: string,
  params: ChargeCardParams,
): Promise<GatewayChargeResult> {
  const headers = {
    'Content-Type': 'application/json',
    'access_token': secretKey,
  };

  // 1) Upsert customer
  const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name:     params.fullName,
      cpfCnpj: params.document.replace(/\D/g, ''),
      email:    params.email,
      phone:    params.phone,
      externalReference: params.externalRef,
    }),
  });
  const customer = await customerRes.json();
  if (!customerRes.ok) {
    return { success: false, gatewayChargeId: '', status: 'failed', errorMessage: 'Erro ao registrar cliente.' };
  }

  // 2) Create credit card charge
  const chargeRes = await fetch(`${ASAAS_BASE}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer:          customer.id,
      billingType:       'CREDIT_CARD',
      value:             params.amount / 100,
      dueDate:           new Date().toISOString().split('T')[0],
      description:       params.description,
      externalReference: params.externalRef,
      installmentCount:  params.installments,
      creditCardToken:   params.token,
    }),
  });
  const charge = await chargeRes.json();

  if (!chargeRes.ok || charge.status === 'OVERDUE' || charge.status === 'REFUNDED') {
    return {
      success: false,
      gatewayChargeId: charge.id ?? '',
      status: 'failed',
      errorMessage: charge.errors?.[0]?.description ?? 'Pagamento recusado pela Asaas.',
    };
  }

  return {
    success: true,
    gatewayChargeId: charge.id,
    status: charge.status === 'CONFIRMED' || charge.status === 'RECEIVED' ? 'paid' : 'pending',
  };
}

async function createAsaasPixCharge(
  secretKey: string,
  params: PixParams,
): Promise<GatewayChargeResult> {
  const headers = {
    'Content-Type': 'application/json',
    'access_token': secretKey,
  };

  const customerRes = await fetch(`${ASAAS_BASE}/customers`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name:     params.fullName,
      cpfCnpj: params.document.replace(/\D/g, ''),
      email:    params.email,
    }),
  });
  const customer = await customerRes.json();
  if (!customerRes.ok) {
    return { success: false, gatewayChargeId: '', status: 'failed', errorMessage: 'Erro ao registrar cliente.' };
  }

  const chargeRes = await fetch(`${ASAAS_BASE}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      customer:          customer.id,
      billingType:       'PIX',
      value:             params.amount / 100,
      dueDate:           new Date().toISOString().split('T')[0],
      description:       params.description,
      externalReference: params.externalRef,
    }),
  });
  const charge = await chargeRes.json();

  if (!chargeRes.ok) {
    return { success: false, gatewayChargeId: '', status: 'failed', errorMessage: 'Erro ao gerar cobrança PIX.' };
  }

  // Fetch PIX QR code
  const qrRes = await fetch(`${ASAAS_BASE}/payments/${charge.id}/pixQrCode`, { headers });
  const qr = await qrRes.json();

  return {
    success: true,
    gatewayChargeId: charge.id,
    status: 'pending',
    pixQrCode:    qr.encodedImage ?? undefined,
    pixCopyPaste: qr.payload ?? undefined,
  };
}

// ── Mercado Pago Adapter ──────────────────────────────────────

const MP_BASE = 'https://api.mercadopago.com/v1';

async function chargeMercadoPago(
  secretKey: string,
  params: ChargeCardParams,
): Promise<GatewayChargeResult> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${secretKey}`,
    'X-Idempotency-Key': params.externalRef,
  };

  const res = await fetch(`${MP_BASE}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transaction_amount:   params.amount / 100,
      token:                params.token,
      description:          params.description,
      installments:         params.installments,
      payment_method_id:    'visa', // determined from token by MP
      payer: {
        email:              params.email,
        identification:     { type: 'CPF', number: params.document.replace(/\D/g, '') },
      },
      external_reference:   params.externalRef,
    }),
  });
  const payment = await res.json();

  if (!res.ok || payment.status === 'rejected') {
    return {
      success: false,
      gatewayChargeId: payment.id?.toString() ?? '',
      status: 'failed',
      errorMessage: translateMPError(payment.status_detail),
    };
  }

  return {
    success: true,
    gatewayChargeId: payment.id.toString(),
    status: payment.status === 'approved' ? 'paid' : 'pending',
  };
}

async function createMPPixCharge(
  secretKey: string,
  params: PixParams,
): Promise<GatewayChargeResult> {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${secretKey}`,
    'X-Idempotency-Key': params.externalRef,
  };

  const res = await fetch(`${MP_BASE}/payments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      transaction_amount: params.amount / 100,
      description:        params.description,
      payment_method_id:  'pix',
      payer: {
        email:            params.email,
        first_name:       params.fullName.split(' ')[0],
        last_name:        params.fullName.split(' ').slice(1).join(' '),
        identification:   { type: 'CPF', number: params.document.replace(/\D/g, '') },
      },
      external_reference: params.externalRef,
    }),
  });
  const payment = await res.json();

  if (!res.ok) {
    return { success: false, gatewayChargeId: '', status: 'failed', errorMessage: 'Erro ao gerar PIX.' };
  }

  const txInfo = payment.point_of_interaction?.transaction_data;
  return {
    success: true,
    gatewayChargeId: payment.id.toString(),
    status: 'pending',
    pixQrCode:    txInfo?.qr_code_base64 ?? undefined,
    pixCopyPaste: txInfo?.qr_code ?? undefined,
  };
}

function translateMPError(detail?: string): string {
  const map: Record<string, string> = {
    cc_rejected_insufficient_amount:  'Saldo insuficiente no cartão.',
    cc_rejected_bad_filled_cvv:       'CVV incorreto.',
    cc_rejected_bad_filled_date:      'Data de validade incorreta.',
    cc_rejected_bad_filled_card_number: 'Número de cartão inválido.',
    cc_rejected_call_for_authorize:   'Banco exige autorização prévia. Contacte seu banco.',
    cc_rejected_card_disabled:        'Cartão desabilitado.',
    cc_rejected_duplicated_payment:   'Pagamento duplicado detectado.',
  };
  return map[detail ?? ''] ?? 'Pagamento recusado pelo Mercado Pago.';
}

// ── Public facade ─────────────────────────────────────────────

export async function gatewayChargeCard(
  gateway: ActiveGateway,
  params: ChargeCardParams,
): Promise<GatewayChargeResult> {
  if (gateway.name === 'stripe')      return chargeStripe(gateway.secretKey, params);
  if (gateway.name === 'asaas')       return chargeAsaas(gateway.secretKey, params);
  if (gateway.name === 'mercadopago') return chargeMercadoPago(gateway.secretKey, params);
  return { success: false, gatewayChargeId: '', status: 'failed', errorMessage: 'Gateway desconhecido.' };
}

export async function gatewayCreatePix(
  gateway: ActiveGateway,
  params: PixParams,
): Promise<GatewayChargeResult> {
  if (gateway.name === 'stripe')      return createStripePixCharge(gateway.secretKey, params);
  if (gateway.name === 'asaas')       return createAsaasPixCharge(gateway.secretKey, params);
  if (gateway.name === 'mercadopago') return createMPPixCharge(gateway.secretKey, params);
  return { success: false, gatewayChargeId: '', status: 'failed', errorMessage: 'Gateway desconhecido.' };
}
