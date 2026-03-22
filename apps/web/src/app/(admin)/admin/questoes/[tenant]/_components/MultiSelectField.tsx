'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMetadataOptions } from './useMetadataOptions';

interface MultiSelectFieldProps {
  tenant: string;
  /** localStorage key suffix, e.g. 'subcategory' */
  field: string;
  label: string;
  /** Currently selected values */
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
}

/**
 * Multi-select combobox with chip/tag display.
 *
 * - Chips show selected values inline; "×" removes each
 * - Typing in the input filters the saved-options dropdown
 * - Click a saved option → toggle select/deselect
 * - "+" adds a brand-new option to localStorage AND selects it
 * - Click outside closes the dropdown
 */
export function MultiSelectField({
  tenant,
  field,
  label,
  values,
  onChange,
  placeholder,
}: MultiSelectFieldProps) {
  const { options, add, remove } = useMetadataOptions(tenant, field);
  const [inputValue, setInputValue] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* ── Close on outside click ── */
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputValue('');
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  /* ── Derived state ── */
  const query = inputValue.trim().toLowerCase();
  const filtered = options.filter((o) => {
    const matchesQuery = !query || o.toLowerCase().includes(query);
    return matchesQuery;
  });

  const isSelectedFn = (opt: string) => values.includes(opt);

  // "New value" = typed text that doesn't already exist in saved options
  const isNew =
    inputValue.trim() !== '' &&
    !options.some((o) => o.toLowerCase() === inputValue.trim().toLowerCase());

  /* ── Handlers ── */
  const toggleOption = useCallback(
    (opt: string) => {
      if (values.includes(opt)) {
        onChange(values.filter((v) => v !== opt));
      } else {
        onChange([...values, opt]);
      }
    },
    [values, onChange],
  );

  const removeChip = useCallback(
    (opt: string) => {
      onChange(values.filter((v) => v !== opt));
    },
    [values, onChange],
  );

  const handleAddNew = useCallback(() => {
    const v = inputValue.trim();
    if (!v) return;
    add(v);
    if (!values.includes(v)) onChange([...values, v]);
    setInputValue('');
    inputRef.current?.focus();
  }, [inputValue, add, values, onChange]);

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isNew) {
        handleAddNew();
      } else if (filtered.length === 1) {
        toggleOption(filtered[0]);
        setInputValue('');
      }
    }
    if (e.key === 'Escape') {
      setOpen(false);
      setInputValue('');
    }
    if (e.key === 'Backspace' && inputValue === '' && values.length > 0) {
      // Remove last chip on backspace when input is empty
      onChange(values.slice(0, -1));
    }
  };

  const handleRemoveSaved = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    remove(opt);
    // If it was selected, also deselect
    if (values.includes(opt)) onChange(values.filter((v) => v !== opt));
  };

  return (
    <div ref={containerRef} className="relative col-span-full sm:col-span-2 lg:col-span-3">
      {/* Label row */}
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-xs text-slate-400">
          {values.length > 0
            ? `${values.length} selecionada${values.length > 1 ? 's' : ''}`
            : 'Selecione ou adicione subcategorias'}
        </span>
      </div>

      {/* Input box — chips + text input */}
      <div
        onClick={() => { setOpen(true); inputRef.current?.focus(); }}
        className={`min-h-[42px] w-full flex flex-wrap gap-1.5 items-center px-2.5 py-2 rounded-md border bg-white shadow-sm cursor-text transition ${
          open
            ? 'border-slate-900 ring-2 ring-slate-900'
            : 'border-slate-200 hover:border-slate-300'
        }`}
      >
        {/* Selected chips */}
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 text-white text-xs font-medium shrink-0"
          >
            {v}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeChip(v); }}
              className="hover:text-slate-300 transition-colors ml-0.5"
              tabIndex={-1}
              aria-label={`Remover ${v}`}
            >
              <XIcon className="w-3 h-3" />
            </button>
          </span>
        ))}

        {/* Text input */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleInputKeyDown}
          placeholder={values.length === 0 ? (placeholder ?? 'Buscar ou adicionar...') : ''}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none py-0.5"
        />

        {/* Chevron */}
        <button
          type="button"
          tabIndex={-1}
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          className="ml-auto shrink-0 text-slate-400 hover:text-slate-700 transition-colors p-0.5"
        >
          <ChevronIcon
            className={`w-4 h-4 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-64 flex flex-col overflow-hidden">

          {/* Option list */}
          {filtered.length > 0 ? (
            <ul className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {filtered.map((opt) => {
                const selected = isSelectedFn(opt);
                return (
                  <li key={opt}>
                    <button
                      type="button"
                      onClick={() => { toggleOption(opt); setInputValue(''); }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors group ${
                        selected
                          ? 'bg-slate-50 text-slate-900'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        {/* Checkbox visual */}
                        <span
                          className={`flex items-center justify-center w-4 h-4 rounded border shrink-0 transition-colors ${
                            selected
                              ? 'bg-slate-900 border-slate-900'
                              : 'border-slate-300 group-hover:border-slate-400'
                          }`}
                        >
                          {selected && <CheckIcon className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className={selected ? 'font-medium' : ''}>{opt}</span>
                      </span>

                      {/* Delete saved option */}
                      <span
                        role="button"
                        onClick={(e) => handleRemoveSaved(e, opt)}
                        title="Remover opção salva"
                        className="ml-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <XIcon className="w-3.5 h-3.5" />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            !isNew && (
              <p className="px-3 py-3 text-xs text-slate-400 text-center">
                {options.length === 0
                  ? 'Nenhuma subcategoria salva. Digite e pressione Enter ou clique em + Adicionar.'
                  : 'Nenhuma correspondência. Pressione Enter para adicionar.'}
              </p>
            )
          )}

          {/* Add new footer */}
          {isNew && (
            <button
              type="button"
              onClick={handleAddNew}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              Adicionar{' '}
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                &ldquo;{inputValue.trim()}&rdquo;
              </span>
            </button>
          )}

          {/* Footer hint */}
          {values.length > 0 && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {values.length} selecionada{values.length > 1 ? 's' : ''}
              </span>
              <button
                type="button"
                onClick={() => onChange([])}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Limpar seleção
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline SVG icons ── */

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
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
