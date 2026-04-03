'use client';

import { useState } from 'react';
import { UploadStep } from './UploadStep';
import { ProcessingStep } from './ProcessingStep';
import { ReviewStep } from './ReviewStep';
import { analyzeWithAI } from '../../_actions/importQuestion';
import type { EnrichedQuestion, ImportStep } from './types';
import type { Subject } from '../types';

interface Props {
  tenant: string;
  subjects: Subject[];
  onSuccess: () => void;
}

/**
 * Orquestrador do Super Importador de IA.
 * Gerencia a máquina de estados: idle → processing → review → saved
 */
export function SuperImporter({ tenant, subjects, onSuccess }: Props) {
  const [step, setStep] = useState<ImportStep>('idle');
  const [enriched, setEnriched] = useState<EnrichedQuestion | null>(null);
  const [operatorHint, setOperatorHint] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  const isProcessing = step === 'processing';

  async function handleAnalyze(imageBase64: string, mimeType: string, hint: string) {
    setAnalysisError(null);
    setOperatorHint(hint);
    setStep('processing');

    const result = await analyzeWithAI(imageBase64, mimeType, hint, tenant);

    if (!result.ok) {
      setAnalysisError(result.error);
      setStep('idle');
      return;
    }

    setEnriched(result.data);
    setStep('review');
  }

  function handleReset() {
    setStep('idle');
    setEnriched(null);
    setAnalysisError(null);
    setOperatorHint('');
    setSavedId(null);
  }

  function handleSaved(id: string) {
    setSavedId(id);
    setStep('saved');
  }

  return (
    <div className="space-y-0">

      {/* ── Estado: idle — Upload + instrução ── */}
      {step === 'idle' && (
        <>
          {analysisError && (
            <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-red-500 shrink-0 mt-0.5">✕</span>
              <div>
                <p className="text-sm font-semibold text-red-800">Falha na análise</p>
                <p className="text-sm text-red-700 mt-0.5">{analysisError}</p>
              </div>
            </div>
          )}
          <UploadStep onAnalyze={handleAnalyze} isLoading={isProcessing} />
        </>
      )}

      {/* ── Estado: processing — Animação de progresso ── */}
      {step === 'processing' && <ProcessingStep />}

      {/* ── Estado: review — Formulário editável ── */}
      {step === 'review' && enriched && (
        <ReviewStep
          enriched={enriched}
          tenant={tenant}
          subjects={subjects}
          operatorHint={operatorHint}
          onSuccess={handleSaved}
          onReset={handleReset}
        />
      )}

      {/* ── Estado: saved — Confirmação ── */}
      {step === 'saved' && (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center">
            <CheckIcon className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-slate-900">Questão Inteligente Salva!</p>
            <p className="text-sm text-slate-500">
              Flashcard pré-processado e todos os metadados foram salvos no banco.
            </p>
            {savedId && (
              <p className="text-xs text-slate-300 font-mono mt-1">ID: {savedId}</p>
            )}
          </div>
          <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full">
            Custo de IA para alunos acessarem esta questão: zero.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 transition-colors"
            >
              Importar Próxima Questão
            </button>
            <button
              onClick={onSuccess}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Ver Lista de Questões
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
