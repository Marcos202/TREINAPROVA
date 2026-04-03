'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { encryptApiKey, decryptApiKey, maskApiKey } from '@/lib/ai/crypto';
import { bustSettingsCache } from '@/lib/ai/settings-cache';
import type { AiProvider } from '@/lib/ai/types';

// ── Auth guard ────────────────────────────────────────────────

async function requireAdmin() {
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

// ── Read (masked) ─────────────────────────────────────────────

export interface ProviderRow {
  provider: AiProvider;
  maskedKey: string | null;
  hasKey: boolean;
  defaultModel: string;
  isEnabled: boolean;
  priority: number;
  extraConfig: Record<string, unknown>;
}

export async function getProviderRows(): Promise<ProviderRow[]> {
  await requireAdmin();
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('system_settings')
    .select('provider, encrypted_key, default_model, is_enabled, priority, extra_config')
    .order('priority', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    let maskedKey: string | null = null;
    if (row.encrypted_key) {
      try {
        maskedKey = maskApiKey(decryptApiKey(row.encrypted_key));
      } catch {
        maskedKey = '••••(erro ao decodificar)';
      }
    }
    return {
      provider: row.provider as AiProvider,
      maskedKey,
      hasKey: Boolean(row.encrypted_key),
      defaultModel: row.default_model ?? '',
      isEnabled: row.is_enabled,
      priority: row.priority,
      extraConfig: (row.extra_config as Record<string, unknown>) ?? {},
    };
  });
}

// ── Update API key ────────────────────────────────────────────

export async function updateProviderKey(
  provider: AiProvider,
  plainApiKey: string
): Promise<{ ok: boolean; masked?: string; error?: string }> {
  try {
    const userId = await requireAdmin();
    if (!plainApiKey.trim()) return { ok: false, error: 'A chave não pode estar vazia.' };

    const encrypted = encryptApiKey(plainApiKey.trim());
    const supabase = createServiceClient();

    await supabase
      .from('system_settings')
      .update({ encrypted_key: encrypted, updated_at: new Date().toISOString(), updated_by: userId })
      .eq('provider', provider);

    await supabase.from('system_settings_audit').insert({
      provider,
      action: 'key_updated',
      changed_by: userId,
    });

    bustSettingsCache();
    revalidatePath('/admin/desenvolvedor');

    return { ok: true, masked: maskApiKey(plainApiKey.trim()) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Update default model ──────────────────────────────────────

export async function updateProviderModel(
  provider: AiProvider,
  model: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireAdmin();
    const supabase = createServiceClient();

    await supabase
      .from('system_settings')
      .update({ default_model: model, updated_at: new Date().toISOString(), updated_by: userId })
      .eq('provider', provider);

    await supabase.from('system_settings_audit').insert({
      provider,
      action: 'model_changed',
      changed_by: userId,
    });

    bustSettingsCache();
    revalidatePath('/admin/desenvolvedor');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Toggle provider ───────────────────────────────────────────

export async function toggleProvider(
  provider: AiProvider,
  enabled: boolean
): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireAdmin();
    const supabase = createServiceClient();

    await supabase
      .from('system_settings')
      .update({ is_enabled: enabled, updated_at: new Date().toISOString(), updated_by: userId })
      .eq('provider', provider);

    await supabase.from('system_settings_audit').insert({
      provider,
      action: enabled ? 'enabled' : 'disabled',
      changed_by: userId,
    });

    bustSettingsCache();
    revalidatePath('/admin/desenvolvedor');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}

// ── Update strategy (priority / fallback order) ───────────────

export async function updateProviderPriority(
  primaryProvider: AiProvider
): Promise<{ ok: boolean; error?: string }> {
  try {
    const userId = await requireAdmin();
    const supabase = createServiceClient();
    const providers: AiProvider[] = ['gemini', 'openrouter'];
    const fallback = providers.find((p) => p !== primaryProvider)!;

    await Promise.all([
      supabase
        .from('system_settings')
        .update({ priority: 1, updated_by: userId })
        .eq('provider', primaryProvider),
      supabase
        .from('system_settings')
        .update({ priority: 2, updated_by: userId })
        .eq('provider', fallback),
    ]);

    await supabase.from('system_settings_audit').insert({
      provider: primaryProvider,
      action: 'priority_changed',
      changed_by: userId,
    });

    bustSettingsCache();
    revalidatePath('/admin/desenvolvedor');
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
  }
}
