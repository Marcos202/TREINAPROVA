'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { cleanupReplacedImages } from '../_actions/cleanupReplacedImages';
import { SmartField } from './SmartField';
import { SubjectField } from './SubjectField';
import { MultiSelectField } from './MultiSelectField';
import { RichTextEditor } from './RichTextEditor';
import type { Subject, QuestionRow, QuestionOption, DifficultyLevel } from './types';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E'] as const;

interface OptionState {
  text: string;
  comment: string;
}

interface Props {
  tenant: string;
  subjects: Subject[];
  initialData?: QuestionRow;
  onSuccess?: () => void;
  onCancel?: () => void;
}

function parseSubcategories(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return [raw];
}

/** Resolve subcategories priorizando JSONB (00005) sobre VARCHAR legado (00004). */
function resolveInitialSubcategories(data?: QuestionRow): string[] {
  // JSONB array (coluna canônica pós-migration 00005)
  if (Array.isArray(data?.subcategories) && data.subcategories.length > 0) {
    return data.subcategories;
  }
  // Fallback: VARCHAR legado que pode conter JSON string
  return parseSubcategories(data?.subcategory ?? null);
}

function buildOptionStates(options: QuestionOption[]): OptionState[] {
  const base = OPTION_LABELS.map((_, i) => ({
    text: options[i]?.text ?? '',
    comment: options[i]?.comment ?? '',
  }));
  return base;
}

const emptyOptions = (): OptionState[] =>
  OPTION_LABELS.map(() => ({ text: '', comment: '' }));

