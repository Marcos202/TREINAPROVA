'use client';

import { useState, useTransition } from 'react';
import {
  updateProviderKey,
  updateProviderModel,
  toggleProvider,
} from '../_actions/settingsActions';
import type { ProviderRow } from '../_actions/settingsActions';
import type { AiProvider } from '@/lib/ai/types';

const GEMINI_MODELS = [
  { id: 'gemini-1.5-flash',      label: 'gemini-1.5-flash (Rápido & Econômico)' },
  { id: 'gemini-1.5-pro',        label: 'gemini-1.5-pro (Mais Capaz)' },
  { id: 'gemini-2.0-flash-exp',  label: 'gemini-2.0-flash-exp (Experimental)' },
];

const PROVIDER_META: Record<AiProvider, { label: string; docsUrl: string; color: string; bgLight: string; border: string }> = {
  gemini: {
    label: 'Google Gemini',
    docsUrl: 'https://aistudio.google.com/',
    color: 'text-blue-600',
    bgLight: 'bg-blue-50',
    border: 'border-blue-200',
  },
  openrouter: {
    label: 'OpenRouter',
    docsUrl: 'https://openrouter.ai/keys',
    color: 'text-violet-600',
    bgLight: 'bg-violet-50',
    border: 'border-violet-200',
  },
};

interface Props {
  row: ProviderRow;
}

export function ProviderCard({ row }: Props) {
  const meta = PROVIDER_META[row.provider];
  const [isPending, startTransition] = useTransition();
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [keyValue, setKeyValue] = useState('');
  const [model, setModel] = useState(row.defaultModel);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  function flash(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleToggle() {
    startTransition(async () => {
      const res = await toggleProvider(row.provider, !row.isEnabled);
      if (!res.ok) flash('err', res.error ?? 'Erro ao alternar provedor.');
    });
  }

  function handleSaveKey() {
    if (!keyValue.trim()) return;
    startTransition(async () => {
      const res = await updateProviderKey(row.provider, keyValue);
      if (res.ok) {
        flash('ok', `Chave salva: ${res.masked}`);
        setKeyValue('');
        setShowKeyInput(false);
      } else {
        flash('err', res.error ?? 'Erro ao salvar chave.');
      }
    });
  }

  function handleModelChange(newModel: string) {
    setModel(newModel);
    startTransition(async () => {
      const res = await updateProviderModel(row.provider, newModel);
      if (!res.ok) flash('err', res.error ?? 'Erro ao salvar modelo.');
      else flash('ok', 'Modelo atualizado.');
    });
  }

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden ${row.isEnabled ? 'border-gray-100' : 'border-gray-100 opacity-80'}`}>
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-xl ${meta.bgLight} flex items-center justify-center shrink-0`}>
            <BrainIcon className={`w-4 h-4 ${meta.color}`} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800">{meta.label}</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Prioridade {row.priority === 1 ? '1 — Primário' : '2 — Fallback'}
            </p>
          </div>
        </div>

        {/* Toggle */}
        <button
          onClick={handleToggle}
          disabled={isPending}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
            row.isEnabled ? 'bg-emerald-500' : 'bg-gray-200'
          }`}
          aria-label={row.isEnabled ? 'Desativar' : 'Ativar'}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
              row.isEnabled ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* ── Body ── */}
      <div className="px-6 py-5 space-y-5">

        {/* API Key row */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            API Key
          </label>
          <div className="flex items-center gap-2">
            {/* Masked display */}
            <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 min-w-0 truncate">
              {row.hasKey && !showKeyInput
                ? row.maskedKey
                : showKeyInput
                ? (
                  <input
                    type="password"
                    value={keyValue}
                    onChange={(e) => setKeyValue(e.target.value)}
                    placeholder="Cole a nova chave aqui..."
                    className="w-full bg-transparent outline-none placeholder-gray-300 text-gray-800"
                    autoFocus
                  />
                )
                : <span className="text-gray-300 italic">Nenhuma chave configurada</span>
              }
            </div>

            {showKeyInput ? (
              <>
                <button
                  onClick={handleSaveKey}
                  disabled={isPending || !keyValue.trim()}
                  className="shrink-0 px-3 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
                >
                  Salvar
                </button>
                <button
                  onClick={() => { setShowKeyInput(false); setKeyValue(''); }}
                  className="shrink-0 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Cancelar
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowKeyInput(true)}
                className="shrink-0 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {row.hasKey ? 'Atualizar' : 'Adicionar'}
              </button>
            )}
          </div>

          {/* Docs link */}
          <p className="text-[11px] text-gray-400">
            Obtenha sua chave em{' '}
            <span className={`font-medium ${meta.color}`}>{meta.docsUrl}</span>
          </p>
        </div>

        {/* Model selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Modelo Padrão
          </label>

          {row.provider === 'gemini' ? (
            <select
              value={model}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isPending}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          ) : (
            /* OpenRouter: free text (200+ models) */
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                onBlur={() => { if (model !== row.defaultModel) handleModelChange(model); }}
                disabled={isPending}
                placeholder="ex: anthropic/claude-3.5-sonnet"
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
              />
            </div>
          )}

          <p className="text-[11px] text-gray-400">
            {row.provider === 'openrouter'
              ? 'ID do modelo do OpenRouter (openrouter.ai/models). Salvo automaticamente ao sair do campo.'
              : 'Selecione o modelo do Gemini a usar como padrão.'}
          </p>
        </div>
      </div>

      {/* ── Feedback toast ── */}
      {feedback && (
        <div className={`mx-6 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
          feedback.type === 'ok'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.type === 'ok'
            ? <CheckIcon className="w-4 h-4 shrink-0" />
            : <XIcon className="w-4 h-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function BrainIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24 3 3 0 0 1 .34-5.58 2.5 2.5 0 0 1 1.32-4.24A2.5 2.5 0 0 1 9.5 2Z" />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24 3 3 0 0 0-.34-5.58 2.5 2.5 0 0 0-1.32-4.24A2.5 2.5 0 0 0 14.5 2Z" />
    </svg>
  );
}
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
