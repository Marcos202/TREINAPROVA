'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Deck {
  subjectId: string | null;
  subjectName: string;
  count: number;
  type: 'official' | 'personal';
}

interface TenantTheme {
  accent: string;
  accentGradient: string;
}

interface Props {
  tenant: string;
  deck: Deck;
  theme: TenantTheme;
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const LIMIT_OPTIONS = [
  { label: '20',   value: 20  },
  { label: '50',   value: 50  },
  { label: '100',  value: 100 },
  { label: 'Todos', value: 0  },
] as const;

type StudyMode = 'pending' | 'all';

const MODE_OPTIONS: { value: StudyMode; label: string; sub: string }[] = [
  {
    value: 'pending',
    label: 'Apenas pendentes de revisão',
    sub: 'Cards difíceis e novos em primeiro lugar',
  },
  {
    value: 'all',
    label: 'Todos os cards',
    sub: 'Inclui cards já marcados como fácil',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SessionConfigModal({ tenant, deck, theme, onClose }: Props) {
  const router = useRouter();
  const [limit, setLimit] = useState<number>(20);
  const [mode, setMode] = useState<StudyMode>('pending');

  function handleStart() {
    const params = new URLSearchParams({
      type: deck.type,
      limit: String(limit === 0 ? deck.count : limit),
      mode,
    });
    if (deck.subjectId) params.set('subject', deck.subjectId);

    router.push(`/${tenant}/flashcards/player?${params.toString()}`);
  }

  return (
    // ── Backdrop ──
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4
        bg-slate-900/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Sheet / Dialog ── */}
      <div
        className="w-full sm:max-w-sm bg-white
          rounded-t-3xl sm:rounded-3xl shadow-2xl
          overflow-hidden
          animate-in slide-in-from-bottom-4 sm:zoom-in-95
          duration-200"
      >

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-5 border-b border-slate-100">
          {/* Drag handle (mobile only) */}
          <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />

          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-base font-bold text-slate-900 truncate">
                {deck.subjectName}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 tabular-nums">
                {deck.count} {deck.count === 1 ? 'flashcard disponível' : 'flashcards disponíveis'}
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200
                flex items-center justify-center transition-colors text-slate-500 text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="px-6 py-5 space-y-6">

          {/* Limit selector */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Cards por sessão
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {LIMIT_OPTIONS.map((opt) => {
                const isActive = limit === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setLimit(opt.value)}
                    className="py-3 rounded-xl text-sm font-semibold border transition-all duration-150
                      active:scale-[0.97]"
                    style={
                      isActive
                        ? { background: theme.accentGradient, color: '#fff', borderColor: 'transparent' }
                        : { background: '#f8fafc', color: '#475569', borderColor: '#e2e8f0' }
                    }
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Mode selector */}
          <div>
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Modo de estudo
            </p>
            <div className="space-y-2">
              {MODE_OPTIONS.map((m) => {
                const isActive = mode === m.value;
                return (
                  <label
                    key={m.value}
                    className="flex items-start gap-3 p-3 rounded-xl border cursor-pointer
                      transition-all duration-150"
                    style={
                      isActive
                        ? { borderColor: theme.accent + '45', backgroundColor: theme.accent + '08' }
                        : { borderColor: '#e2e8f0', backgroundColor: 'transparent' }
                    }
                  >
                    {/* Custom radio */}
                    <div className="flex-shrink-0 mt-0.5">
                      <input
                        type="radio"
                        name="study-mode"
                        value={m.value}
                        checked={isActive}
                        onChange={() => setMode(m.value)}
                        className="sr-only"
                      />
                      <div
                        className="w-4 h-4 rounded-full border-2 flex items-center justify-center
                          transition-colors duration-150"
                        style={
                          isActive
                            ? { borderColor: theme.accent }
                            : { borderColor: '#cbd5e1' }
                        }
                      >
                        {isActive && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: theme.accent }}
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <p className="text-[12px] font-semibold text-slate-800 leading-snug">
                        {m.label}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                        {m.sub}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="px-6 pb-6 flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleStart}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
              shadow-sm hover:opacity-90 active:scale-[0.98] transition-all duration-150"
            style={{ background: theme.accentGradient }}
          >
            ▶ Começar sessão
          </button>
        </div>

      </div>
    </div>
  );
}
