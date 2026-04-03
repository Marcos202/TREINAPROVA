'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { encryptApiKey, decryptApiKey } from '@/lib/ai/crypto';

// ── Types ─────────────────────────────────────────────────────

export type GatewayName = 'stripe' | 'asaas' | 'mercadopago';
export type KeyType     = 'secret' | 'pub' | 'webhook';

export interface GatewayRow {
  gatewayName:          GatewayName;
  isActive:             boolean;
  hasSecretKey:         boolean;
  hasPubKey:            boolean;
  hasWebhookSecret:     boolean;
  maskedSecretKey:      string | null;
  maskedPubKey:         string | null;
  maskedWebhookSecret:  string | null;
}

// ── Auth guard ────────────────────────────────────────────────

async function requireAdmin(): Promise<string> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Não autenticado.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', session.user.id)
    .single();

  if (!profile?.is_admin) throw new Error('Acesso negado.');
  return session.user.id;
}

// ── Masking ───────────────────────────────────────────────────

function maskGatewayKey(plain: string): string {
  if (plain.length <= 8) return '••••••••';
  return `${plain.slice(0, 4)}${'•'.repeat(20)}${plain.slice(-4)}`;
}

function tryMask(enc: string | null): string | null {
  if (!enc) return null;
  try   { return maskGatewayKey(decryptApiKey(enc)); }
  catch { return '••••(erro ao decodificar)'; }
}

// ── Read ──────────────────────────────────────────────────────

const GATEWAY_ORDER: GatewayName[] = ['stripe', 'asaas', 'mercadopago'];

/** Empty row shown when the table doesn't exist yet (migration pending). */
function emptyRow(name: GatewayName): GatewayRow {
  return {
    gatewayName:         name,
    isActive:            false,
    hasSecretKey:        false,
    hasPubKey:           false,
    hasWebhookSecret:    false,
    maskedSecretKey:     null,
    maskedPubKey:        null,
    maskedWebhookSecret: null,
  };
}

export interface GatewayRowsResult {
  rows:        GatewayRow[];
  tableExists: boolean;
}

export async function getGatewayRows(): Promise<GatewayRowsResult> {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('payment_gateway_configs')
    .select('gateway_name, is_active, secret_key_enc, pub_key_enc, webhook_secret_enc')
    .order('gateway_name', { ascending: true });

  // If the migration hasn't been applied yet the table won't exist.
  // Return tableExists:false so the page shows the pending-migration banner
  // instead of crashing with a 500.
  if (error) {
    const isMissingTable = error.message.includes('schema cache') ||
                           error.message.includes('does not exist') ||
                           error.code === '42P01';
    if (isMissingTable) return { rows: GATEWAY_ORDER.map(emptyRow), tableExists: false };
    throw new Error(error.message);
  }

  const rows = GATEWAY_ORDER.map((name) => {
    const row = (data ?? []).find((r) => r.gateway_name === name);
    return {
      gatewayName:         name,
      isActive:            row?.is_active ?? false,
      hasSecretKey:        Boolean(row?.secret_key_enc),
      hasPubKey:           Boolean(row?.pub_key_enc),
      hasWebhookSecret:    Boolean(row?.webhook_secret_enc),
      maskedSecretKey:     tryMask(row?.secret_key_enc ?? null),
      maskedPubKey:        tryMask(row?.pub_key_enc ?? null),
      maskedWebhookSecret: tryMask(row?.webhook_secret_enc ?? null),
    };
  });

  return { rows, tableExists: true };
}

// ── Update key ────────────────────────────────────────────────

export async function updateGatewayKey(
  gateway:  GatewayName,
  keyType:  KeyType,
  plainKey: string,
): Promise<{ ok: boolean; masked?: string; error?: string }> {
  try {
    const userId = await requireAdmin();
    if (!plainKey.trim()) return { ok: false, error: 'A chave não pode estar vazia.' };

    const encrypted = encryptApiKey(plainKey.trim());
    const column    = keyType === 'secret'  ? 'secret_key_enc'
                    : keyType === 'pub'     ? 'pub_key_enc'
                    :                        'webhook_secret_enc';

    const supabase = createServiceClient();
    const { error } = await supabase
      .from('payment_gateway_configs')
      .update({ [column]: encrypted, updated_at: new Date().toISOString(), updated_by: userId })
      .eq('gateway_name', gateway);

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/financeiro');
    return { ok: true, masked: maskGatewayKey(plainKey.trim()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Set active gateway (atomic DB function) ───────────────────

export async function setActiveGateway(
  gateway: GatewayName,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const supabase = createServiceClient();

    // Calls the set_active_gateway() PL/pgSQL function which wraps both
    // UPDATE statements in a single transaction (atomic swap).
    const { error } = await supabase.rpc('set_active_gateway', {
      p_gateway_name: gateway,
    });

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/financeiro');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Deactivate all gateways ───────────────────────────────────

export async function deactivateAllGateways(): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId   = await requireAdmin();
    const supabase = createServiceClient();

    const { error } = await supabase
      .from('payment_gateway_configs')
      .update({ is_active: false, updated_by: userId, updated_at: new Date().toISOString() })
      .neq('gateway_name', '');   // matches all rows

    if (error) return { ok: false, error: error.message };

    revalidatePath('/admin/financeiro');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
