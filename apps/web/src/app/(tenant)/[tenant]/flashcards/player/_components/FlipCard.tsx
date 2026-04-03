'use client';

// ── FlipCard ──────────────────────────────────────────────────────────────────
//
// 3D Flip technique:
//   • CSS perspective + preserve-3d + backface-visibility for the flip.
//   • Inline styles are intentional — Tailwind purge cannot handle dynamic
//     3D properties reliably across all browser vendor prefixes.
//
// Dynamic height (CSS Grid overlay):
//   • The inner rotating div uses display:grid instead of position:relative.
//   • Both faces share gridArea '1 / 1', so they overlap in the same cell.
//   • The grid height = max(front height, back height) — the card auto-grows
//     with content and never clips or adds a scrollbar.
//   • The 3D flip is unaffected: preserve-3d + backfaceVisibility still work
//     perfectly on grid children.
//
// Security:
//   • front/back HTML is sanitized client-side (DOMPurify) as a second layer;
//     server actions also sanitize before persisting to the DB.
// ─────────────────────────────────────────────────────────────────────────────

import { useMemo } from 'react';
import { sanitizeFlashcardHtml } from '@/lib/flashcard-sanitize';

interface Props {
  front: string;   // HTML from TipTap
  back: string;    // HTML from TipTap
  hint: string | null;
  subjectName: string | null;
  isFlipped: boolean;
  onFlip: () => void;
  accent: string;
}

export function FlipCard({ front, back, hint, subjectName, isFlipped, onFlip, accent }: Props) {
  // Client-side sanitization — belt-and-suspenders over the server-side pass
  const safeFront = useMemo(() => sanitizeFlashcardHtml(front), [front]);
  const safeBack  = useMemo(() => sanitizeFlashcardHtml(back),  [back]);

  return (
    <div className="w-full max-w-2xl mx-auto select-none">

      {/* ── Subject badge ── */}
      {subjectName && (
        <p
          className="text-center text-[11px] font-semibold uppercase tracking-widest mb-3"
          style={{ color: accent }}
        >
          {subjectName}
        </p>
      )}

      {/* ── Perspective container ── */}
      <div
        style={{ perspective: '1400px', perspectiveOrigin: '50% 40%' }}
        className="w-full"
      >
        {/*
          ── Inner rotating element (CSS Grid) ──
          display:grid makes both faces share the same cell.
          The grid height = max(front, back) → card auto-grows with content.
          preserve-3d + backfaceVisibility still work correctly on grid children.
        */}
        <div
          style={{
            transformStyle: 'preserve-3d',
            transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            display: 'grid',
          }}
          className="w-full cursor-pointer"
          onClick={onFlip}
          role="button"
          tabIndex={0}
          aria-label={isFlipped ? 'Mostrar frente' : 'Mostrar resposta'}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onFlip(); }
          }}
        >

          {/* ═══ FRONT FACE — colored background, white text ═══ */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              gridArea: '1 / 1',
              backgroundColor: accent,
            }}
            className="rounded-3xl shadow-lg flex flex-col min-h-[260px] p-6 overflow-hidden"
          >
            {/* Label */}
            <span
              className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest self-start mb-4"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              Frente
            </span>

            {/* Content — grows with text, centered vertically when short */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div
                className="text-white text-center text-base sm:text-lg font-semibold
                  leading-relaxed max-w-prose
                  break-words whitespace-pre-wrap w-full
                  tiptap-player-content"
                style={{ color: 'white' }}
                dangerouslySetInnerHTML={{ __html: safeFront }}
              />
            </div>

            {/* Tap hint */}
            <p
              className="flex-shrink-0 text-center text-[11px] font-medium mt-4"
              style={{ color: 'rgba(255,255,255,0.60)' }}
            >
              Toque para ver a resposta
            </p>
          </div>

          {/* ═══ BACK FACE ═══ */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              gridArea: '1 / 1',
            }}
            className="bg-white rounded-3xl border border-slate-200/70 shadow-sm
              flex flex-col min-h-[260px] p-6 overflow-hidden"
          >
            {/* Label */}
            <span className="flex-shrink-0 text-[10px] font-semibold text-slate-300 uppercase tracking-widest self-start mb-4">
              Verso
            </span>

            {/* Content */}
            <div className="flex-1 flex items-center justify-center py-2">
              <div
                className="text-slate-800 text-center text-sm sm:text-base
                  leading-relaxed max-w-prose
                  break-words whitespace-pre-wrap w-full
                  tiptap-player-content"
                dangerouslySetInnerHTML={{ __html: safeBack }}
              />
            </div>

            {/* Hint */}
            {hint && (
              <div
                className="flex-shrink-0 mt-4 px-4 py-2.5 rounded-xl text-[12px] text-center leading-snug border"
                style={{
                  backgroundColor: accent + '0d',
                  borderColor: accent + '30',
                  color: accent,
                }}
              >
                <span className="font-semibold">Dica: </span>
                {hint}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ── "Ver Resposta" button — shown only on front ── */}
      {!isFlipped && (
        <div className="flex justify-center mt-5">
          <button
            onClick={onFlip}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl
              text-sm font-semibold bg-white shadow-sm
              hover:shadow-md hover:scale-[1.02]
              active:scale-[0.97] transition-all duration-150"
            style={{ color: accent, border: `1.5px solid ${accent}30` }}
          >
            Ver Resposta
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
