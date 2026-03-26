'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface QuestionOption { id: string; text: string; comment?: string }

interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
  correct_option: string;
  difficulty: string;
  general_explanation: string | null;
  subjects?: { name: string } | null;
  // Extended fields (fetched in page.tsx)
  year?: number | null;
  exam_board_id?: string | null;
  institution_id?: string | null;
  exam_boards?: { name: string } | null;
  institutions?: { name: string } | null;
  subcategories?: string[];
}

interface Props {
  tenant: string;
  theme: { accent: string; accentLight: string; [key: string]: string };
  sessionId: string;
  userId: string;
  questions: Question[];
  initialIndex: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const TAG_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];
const DIFF_LABELS: Record<string, string> = { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' };
const DIFF_CLS: Record<string, string> = {
  easy: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-amber-100 text-amber-700',
  hard: 'bg-red-100 text-red-700',
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

export function QuestionEngineUI({ tenant, theme, sessionId, userId, questions, initialIndex }: Props) {
  const supabase = createClient();
  const total = questions.length;
  const { accent, accentLight } = theme;

  // State
  const [idx, setIdx] = useState(Math.min(initialIndex, total - 1));
  const [selected, setSelected] = useState<string | null>(null);
  const [validated, setValidated] = useState(false);
  const [fontSize, setFontSize] = useState(15);
  const [isFav, setIsFav] = useState(false);
  const [secs, setSecs] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answeredMap, setAnsweredMap] = useState<Map<string, 'correct' | 'wrong'>>(new Map());

  const question = questions[idx];
  const isCorrect = validated && selected === question.correct_option;

  // Timer — reseta por questão
  useEffect(() => {
    setSecs(0);
    const t = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [idx]);

  const fmt = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Navegação
  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      supabase.from('question_sessions').update({ current_index: next }).eq('id', sessionId).then(() => {});
      setIdx(next);
      setSelected(null);
      setValidated(false);
    },
    [sessionId, total, supabase]
  );

  // Responder
  const handleResponder = async () => {
    if (!selected || validated || saving) return;
    setSaving(true);
    const correct = selected === question.correct_option;
    try {
      await supabase.from('user_question_history').upsert(
        { user_id: userId, question_id: question.id, tenant_id: tenant, is_correct: correct, time_spent_ms: secs * 1000, answered_at: new Date().toISOString() },
        { onConflict: 'user_id,question_id' }
      );
      setAnsweredMap((prev) => new Map(prev).set(question.id, correct ? 'correct' : 'wrong'));
    } finally {
      setSaving(false);
      setValidated(true);
    }
  };

  // Estado visual da opção
  const optState = (optId: string): 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed' => {
    if (!validated) return selected === optId ? 'selected' : 'idle';
    if (optId === question.correct_option) return 'correct';
    if (optId === selected) return 'wrong';
    return 'dimmed';
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    // Cancela o padding do layout pai e ocupa toda a altura disponível
    <div
      className="-mx-4 sm:-mx-6 lg:-mx-8 -my-5 lg:-my-6 overflow-hidden bg-[#F4F7FE] lg:grid lg:grid-cols-12"
      style={{ height: 'calc(100vh - 68px)' }}
    >

      {/* ═══════════════════════════════════════
          COLUNA ESQUERDA — Questão (col-span-9)
      ═══════════════════════════════════════ */}
      <div className="lg:col-span-9 flex flex-col min-w-0 overflow-hidden">

        {/* Toolbar — floating card */}
        <div className="flex-shrink-0 px-4 sm:px-5 pt-3 pb-2">
          <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm px-4 h-[46px] flex items-center justify-between gap-3">
            {/* Timer */}
            <div className="flex items-center gap-1.5 bg-slate-50 rounded-full px-3 py-1 border border-slate-200 shrink-0">
              <ClockIcon className="w-3.5 h-3.5 shrink-0" style={{ color: accent }} />
              <span className="text-xs font-mono font-bold text-slate-700 tabular-nums">{fmt(secs)}</span>
            </div>

            {/* Marca Texto */}
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors">
              <HighlightIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Marca Texto</span>
            </button>

            {/* Right tools */}
            <div className="flex items-center gap-0.5 ml-auto">
              <ToolBtn title="Imprimir"><PrintIcon className="w-3.5 h-3.5" /></ToolBtn>
              <ToolBtn title="Informações"><InfoIcon className="w-3.5 h-3.5" /></ToolBtn>
              <ToolBtn title="Aumentar fonte" onClick={() => setFontSize((s) => Math.min(s + 1, 20))}>
                <span className="text-[11px] font-bold">A<sup className="text-[7px]">+</sup></span>
              </ToolBtn>
              <ToolBtn title="Diminuir fonte" onClick={() => setFontSize((s) => Math.max(s - 1, 12))}>
                <span className="text-[11px] font-bold">A<sup className="text-[7px]">-</sup></span>
              </ToolBtn>
              <ToolBtn
                title="Favoritar"
                onClick={() => setIsFav((f) => !f)}
                className={isFav ? 'text-red-500 bg-red-50 hover:bg-red-100' : ''}
              >
                <HeartIcon className="w-3.5 h-3.5" filled={isFav} />
              </ToolBtn>
              <ToolBtn title="Compartilhar"><ShareIcon className="w-3.5 h-3.5" /></ToolBtn>
              <ToolBtn title="Expandir"><ExpandIcon className="w-3.5 h-3.5" /></ToolBtn>
            </div>
          </div>
        </div>

        {/* Scrollable question area */}
        <div className="flex-1 overflow-y-auto">
          <div className="py-6 px-4 sm:px-5 lg:px-6">

            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 mb-4 text-[11px]">
              <Link
                href={`/${tenant}/questoes`}
                className="flex items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <ArrowLeftIcon className="w-3 h-3" />
                Banco de Questões
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500">Treino</span>
              {question.subjects?.name && (
                <>
                  <span className="text-slate-300">/</span>
                  <span className="text-slate-400">{question.subjects.name}</span>
                </>
              )}
            </div>

            {/* ─── Question Card ─── */}
            <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">

              {/* Card header */}
              <div className="flex items-center gap-3 px-6 pt-5 pb-3">
                <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
                  Questão {idx + 1} de {total}
                </span>
                {question.difficulty && (
                  <span className={`ml-auto text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${DIFF_CLS[question.difficulty] ?? 'bg-slate-100 text-slate-600'}`}>
                    {DIFF_LABELS[question.difficulty] ?? question.difficulty}
                  </span>
                )}
              </div>

              <div className="mx-6 border-t border-slate-100" />

              {/* Question text */}
              <div
                className="px-6 py-5 text-slate-800 leading-[1.75] select-text
                  [&_p]:mb-3 [&_p:last-child]:mb-0
                  [&_strong]:font-semibold [&_em]:italic
                  [&_img]:rounded-xl [&_img]:max-w-full [&_img]:my-3 [&_img]:border [&_img]:border-slate-200
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-2
                  [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-slate-200 [&_td]:p-2 [&_td]:text-sm"
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: question.text }}
              />

              {/* ─── Options ─── */}
              <div className="px-3 pb-3 space-y-0.5">
                {(question.options as QuestionOption[]).map((opt, i) => {
                  const state = optState(opt.id);
                  return (
                    <button
                      key={opt.id}
                      onClick={() => !validated && setSelected(opt.id)}
                      disabled={validated}
                      className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl text-left
                        transition-all duration-100 group
                        ${state === 'idle'
                          ? 'hover:bg-slate-50/80'
                          : state === 'correct'
                          ? 'bg-emerald-50'
                          : state === 'wrong'
                          ? 'bg-red-50'
                          : state === 'dimmed'
                          ? 'opacity-40'
                          : ''}`}
                      style={state === 'selected' ? { backgroundColor: accentLight } : {}}
                    >
                      {/* Radio indicator */}
                      <div
                        className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center
                          shrink-0 mt-[2px] transition-all duration-100
                          ${state === 'idle'
                            ? 'border-slate-300 group-hover:border-slate-400 bg-white'
                            : state === 'correct'
                            ? 'border-emerald-500 bg-emerald-500'
                            : state === 'wrong'
                            ? 'border-red-400 bg-red-400'
                            : state === 'dimmed'
                            ? 'border-slate-200 bg-slate-50'
                            : 'border-transparent'}`}
                        style={state === 'selected' ? { backgroundColor: accent, borderColor: accent } : {}}
                      >
                        {state === 'selected' && <div className="w-2 h-2 rounded-full bg-white" />}
                        {state === 'correct' && <MiniCheckIcon />}
                        {state === 'wrong' && <MiniXIcon />}
                      </div>

                      {/* Text */}
                      <span
                        className={`leading-[1.65] flex-1 text-left
                          ${state === 'dimmed'
                            ? 'text-slate-400'
                            : state === 'correct'
                            ? 'text-emerald-800'
                            : state === 'wrong'
                            ? 'text-red-700'
                            : 'text-slate-700'}`}
                        style={{ fontSize: `${Math.max(fontSize - 1, 13)}px` }}
                      >
                        <span className="font-semibold text-slate-400 mr-1.5">{LETTERS[i]}.</span>
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ─── Explanation ─── */}
              {validated && (
                <div className={`mx-4 mb-4 mt-1 rounded-xl p-4 border
                  ${isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0
                      ${isCorrect ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    >
                      {isCorrect ? <MiniCheckIcon /> : <InfoTinyIcon />}
                    </div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider
                      ${isCorrect ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {isCorrect ? 'Resposta Correta!' : `Resposta incorreta — a correta é a alternativa ${
                        LETTERS[(question.options as QuestionOption[]).findIndex(o => o.id === question.correct_option)] ?? '?'
                      }`}
                    </span>
                  </div>
                  {question.general_explanation ? (
                    <div
                      className={`text-[13px] leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_img]:rounded-lg [&_img]:max-w-full
                        ${isCorrect ? 'text-emerald-900' : 'text-amber-900'}`}
                      dangerouslySetInnerHTML={{ __html: question.general_explanation }}
                    />
                  ) : null}
                </div>
              )}

              {/* ─── Card Footer ─── */}
              <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
                {/* Left: secondary actions */}
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors">
                    <NotesIcon className="w-3.5 h-3.5" />
                    Notas
                  </button>
                  <button className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:bg-slate-100 border border-slate-200 transition-colors">
                    <FlashcardIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Criar flashcards</span>
                    <ChevronSmallIcon className="w-3 h-3" />
                  </button>
                </div>

                {/* Right: primary CTA */}
                {!validated ? (
                  <button
                    onClick={handleResponder}
                    disabled={!selected || saving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all
                      disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    {saving && <SpinIcon className="w-3.5 h-3.5 animate-spin" />}
                    Responder
                  </button>
                ) : idx < total - 1 ? (
                  <button
                    onClick={() => goTo(idx + 1)}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98] shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    Próxima →
                  </button>
                ) : (
                  <Link
                    href={`/${tenant}/questoes`}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shrink-0"
                    style={{ backgroundColor: accent }}
                  >
                    Concluir ✓
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════
          COLUNA DIREITA — Sidebar (col-span-3)
      ═══════════════════════════════════════ */}
      <div className="hidden lg:block lg:col-span-3 overflow-y-auto bg-[#F4F7FE]">
        <div className="p-4 space-y-3">

          {/* ── Card: Navegação de Questões ── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[13px] font-bold text-slate-900">Questões</h3>
              <span className="text-[11px] text-slate-400 tabular-nums">{answeredMap.size}/{total} respondidas</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {questions.map((q, i) => {
                const ans = answeredMap.get(q.id);
                const isCur = i === idx;
                return (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    title={`Questão ${i + 1}`}
                    className={`w-full aspect-square rounded-xl text-xs font-bold flex items-center justify-center transition-all
                      ${isCur
                        ? 'text-white shadow-sm'
                        : ans === 'correct'
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        : ans === 'wrong'
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200'}`}
                    style={isCur ? { backgroundColor: accent } : {}}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-4 text-[10px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-emerald-300 border border-emerald-200" />
                Acerto
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-red-300 border border-red-200" />
                Erro
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-sm bg-slate-200 border border-slate-300" />
                Pendente
              </div>
            </div>
          </div>

          {/* ── Card: Dicas ── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
              Dicas da Questão
            </p>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`w-8 h-8 rounded-full text-[11px] font-bold flex items-center justify-center transition-all
                    ${n === 1 ? 'text-white shadow-sm' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                  style={n === 1 ? { backgroundColor: accent } : {}}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* ── Card: Tags ── */}
          {question.subcategories && question.subcategories.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                Tags da Questão
              </p>
              <ul className="space-y-2">
                {question.subcategories.slice(0, 5).map((tag, i) => (
                  <li key={tag} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: TAG_COLORS[i % TAG_COLORS.length] }}
                    />
                    <span className="text-xs text-slate-700 leading-tight">{tag}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* ── Card: Informações ── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <h3 className="text-[13px] font-bold text-slate-900 mb-3">Informações</h3>
            {(!question.exam_boards?.name && !question.institutions?.name && !question.year) ? (
              <p className="text-[11px] text-slate-400">Sem informações cadastradas.</p>
            ) : (
              <dl className="space-y-3">
                {question.exam_boards?.name && (
                  <div>
                    <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Banca</dt>
                    <dd className="text-[12px] font-semibold text-slate-800 mt-0.5">{question.exam_boards.name}</dd>
                  </div>
                )}
                {question.institutions?.name && (
                  <div>
                    <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Instituição</dt>
                    <dd className="text-[12px] font-semibold text-slate-800 mt-0.5">{question.institutions.name}</dd>
                  </div>
                )}
                {question.year && (
                  <div>
                    <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Ano</dt>
                    <dd className="text-[12px] font-semibold text-slate-800 mt-0.5">{question.year}</dd>
                  </div>
                )}
                {question.difficulty && (
                  <div>
                    <dt className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Dificuldade</dt>
                    <dd className={`text-[12px] font-semibold mt-0.5
                      ${question.difficulty === 'easy' ? 'text-emerald-600' :
                        question.difficulty === 'medium' ? 'text-amber-600' : 'text-red-600'}`}
                    >
                      {DIFF_LABELS[question.difficulty] ?? question.difficulty}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>

          {/* ── Card: Finalizar Prova ── */}
          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[13px] font-bold text-slate-900">Finalizar Prova</h3>
              <span className="text-[11px] text-slate-400 tabular-nums">{answeredMap.size}/{total}</span>
            </div>
            {/* Barra de progresso */}
            <div className="w-full h-1.5 bg-slate-100 rounded-full mb-4 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${total > 0 ? (answeredMap.size / total) * 100 : 0}%`, backgroundColor: accent }}
              />
            </div>
            <Link
              href={`/${tenant}/questoes`}
              className="flex items-center justify-center w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 active:scale-[0.98]"
              style={{ backgroundColor: accent }}
            >
              Finalizar Prova
            </Link>
          </div>

          {/* Espaçamento final */}
          <div className="h-2" />
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper Components
// ─────────────────────────────────────────────────────────────────────────────

function ToolBtn({
  children,
  title,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  title?: string;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-slate-400
        hover:bg-slate-100 hover:text-slate-700 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline SVG Icons
// ─────────────────────────────────────────────────────────────────────────────

function ClockIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>;
}
function HighlightIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></svg>;
}
function PrintIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>;
}
function InfoIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>;
}
function HeartIcon({ filled, ...p }: React.SVGProps<SVGSVGElement> & { filled?: boolean }) {
  return <svg {...p} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>;
}
function ShareIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /><line x1="15.41" x2="8.59" y1="6.51" y2="10.49" /></svg>;
}
function ExpandIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6" /><path d="M9 21H3v-6" /><path d="M21 3l-7 7" /><path d="M3 21l7-7" /></svg>;
}
function ArrowLeftIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>;
}
function MiniCheckIcon(p: React.SVGProps<SVGSVGElement> = {}) {
  return <svg {...p} className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 5 9 10 3" /></svg>;
}
function MiniXIcon(p: React.SVGProps<SVGSVGElement> = {}) {
  return <svg {...p} className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><line x1="9" x2="3" y1="3" y2="9" /><line x1="3" x2="9" y1="3" y2="9" /></svg>;
}
function InfoTinyIcon(p: React.SVGProps<SVGSVGElement> = {}) {
  return <svg {...p} className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="5" /><path d="M6 8V6" /><path d="M6 4h.01" /></svg>;
}
function NotesIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>;
}
function FlashcardIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>;
}
function ChevronSmallIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
}
function SpinIcon(p: React.SVGProps<SVGSVGElement>) {
  return <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>;
}
