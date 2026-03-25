'use client';

import { useState } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

export interface SubjectStat {
  id: string;
  name: string;
  question_count: number;
  subcategories?: string[];
}

export interface TenantTheme {
  accent: string;
  accentLight: string;
  accentGradient: string;
  badge: string;
}

interface Props {
  tenant: string;
  theme: TenantTheme;
  subjects: SubjectStat[];
  totalQuestionCount: number;
}

// ── Main Component ────────────────────────────────────────────────────────────

export function TestBuilderPage({ theme, subjects, totalQuestionCount }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(['__all__']));
  const [unansweredOnly, setUnansweredOnly] = useState(false);

  const isAllSelected = selected.has('__all__');

  function toggleAll() {
    setSelected(new Set(['__all__']));
  }

  function toggleSubject(id: string) {
    const next = new Set(selected);
    next.delete('__all__');
    if (next.has(id)) {
      next.delete(id);
      if (next.size === 0) next.add('__all__');
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  const selectedCount = isAllSelected
    ? totalQuestionCount
    : subjects.filter((s) => selected.has(s.id)).reduce((sum, s) => sum + s.question_count, 0);

  return (
    <div className="w-full p-4 sm:p-6 space-y-6">

      {/* ── Modo de Estudo ── */}
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Modo de Estudo
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Card 1: Foco Inteligente PRO */}
          <div
            className="relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
            style={{
              borderColor: theme.accent,
              backgroundColor: `${theme.accent}0D`,
              boxShadow: `0 2px 12px ${theme.accent}18`,
            }}
          >
            <div
              className="w-8 h-8 rounded mt-0.5 flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.accent }}
            >
              <SparklesIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-slate-800 text-sm leading-tight">Foco Inteligente</span>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded text-white shrink-0 leading-snug"
                  style={{ backgroundColor: theme.accent }}
                >
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-snug">
                Seleção automática baseada nos seus pontos fracos.
              </p>
            </div>
          </div>

          {/* Card 2: Geral */}
          <SubjectCard
            isSelected={isAllSelected}
            onClick={toggleAll}
            title="Geral"
            description="Selecionar todas as especialidades e temas automaticamente."
            badgeText="TODAS AS QUESTÕES"
            accent={theme.accent}
          />
        </div>
      </div>

      {/* ── Select Subjects ── */}
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Selecione as disciplinas
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Individual subjects */}
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              isSelected={!isAllSelected && selected.has(subject.id)}
              onClick={() => toggleSubject(subject.id)}
              title={subject.name}
              badgeText={`${subject.question_count.toLocaleString('pt-BR')} QUESTÕES`}
              subcategories={subject.subcategories}
              accent={theme.accent}
            />
          ))}
        </div>
      </div>

      {/* ── Advanced Filters + CTA ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">

        {/* Filtros Avançados */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-800 text-base">Filtros Avançados</h3>

          {/* Toggle: apenas não respondidas */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
            <div className="w-9 h-9 rounded-lg bg-slate-200 flex items-center justify-center shrink-0">
              <ClockIcon className="w-4 h-4 text-slate-500" />
            </div>
            <span className="text-sm text-slate-700 flex-1 leading-snug">
              Apenas questões não respondidas
            </span>
            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={unansweredOnly}
              onClick={() => setUnansweredOnly((v) => !v)}
              className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
              style={{
                backgroundColor: unansweredOnly ? theme.accent : '#e2e8f0',
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{ transform: unansweredOnly ? 'translateX(20px)' : 'translateX(0)' }}
              />
            </button>
          </div>

          {/* PRO locked: bancas específicas */}
          <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-4 border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors group">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
              <LockIcon className="w-4 h-4 text-red-400" />
            </div>
            <span className="text-sm text-slate-700 flex-1 leading-snug">
              Questões de Bancas Específicas
            </span>
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
              style={{ backgroundColor: theme.accent }}
            >
              PRO
            </span>
            <ChevronRightIcon className="w-4 h-4 text-slate-300 group-hover:text-slate-500 shrink-0 transition-colors" />
          </div>
        </div>

        {/* CTA — Gerar Teste */}
        <div className="flex flex-col items-stretch justify-center gap-3">
          <button
            type="button"
            className="w-full py-5 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus:outline-none focus-visible:ring-4"
            style={{
              backgroundColor: theme.accent,
              boxShadow: `0 8px 32px ${theme.accent}45`,
            }}
          >
            <RocketIcon className="w-6 h-6" />
            Gerar Teste
          </button>

          <div className="text-center mt-2">
            <p className="text-sm text-slate-500">
              Você ainda tem{' '}
              <span className="font-bold" style={{ color: theme.accent }}>
                7 respostas
              </span>{' '}
              hoje.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SubjectCard ───────────────────────────────────────────────────────────────

interface SubjectCardProps {
  isSelected: boolean;
  onClick: () => void;
  title: string;
  description?: string;
  badgeText: string;
  badgeVariant?: 'all' | 'count';
  subcategories?: string[];
  accent: string;
}

function SubjectCard({
  isSelected,
  onClick,
  title,
  description,
  badgeText,
  subcategories,
  accent,
}: SubjectCardProps) {
  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' || e.key === ' ' ? onClick() : null}
      className="relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{
        borderColor: isSelected ? accent : '#e2e8f0',
        boxShadow: isSelected ? `0 2px 12px ${accent}18` : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      {/* Checkbox */}
      <div
        className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-all duration-150"
        style={{
          backgroundColor: isSelected ? accent : 'transparent',
          borderColor: isSelected ? accent : '#cbd5e1',
        }}
      >
        {isSelected && (
          <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
            <path
              d="M2.5 6L5 8.5L9.5 3.5"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title + badge row */}
        <div className="flex items-start justify-between gap-2">
          <span className="font-semibold text-slate-800 text-sm leading-tight">{title}</span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap shrink-0 leading-snug">
            {badgeText}
          </span>
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{description}</p>
        )}

        {/* Subcategory pills */}
        {subcategories && subcategories.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {subcategories.slice(0, 5).map((sub) => (
              <span
                key={sub}
                className="text-[11px] bg-blue-50 text-slate-600 px-2 py-0.5 rounded-full font-medium border border-blue-100/60"
              >
                {sub}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Inline SVG Icons ──────────────────────────────────────────────────────────

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
      <path d="M20 3v4M22 5h-4M4 17v2M5 18H3" />
    </svg>
  );
}

function RocketIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function ChevronRightIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
