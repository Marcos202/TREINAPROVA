import { Suspense } from 'react';
import { getProviderRows } from './_actions/settingsActions';
import { ProviderCard } from './_components/ProviderCard';
import { StrategyCard } from './_components/StrategyCard';
import { HealthMonitor } from './_components/HealthMonitor';
import type { AiProvider } from '@/lib/ai/types';

export const revalidate = 0; // always fresh

export default async function DesenvolvedorPage() {
  const rows = await getProviderRows();

  const primaryProvider: AiProvider =
    (rows.find((r) => r.priority === 1)?.provider) ?? 'gemini';

  const enabledCount = rows.filter((r) => r.isEnabled && r.hasKey).length;

  return (
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Motor de IA
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure provedores de Inteligência Artificial, modelos e estratégia de fallback.
          </p>
        </div>

        {/* Status pill */}
        <div className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
          enabledCount > 0
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-gray-500 bg-gray-50 border-gray-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${enabledCount > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
          {enabledCount > 0
            ? `${enabledCount} provedor${enabledCount > 1 ? 'es' : ''} ativo${enabledCount > 1 ? 's' : ''}`
            : 'Nenhum provedor ativo'}
        </div>
      </div>

      {/* ── Warning if no providers configured ── */}
      {enabledCount === 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <WarningIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Motor de IA desativado</p>
            <p className="text-sm text-amber-700 mt-0.5">
              Adicione a chave de API de pelo menos um provedor e ative-o para habilitar
              os recursos de IA (Tutor, Flashcards, Parser de Questões e Analytics).
            </p>
          </div>
        </div>
      )}

      {/* ── Strategy ── */}
      <StrategyCard currentPrimary={primaryProvider} />

      {/* ── Provider Cards ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-0.5">
          Provedores
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {rows.map((row) => (
            <ProviderCard key={row.provider} row={row} />
          ))}
        </div>
      </div>

      {/* ── Health Monitor ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-0.5">
          Saúde do Sistema
        </h2>
        <Suspense fallback={<HealthMonitorSkeleton />}>
          <HealthMonitor />
        </Suspense>
      </div>

      {/* ── Env Reminder ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
        <p className="text-xs font-semibold text-gray-600 mb-1">Variáveis de Ambiente Necessárias</p>
        <div className="space-y-1 font-mono text-[11px] text-gray-500">
          <p>
            <span className="text-gray-800">SUPABASE_SERVICE_ROLE_KEY</span>
            {' '}— chave service_role do Supabase (nunca NEXT_PUBLIC_)
          </p>
          <p>
            <span className="text-gray-800">SYSTEM_MASTER_KEY</span>
            {' '}— 64 hex chars para criptografia AES-256-GCM das API keys
          </p>
          <p className="text-gray-400 pt-1">
            Gere: <span className="text-gray-600">node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;</span>
          </p>
        </div>
      </div>

    </div>
  );
}

function HealthMonitorSkeleton() {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-gray-100 rounded w-24" />
            <div className="flex-1 grid grid-cols-3 gap-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-12 bg-gray-100 rounded-xl" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WarningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
