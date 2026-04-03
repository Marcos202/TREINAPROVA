// ── DeckCard — visual "stack of cards" for a subject deck ─────────────────────
// Pure presentational. Receives accent from tenant theme.
// The stacked-layer effect (two rotated divs behind) gives depth without JS.

interface Props {
  subjectName: string;
  count: number;
  type: 'official' | 'personal';
  accent: string;
  accentLight: string;
  onStudy: () => void;
  /** Called when the pencil edit button is clicked (personal cards only) */
  onManage?: () => void;
}

export function DeckCard({ subjectName, count, type, accent, accentLight, onStudy, onManage }: Props) {
  return (
    // Outer wrapper sets the stacking context for pseudo-layers
    <div className="relative group">

      {/* ── Stacked layers — depth illusion ── */}
      <div
        className="absolute inset-x-2 bottom-0 top-2 rounded-2xl border border-slate-200/70 bg-white"
        style={{ transform: 'rotate(2.5deg)', zIndex: 0 }}
      />
      <div
        className="absolute inset-x-1 bottom-0 top-1 rounded-2xl border border-slate-200/60 bg-white"
        style={{ transform: 'rotate(1.2deg)', zIndex: 1 }}
      />

      {/* ── Main card ── */}
      <div
        className="relative z-10 bg-white rounded-2xl border border-slate-200/60 p-5
          group-hover:shadow-lg group-hover:border-slate-300/50
          transition-all duration-200 overflow-hidden flex flex-col gap-4"
      >
        {/* Decorative gradient blob (top-right corner) */}
        <div
          className="absolute top-0 right-0 w-20 h-20 rounded-bl-[48px] opacity-[0.06] pointer-events-none"
          style={{ background: accent }}
        />

        {/* Pencil edit button — personal cards only, visible on hover */}
        {type === 'personal' && onManage && (
          <button
            onClick={(e) => { e.stopPropagation(); onManage(); }}
            title="Gerenciar cards"
            className="absolute top-2.5 right-2.5 z-20
              w-7 h-7 rounded-lg flex items-center justify-center
              text-slate-400 bg-white border border-slate-200
              hover:text-slate-700 hover:border-slate-300 hover:shadow-sm
              opacity-0 group-hover:opacity-100
              active:scale-95 transition-all duration-150"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </button>
        )}

        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: accentLight }}
        >
          {type === 'official' ? (
            // Flashcard icon
            <svg
              className="w-5 h-5"
              style={{ color: accent }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M2 9h20" />
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="M10 14h4" />
            </svg>
          ) : (
            // Pencil icon for personal cards
            <svg
              className="w-5 h-5"
              style={{ color: accent }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          )}
        </div>

        {/* Subject name + count */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13px] font-semibold text-slate-900 leading-snug line-clamp-2">
            {subjectName}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 tabular-nums">
            {count} {count === 1 ? 'card' : 'cards'} disponíveis
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onStudy}
          className="w-full py-2 rounded-xl text-[12px] font-semibold
            border transition-all duration-150
            hover:shadow-sm active:scale-[0.98]"
          style={{
            color: accent,
            backgroundColor: accent + '10',
            borderColor: accent + '28',
          }}
        >
          ▶ Estudar
        </button>
      </div>
    </div>
  );
}
