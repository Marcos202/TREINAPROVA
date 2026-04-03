import { TENANT_LABELS } from '@/config/tenants';
import { getPlansForVertical } from './_actions/planActions';
import PlanManager from './_components/PlanManager';

export const revalidate = 0;

interface PlanosPageProps {
    params: Promise<{ vertical: string }>;
}

export default async function PlanosPage({ params }: PlanosPageProps) {
    const { vertical } = await params;
    const label = TENANT_LABELS[vertical] || vertical.toUpperCase();
    const { plans, tableExists } = await getPlansForVertical(vertical);

    return (
        <div className="space-y-8">
            {/* ── Page Header ── */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                    Planos e Preços — {label}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                    Cadastre os planos de assinatura específicos desta vertical.
                    Os alunos verão os planos ativos na página de upgrade <code className="font-mono text-xs bg-slate-100 px-1 rounded">/{vertical}/planos</code>.
                </p>
            </div>

            {/* ── Info banner ── */}
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4">
                <svg className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                </svg>
                <p className="text-xs text-blue-700 leading-relaxed">
                    <span className="font-semibold">Multi-Gateway:</span>{' '}
                    Cada plano pode ter links para Stripe, Asaas e Mercado Pago simultaneamente.
                    O botão de &quot;Assinar&quot; na {`paywall`} do aluno usará automaticamente o gateway ativo
                    (configurado em <span className="font-semibold">Financeiro → Motor de Pagamentos</span>).
                </p>
            </div>

            <PlanManager
                verticalId={vertical}
                initialPlans={plans}
                tableExists={tableExists}
            />
        </div>
    );
}
