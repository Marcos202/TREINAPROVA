'use client';

import { useState, useRef, useEffect } from 'react';
import { createSubject, renameSubject, deleteSubject } from '../_actions/subjectActions';

interface SubjectWithCount {
  id: string;
  name: string;
  created_at: string;
  questionCount: number;
}

interface Props {
  tenant: string;
  tenantLabel: string;
  initialSubjects: SubjectWithCount[];
}

export function DisciplinaManager({ tenant, tenantLabel, initialSubjects }: Props) {
  const [subjects, setSubjects] = useState<SubjectWithCount[]>(initialSubjects);

  // ── Estados de UI ──────────────────────────────────────────
  const [newName, setNewName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSaving, setRenameSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<SubjectWithCount | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const newNameRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAddForm) newNameRef.current?.focus();
  }, [showAddForm]);

  useEffect(() => {
    if (renamingId) renameRef.current?.focus();
  }, [renamingId]);

  // ── Criar nova disciplina ───────────────────────────────────
  async function handleCreate() {
    if (!newName.trim()) return;
    setAddingNew(true);
    setAddError(null);

    const result = await createSubject(tenant, newName.trim());

    setAddingNew(false);
    if (result.error) {
      setAddError(result.error);
      return;
    }

    const created: SubjectWithCount = { ...(result.data as { id: string; name: string; created_at: string }), questionCount: 0 };
    setSubjects((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    );
    setNewName('');
    setShowAddForm(false);
  }

  // ── Iniciar renomeação ──────────────────────────────────────
  function startRename(s: SubjectWithCount) {
    setRenamingId(s.id);
    setRenameValue(s.name);
    setRenameError(null);
  }

  function cancelRename() {
    setRenamingId(null);
    setRenameValue('');
    setRenameError(null);
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    setRenameSaving(true);
    setRenameError(null);

    const result = await renameSubject(id, renameValue.trim());

    setRenameSaving(false);
    if (result.error) {
      setRenameError(result.error);
      return;
    }

    setSubjects((prev) =>
      prev
        .map((s) => (s.id === id ? { ...s, name: result.data?.name ?? renameValue.trim() } : s))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    );
    setRenamingId(null);
  }

  // ── Deletar disciplina ──────────────────────────────────────
  function openDeleteModal(s: SubjectWithCount) {
    setDeleteTarget(s);
    setDeleteConfirmText('');
    setDeleteError(null);
  }

  function closeDeleteModal() {
    setDeleteTarget(null);
    setDeleteConfirmText('');
    setDeleteError(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);

    const result = await deleteSubject(deleteTarget.id);

    setDeleting(false);
    if (result.error) {
      setDeleteError(result.error);
      return;
    }

    setSubjects((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    closeDeleteModal();
  }

  const deleteConfirmMatch =
    deleteTarget !== null && deleteConfirmText === deleteTarget.name;

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Disciplinas — {tenantLabel}
          </h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            {subjects.length} disciplina{subjects.length !== 1 ? 's' : ''} cadastrada{subjects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowAddForm((v) => !v); setAddError(null); setNewName(''); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          Nova Disciplina
        </button>
      </div>

      {/* ── Formulário adicionar ── */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-3">Nova disciplina para {tenantLabel}</p>
          <div className="flex gap-2">
            <input
              ref={newNameRef}
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                if (e.key === 'Escape') { setShowAddForm(false); setNewName(''); }
              }}
              placeholder="Ex: Clínica Médica"
              className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleCreate}
              disabled={addingNew || !newName.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {addingNew ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewName(''); setAddError(null); }}
              className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 rounded-lg hover:bg-blue-100 transition-colors"
            >
              Cancelar
            </button>
          </div>
          {addError && (
            <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">
              {addError}
            </p>
          )}
        </div>
      )}

      {/* ── Tabela ── */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {subjects.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3">
              <BookIcon className="w-5 h-5 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">Nenhuma disciplina cadastrada</p>
            <p className="text-xs text-zinc-400 mt-1">Clique em "Nova Disciplina" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 text-zinc-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold">Disciplina</th>
                  <th className="w-32 px-5 py-3 text-center text-xs font-semibold">Questões</th>
                  <th className="w-40 px-5 py-3 text-right text-xs font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 transition-colors group">
                    {/* Nome / inline rename */}
                    <td className="px-5 py-3.5">
                      {renamingId === s.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            ref={renameRef}
                            type="text"
                            value={renameValue}
                            onChange={(e) => { setRenameValue(e.target.value); setRenameError(null); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleRename(s.id); }
                              if (e.key === 'Escape') cancelRename();
                            }}
                            className="flex-1 rounded-md border border-blue-400 px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => handleRename(s.id)}
                            disabled={renameSaving || !renameValue.trim()}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors"
                          >
                            {renameSaving ? '...' : 'Salvar'}
                          </button>
                          <button
                            onClick={cancelRename}
                            className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 rounded-md hover:bg-zinc-100 transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className="font-medium text-zinc-800">{s.name}</span>
                          {renameError && renamingId === s.id && (
                            <p className="text-xs text-red-600 mt-0.5">{renameError}</p>
                          )}
                        </div>
                      )}
                      {renamingId === s.id && renameError && (
                        <p className="text-xs text-red-600 mt-1">{renameError}</p>
                      )}
                    </td>

                    {/* Contagem */}
                    <td className="px-5 py-3.5 text-center">
                      {s.questionCount > 0 ? (
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700">
                          {s.questionCount}
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-300">0</span>
                      )}
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-3.5">
                      {renamingId !== s.id && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startRename(s)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors"
                            title="Renomear disciplina"
                          >
                            <PencilIcon className="w-3.5 h-3.5" />
                            Renomear
                          </button>

                          {s.questionCount > 0 ? (
                            <button
                              disabled
                              title={`${s.questionCount} questões usam esta disciplina`}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 cursor-not-allowed rounded-md"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          ) : (
                            <button
                              onClick={() => openDeleteModal(s)}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                              title="Excluir disciplina (sem questões)"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                              Excluir
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal de confirmação de deleção ── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDeleteModal}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-zinc-200">
            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <TriangleAlertIcon className="w-4.5 h-4.5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Excluir disciplina</h3>
                <p className="text-sm text-zinc-500 mt-0.5">
                  Esta ação é permanente e não pode ser desfeita.
                </p>
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-5">
              <p className="text-sm text-amber-800">
                Você está excluindo a disciplina{' '}
                <strong>&ldquo;{deleteTarget.name}&rdquo;</strong>.
                {deleteTarget.questionCount === 0
                  ? ' Esta disciplina não possui questões vinculadas.'
                  : ` ${deleteTarget.questionCount} questão${deleteTarget.questionCount !== 1 ? 'ões ficará' : ' ficarão'} sem disciplina.`}
              </p>
            </div>

            {/* Confirmação por digitação */}
            <div className="space-y-2 mb-5">
              <label className="text-sm font-medium text-zinc-700">
                Digite <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800">{deleteTarget.name}</span> para confirmar:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError(null); }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && deleteConfirmMatch) handleDelete();
                  if (e.key === 'Escape') closeDeleteModal();
                }}
                placeholder={deleteTarget.name}
                autoFocus
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {deleteError && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">
                  {deleteError}
                </p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={closeDeleteModal}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={!deleteConfirmMatch || deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {deleting ? 'Excluindo...' : 'Excluir permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Icons ─────────────────────────────────────────── */

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  );
}

function BookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function TriangleAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" x2="12" y1="9" y2="13" />
      <line x1="12" x2="12.01" y1="17" y2="17" />
    </svg>
  );
}
