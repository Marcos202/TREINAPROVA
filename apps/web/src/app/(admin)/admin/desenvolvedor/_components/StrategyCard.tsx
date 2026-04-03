'use client';

import { useState, useTransition } from 'react';
import { updateProviderPriority } from '../_actions/settingsActions';
import type { AiProvider } from '@/lib/ai/types';

interface Props {
  currentPrimary: AiProvider;
}

const PROVIDER_LABELS: Record<AiProvider, string> = {
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
};

export function StrategyCard({ currentPrimary }: Props) {
  const [primary, setPrimary] = useState<AiProvider>(currentPrimary);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const fallback: AiProvider = primary === 'gemini' ? 'openrouter' : 'gemini';

  function handleChange(newPrimary: AiProvider) {
    setPrimary(newPrimary);
    startTransition(async () => {
      await updateProviderPriority(newPrimary);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Estratégia de Execução</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Define qual provedor é chamado primeiro e qual é o fallback automático.
          </p>
        </div>
        {saved && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Salvo
          </span>
        )}
      </div>

      <div className="px-6 py-5 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(['gemini', 'openrouter'] as AiProvider[]).map((p) => (
            <button
              key={p}
              onClick={() => handleChange(p)}
              disabled={isPending}
              className={`relative flex flex-col items-start gap-1 px-4 py-3 rounded-xl border-2 transition-all text-left disabled:opacity-50 ${
                primary === p
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white'
              }`}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                {primary === p ? 'Primário' : 'Fallback'}
              </span>
              <span className="text-sm font-semibold">{PROVIDER_LABELS[p]}</span>
              {primary === p && (
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <InfoIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">
            Se <strong>{PROVIDER_LABELS[primary]}</strong> retornar timeout, erro 429 ou 5xx,
            o sistema tentará automaticamente o <strong>{PROVIDER_LABELS[fallback]}</strong>.
            Erros 400/401 (chave inválida ou prompt inválido) não ativam o fallback.
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}
