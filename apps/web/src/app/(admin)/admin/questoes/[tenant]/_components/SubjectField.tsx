'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Subject {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

interface SubjectFieldProps {
  tenant: string;
  subjects: Subject[];
  value: string;
  onChange: (id: string) => void;
}

/**
 * Dropdown de Disciplina com opção de cadastrar nova disciplina inline.
 * Novas disciplinas são inseridas na tabela `subjects` do Supabase e
 * adicionadas ao estado local sem necessitar de reload da página.
 */
export function SubjectField({ tenant, subjects, value, onChange }: SubjectFieldProps) {
  const supabase = createClient();

  const [localSubjects, setLocalSubjects] = useState<Subject[]>(subjects);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const inputBase =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
    'placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ' +
    'focus:ring-slate-900 focus:border-transparent';

  async function handleAddSubject() {
    const name = newName.trim();
    if (!name) return;
    if (localSubjects.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setAddError('Disciplina já cadastrada.');
      return;
    }

    setAdding(true);
    setAddError(null);

    const { data, error } = await supabase
      .from('subjects')
      .insert({ tenant_id: tenant, name })
      .select('id, tenant_id, name, created_at')
      .single();

    setAdding(false);

    if (error) {
      // Código 23505 = violação de unique constraint (subjects_tenant_name_unique)
      if (error.code === '23505') {
        setAddError('Disciplina já existe. Selecione-a no dropdown.');
      } else {
        setAddError(error.message);
      }
      return;
    }

    const newSubject = data as Subject;
    setLocalSubjects((prev) => [...prev, newSubject].sort((a, b) => a.name.localeCompare(b.name)));
    onChange(newSubject.id);
    setNewName('');
    setShowAdd(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">
          Disciplina <span className="text-red-500">*</span>
        </label>
        <button
          type="button"
          onClick={() => { setShowAdd((v) => !v); setAddError(null); setNewName(''); }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          {showAdd ? (
            <>
              <XIcon className="w-3 h-3" /> Cancelar
            </>
          ) : (
            <>
              <PlusIcon className="w-3 h-3" /> Adicionar
            </>
          )}
        </button>
      </div>

      {!showAdd ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase}
          required
        >
          <option value="">Selecione uma disciplina...</option>
          {localSubjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubject(); }}}
              placeholder="Nome da nova disciplina..."
              className={inputBase}
              autoFocus
            />
            <button
              type="button"
              onClick={handleAddSubject}
              disabled={adding || !newName.trim()}
              className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? '...' : 'Salvar'}
            </button>
          </div>
          {addError && (
            <p className="text-xs text-red-600">{addError}</p>
          )}
          {/* Also show existing select below for context */}
          {localSubjects.length > 0 && (
            <p className="text-xs text-slate-400">
              Ou selecione uma existente:{' '}
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="underline hover:text-slate-700"
              >
                voltar ao dropdown
              </button>
            </p>
          )}
        </div>
      )}
    </div>
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

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
