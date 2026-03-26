'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { deleteQuestion } from '../_actions/deleteQuestion';
import type { Subject, QuestionRow, DifficultyLevel } from './types';

const PAGE_SIZE = 20;

const DIFFICULTY: Record<DifficultyLevel, { label: string; cls: string }> = {
  easy: { label: 'Fácil', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: 'Média', cls: 'bg-amber-50   text-amber-700   border-amber-200' },
  hard: { label: 'Difícil', cls: 'bg-red-50     text-red-700     border-red-200' },
};

function parseSubcategories(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const p = JSON.parse(raw);
    if (Array.isArray(p)) return p;
  } catch { /* ignore */ }
  return [raw];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

/** Remove tags HTML para exibição em texto plano na listagem. */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(str: string, max = 110) {
  const plain = stripHtml(str);
  return plain.length > max ? plain.slice(0, max) + '...' : plain;
}

interface Props {
  tenant: string;
  subjects: Subject[];
  refreshKey: number;
  onNew: () => void;
  onEdit: (q: QuestionRow) => void;
}

export function QuestionList({ tenant, subjects, refreshKey, onNew, onEdit }: Props) {
  const supabase = createClient();

  /* ── Data state ── */
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ── Filter state ── */
  const [searchRaw, setSearchRaw] = useState('');
  const [searchDeb, setSearchDeb] = useState('');
  const [fSubject, setFSubject] = useState('');
  const [fDifficulty, setFDifficulty] = useState('');
  const [fYear, setFYear] = useState('');
  const [fBanca, setFBanca] = useState('');
  const [fSubcategory, setFSubcategory] = useState('');

  /* ── Pagination ── */
  const [page, setPage] = useState(0);

  /* ── Delete ── */
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const hasFilters = !!(searchRaw || fSubject || fDifficulty || fYear || fBanca || fSubcategory);

  /* ── Debounce search ── */
  useEffect(() => {
    const t = setTimeout(() => setSearchDeb(searchRaw), 350);
    return () => clearTimeout(t);
  }, [searchRaw]);

  /* ── Reset page when filters change ── */
  useEffect(() => {
    setPage(0);
  }, [searchDeb, fSubject, fDifficulty, fYear, fBanca, fSubcategory, refreshKey]);

  /* ── Fetch ── */
  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    let q = supabase
      .from('questions')
      .select('*, subjects(name), exam_boards(name), institutions(name)', { count: 'exact' })
      .eq('tenant_id', tenant)
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (searchDeb) q = q.ilike('text', `%${searchDeb}%`);
    if (fSubject) q = q.eq('subject_id', fSubject);
    if (fDifficulty) q = q.eq('difficulty', fDifficulty);
    if (fYear) q = q.eq('year', parseInt(fYear, 10));
    if (fBanca) q = q.ilike('exam_boards.name' as any, `%${fBanca}%`);
    // Filtra na coluna JSONB `subcategories` (migration 00005).
    // cs = "contains" em PostgREST: verifica se o array contém o elemento exato.
    if (fSubcategory) q = q.contains('subcategories', [fSubcategory]);

    const { data, count, error: err } = await q;

    if (err) {
      setError(err.message);
    } else {
      setQuestions((data ?? []) as unknown as QuestionRow[]);
      setTotal(count ?? 0);
    }
    setLoading(false);
  }, [tenant, page, searchDeb, fSubject, fDifficulty, fYear, fBanca, fSubcategory, refreshKey]); // eslint-disable-line

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  /* ── Delete handlers ── */
  async function confirmDelete(id: string) {
    setDeleteLoading(true);
    try {
      // Server Action: verifica admin, limpa R2, deleta do Supabase
      await deleteQuestion(id);
      // Optimistic removal
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setTotal((t) => t - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir questão.');
    } finally {
      setDeleteLoading(false);
      setDeletingId(null);
    }
  }

  function clearFilters() {
    setSearchRaw('');
    setFSubject('');
    setFDifficulty('');
    setFYear('');
    setFBanca('');
    setFSubcategory('');
    setPage(0);
  }

  /* ── Shared input class ── */
  const filterInput =
    'rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 ' +
    'shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent ' +
    'placeholder-zinc-400 transition';

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="space-y-4">

      {/* ── Header row ── */}
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 truncate">
          {loading ? 'Carregando...' : `${total} questão${total !== 1 ? 'ões' : ''}`}
        </p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors shrink-0 touch-manipulation"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Nova Questão</span>
          <span className="sm:hidden">Nova</span>
        </button>
      </div>

      {/* ── Filter bar ── */}
      <div className="bg-white border border-zinc-200 rounded-lg p-3 sm:p-4 shadow-sm">
        <div className="flex flex-wrap gap-2 sm:gap-3 items-end">
          {/* Search — ocupa linha inteira no mobile */}
          <div className="relative w-full sm:flex-1 sm:min-w-[200px]">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchRaw}
              onChange={(e) => setSearchRaw(e.target.value)}
              placeholder="Buscar no enunciado..."
              className={`${filterInput} pl-9 w-full`}
            />
          </div>

          {/* Disciplina */}
          <select
            value={fSubject}
            onChange={(e) => { setFSubject(e.target.value); setPage(0); }}
            className={`${filterInput} flex-1 sm:flex-none sm:w-44 min-w-[120px]`}
          >
            <option value="">Disciplina</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {/* Dificuldade */}
          <select
            value={fDifficulty}
            onChange={(e) => { setFDifficulty(e.target.value); setPage(0); }}
            className={`${filterInput} flex-1 sm:flex-none sm:w-36 min-w-[100px]`}
          >
            <option value="">Dificuldade</option>
            <option value="easy">Fácil</option>
            <option value="medium">Média</option>
            <option value="hard">Difícil</option>
          </select>

          {/* Ano — oculto no mobile se não preenchido */}
          <input
            type="number"
            value={fYear}
            onChange={(e) => { setFYear(e.target.value); setPage(0); }}
            placeholder="Ano"
            className={`${filterInput} w-24 ${!fYear ? 'hidden sm:block' : ''}`}
          />

          {/* Banca */}
          <input
            type="text"
            value={fBanca}
            onChange={(e) => { setFBanca(e.target.value); setPage(0); }}
            placeholder="Banca"
            className={`${filterInput} sm:w-36 flex-1 min-w-[80px] ${!fBanca ? 'hidden sm:block' : ''}`}
          />

          {/* Subcategoria */}
          <input
            type="text"
            value={fSubcategory}
            onChange={(e) => { setFSubcategory(e.target.value); setPage(0); }}
            placeholder="Subcategoria"
            className={`${filterInput} sm:w-40 flex-1 min-w-[100px] ${!fSubcategory ? 'hidden sm:block' : ''}`}
          />

          {/* Clear */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-xs text-zinc-500 hover:text-zinc-800 font-medium underline underline-offset-2 transition-colors whitespace-nowrap py-2 px-1 touch-manipulation"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <ExclamationIcon className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button
            onClick={fetchQuestions}
            className="ml-auto text-xs underline underline-offset-2 hover:text-red-900 transition-colors"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white border border-zinc-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-zinc-900 text-zinc-100">
                <th className="w-10 px-4 py-3 text-left font-medium text-zinc-400 text-xs">#</th>
                <th className="px-4 py-3 text-left font-medium text-xs">Enunciado</th>
                <th className="w-36 px-4 py-3 text-left font-medium text-xs">Disciplina</th>
                <th className="w-24 px-4 py-3 text-left font-medium text-xs">Dificuldade</th>
                <th className="w-40 px-4 py-3 text-left font-medium text-xs">Ano / Banca</th>
                <th className="w-28 px-4 py-3 text-left font-medium text-xs">Subcategoria</th>
                <th className="w-28 px-4 py-3 text-left font-medium text-xs">Data</th>
                <th className="w-32 px-4 py-3 text-right font-medium text-xs">Ações</th>
              </tr>
            </thead>

            <tbody className={`divide-y divide-zinc-100 ${loading && questions.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
              {/* Skeleton rows */}
              {loading && questions.length === 0 && (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 w-4 bg-zinc-100 rounded" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-100 rounded w-4/5" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-100 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-5 bg-zinc-100 rounded-full w-14" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-100 rounded w-20" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-100 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-100 rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-100 rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              )}

              {/* Empty state */}
              {!loading && questions.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <SearchIcon className="w-12 h-12 text-zinc-200" />
                      <p className="text-sm font-medium text-zinc-500">
                        Nenhuma questão encontrada
                      </p>
                      <p className="text-xs text-zinc-400">
                        {hasFilters
                          ? 'Tente ajustar ou limpar os filtros acima.'
                          : 'Clique em "Nova Questão" para começar.'}
                      </p>
                      {hasFilters && (
                        <button
                          onClick={clearFilters}
                          className="mt-1 text-xs font-medium text-zinc-600 border border-zinc-200 px-3 py-1.5 rounded-md hover:bg-zinc-50 transition-colors"
                        >
                          Limpar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {/* Data rows */}
              {questions.map((q, i) => {
                // Prioriza JSONB canônico (00005); fallback p/ VARCHAR legado
                const subs = Array.isArray(q.subcategories) && q.subcategories.length > 0
                  ? q.subcategories
                  : parseSubcategories(q.subcategory ?? null);
                const diff = DIFFICULTY[q.difficulty];
                const isDeleting = deletingId === q.id;

                return (
                  <tr key={q.id} className="hover:bg-zinc-50 transition-colors group">
                    {/* Row number */}
                    <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums">
                      {page * PAGE_SIZE + i + 1}
                    </td>

                    {/* Enunciado */}
                    <td className="px-4 py-3 max-w-xs">
                      <span
                        title={q.text}
                        className="text-zinc-800 leading-snug"
                      >
                        {truncate(q.text)}
                      </span>
                    </td>

                    {/* Disciplina */}
                    <td className="px-4 py-3 text-zinc-600 text-xs">
                      {(q as unknown as { subjects?: { name: string } }).subjects?.name ?? (
                        <span className="text-zinc-300">—</span>
                      )}
                    </td>

                    {/* Dificuldade */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${diff.cls}`}>
                        {diff.label}
                      </span>
                    </td>

                    {/* Ano / Banca */}
                    <td className="px-4 py-3">
                      {q.year ? (
                        <span className="block text-zinc-800 font-medium text-xs">{q.year}</span>
                      ) : null}
                      {q.exam_boards?.name ? (
                        <span className="block text-zinc-400 text-xs">{q.exam_boards.name}</span>
                      ) : !q.year ? (
                        <span className="text-zinc-300 text-xs">—</span>
                      ) : null}
                    </td>

                    {/* Subcategoria */}
                    <td className="px-4 py-3">
                      {subs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {subs.slice(0, 2).map((s) => (
                            <span key={s} className="inline-block bg-zinc-100 text-zinc-600 text-xs px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                          {subs.length > 2 && (
                            <span className="text-xs text-zinc-400">+{subs.length - 2}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </td>

                    {/* Data */}
                    <td className="px-4 py-3 text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                      {formatDate(q.created_at)}
                    </td>

                    {/* Ações */}
                    <td className="px-4 py-3">
                      {isDeleting ? (
                        <div className="flex items-center justify-end gap-2">
                          <span className="text-xs text-zinc-600 whitespace-nowrap">Excluir?</span>
                          <button
                            onClick={() => confirmDelete(q.id)}
                            disabled={deleteLoading}
                            className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                          >
                            {deleteLoading ? '...' : 'Sim'}
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onEdit(q)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded transition-colors"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => setDeletingId(q.id)}
                            className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                            Excluir
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* ── Pagination ── */}
        {total > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-100 bg-zinc-50">
            <span className="text-xs text-zinc-500">
              Exibindo {from}–{to} de {total} questão{total !== 1 ? 'ões' : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Anterior
              </button>
              <span className="text-xs text-zinc-600 tabular-nums">
                {page + 1} / {totalPages}
              </span>
              <button
                disabled={(page + 1) * PAGE_SIZE >= total}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 text-xs border border-zinc-200 rounded-md bg-white hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Inline icons ── */

function SearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function ExclamationIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" x2="12" y1="8" y2="12" />
      <line x1="12" x2="12.01" y1="16" y2="16" />
    </svg>
  );
}
