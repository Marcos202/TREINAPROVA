import { createServiceClient } from '@/lib/supabase/service';
import type { AiFeature, AiProvider } from './types';

interface LogPayload {
  feature: AiFeature;
  providerUsed: AiProvider;
  modelUsed: string;
  fallbackUsed: boolean;
  tokensInput?: number;
  tokensOutput?: number;
  latencyMs?: number;
  success: boolean;
  errorCode?: string;
}

/**
 * Fire-and-forget log to public.ai_request_logs.
 * Uses service client — never throws to the caller.
 */
export async function logAiRequest(payload: LogPayload): Promise<void> {
  try {
    const supabase = createServiceClient();
    await supabase.from('ai_request_logs').insert({
      feature: payload.feature,
      provider_used: payload.providerUsed,
      model_used: payload.modelUsed,
      fallback_used: payload.fallbackUsed,
      tokens_input: payload.tokensInput ?? null,
      tokens_output: payload.tokensOutput ?? null,
      latency_ms: payload.latencyMs ?? null,
      success: payload.success,
      error_code: payload.errorCode ?? null,
    });
  } catch {
    // Logging failure must never crash the main AI request
    console.error('[ai-logger] Failed to write request log');
  }
}

/** Returns aggregated stats for the last 24h per provider (used by HealthMonitor). */
export async function getLast24hStats() {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('ai_request_logs')
    .select('provider_used, success, latency_ms, fallback_used')
    .gte('created_at', since);

  if (error || !data) return [];

  const map = new Map<string, { total: number; ok: number; latencies: number[]; fallbacks: number }>();

  for (const row of data) {
    const entry = map.get(row.provider_used) ?? { total: 0, ok: 0, latencies: [], fallbacks: 0 };
    entry.total++;
    if (row.success) entry.ok++;
    if (row.latency_ms) entry.latencies.push(row.latency_ms);
    if (row.fallback_used) entry.fallbacks++;
    map.set(row.provider_used, entry);
  }

  return Array.from(map.entries()).map(([provider, s]) => ({
    provider,
    total: s.total,
    successRate: s.total > 0 ? Math.round((s.ok / s.total) * 100) : 100,
    avgLatencyMs: s.latencies.length > 0
      ? Math.round(s.latencies.reduce((a, b) => a + b, 0) / s.latencies.length)
      : 0,
    fallbacks: s.fallbacks,
  }));
}
