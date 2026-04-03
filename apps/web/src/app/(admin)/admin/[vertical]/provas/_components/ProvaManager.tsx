'use client';

import { useState, useRef, useEffect } from 'react';
import { createProva, renameProva, deleteProva } from '../_actions/provaActions';

interface ProvaItem {
  id: string;
  tenant_id: string;
  name: string;
  year: number | null;
  created_at: string;
}

interface Props {
  tenant: string;
  tenantLabel: string;
  initialProvas: ProvaItem[];
}

export function ProvaManager({ tenant, tenantLabel, initialProvas }: Props) {
  const [provas, setProvas] = useState<ProvaItem[]>(initialProvas);
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameNameValue, setRenameNameValue] = useState('');
  const [renameYearValue, setRenameYearValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSaving, setRenameSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ProvaItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const newNameRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (showAddForm) newNameRef.current?.focus(); }, [showAddForm]);
  useEffect(() => { if (renamingId) renameRef.current?.focus(); }, [renamingId]);

  function provaLabel(p: ProvaItem) {
    return p.year ? `${p.name} (${p.year})` : p.name;
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setAddingNew(true);
    setAddError(null);
    const year = newYear ? parseInt(newYear, 10) : null;
    const result = await createProva(tenant, newName.trim(), year);
    setAddingNew(false);
    if (result.error) { setAddError(result.error); return; }
    setProvas((prev) => [...prev, result.data as ProvaItem].sort((a, b) => {
      const cmp = a.name.localeCompare(b.name, 'pt-BR');
      if (cmp !== 0) return cmp;
      return (b.year ?? 0) - (a.year ?? 0);
    }));
    setNewName('');
    setNewYear('');
    setShowAddForm(false);
  }

  async function handleRename(id: string) {
    if (!renameNameValue.trim()) return;
    setRenameSaving(true);
    setRenameError(null);
    const year = renameYearValue ? parseInt(renameYearValue, 10) : null;
    const result = await renameProva(id, renameNameValue.trim(), year);
    setRenameSaving(false);
    if (result.error) { setRenameError(result.error); return; }
    setProvas((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: result.data?.name ?? renameNameValue.trim(), year: result.data?.year ?? year } : p))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    );
    setRenamingId(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteProva(deleteTarget.id);
    setDeleting(false);
    if (result.error) { setDeleteError(result.error); return; }
    setProvas((prev) => prev.filter((p) => p.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const deleteConfirmMatch = deleteTarget !== null && deleteConfirmText === provaLabel(deleteTarget);

  const inputClass = 'rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Provas — {tenantLabel}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{provas.length} prova{provas.length !== 1 ? 's' : ''} cadastrada{provas.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowAddForm((v) => !v); setAddError(null); setNewName(''); setNewYear(''); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          Nova Prova
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-3">Nova prova para {tenantLabel}</p>
          <div className="flex gap-2 flex-wrap">
            <input ref={newNameRef} type="text" value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } if (e.key === 'Escape') { setShowAddForm(false); } }}
              placeholder="Nome da prova (ex: Residência Clínica)"
              className={`${inputClass} flex-1 min-w-[200px]`}
            />
            <input type="number" value={newYear}
              onChange={(e) => { setNewYear(e.target.value); setAddError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
              placeholder="Ano (opcional)"
              className={`${inputClass} w-32`}
              min={1990} max={2099}
            />
            <button onClick={handleCreate} disabled={addingNew || !newName.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {addingNew ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => { setShowAddForm(false); setNewName(''); setNewYear(''); setAddError(null); }}
              className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 rounded-lg hover:bg-blue-100 transition-colors">
              Cancelar
            </button>
          </div>
          {addError && <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">{addError}</p>}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {provas.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3">
              <FileTextIcon className="w-5 h-5 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">Nenhuma prova cadastrada</p>
            <p className="text-xs text-zinc-400 mt-1">Clique em "Nova Prova" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 text-zinc-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold">Prova</th>
                  <th className="w-24 px-5 py-3 text-center text-xs font-semibold">Ano</th>
                  <th className="w-40 px-5 py-3 text-right text-xs font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {provas.map((p) => (
                  <tr key={p.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      {renamingId === p.id ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input ref={renameRef} type="text" value={renameNameValue}
                            onChange={(e) => { setRenameNameValue(e.target.value); setRenameError(null); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRename(p.id); } if (e.key === 'Escape') { setRenamingId(null); } }}
                            className="flex-1 min-w-[160px] rounded-md border border-blue-400 px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input type="number" value={renameYearValue}
                            onChange={(e) => { setRenameYearValue(e.target.value); setRenameError(null); }}
                            placeholder="Ano"
                            className="w-24 rounded-md border border-blue-400 px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min={1990} max={2099}
                          />
                          <button onClick={() => handleRename(p.id)} disabled={renameSaving || !renameNameValue.trim()}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors">
                            {renameSaving ? '...' : 'Salvar'}
                          </button>
                          <button onClick={() => setRenamingId(null)}
                            className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 rounded-md hover:bg-zinc-100 transition-colors">
                            Cancelar
                          </button>
                          {renameError && <p className="text-xs text-red-600">{renameError}</p>}
                        </div>
                      ) : (
                        <span className="font-medium text-zinc-800">{p.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {p.year ? (
                        <span className="text-zinc-600 text-sm tabular-nums">{p.year}</span>
                      ) : (
                        <span className="text-zinc-300 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {renamingId !== p.id && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setRenamingId(p.id); setRenameNameValue(p.name); setRenameYearValue(p.year?.toString() ?? ''); setRenameError(null); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">
                            <PencilIcon className="w-3.5 h-3.5" />
                            Editar
                          </button>
                          <button
                            onClick={() => { setDeleteTarget(p); setDeleteConfirmText(''); setDeleteError(null); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors">
                            <TrashIcon className="w-3.5 h-3.5" />
                            Excluir
                          </button>
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

      {/* Delete modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 border border-zinc-200">
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                <TriangleAlertIcon className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-zinc-900">Excluir prova</h3>
                <p className="text-sm text-zinc-500 mt-0.5">As questões vinculadas perderão a referência desta prova.</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              <label className="text-sm font-medium text-zinc-700">
                Digite <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800">{provaLabel(deleteTarget)}</span> para confirmar:
              </label>
              <input type="text" value={deleteConfirmText}
                onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && deleteConfirmMatch) handleDelete(); if (e.key === 'Escape') setDeleteTarget(null); }}
                placeholder={provaLabel(deleteTarget)} autoFocus
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
              {deleteError && <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">{deleteError}</p>}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-2.5 text-sm font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={!deleteConfirmMatch || deleting}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {deleting ? 'Excluindo...' : 'Excluir permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>;
}
function PencilIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>;
}
function TrashIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>;
}
function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /></svg>;
}
function TriangleAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>;
}
