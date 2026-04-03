import { getGatewayRows } from './_actions/gatewayActions';
import { GatewayCard }    from './_components/GatewayCard';

export const revalidate = 0; // always fresh — gateway config changes must appear immediately

export default async function FinanceiroPage() {
  const { rows, tableExists } = await getGatewayRows();

  const activeGateway    = rows.find((r) => r.isActive);
  const configured       = rows.filter((r) => r.hasSecretKey).length;
  const migrationPending = !tableExists;

  return (
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            Motor de Pagamentos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Configure os gateways de pagamento, insira as chaves de API e defina qual está ativo.
            A troca de gateway é instantânea — novos checkouts usam o gateway ativo imediatamente.
          </p>
        </div>

        {/* Active status pill */}
        <div className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border ${
          activeGateway
            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
            : 'text-gray-500 bg-gray-50 border-gray-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${activeGateway ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
          {activeGateway
            ? `${activeGateway.gatewayName === 'stripe' ? 'Stripe'
                : activeGateway.gatewayName === 'asaas' ? 'Asaas'
                : 'Mercado Pago'} ativo`
            : 'Nenhum gateway ativo'}
        </div>
      </div>

      {/* ── Migration pending banner ── */}
      {migrationPending && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
          <WarningIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Migration pendente — tabela não encontrada</p>
            <p className="text-sm text-red-700 mt-1">
              A tabela <code className="font-mono bg-red-100 px-1 rounded">payment_gateway_configs</code> ainda
              não existe no banco. Execute a migration <strong>00014_billing_engine.sql</strong> no{' '}
              <span className="font-medium">Supabase Dashboard → SQL Editor</span> para ativar esta página.
            </p>
          </div>
        </div>
      )}

      {/* ── Warning: no active gateway ── */}
      {!activeGateway && !migrationPending && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <WarningIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">Nenhum gateway de pagamento ativo</p>
            <p className="text-sm text-amber-700 mt-0.5">
              {configured === 0
                ? 'Configure as chaves de API de pelo menos um gateway e clique em "Definir Ativo".'
                : 'Você configurou chaves, mas nenhum gateway está ativo. Clique em "Definir Ativo" em um dos cards abaixo.'}
            </p>
          </div>
        </div>
      )}

      {/* ── How-it-works note ── */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
        <InfoIcon className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-xs text-blue-700 leading-relaxed">
          <span className="font-semibold">Alta Disponibilidade:</span>{' '}
          Se um gateway cair, troque o "Ativo" em 1 segundo e todos os novos checkouts migram
          automaticamente. Assinantes já ativos no gateway anterior continuam operando
          normalmente até o término do período pago — sem migração de base.
        </p>
      </div>

      {/* ── Gateway Cards ── */}
      <div>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-0.5">
          Gateways Configurados
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {rows.map((row) => (
            <GatewayCard key={row.gatewayName} row={row} />
          ))}
        </div>
      </div>

      {/* ── Env vars reminder ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Variáveis de Ambiente Necessárias</p>
        <div className="space-y-1 font-mono text-[11px] text-gray-500">
          <p>
            <span className="text-gray-800">SYSTEM_MASTER_KEY</span>
            {' '}— 64 hex chars (compartilhado com Motor de IA). Criptografa todas as chaves.
          </p>
          <p>
            <span className="text-gray-800">SUPABASE_SERVICE_ROLE_KEY</span>
            {' '}— necessário para as Server Actions de leitura/escrita.
          </p>
          <p className="text-gray-400 pt-1">
            Gere a master key:{' '}
            <span className="text-gray-600">
              node -e &quot;console.log(require(&apos;crypto&apos;).randomBytes(32).toString(&apos;hex&apos;))&quot;
            </span>
          </p>
        </div>
      </div>

    </div>
  );
}

/* ── Icons ── */
function WarningIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}
