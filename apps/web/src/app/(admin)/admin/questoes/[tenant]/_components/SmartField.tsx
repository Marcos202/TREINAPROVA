'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useMetadataOptions } from './useMetadataOptions';

interface SmartFieldProps {
  tenant: string;
  /** Key used for localStorage namespacing, e.g. 'banca', 'institution' */
  field: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}

/**
 * A combobox-style input that lets the user type freely OR pick from
 * previously saved values. Saved values live in localStorage per (tenant, field).
 *
 * UX:
 * - Type to filter saved options in the dropdown
 * - Click a saved option to select it instantly
 * - Click "+" to save the current value for future reuse
 * - Click "×" on a saved option to permanently delete it
 */
export function SmartField({
  tenant,
  field,
  label,
  value,
  onChange,
  placeholder,
  required,
}: SmartFieldProps) {
  const { options, add, remove } = useMetadataOptions(tenant, field);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const filtered = options.filter((o) =>
    o.toLowerCase().includes(value.toLowerCase()),
  );

  const isNew = value.trim() !== '' && !options.includes(value.trim());

  const handleSave = useCallback(() => {
    if (value.trim()) {
      add(value.trim());
      setOpen(false);
    }
  }, [value, add]);

  const handleSelect = (opt: string) => {
    onChange(opt);
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    remove(opt);
  };

  const inputBase =
    'w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 ' +
    'placeholder-slate-400 shadow-sm transition focus:outline-none focus:ring-2 ' +
    'focus:ring-slate-900 focus:border-transparent pr-16';

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
        {/* Save button — only visible when value is new */}
        {isNew && (
          <button
            type="button"
            onClick={handleSave}
            title={`Salvar "${value.trim()}" para reutilização`}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-900 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Salvar
          </button>
        )}
      </div>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          required={required}
          className={inputBase}
        />
        {/* Dropdown toggle */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setOpen((o) => !o)}
          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          {options.length > 0 && (
            <span className="text-xs font-medium text-slate-400 leading-none">
              {options.length}
            </span>
          )}
          <ChevronIcon
            className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-md shadow-lg max-h-56 flex flex-col overflow-hidden">
          {filtered.length === 0 && !isNew ? (
            <p className="px-3 py-3 text-xs text-slate-400 text-center">
              {options.length === 0
                ? 'Nenhum valor salvo ainda. Digite e clique em + Salvar.'
                : 'Nenhum resultado para o filtro atual.'}
            </p>
          ) : (
            <ul className="overflow-y-auto flex-1 divide-y divide-slate-50">
              {filtered.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 text-left group"
                  >
                    <span className="truncate">{opt}</span>
                    <span
                      role="button"
                      onClick={(e) => handleRemove(e, opt)}
                      title="Remover opção salva"
                      className="ml-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                    >
                      <XIcon className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Save new value footer */}
          {isNew && (
            <button
              type="button"
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 border-t border-slate-100 transition-colors"
            >
              <PlusIcon className="w-3.5 h-3.5 text-slate-400" />
              Salvar{' '}
              <span className="font-semibold text-slate-900 truncate max-w-[160px]">
                &ldquo;{value.trim()}&rdquo;
              </span>{' '}
              para reutilização
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Inline SVG icons ── */

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

function ChevronIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
