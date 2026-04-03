import { generateText } from 'ai';
import { getEnabledProviders } from './settings-cache';
import { createProviderModel } from './provider-factory';
import { logAiRequest } from './request-logger';
import { AiUnavailableError, AiNonRetryableError } from './types';
import type { AiRunOptions, AiRunResult } from './types';

/**
 * HTTP status codes that should NOT trigger fallback.
 * These indicate a bug in our prompt or an invalid API key — retrying on another
 * provider will not help.
 */
const NON_RETRYABLE_STATUS = new Set([400, 401, 403, 422]);

/** Timeout for a single provider attempt (ms). */
const PROVIDER_TIMEOUT_MS = 12_000;

/**
 * Main entry point for all AI features.
 *
 * Usage:
 *   import { aiService } from '@/lib/ai/ai-service';
 *   const result = await aiService.run({ feature: 'tutor', prompt: '...' });
 */
export const aiService = {
  async run(options: AiRunOptions): Promise<AiRunResult> {
    const providers = await getEnabledProviders();

    if (providers.length === 0) {
      throw new AiUnavailableError(
        'Nenhum provedor de IA está habilitado. Configure em /admin/desenvolvedor.'
      );
    }

    let fallbackUsed = false;

    for (let i = 0; i < providers.length; i++) {
      const settings = providers[i];
      const isLastProvider = i === providers.length - 1;
      if (i > 0) fallbackUsed = true;

      const model = createProviderModel(settings);
      const started = Date.now();

      try {
        // Build messages array for multimodal support
        const messages: Parameters<typeof generateText>[0]['messages'] = options.imageBase64
          ? [
              {
                role: 'user' as const,
                content: [
                  { type: 'text' as const, text: options.prompt },
                  {
                    type: 'image' as const,
                    // Embed mimeType in the data URL — ImagePart doesn't have a standalone mimeType field
                    image: `data:${options.mimeType ?? 'image/jpeg'};base64,${options.imageBase64}`,
                  },
                ],
              },
            ]
          : undefined;

        const { text, usage } = await withTimeout(
          generateText({
            model,
            ...(messages
              ? { messages }
              : { prompt: options.prompt }),
            ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
            maxOutputTokens: options.maxTokens ?? 2048,
          }),
          PROVIDER_TIMEOUT_MS
        );

        const latencyMs = Date.now() - started;

        // Fire-and-forget log
        void logAiRequest({
          feature: options.feature,
          providerUsed: settings.provider,
          modelUsed: settings.defaultModel,
          fallbackUsed,
          tokensInput: usage?.inputTokens,
          tokensOutput: usage?.outputTokens,
          latencyMs,
          success: true,
        });

        return {
          text,
          providerUsed: settings.provider,
          modelUsed: settings.defaultModel,
          fallbackUsed,
          tokensUsed: {
            input: usage?.inputTokens ?? 0,
            output: usage?.outputTokens ?? 0,
          },
          latencyMs,
        };
      } catch (err: unknown) {
        const latencyMs = Date.now() - started;
        const { code, retryable } = classifyError(err);

        void logAiRequest({
          feature: options.feature,
          providerUsed: settings.provider,
          modelUsed: settings.defaultModel,
          fallbackUsed,
          latencyMs,
          success: false,
          errorCode: code,
        });

        // Non-retryable → throw immediately, no point trying fallback
        if (!retryable) {
          throw new AiNonRetryableError(
            `Provedor ${settings.provider} retornou um erro não recuperável (${code}).`
          );
        }

        // Last provider and still failing → give up
        if (isLastProvider) {
          throw new AiUnavailableError(
            `Todos os provedores de IA falharam. Último erro: ${code}`
          );
        }

        // Try next provider (fallback)
        console.warn(`[ai-service] ${settings.provider} failed (${code}), trying fallback...`);
      }
    }

    throw new AiUnavailableError('Nenhum provedor de IA disponível.');
  },
};

// ── Helpers ──────────────────────────────────────────────────

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    ),
  ]);
}

function classifyError(err: unknown): { code: string; retryable: boolean } {
  const message = err instanceof Error ? err.message : String(err);

  if (message === 'TIMEOUT') return { code: 'TIMEOUT', retryable: true };

  // HTTP status embedded in error message by AI SDK
  for (const status of NON_RETRYABLE_STATUS) {
    if (message.includes(String(status))) {
      return { code: `HTTP_${status}`, retryable: false };
    }
  }

  // Rate limit / quota / server error → retryable
  if (message.includes('429') || message.includes('503') || message.includes('502')) {
    return { code: 'RATE_LIMIT_OR_UNAVAILABLE', retryable: true };
  }

  return { code: 'UNKNOWN', retryable: true };
}
