'use client';

import { formatTime } from './SessionTimer';
import type { FlashcardRating } from '../_actions/recordResult';

// ── SessionComplete ────────────────────────────────────────────────────────────

interface Props {
  total: number;
  ratings: FlashcardRating[];
  elapsedSeconds: number;
  tenant: string;
  accentGradient: string;
  accent: string;
}

export function SessionComplete({
  total,
  ratings,
  elapsedSeconds,
  tenant,
  accentGradient,
  accent,
}: Props) {
  // ── Stats ──
  const answered = ratings.length;
  const easyCount   = ratings.filter((r) => r === 'easy').length;
  const mediumCount = ratings.filter((r) => r === 'medium').length;
  const hardCount   = ratings.filter((r) => r === 'hard').length;
  const againCount  = ratings.filter((r) => r === 'again').length;

  const retentionRate =
    answered > 0 ? Math.round(((easyCount + mediumCount) / answered) * 100) : 0;

  const minutesDisplay =
    elapsedSeconds < 60
      ? `${elapsedSeconds}s`
      : `${formatTime(elapsedSeconds)} min`;

  // ── Emoji feedback ──
  const emoji =
    retentionRate >= 80 ? '🏆' : retentionRate >= 60 ? '💪' : '📚';
  const message =
    retentionRate >= 80
      ? 'Excelente! Você domina este conteúdo.'
      : retentionRate >= 60
      ? 'Bom progresso! Continue revisando os difíceis.'
      : 'Continue praticando — a repetição é o caminho.';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-12">
      <div className="w-full max-w-md space-y-6">

        {/* ── Trophy / Emoji ── */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-md text-3xl"
            style={{ background: accentGradient }}
          >
            {emoji}
          </div>
        </div>

        {/* ── Title ── */}
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold text-slate-900">Sessão Concluída!</h1>
          <p className="text-sm text-slate-500">{message}</p>
        </div>

        {/* ── Summary card ── */}
        <div className="bg-white rounded-3xl border border-slate-200/70 shadow-sm p-6 space-y-5">

          {/* Retention ring + label */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">
                Taxa de Retenção
              </p>
              <p className="text-3xl font-bold tabular-nums" style={{ color: accent }}>
                {retentionRate}%
              </p>
              <p className="text-xs text-slate-400 mt-0.5">fácil + médio</p>
            </div>
            <RetentionRing percentage={retentionRate} accent={accent} />
          </div>

          <div className="h-px bg-slate-100" />

          {/* Time + count */}
          <div className="grid grid-cols-2 gap-4">
            <Stat label="Cards revisados" value={String(answered)} />
            <Stat label="Tempo de sessão" value={minutesDisplay} />
          </div>

          <div className="h-px bg-slate-100" />

          {/* Rating breakdown */}
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Distribuição
            </p>
            <RatingBar label="Fácil"   count={easyCount}   total={answered} color="#16a34a" bg="#f0fdf4" />
            <RatingBar label="Médio"   count={mediumCount} total={answered} color="#ca8a04" bg="#fefce8" />
            <RatingBar label="Difícil" count={hardCount}   total={answered} color="#ea580c" bg="#fff7ed" />
            <RatingBar label="Errei"   count={againCount}  total={answered} color="#dc2626" bg="#fef2f2" />
          </div>
        </div>

        {/* ── Actions ── */}
        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={`/${tenant}/flashcards`}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white text-center
              shadow-sm hover:opacity-90 active:scale-[0.97] transition-all duration-150"
            style={{ background: accentGradient }}
          >
            Voltar para Baralhos
          </a>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 py-3 rounded-2xl text-sm font-semibold text-slate-600
              bg-white border border-slate-200 hover:bg-slate-50
              active:scale-[0.97] transition-all duration-150"
          >
            Repetir Sessão
          </button>
        </div>

      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xl font-bold text-slate-900 tabular-nums">{value}</p>
      <p className="text-[11px] text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function RatingBar({
  label,
  count,
  total,
  color,
  bg,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
  bg: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-medium text-slate-500 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: bg }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold tabular-nums text-slate-500 w-8 text-right">
        {count}
      </span>
    </div>
  );
}

function RetentionRing({ percentage, accent }: { percentage: number; accent: string }) {
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="-rotate-90">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="7" />
      <circle
        cx="40"
        cy="40"
        r={radius}
        fill="none"
        stroke={accent}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
      />
    </svg>
  );
}
