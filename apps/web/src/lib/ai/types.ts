// ── AI Engine — shared types ──────────────────────────────────

export type AiFeature = 'question-parser' | 'tutor' | 'flashcard' | 'study-plan';
export type AiProvider = 'gemini' | 'openrouter';

/** Shape of one row from public.system_settings (with key decrypted by app layer). */
export interface ProviderSettings {
  provider: AiProvider;
  /** Plain-text API key (decrypted in server-side code, never sent to client). */
  apiKey: string;
  defaultModel: string;
  isEnabled: boolean;
  /** 1 = primary, 2 = fallback */
  priority: number;
  extraConfig: Record<string, unknown>;
}

/** What callers pass into aiService.run(). */
export interface AiRunOptions {
  feature: AiFeature;
  /** Text prompt (system + user combined, or just user if systemPrompt is set). */
  prompt: string;
  /** Optional separate system instruction. */
  systemPrompt?: string;
  /** Base-64 encoded image for multimodal features (question-parser). */
  imageBase64?: string;
  /** MIME type of the image. Defaults to 'image/jpeg'. */
  mimeType?: string;
  maxTokens?: number;
}

/** What aiService.run() returns on success. */
export interface AiRunResult {
  text: string;
  providerUsed: AiProvider;
  modelUsed: string;
  fallbackUsed: boolean;
  tokensUsed: { input: number; output: number };
  latencyMs: number;
}

/** Thrown when every provider fails. Callers should surface a user-friendly message. */
export class AiUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiUnavailableError';
  }
}

/** Errors that should NOT trigger fallback (bad prompt, invalid key, etc.). */
export class AiNonRetryableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AiNonRetryableError';
  }
}
