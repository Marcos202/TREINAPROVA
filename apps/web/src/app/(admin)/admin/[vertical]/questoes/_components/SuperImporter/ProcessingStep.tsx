'use client';

import { useEffect, useState } from 'react';

/**
 * Tela de progresso exibida durante o pipeline de IA (Stage 1 + Stage 2).
 * Como o Server Action não tem streaming, simula progresso visualmente.
 */
export function ProcessingStep() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<1 | 2>(1);

  // Simulação visual do progresso — não reflete tempo real do servidor
  useEffect(() => {
    const TOTAL_MS = 12000; // estimativa conservadora
    const STAGE2_START = 55; // % em que "simula" troca de estágio

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev; // trava em 95% — destrava quando a resposta chegar
        const step = prev < STAGE2_START ? 1.2 : 0.6; // Stage 2 é "mais lento"
        const next = prev + step;
        if (prev < STAGE2_START && next >= STAGE2_START) setStage(2);
        return Math.min(next, 95);
      });
    }, TOTAL_MS / 100);

    return () => clearInterval(interval);
  }, []);

  const stageLabel = stage === 1
    ? 'Etapa 1/2 — Extraindo questão da imagem...'
    : 'Etapa 2/2 — Identificando metadados e gerando flashcard...';

  const stageDetail = stage === 1
    ? 'O modelo de visão está lendo o enunciado e as alternativas.'
    : 'Inferindo banca, ano, órgão e criando o flashcard de memorização.';

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-6">

      {/* Ícone animado */}
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 flex items-center justify-center">
          <SparklesIcon className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center">
          <span className="text-[9px] font-bold text-white">{stage}</span>
        </div>
      </div>

      {/* Labels */}
      <div className="space-y-1.5">
        <p className="text-base font-semibold text-slate-800">{stageLabel}</p>
        <p className="text-sm text-slate-400">{stageDetail}</p>
      </div>

      {/* Barra de progresso */}
      <div className="w-full max-w-xs space-y-2">
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-slate-900 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-slate-400 tabular-nums">{Math.round(progress)}%</p>
      </div>

      {/* Dica */}
      <p className="text-xs text-slate-300 max-w-xs">
        Este processo leva entre 5 e 15 segundos dependendo do provedor de IA e da complexidade da questão.
      </p>
    </div>
  );
}

function SparklesIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
    </svg>
  );
}
