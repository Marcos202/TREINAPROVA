// ── flashcard-sanitize ────────────────────────────────────────────────────────
//
// Shared DOMPurify config for personal flashcard HTML.
// Used on both server (Server Actions) and client (FlipCard render).
// isomorphic-dompurify auto-detects the environment:
//   • Browser → native DOMPurify
//   • Node.js  → jsdom-backed DOMPurify
// ─────────────────────────────────────────────────────────────────────────────

import DOMPurify from 'isomorphic-dompurify';

/** Maximum plain-text length for the front (question) face */
export const FLASHCARD_FRONT_LIMIT = 400;
/** Maximum plain-text length for the back (answer) face */
export const FLASHCARD_BACK_LIMIT  = 1000;

const FLASHCARD_CONFIG: Parameters<typeof DOMPurify.sanitize>[1] = {
  ALLOWED_TAGS : ['p', 'b', 'i', 'strong', 'em', 'ul', 'ol', 'li', 'br', 'img'],
  ALLOWED_ATTR : ['src', 'alt'],
  // Never allow javascript: URLs in src
  ALLOW_DATA_ATTR: false,
};

/**
 * Sanitize flashcard HTML — strips all tags/attributes not on the allow-list.
 * Safe to call on both server and client.
 */
export function sanitizeFlashcardHtml(html: string): string {
  return DOMPurify.sanitize(html, FLASHCARD_CONFIG) as string;
}

/**
 * Strip HTML tags and return plain text — used for length validation.
 * Collapses whitespace so the count matches what the user sees.
 */
export function stripHtmlForCount(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}
