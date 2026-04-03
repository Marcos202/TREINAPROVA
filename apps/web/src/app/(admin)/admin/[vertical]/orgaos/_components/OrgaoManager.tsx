'use client';

import { useState, useRef, useEffect } from 'react';
import { createOrgao, renameOrgao, deleteOrgao } from '../_actions/orgaoActions';

interface OrgaoItem {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

interface Props {
  tenant: string;
  tenantLabel: string;
  initialOrgaos: OrgaoItem[];
}

export function OrgaoManager({ tenant, tenantLabel, initialOrgaos }: Props) {
  const [orgaos, setOrgaos] = useState<OrgaoItem[]>(initialOrgaos);
  const [newName, setNewName] = useState('');
  const [addingNew, setAddingNew] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSaving, setRenameSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<OrgaoItem | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const newNameRef = useRef<HTMLInputElement>(null);
  const renameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (showAddForm) newNameRef.current?.focus(); }, [showAddForm]);
  useEffect(() => { if (renamingId) renameRef.current?.focus(); }, [renamingId]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setAddingNew(true);
    setAddError(null);
    const result = await createOrgao(tenant, newName.trim());
    setAddingNew(false);
    if (result.error) { setAddError(result.error); return; }
    setOrgaos((prev) => [...prev, result.data as OrgaoItem].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')));
    setNewName('');
    setShowAddForm(false);
  }

  async function handleRename(id: string) {
    if (!renameValue.trim()) return;
    setRenameSaving(true);
    setRenameError(null);
    const result = await renameOrgao(id, renameValue.trim());
    setRenameSaving(false);
    if (result.error) { setRenameError(result.error); return; }
    setOrgaos((prev) =>
      prev.map((o) => (o.id === id ? { ...o, name: result.data?.name ?? renameValue.trim() } : o))
        .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    );
    setRenamingId(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteOrgao(deleteTarget.id);
    setDeleting(false);
    if (result.error) { setDeleteError(result.error); return; }
    setOrgaos((prev) => prev.filter((o) => o.id !== deleteTarget.id));
    setDeleteTarget(null);
  }

  const deleteConfirmMatch = deleteTarget !== null && deleteConfirmText === deleteTarget.name;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Órgãos — {tenantLabel}</h2>
          <p className="text-sm text-zinc-500 mt-0.5">{orgaos.length} órgão{orgaos.length !== 1 ? 's' : ''} cadastrado{orgaos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => { setShowAddForm((v) => !v); setAddError(null); setNewName(''); }}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 transition-colors shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          Novo Órgão
        </button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <p className="text-sm font-medium text-blue-800 mb-3">Novo órgão para {tenantLabel}</p>
          <div className="flex gap-2">
            <input ref={newNameRef} type="text" value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                if (e.key === 'Escape') { setShowAddForm(false); setNewName(''); }
              }}
              placeholder="Ex: USP, CFM, Prefeitura de SP"
              className="flex-1 rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button onClick={handleCreate} disabled={addingNew || !newName.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
              {addingNew ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => { setShowAddForm(false); setNewName(''); setAddError(null); }}
              className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 rounded-lg hover:bg-blue-100 transition-colors">
              Cancelar
            </button>
          </div>
          {addError && <p className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md px-3 py-1.5">{addError}</p>}
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
        {orgaos.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center mx-auto mb-3">
              <OfficeBuildingIcon className="w-5 h-5 text-zinc-300" />
            </div>
            <p className="text-sm font-medium text-zinc-500">Nenhum órgão cadastrado</p>
            <p className="text-xs text-zinc-400 mt-1">Clique em "Novo Órgão" para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-900 text-zinc-100">
                  <th className="px-5 py-3 text-left text-xs font-semibold">Órgão / Instituição</th>
                  <th className="w-40 px-5 py-3 text-right text-xs font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {orgaos.map((o) => (
                  <tr key={o.id} className="hover:bg-zinc-50/50 transition-colors group">
                    <td className="px-5 py-3.5">
                      {renamingId === o.id ? (
                        <div className="flex items-center gap-2">
                          <input ref={renameRef} type="text" value={renameValue}
                            onChange={(e) => { setRenameValue(e.target.value); setRenameError(null); }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') { e.preventDefault(); handleRename(o.id); }
                              if (e.key === 'Escape') { setRenamingId(null); }
                            }}
                            className="flex-1 rounded-md border border-blue-400 px-2.5 py-1.5 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button onClick={() => handleRename(o.id)} disabled={renameSaving || !renameValue.trim()}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-40 transition-colors">
                            {renameSaving ? '...' : 'Salvar'}
                          </button>
                          <button onClick={() => setRenamingId(null)}
                            className="px-3 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 rounded-md hover:bg-zinc-100 transition-colors">
                            Cancelar
                          </button>
                          {renameError && <p className="text-xs text-red-600 ml-1">{renameError}</p>}
                        </div>
                      ) : (
                        <span className="font-medium text-zinc-800">{o.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      {renamingId !== o.id && (
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setRenamingId(o.id); setRenameValue(o.name); setRenameError(null); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors">
                            <PencilIcon className="w-3.5 h-3.5" />
                            Renomear
                          </button>
                          <button onClick={() => { setDeleteTarget(o); setDeleteConfirmText(''); setDeleteError(null); }}
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
                <h3 className="text-base font-semibold text-zinc-900">Excluir órgão</h3>
                <p className="text-sm text-zinc-500 mt-0.5">As questões vinculadas perderão a referência de órgão.</p>
              </div>
            </div>
            <div className="space-y-2 mb-5">
              <label className="text-sm font-medium text-zinc-700">
                Digite <span className="font-mono bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-800">{deleteTarget.name}</span> para confirmar:
              </label>
              <input type="text" value={deleteConfirmText}
                onChange={(e) => { setDeleteConfirmText(e.target.value); setDeleteError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter' && deleteConfirmMatch) handleDelete(); if (e.key === 'Escape') setDeleteTarget(null); }}
                placeholder={deleteTarget.name} autoFocus
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
function OfficeBuildingIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" /><path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01" /></svg>;
}
function TriangleAlertIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>;
}
