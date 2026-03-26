'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

// Tabelas de domínio suportadas por este componente genérico
type DomainTable = 'exam_boards' | 'institutions';

interface DomainItem {
  id: string;
  tenant_id: string;
  name: string;
  created_at: string;
}

interface DomainSelectFieldProps {
  /** Tabela Supabase: 'exam_boards' ou 'institutions' */
  table: DomainTable;
  /** Rótulo exibido acima do campo */
  label: string;
  /** Placeholder do input de adição */
  placeholder?: string;
  tenant: string;
  items: DomainItem[];
  value: string;           // ID selecionado
  onChange: (id: string) => void;
  required?: boolean;
}

/**
 * Campo de seleção com opção "+ Adicionar" para tabelas de domínio
 * (exam_boards, institutions). Segue o mesmo padrão do SubjectField.
 *
 * - Dropdown lista itens existentes via prop `items`
 * - "+ Adicionar" revela um input inline que insere na tabela e
 *   imediatamente seleciona o novo item (optimistic update)
 * - Código 23505 (unique violation) → mensagem amigável "já cadastrada"
 */
export function DomainSelectField({
  table,
  label,
  placeholder = 'Nome...',
  tenant,
  items,
  value,
  onChange,
  required = false,
}: DomainSelectFieldProps) {
  const supabase = createClient();

  const [localItems, setLocalItems] = useState<DomainItem[]>(items);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showAdd) inputRef.current?.focus();
  }, [showAdd]);

  const inputBase =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
    'placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ' +
    'focus:ring-slate-900 focus:border-transparent';

  const LABEL_MAP: Record<DomainTable, string> = {
    exam_boards: 'banca',
    institutions: 'órgão/instituição',
  };

  async function handleAdd() {
    const name = newName.trim();
    if (!name) return;

    // Check client-side first for fast feedback
    if (localItems.some((it) => it.name.toLowerCase() === name.toLowerCase())) {
      setAddError(`Já existe ${LABEL_MAP[table]} com este nome.`);
      return;
    }

    setAdding(true);
    setAddError(null);

    const { data, error } = await supabase
      .from(table)
      .insert({ tenant_id: tenant, name })
      .select('id, tenant_id, name, created_at')
      .single();

    setAdding(false);

    if (error) {
      // 23505 = unique_violation — índice case-insensitive ativado na migration 00009
      if (error.code === '23505') {
        setAddError(`Já existe ${LABEL_MAP[table]} com este nome. Selecione-o no dropdown.`);
      } else {
        setAddError(error.message);
      }
      return;
    }

    const created = data as DomainItem;
    setLocalItems((prev) =>
      [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
    );
    onChange(created.id);
    setNewName('');
    setShowAdd(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => { setShowAdd((v) => !v); setAddError(null); setNewName(''); }}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
        >
          {showAdd ? (
            <>
              <XIcon className="w-3 h-3" />
              Cancelar
            </>
          ) : (
            <>
              <PlusIcon className="w-3 h-3" />
              Adicionar
            </>
          )}
        </button>
      </div>

      {!showAdd ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputBase}
          required={required}
        >
          <option value="">Selecione {LABEL_MAP[table]}...</option>
          {localItems.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </select>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setAddError(null); }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); handleAdd(); }
                if (e.key === 'Escape') { setShowAdd(false); setNewName(''); }
              }}
              placeholder={placeholder}
              className={inputBase}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={adding || !newName.trim()}
              className="shrink-0 px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {adding ? '...' : 'Salvar'}
            </button>
          </div>
          {addError && (
            <p className="text-xs text-red-600">{addError}</p>
          )}
          {localItems.length > 0 && (
            <p className="text-xs text-slate-400">
              Ou selecione um existente:{' '}
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
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
