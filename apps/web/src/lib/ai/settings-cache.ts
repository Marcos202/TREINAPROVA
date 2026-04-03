import { createServiceClient } from '@/lib/supabase/service';
import { decryptApiKey } from './crypto';
import type { ProviderSettings, AiProvider } from './types';

/**
 * In-memory cache for provider settings.
 * TTL: 60s — cache is busted immediately when admin saves changes via Server Action.
 *
 * The decrypted API key never leaves the server; it lives here only for the
 * duration between cache population and the actual AI SDK call.
 */

const CACHE_TTL_MS = 60_000;

interface CacheEntry {
  settings: ProviderSettings[];
  expiresAt: number;
}

// Module-level singleton (Node.js process scope)
let _cache: CacheEntry | null = null;

/** Call this from Server Actions after saving provider changes. */
export function bustSettingsCache(): void {
  _cache = null;
}

/** Returns providers ordered by priority (1 = primary first). */
export async function getProviderSettings(): Promise<ProviderSettings[]> {
  if (_cache && Date.now() < _cache.expiresAt) {
    return _cache.settings;
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from('system_settings')
    .select('provider, encrypted_key, default_model, is_enabled, priority, extra_config')
    .order('priority', { ascending: true });

  if (error) throw new Error(`Failed to load AI provider settings: ${error.message}`);

  const settings: ProviderSettings[] = (data ?? []).map((row) => ({
    provider: row.provider as AiProvider,
    apiKey: row.encrypted_key ? decryptApiKey(row.encrypted_key) : '',
    defaultModel: row.default_model ?? '',
    isEnabled: row.is_enabled,
    priority: row.priority,
    extraConfig: (row.extra_config as Record<string, unknown>) ?? {},
  }));

  _cache = { settings, expiresAt: Date.now() + CACHE_TTL_MS };
  return settings;
}

/** Returns the ordered list of enabled providers (primary first). */
export async function getEnabledProviders(): Promise<ProviderSettings[]> {
  const all = await getProviderSettings();
  return all.filter((p) => p.isEnabled && p.apiKey);
}
