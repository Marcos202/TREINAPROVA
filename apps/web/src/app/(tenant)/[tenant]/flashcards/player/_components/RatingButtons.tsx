'use client';

import type { FlashcardRating } from '../_actions/recordResult';

// ── Rating button config ───────────────────────────────────────────────────────
// Colors are hardcoded — they must NOT follow tenant theming.
// Red/Orange/Yellow/Green is a universal semantic that should stay consistent
// across all verticals so students build muscle memory.

const RATINGS: {
  value: FlashcardRating;
  label: string;
  emoji: string;
  bg: string;
  border: string;
  text: string;
  hoverBg: string;
}[] = [
  {
    value: 'again',
    label: 'Errei',
    emoji: '✕',
    bg: '#fef2f2',
    border: '#fecaca',
    text: '#dc2626',
    hoverBg: '#fee2e2',
  },
  {
    value: 'hard',
    label: 'Difícil',
    emoji: '↻',
    bg: '#fff7ed',
    border: '#fed7aa',
    text: '#ea580c',
    hoverBg: '#ffedd5',
  },
  {
    value: 'medium',
    label: 'Médio',
    emoji: '~',
    bg: '#fefce8',
    border: '#fde68a',
    text: '#ca8a04',
    hoverBg: '#fef9c3',
  },
  {
    value: 'easy',
    label: 'Fácil',
    emoji: '✓',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    text: '#16a34a',
    hoverBg: '#dcfce7',
  },
];

interface Props {
  onRate: (rating: FlashcardRating) => void;
  disabled?: boolean;
}

export function RatingButtons({ onRate, disabled = false }: Props) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <p className="text-center text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
        Como você se saiu?
      </p>

      <div className="grid grid-cols-4 gap-2 sm:gap-3">
        {RATINGS.map((r) => (
          <button
            key={r.value}
            onClick={() => !disabled && onRate(r.value)}
            disabled={disabled}
            className="flex flex-col items-center gap-1.5 py-3 sm:py-4 rounded-2xl
              border font-semibold transition-all duration-150
              active:scale-[0.95] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              backgroundColor: r.bg,
              borderColor: r.border,
              color: r.text,
            }}
            onMouseEnter={(e) => {
              if (!disabled) (e.currentTarget as HTMLButtonElement).style.backgroundColor = r.hoverBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = r.bg;
            }}
          >
            <span className="text-lg leading-none">{r.emoji}</span>
            <span className="text-[11px] sm:text-xs font-bold">{r.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
