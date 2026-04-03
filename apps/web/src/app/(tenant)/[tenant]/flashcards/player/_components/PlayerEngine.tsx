'use client';

import { useState, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FlipCard } from './FlipCard';
import { RatingButtons } from './RatingButtons';
import { SessionTimer } from './SessionTimer';
import { SessionComplete } from './SessionComplete';
import { recordFlashcardResult, type FlashcardRating } from '../_actions/recordResult';
import type { FlashCard } from '../_actions/getCards';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TenantTheme {
  accent: string;
  accentGradient: string;
}

interface Props {
  cards: FlashCard[];
  tenant: string;
  theme: TenantTheme;
}

// ── Framer variants ───────────────────────────────────────────────────────────

const cardVariants = {
  enter:  { opacity: 0, x: 70, scale: 0.97 },
  center: { opacity: 1, x: 0,  scale: 1   },
  exit:   { opacity: 0, x: -70, scale: 0.97 },
};

const cardTransition = { duration: 0.22, ease: 'easeOut' as const };

// ── Component ─────────────────────────────────────────────────────────────────

export function PlayerEngine({ cards, tenant, theme }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped]       = useState(false);
  const [ratings, setRatings]           = useState<FlashcardRating[]>([]);
  const [isRating, setIsRating]         = useState(false);

  // Stable elapsed seconds ref — captured on session complete
  const elapsedRef = useRef(0);

  const isComplete = currentIndex >= cards.length;
  const currentCard = cards[currentIndex];
  const progress = cards.length > 0 ? currentIndex / cards.length : 0;

  // ── Handlers ──

  const handleFlip = useCallback(() => {
    setIsFlipped((v) => !v);
  }, []);

  const handleRate = useCallback(
    (rating: FlashcardRating) => {
      if (isRating || !currentCard) return;
      setIsRating(true);

      // Fire-and-forget persistence — never block the UI
      recordFlashcardResult({
        questionId:       currentCard.source === 'official' ? currentCard.id : null,
        userFlashcardId:  currentCard.source === 'personal' ? currentCard.id : null,
        rating,
        tenant,
      });

      // Append rating, advance index, reset flip
      setRatings((prev) => [...prev, rating]);
      setCurrentIndex((i) => i + 1);
      setIsFlipped(false);

      // Re-enable after the slide animation completes
      setTimeout(() => setIsRating(false), 280);
    },
    [currentCard, isRating, tenant]
  );

  const handleTimerTick = useCallback((secs: number) => {
    elapsedRef.current = secs;
  }, []);

  // ── Complete screen ──

  if (isComplete) {
    return (
      <SessionComplete
        total={cards.length}
        ratings={ratings}
        elapsedSeconds={elapsedRef.current}
        tenant={tenant}
        accentGradient={theme.accentGradient}
        accent={theme.accent}
      />
    );
  }

  // ── Player screen ──

  return (
    <div className="flex flex-col min-h-screen">

      {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 flex items-center gap-4 px-4 sm:px-6 pt-4 pb-3">

        {/* Exit button */}
        <a
          href={`/${tenant}/flashcards`}
          aria-label="Sair do estudo"
          className="flex-shrink-0 w-9 h-9 rounded-xl bg-white border border-slate-200
            flex items-center justify-center text-slate-500
            hover:bg-slate-50 hover:text-slate-800
            active:scale-95 transition-all duration-150 shadow-sm"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </a>

        {/* Progress bar + counter */}
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="flex-1 h-2 rounded-full bg-white border border-slate-200/60 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progress * 100}%`,
                background: theme.accentGradient,
              }}
            />
          </div>
          <span className="flex-shrink-0 text-xs font-semibold text-slate-500 tabular-nums">
            {currentIndex}/{cards.length}
          </span>
        </div>
      </header>

      {/* ══ CENTER — FlipCard with AnimatePresence slide ══════════════════════ */}
      <main
        className="flex-1 flex flex-col items-center justify-center
          px-4 sm:px-6 py-6 gap-6 overflow-hidden"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentIndex}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={cardTransition}
            className="w-full max-w-2xl"
          >
            <FlipCard
              front={currentCard.front}
              back={currentCard.back}
              hint={currentCard.hint}
              subjectName={currentCard.subjectName}
              isFlipped={isFlipped}
              onFlip={handleFlip}
              accent={theme.accent}
            />
          </motion.div>
        </AnimatePresence>

        {/* Rating buttons — slide in after flip */}
        <div
          className="w-full max-w-2xl transition-all duration-300"
          style={{
            opacity: isFlipped ? 1 : 0,
            transform: isFlipped ? 'translateY(0)' : 'translateY(12px)',
            pointerEvents: isFlipped ? 'auto' : 'none',
          }}
        >
          <RatingButtons onRate={handleRate} disabled={isRating || !isFlipped} />
        </div>
      </main>

      {/* ══ FOOTER — Timer ════════════════════════════════════════════════════ */}
      <footer className="flex-shrink-0 flex items-center justify-between
        px-4 sm:px-6 pb-5 pt-2">
        <SessionTimer onTick={handleTimerTick} />

        {/* Card number hint (mobile) */}
        <p className="text-[11px] text-slate-400 tabular-nums">
          Card {currentIndex + 1} de {cards.length}
        </p>
      </footer>

    </div>
  );
}
