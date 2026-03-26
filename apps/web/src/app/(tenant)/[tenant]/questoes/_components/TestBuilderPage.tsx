'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createTestSession } from '../_actions/sessionActions';

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

export function TestBuilderPage({ tenant, theme, subjects, totalQuestionCount }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set(['__all__']));
  const [unansweredOnly, setUnansweredOnly] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAllSelected = selected.has('__all__');
  const isFocoSelected = selected.has('__foco__');

  // ── Gerar Teste ──────────────────────────────────────────────────────────
  async function handleGerarTeste() {
    setIsGenerating(true);
    setErrorMsg(null);
    try {
      // null = todas as disciplinas; lista = disciplinas selecionadas
      const subjectIds =
        isAllSelected || isFocoSelected
          ? null
          : [...selected].filter((id) => id !== '__all__' && id !== '__foco__');

      const result = await createTestSession(
        tenant,
        subjectIds && subjectIds.length > 0 ? subjectIds : null
      );

      if (result.error) {
        console.error('[TestBuilderPage] Erro:', result.error);
        setErrorMsg(result.error);
        return;
      }

      // Navegar para a sessão criada
      router.push(`/${tenant}/treino/${result.sessionId}`);
    } catch (err) {
      console.error('[TestBuilderPage] Erro inesperado:', err);
      setErrorMsg('Erro inesperado. Verifique o console e tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  }

  function toggleAll() {
    setSelected(new Set(['__all__']));
  }

  function toggleFoco() {
    setSelected(new Set(['__foco__']));
  }

  function toggleSubject(id: string) {
    const next = new Set(selected);
    next.delete('__all__');
    next.delete('__foco__');
    if (next.has(id)) {
      next.delete(id);
      if (next.size === 0) next.add('__all__');
    } else {
      next.add(id);
    }
    setSelected(next);
  }

  const selectedCount = isAllSelected || isFocoSelected
    ? totalQuestionCount
    : subjects.filter((s) => selected.has(s.id)).reduce((sum, s) => sum + s.question_count, 0);

  return (
    <div className="w-full space-y-8">

      {/* ── Filtros (Topo) ── */}
      <div className="flex flex-col">
        {/* Pill Trigger */}
        <div
          className="bg-white border border-slate-200 rounded-full px-6 h-16 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-all select-none shadow-sm shadow-slate-100/50 relative z-10"
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
        >
          <div className="flex items-center gap-3">
            <FilterIcon className="w-5 h-5" style={{ color: theme.accent }} />
            <span className="font-bold text-slate-800 text-sm">Filtros</span>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-slate-800 shadow-sm ml-1"
              style={{ backgroundColor: theme.accent }}
            >
              PRO
            </span>
          </div>
          {isFiltersOpen ? (
            <ChevronDownIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <ChevronRightIcon className="w-5 h-5 text-slate-400" />
          )}
        </div>

        {/* Expanded Content (Animated via Grid Rows trick) */}
        <div
          className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ease-in-out ${isFiltersOpen ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
            }`}
        >
          <div className="overflow-hidden">
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">

              {/* Select Groups */}
              <div className="flex flex-col gap-5">
                <div className="space-y-2 relative">
                  <label className="font-bold text-slate-800 text-sm pl-1">Favoritos</label>
                  <div className="relative">
                    <select className="w-full bg-white border border-slate-200 rounded-full px-5 py-3.5 text-sm text-slate-700 outline-none focus:border-slate-300 appearance-none cursor-pointer hover:bg-slate-50 transition-colors">
                      <option value="all">Todas as questões</option>
                      <option value="favorites">Apenas favoritadas</option>
                      <option value="not_favorites">Apenas não favoritadas</option>
                    </select>
                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="font-bold text-slate-800 text-sm pl-1">Questões respondidas</label>
                  <div className="relative">
                    <select className="w-full bg-white border border-slate-200 rounded-full px-5 py-3.5 text-sm text-slate-700 outline-none focus:border-slate-300 appearance-none cursor-pointer hover:bg-slate-50 transition-colors">
                      <option value="all">Todas as questões</option>
                      <option value="wrong">Respondidas erradas</option>
                      <option value="correct">Respondidas corretas</option>
                    </select>
                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2 relative">
                  <label className="font-bold text-slate-800 text-sm pl-1">Dificuldade de questões</label>
                  <div className="relative">
                    <select className="w-full bg-white border border-slate-200 rounded-full px-5 py-3.5 text-sm text-slate-700 outline-none focus:border-slate-300 appearance-none cursor-pointer hover:bg-slate-50 transition-colors">
                      <option value="all">Todas as dificuldades</option>
                      <option value="easy">Fácil</option>
                      <option value="medium">Médio</option>
                      <option value="hard">Difícil</option>
                    </select>
                    <ChevronDownIcon className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              <hr className="border-slate-100" />

              {/* Rodapé do Painel */}
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between pl-1">
                  <span className="text-sm font-semibold text-slate-700">Salvar configurações de filtro</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={unansweredOnly}
                    onClick={() => setUnansweredOnly(!unansweredOnly)}
                    className="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                    style={{ backgroundColor: unansweredOnly ? theme.accent : '#e2e8f0' }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                      style={{ transform: unansweredOnly ? 'translateX(20px)' : 'translateX(0)' }}
                    />
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-full px-6 py-3.5 text-sm font-bold transition-colors focus:outline-none"
                    onClick={() => setIsFiltersOpen(false)}
                  >
                    <Trash2Icon className="w-4 h-4" />
                    Limpar Todos
                  </button>
                  <button
                    type="button"
                    className="flex-1 w-full flex items-center justify-center rounded-full px-8 py-3.5 text-white text-sm font-bold transition-opacity hover:opacity-90 focus:outline-none"
                    style={{ backgroundColor: theme.accent }}
                    onClick={() => setIsFiltersOpen(false)}
                  >
                    Aplicar Filtros
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* ── Seleção de Disciplinas ── */}
      <div>
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          Selecione as disciplinas
        </p>

        {/* Linha 1 (Destaques): 2 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <SubjectCard
            variant="pro"
            isSelected={isFocoSelected}
            onClick={toggleFoco}
            title="Foco Inteligente"
            description="Seleção automática baseada nos seus pontos fracos."
            badgeText="PRO"
            accent={theme.accent}
          />
          <SubjectCard
            isSelected={isAllSelected}
            onClick={toggleAll}
            title="Geral"
            description="Selecionar todas as especialidades e temas automaticamente."
            badgeText="TODAS AS QUESTÕES"
            accent={theme.accent}
          />
        </div>

        {/* Linha 2 (Disciplinas): 3 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Individual subjects */}
          {subjects.map((subject) => (
            <SubjectCard
              key={subject.id}
              isSelected={!isAllSelected && !isFocoSelected && selected.has(subject.id)}
              onClick={() => toggleSubject(subject.id)}
              title={subject.name}
              subcategories={subject.subcategories}
              accent={theme.accent}
            />
          ))}
        </div>
      </div>

      {/* ── Área do Rodapé (Progress + CTA) ── */}
      <div className="flex flex-col gap-6 pt-4">
        {/* Barra de Progresso do Plano */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 tracking-wide">PLANO FREE</span>
            <span className="text-xs font-bold tracking-wide" style={{ color: theme.accent }}>10/DIA</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: '70%', backgroundColor: theme.accent }}
            />
          </div>
        </div>

        {/* Mensagem de erro */}
        {errorMsg && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            <span className="shrink-0 mt-0.5">⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CTA — Gerar Teste */}
        <button
          type="button"
          onClick={handleGerarTeste}
          disabled={isGenerating}
          className="w-full h-16 rounded-2xl text-white font-bold text-xl flex items-center justify-center gap-3 transition-all duration-150 hover:opacity-90 active:scale-[0.98] focus:outline-none focus-visible:ring-4 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            backgroundColor: theme.accent,
            boxShadow: `0 8px 32px ${theme.accent}45`,
          }}
        >
          {isGenerating ? (
            <>
              <SpinIcon className="w-5 h-5 animate-spin" />
              Gerando...
            </>
          ) : (
            <>
              <RocketIcon className="w-6 h-6" />
              Gerar Teste
            </>
          )}
        </button>
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
  badgeText?: string;
  variant?: 'default' | 'pro';
  subcategories?: string[];
  accent: string;
}

function SubjectCard({
  isSelected,
  onClick,
  title,
  description,
  badgeText,
  variant = 'default',
  subcategories,
  accent,
}: SubjectCardProps) {
  const isPro = variant === 'pro';

  return (
    <div
      role="checkbox"
      aria-checked={isSelected}
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ' ? onClick() : null)}
      className="relative flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1"
      style={{
        borderColor: isSelected ? accent : isPro ? accent : '#e2e8f0',
        backgroundColor: isPro ? `${accent}0D` : '#ffffff',
        boxShadow: isSelected || isPro ? `0 2px 12px ${accent}18` : '0 1px 3px rgba(0,0,0,0.04)',
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
          {badgeText && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap shrink-0 leading-snug ${isPro ? 'text-white' : 'text-slate-400 bg-slate-100'
                }`}
              style={isPro ? { backgroundColor: accent } : {}}
            >
              {badgeText}
            </span>
          )}
        </div>

        {/* Description */}
        {description && (
          <p className="text-xs text-slate-500 mt-1 leading-snug">{description}</p>
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

function FilterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

function ChevronDownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function SpinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}

function Trash2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}
