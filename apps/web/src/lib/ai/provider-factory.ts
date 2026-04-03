import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import type { ProviderSettings } from './types';

/**
 * Returns a Vercel AI SDK LanguageModelV1 instance for the given provider settings.
 *
 * - 'gemini'     → @ai-sdk/google  (native Google Generative AI)
 * - 'openrouter' → @ai-sdk/openai  (OpenAI-compatible API, custom baseURL)
 */
export function createProviderModel(settings: ProviderSettings): LanguageModel {
  const model = settings.defaultModel;

  switch (settings.provider) {
    case 'gemini': {
      const google = createGoogleGenerativeAI({ apiKey: settings.apiKey });
      return google(model);
    }

    case 'openrouter': {
      const baseURL =
        (settings.extraConfig.base_url as string | undefined) ??
        'https://openrouter.ai/api/v1';
      const openrouter = createOpenAI({
        baseURL,
        apiKey: settings.apiKey,
        headers: {
          'HTTP-Referer': 'https://treinaprova.com',
          'X-Title': 'TreinaPro AI Engine',
        },
      });
      return openrouter(model);
    }

    default:
      throw new Error(`Unknown AI provider: ${settings.provider}`);
  }
}
