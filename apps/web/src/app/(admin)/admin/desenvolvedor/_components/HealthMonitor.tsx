import { getLast24hStats } from '@/lib/ai/request-logger';

const PROVIDER_LABELS: Record<string, string> = {
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
};

export async function HealthMonitor() {
  const stats = await getLast24hStats();

  const totalFallbacks = stats.reduce((s, p) => s + p.fallbacks, 0);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">Monitor de Saúde</h3>
          <p className="text-xs text-gray-400 mt-0.5">Últimas 24 horas</p>
        </div>
        {totalFallbacks > 0 && (
          <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
            {totalFallbacks} fallback{totalFallbacks > 1 ? 's' : ''} ativado{totalFallbacks > 1 ? 's' : ''}
          </span>
        )}
      </div>

      <div className="p-6">
        {stats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
              <ActivityIcon className="w-4 h-4 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-400">Nenhuma requisição ainda</p>
            <p className="text-xs text-gray-300 mt-1">Os dados aparecerão após a primeira chamada de IA.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stats.map((s) => (
              <div key={s.provider} className="flex items-center gap-4">
                <div className="w-28 shrink-0">
                  <p className="text-sm font-medium text-gray-700">
                    {PROVIDER_LABELS[s.provider] ?? s.provider}
                  </p>
                </div>

                <div className="flex-1 grid grid-cols-3 gap-3">
                  <Metric
                    label="Requisições"
                    value={String(s.total)}
                    sub="total"
                  />
                  <Metric
                    label="Sucesso"
                    value={`${s.successRate}%`}
                    sub="taxa"
                    highlight={s.successRate >= 99 ? 'green' : s.successRate >= 90 ? 'yellow' : 'red'}
                  />
                  <Metric
                    label="Latência"
                    value={s.avgLatencyMs > 0 ? `${(s.avgLatencyMs / 1000).toFixed(1)}s` : '—'}
                    sub="média"
                  />
                </div>

                {/* Health dot */}
                <div className="shrink-0">
                  <span
                    className={`inline-block w-2.5 h-2.5 rounded-full ${
                      s.successRate >= 99
                        ? 'bg-emerald-500'
                        : s.successRate >= 90
                        ? 'bg-amber-400'
                        : 'bg-red-500'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label, value, sub, highlight }: {
  label: string;
  value: string;
  sub: string;
  highlight?: 'green' | 'yellow' | 'red';
}) {
  const valueColor =
    highlight === 'green' ? 'text-emerald-600' :
    highlight === 'yellow' ? 'text-amber-600' :
    highlight === 'red' ? 'text-red-600' :
    'text-gray-800';

  return (
    <div className="bg-gray-50 rounded-xl px-3 py-2">
      <p className="text-[10px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-base font-bold tabular-nums ${valueColor}`}>{value}</p>
      <p className="text-[10px] text-gray-400">{sub}</p>
    </div>
  );
}

function ActivityIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}
