'use client';

import { useState, useTransition } from 'react';
import dynamic from 'next/dynamic';
import { ConfidenceBadge } from './ConfidenceBadge';
import { SubjectField } from '../SubjectField';
import { MultiSelectField } from '../MultiSelectField';
import { saveImportedQuestion } from '../../_actions/importQuestion';
import type { EnrichedQuestion } from './types';
import type { Subject, DifficultyLevel } from '../types';

const RichTextEditor = dynamic(
  () => import('../RichTextEditor').then((m) => ({ default: m.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[100px] rounded-lg border border-slate-200 bg-slate-50 animate-pulse" />
    ),
  }
);

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

const DIFFICULTY_MAP: Record<string, DifficultyLevel> = {
  'fácil': 'easy', 'facil': 'easy', 'easy': 'easy',
  'médio': 'medium', 'medio': 'medium', 'medium': 'medium',
  'difícil': 'hard', 'dificil': 'hard', 'hard': 'hard',
};

interface Props {
  enriched: EnrichedQuestion;
  tenant: string;
  subjects: Subject[];
  operatorHint: string;
  onSuccess: (id: string) => void;
  onReset: () => void;
}

const inputClass =
  'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
  'placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 transition';

const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

export function ReviewStep({ enriched, tenant, subjects, operatorHint, onSuccess, onReset }: Props) {
  const { stage1, stage2 } = enriched;
  const [isPending, startTransition] = useTransition();

  // ── Form state (pre-filled from IA, all editable) ──
  const [enunciado, setEnunciado] = useState(stage1.enunciado ?? '');
  const [options, setOptions] = useState<string[]>(
    OPTION_LABELS.map((l) => stage1.alternativas?.find((a) => a.letra === l)?.texto ?? '')
  );
  const [correctOption, setCorrectOption] = useState(stage1.gabarito ?? 'A');
  const [subjectId, setSubjectId] = useState('');
  const [subcategories, setSubcategories] = useState<string[]>(
    stage2.assunto?.valor ? [stage2.assunto.valor] : []
  );
  const [examBoard, setExamBoard] = useState(stage2.banca?.valor ?? '');
  const [year, setYear] = useState(stage2.ano?.valor?.toString() ?? '');
  const [institution, setInstitution] = useState(stage2.orgao?.valor ?? '');
  const [examName, setExamName] = useState('');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    DIFFICULTY_MAP[stage2.dificuldade?.valor?.toLowerCase() ?? ''] ?? 'medium'
  );
  const [generalExplanation, setGeneralExplanation] = useState('');

  // ── Flashcard state — front/back usam RichTextEditor (HTML), hint permanece plain text ──
  const [flashcardFront, setFlashcardFront] = useState(() => {
    const raw = stage2.flashcard?.front ?? '';
    return raw ? `<p>${raw}</p>` : '';
  });
  const [flashcardBack, setFlashcardBack] = useState(() => {
    const raw = stage2.flashcard?.back ?? '';
    return raw ? `<p>${raw}</p>` : '';
  });
  const [flashcardHint, setFlashcardHint] = useState(stage2.flashcard?.hint ?? '');

  const [saveError, setSaveError] = useState<string | null>(null);

  // Campos marcados como needs_review (scroll automático para o primeiro)
  const reviewFields = [
    stage2.banca?.needs_review && 'banca',
    stage2.ano?.needs_review && 'ano',
    stage2.orgao?.needs_review && 'orgao',
    stage2.disciplina?.needs_review && 'disciplina',
    stage2.dificuldade?.needs_review && 'dificuldade',
  ].filter(Boolean) as string[];

  // Campos preenchidos pela IA (para rastreabilidade no banco)
  const aiFilledFields = [
    'enunciado', 'alternativas', 'gabarito',
    stage2.banca?.valor && 'exam_board',
    stage2.ano?.valor && 'year',
    stage2.orgao?.valor && 'institution',
    stage2.assunto?.valor && 'subcategories',
    stage2.dificuldade?.valor && 'difficulty',
    stage2.flashcard?.front && 'flashcard_front',
    stage2.flashcard?.back && 'flashcard_back',
    stage2.flashcard?.hint && 'flashcard_hint',
  ].filter(Boolean) as string[];

  const aiConfidence: Record<string, number> = {
    banca: stage2.banca?.confidence ?? 0,
    ano: stage2.ano?.confidence ?? 0,
    orgao: stage2.orgao?.confidence ?? 0,
    disciplina: stage2.disciplina?.confidence ?? 0,
    dificuldade: stage2.dificuldade?.confidence ?? 0,
    flashcard: stage2.flashcard?.confidence ?? 0,
  };

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const builtOptions = OPTION_LABELS
        .map((id, i) => ({ id, text: options[i]?.trim() ?? '' }))
        .filter((o) => o.text);

      const result = await saveImportedQuestion({
        vertical: tenant,
        subjectId,
        enunciado,
        options: builtOptions,
        correctOption,
        difficulty,
        generalExplanation: generalExplanation || undefined,
        subcategories,
        year: year ? parseInt(year, 10) : null,
        examBoard: examBoard || undefined,
        institution: institution || undefined,
        examName: examName || undefined,
        flashcardFront: flashcardFront || undefined,
        flashcardBack: flashcardBack || undefined,
        flashcardHint: flashcardHint || undefined,
        aiFilledFields,
        aiConfidence,
        operatorHint: operatorHint || undefined,
      });

      if (!result.ok) {
        setSaveError(result.error);
      } else {
        onSuccess(result.id);
      }
    });
  }

  const needsReviewCount = reviewFields.length;

  return (
    <div className="space-y-6">

      {/* ── Cabeçalho de revisão ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Revisão Humana</h3>
          <p className="text-sm text-slate-500 mt-0.5">
            A IA preencheu os campos abaixo. Revise, edite o que precisar e salve.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {needsReviewCount > 0 && (
            <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">
              ⚠ {needsReviewCount} campo{needsReviewCount > 1 ? 's' : ''} para verificar
            </span>
          )}
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors"
          >
            ← Reiniciar
          </button>
        </div>
      </div>

      {/* ── Qualidade da imagem ── */}
      {stage1.qualidade_imagem === 'ruim' && (
        <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-red-500 shrink-0">⚠</span>
          <p className="text-sm text-red-700">
            A qualidade da imagem foi classificada como <strong>ruim</strong> pelo modelo.
            Os dados extraídos podem conter erros — revise com atenção redobrada.
          </p>
        </div>
      )}

      {/* ── Seção 1: Enunciado ── */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Enunciado</h4>
          <AiBadge />
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className={labelClass}>Enunciado da Questão <span className="text-red-500">*</span></label>
            <textarea
              rows={6}
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Alternativas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`${labelClass} mb-0`}>Alternativas</label>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500">Correta:</label>
                <select
                  value={correctOption}
                  onChange={(e) => setCorrectOption(e.target.value)}
                  className="rounded-md border border-slate-200 px-2 py-1 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                >
                  {OPTION_LABELS.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>
            {OPTION_LABELS.map((label, i) => (
              <div
                key={label}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors ${
                  correctOption === label
                    ? 'border-emerald-300 bg-emerald-50/40'
                    : 'border-slate-200 bg-slate-50/30'
                }`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                  correctOption === label ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {label}
                </span>
                <input
                  type="text"
                  value={options[i]}
                  onChange={(e) => setOptions((prev) => { const n = [...prev]; n[i] = e.target.value; return n; })}
                  placeholder={`Alternativa ${label}...`}
                  className="flex-1 bg-transparent text-sm text-slate-800 focus:outline-none placeholder-slate-300"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Seção 2: Metadados (com confidence badges) ── */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Metadados</h4>
          <AiBadge />
          <span className="text-[10px] text-slate-400">Campos em amarelo/vermelho precisam de revisão</span>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

          {/* Disciplina */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className={`${labelClass} mb-0`}>Disciplina <span className="text-red-500">*</span></label>
              {stage2.disciplina && (
                <ConfidenceBadge confidence={stage2.disciplina.confidence} needsReview={stage2.disciplina.needs_review} />
              )}
            </div>
            {stage2.disciplina?.valor && (
              <p className="text-[11px] text-slate-400 mb-1.5">
                IA sugeriu: <strong>{stage2.disciplina.valor}</strong>
              </p>
            )}
            <SubjectField
              tenant={tenant}
              subjects={subjects}
              value={subjectId}
              onChange={setSubjectId}
            />
          </div>

          {/* Subcategoria / Assunto */}
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <label className={`${labelClass} mb-0`}>Assunto / Subcategoria</label>
              {stage2.assunto && (
                <ConfidenceBadge confidence={stage2.assunto.confidence} needsReview={stage2.assunto.needs_review} />
              )}
            </div>
            <MultiSelectField
              tenant={tenant}
              field="subcategory"
              label=""
              values={subcategories}
              onChange={setSubcategories}
              placeholder="Assuntos..."
            />
          </div>

          {/* Banca */}
          <FieldWithBadge
            label="Banca"
            confidence={stage2.banca?.confidence}
            needsReview={stage2.banca?.needs_review}
          >
            <input type="text" value={examBoard} onChange={(e) => setExamBoard(e.target.value)}
              placeholder="Ex: FGV, Revalida..." className={inputClass} />
          </FieldWithBadge>

          {/* Ano */}
          <FieldWithBadge
            label="Ano"
            confidence={stage2.ano?.confidence}
            needsReview={stage2.ano?.needs_review}
          >
            <input type="number" value={year} onChange={(e) => setYear(e.target.value)}
              placeholder="Ex: 2024" className={inputClass} />
          </FieldWithBadge>

          {/* Órgão */}
          <FieldWithBadge
            label="Órgão / Instituição"
            confidence={stage2.orgao?.confidence}
            needsReview={stage2.orgao?.needs_review}
          >
            <input type="text" value={institution} onChange={(e) => setInstitution(e.target.value)}
              placeholder="Ex: CFM, HCFMUSP..." className={inputClass} />
          </FieldWithBadge>

          {/* Prova */}
          <div>
            <label className={labelClass}>Nome da Prova</label>
            <input type="text" value={examName} onChange={(e) => setExamName(e.target.value)}
              placeholder="Ex: Residência Clínica 2024" className={inputClass} />
          </div>

          {/* Dificuldade */}
          <FieldWithBadge
            label="Dificuldade"
            confidence={stage2.dificuldade?.confidence}
            needsReview={stage2.dificuldade?.needs_review}
          >
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className={inputClass}>
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </FieldWithBadge>

        </div>
      </section>

      {/* ── Seção 3: Flashcard pré-gerado ── */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Flashcard Gerado</h4>
          <AiBadge />
          {stage2.flashcard?.confidence && (
            <ConfidenceBadge confidence={stage2.flashcard.confidence} />
          )}
          <span className="text-[10px] text-slate-400 ml-auto">
            Alunos verão este flashcard após errar a questão — custo de IA: zero
          </span>
        </div>
        <div className="p-5 space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Frente — TipTap (injetado pela IA via setContent) */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[9px] font-bold shrink-0">F</span>
                <label className="text-sm font-semibold text-slate-800">
                  Frente <span className="text-xs text-slate-400 font-normal">(pergunta de memorização)</span>
                </label>
              </div>
              <RichTextEditor
                tenant={tenant}
                value={flashcardFront}
                onChange={setFlashcardFront}
                placeholder="Pergunta concisa que testa o conceito central..."
                minHeight={100}
              />
            </div>

            {/* Verso — TipTap (injetado pela IA via setContent) */}
            <div className="bg-slate-50/60 border border-slate-200 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shrink-0">V</span>
                <label className="text-sm font-semibold text-slate-800">
                  Verso <span className="text-xs text-slate-400 font-normal">(resposta memorável)</span>
                </label>
              </div>
              <RichTextEditor
                tenant={tenant}
                value={flashcardBack}
                onChange={setFlashcardBack}
                placeholder="Resposta direta e memorável — destaque termos-chave em negrito..."
                minHeight={100}
              />
            </div>
          </div>

          {/* Dica — plain text (mnemônico curto, rich text desnecessário) */}
          <div>
            <label className={labelClass}>Dica <span className="text-xs text-slate-400">(mnemônico — opcional)</span></label>
            <input
              type="text"
              value={flashcardHint}
              onChange={(e) => setFlashcardHint(e.target.value)}
              placeholder="Mnemônico ou associação visual para memorizar..."
              className={inputClass}
            />
          </div>
        </div>
      </section>

      {/* ── Seção 4: Explicação Geral (manual) ── */}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60">
          <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
            Explicação Geral
            <span className="ml-2 text-slate-400 font-normal normal-case tracking-normal">opcional — preenchimento manual</span>
          </h4>
        </div>
        <div className="p-5">
          <textarea
            rows={4}
            value={generalExplanation}
            onChange={(e) => setGeneralExplanation(e.target.value)}
            placeholder="Contexto teórico adicional, resolução passo a passo, referências..."
            className={`${inputClass} resize-y`}
          />
        </div>
      </section>

      {/* ── Erro de save ── */}
      {saveError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {saveError}
        </div>
      )}

      {/* ── Ações ── */}
      <div className="flex items-center justify-between pb-4">
        <button
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-slate-700 transition-colors"
        >
          ← Cancelar e reiniciar
        </button>
        <button
          onClick={handleSave}
          disabled={isPending}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              Salvando...
            </>
          ) : (
            <>
              <CheckIcon className="w-4 h-4 shrink-0" />
              Salvar Questão Inteligente
            </>
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Helpers de UI ── */

function AiBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-1.5 py-0.5 rounded">
      ✦ IA
    </span>
  );
}

function FieldWithBadge({
  label,
  confidence,
  needsReview,
  children,
}: {
  label: string;
  confidence?: number;
  needsReview?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        {confidence !== undefined && (
          <ConfidenceBadge confidence={confidence} needsReview={needsReview} />
        )}
      </div>
      {children}
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