export function QuestionForm({ tenant, subjects, initialData, onSuccess, onCancel }: Props) {
  const supabase = createClient();
  const isEditing = !!initialData?.id;

  const [text, setText] = useState(initialData?.text ?? '');
  const [subjectId, setSubjectId] = useState(initialData?.subject_id ?? '');
  const [subcategories, setSubcategories] = useState<string[]>(
    resolveInitialSubcategories(initialData)
  );
  const [year, setYear] = useState(initialData?.year?.toString() ?? '');
  const [examBoard, setExamBoard] = useState(initialData?.exam_board ?? '');
  const [institution, setInstitution] = useState(initialData?.institution ?? '');
  const [examName, setExamName] = useState(initialData?.exam_name ?? '');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(
    initialData?.difficulty ?? 'medium'
  );
  const [options, setOptions] = useState<OptionState[]>(
    initialData?.options ? buildOptionStates(initialData.options) : emptyOptions()
  );
  const [correctOption, setCorrectOption] = useState(initialData?.correct_option ?? 'A');
  const [generalExplanation, setGeneralExplanation] = useState(
    initialData?.general_explanation ?? ''
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function updateOption(index: number, field: keyof OptionState, value: string) {
    setOptions((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!text || text === '<p></p>') return setError('O enunciado é obrigatório.');
    if (!subjectId) return setError('Selecione uma disciplina.');
    const filledOptions = options.filter((o) => o.text.trim());
    if (filledOptions.length < 2) return setError('Preencha ao menos 2 alternativas.');

    const builtOptions: QuestionOption[] = OPTION_LABELS.map((id, i) => ({
      id,
      text: options[i].text.trim(),
      comment: options[i].comment.trim() || undefined,
    })).filter((o) => o.text);

    const payload = {
      tenant_id: tenant,
      subject_id: subjectId,
      text: text,
      options: builtOptions,
      correct_option: correctOption,
      difficulty,
      general_explanation: generalExplanation || null,
      // Coluna canônica JSONB (migration 00005)
      subcategories: subcategories,
      // Limpar coluna legada VARCHAR ao editar (migration 00004 → deprecated)
      subcategory: null,
      year: year ? parseInt(year, 10) : null,
      exam_board: examBoard.trim() || null,
      institution: institution.trim() || null,
      exam_name: examName.trim() || null,
    };

    setSaving(true);

    let dbError: { message: string } | null = null;

    if (isEditing) {
      // Limpar imagens removidas do R2 (fire-and-forget — não bloqueia o save)
      cleanupReplacedImages(
        initialData!.text ?? '',
        initialData!.general_explanation ?? '',
        text,
        generalExplanation
      ).catch((e) => console.warn('[QuestionForm] R2 image cleanup skipped:', e));

      // .select('id') força retorno dos IDs afetados.
      // Se RLS bloquear silenciosamente, data será [] e podemos detectar.
      const { data: updated, error: err } = await supabase
        .from('questions')
        .update(payload)
        .eq('id', initialData!.id)
        .select('id');

      if (err) {
        dbError = err;
      } else if (!updated || updated.length === 0) {
        // RLS bloqueou sem retornar erro — falha silenciosa detectada
        dbError = {
          message:
            'Sem permissão para editar esta questão. ' +
            'Certifique-se de que sua conta tem permissão de administrador (is_admin = true).',
        };
      }
    } else {
      const { error: err } = await supabase.from('questions').insert(payload);
      if (err) dbError = err;
    }

    setSaving(false);

    if (dbError) {
      setError(dbError.message);
      return;
    }

    setSuccess(true);

    if (!isEditing) {
      // Reset only on create — on edit the manager will unmount this form
      setText('');
      setSubjectId('');
      setSubcategories([]);
      setYear('');
      setExamBoard('');
      setInstitution('');
      setExamName('');
      setDifficulty('medium');
      setOptions(emptyOptions());
      setCorrectOption('A');
      setGeneralExplanation('');

    }

    onSuccess?.();
  }

  const inputClass =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
    'placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ' +
    'focus:ring-slate-900 focus:border-transparent';

  const labelClass = 'block text-sm font-medium text-slate-700 mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ── Section 1: Enunciado ── */}
      <section className="bg-white border border-slate-200 shadow-sm p-6 rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
          Enunciado
        </h3>
        <div>
          <label className={labelClass}>
            Enunciado <span className="text-red-500">*</span>
          </label>
          <RichTextEditor
            tenant={tenant}
            value={text}
            onChange={setText}
            placeholder="Digite o enunciado completo. Use a barra de ferramentas para formatar o texto ou inserir imagens..."
            minHeight={220}
          />
        </div>
      </section>

      {/* ── Section 2: Metadados ── */}
      <section className="bg-white border border-slate-200 shadow-sm p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Metadados
          </h3>
          <p className="text-xs text-slate-400">
            Campos com dropdown permitem salvar valores para reutilização
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <SubjectField
            tenant={tenant}
            subjects={subjects}
            value={subjectId}
            onChange={setSubjectId}
          />

          <MultiSelectField
            tenant={tenant}
            field="subcategory"
            label="Subcategoria"
            values={subcategories}
            onChange={setSubcategories}
            placeholder="Buscar ou adicionar subcategorias..."
          />

          <SmartField
            tenant={tenant}
            field="year"
            label="Ano"
            value={year}
            onChange={setYear}
            placeholder="Ex: 2024"
          />

          <SmartField
            tenant={tenant}
            field="exam_board"
            label="Banca"
            value={examBoard}
            onChange={setExamBoard}
            placeholder="Ex: VUNESP, FUVEST, Revalida"
          />

          <SmartField
            tenant={tenant}
            field="institution"
            label="Órgão / Instituição"
            value={institution}
            onChange={setInstitution}
            placeholder="Ex: USP, CFM, MEC"
          />

          <SmartField
            tenant={tenant}
            field="exam_name"
            label="Prova"
            value={examName}
            onChange={setExamName}
            placeholder="Ex: Residência Clínica 2024"
          />

          <div>
            <label className={labelClass}>
              Dificuldade <span className="text-red-500">*</span>
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
              className={inputClass}
            >
              <option value="easy">Fácil</option>
              <option value="medium">Média</option>
              <option value="hard">Difícil</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Section 3: Alternativas ── */}
      <section className="bg-white border border-slate-200 shadow-sm p-6 rounded-lg space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
            Alternativas
          </h3>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700">Correta:</label>
            <select
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value)}
              className="rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
            >
              {OPTION_LABELS.map((label) => (
                <option key={label} value={label}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-4">
          {OPTION_LABELS.map((label, i) => (
            <div
              key={label}
              className={`rounded-md border p-4 transition-colors ${
                correctOption === label
                  ? 'border-emerald-300 bg-emerald-50/40'
                  : 'border-slate-200 bg-slate-50/30'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0 ${
                    correctOption === label
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {label}
                </span>
                <span className="text-sm font-medium text-slate-700">
                  Alternativa {label}
                  {correctOption === label && (
                    <span className="ml-2 text-xs text-emerald-600 font-normal">✓ correta</span>
                  )}
                </span>
              </div>

              <div className="space-y-3 ml-10">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Texto da alternativa
                  </label>
                  <input
                    type="text"
                    value={options[i].text}
                    onChange={(e) => updateOption(i, 'text', e.target.value)}
                    placeholder={`Digite o texto da alternativa ${label}...`}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">
                    Comentário desta alternativa
                    <span className="ml-1 text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <textarea
                    value={options[i].comment}
                    onChange={(e) => updateOption(i, 'comment', e.target.value)}
                    rows={2}
                    placeholder="Explique por que esta alternativa está certa ou errada..."
                    className={`${inputClass} resize-none`}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Resposta Completa ── */}
      <section className="bg-white border border-slate-200 shadow-sm p-6 rounded-lg space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
          Resposta Completa
        </h3>
        <div>
          <label className={labelClass}>Explicação Geral da Questão</label>
          <RichTextEditor
            tenant={tenant}
            value={generalExplanation}
            onChange={setGeneralExplanation}
            placeholder="Escreva a explicação completa, contexto teórico e comentários gerais sobre a questão..."
            minHeight={180}
          />
        </div>
      </section>

      {/* ── Feedback ── */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-700 font-medium">
          {isEditing ? 'Questão atualizada com sucesso!' : 'Questão cadastrada com sucesso!'}
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex items-center justify-between pb-8">
        <div>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-sm text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              ← Cancelar e voltar
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setText('');
                setSubjectId('');
                setSubcategories([]);
                setYear('');
                setExamBoard('');
                setInstitution('');
                setExamName('');
                setDifficulty('medium');
                setOptions(emptyOptions());
                setCorrectOption('A');
                setGeneralExplanation('');
          
                setError(null);
                setSuccess(false);
              }}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
            >
              Limpar
            </button>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving
              ? isEditing ? 'Salvando...' : 'Salvando...'
              : isEditing ? 'Salvar Alterações' : 'Salvar Questão'}
          </button>
        </div>
      </div>
    </form>
  );
}
