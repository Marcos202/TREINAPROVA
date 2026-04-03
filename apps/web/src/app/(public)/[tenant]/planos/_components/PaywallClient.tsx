'use client';

import { useRouter } from 'next/navigation';
import type { PublicPlan } from '../_actions/publicPlanActions';

const BILLING_LABELS: Record<string, string> = {
    monthly: '/mês',
    quarterly: '/trimestre',
    semiannual: '/semestre',
    annual: '/ano',
};

interface PaywallClientProps {
    tenant: string;
    tenantLabel: string;
    theme: {
        accent: string;
        accentLight: string;
        accentGradient: string;
    };
    plans: PublicPlan[];
    isAuthenticated: boolean;
}

export default function PaywallClient({ tenant, tenantLabel, theme, plans, isAuthenticated }: PaywallClientProps) {
    const hasPlans = plans.length > 0;

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-start py-10 lg:py-16 px-4">

            {/* ── Hero ── */}
            <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
                <div
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-6"
                    style={{ backgroundColor: theme.accentLight, borderColor: theme.accent + '30' }}
                >
                    <svg className="w-3.5 h-3.5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
                    </svg>
                    <span className="text-[11px] font-bold tracking-wide uppercase" style={{ color: theme.accent }}>
                        Treina Prova PRO
                    </span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-slate-900 leading-tight tracking-tight">
                    Desbloqueie todo o seu
                    <br />
                    potencial em{' '}
                    <span className="bg-clip-text text-transparent" style={{ backgroundImage: theme.accentGradient }}>
                        {tenantLabel}
                    </span>
                </h1>

                <p className="mt-4 text-base sm:text-lg text-slate-500 leading-relaxed max-w-xl mx-auto">
                    Escolha o plano ideal e tenha acesso a simulados, inteligência artificial e questões ilimitadas.
                </p>
            </div>

            {/* ── Plans Grid ── */}
            {hasPlans ? (
                <div className={`w-full max-w-5xl mx-auto grid gap-5 ${
                    plans.length === 1 ? 'grid-cols-1 max-w-md' :
                    plans.length === 2 ? 'grid-cols-1 md:grid-cols-2 max-w-3xl' :
                    'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}>
                    {plans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            theme={theme}
                            tenant={tenant}
                            isAuthenticated={isAuthenticated}
                        />
                    ))}
                </div>
            ) : (
                <div className="w-full max-w-md mx-auto text-center">
                    <div className="bg-white border border-slate-200 rounded-2xl px-8 py-10 shadow-sm">
                        <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <rect width="20" height="14" x="2" y="5" rx="2" />
                            <path d="M2 10h20" />
                        </svg>
                        <p className="text-sm font-semibold text-slate-600 mb-1">Planos em breve</p>
                        <p className="text-xs text-slate-400">
                            Os planos para {tenantLabel} estão sendo configurados. Volte em breve!
                        </p>
                    </div>
                </div>
            )}

            {/* ── Trust badges ── */}
            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-slate-400">
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Pagamento seguro
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                    7 dias de garantia
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                    </svg>
                    Cancele quando quiser
                </div>
            </div>

            <div className="mt-10 text-center">
                <p className="text-xs text-slate-400">
                    Dúvidas? Entre em contato pelo{' '}
                    <a
                        href={`/${tenant}`}
                        className="font-medium underline underline-offset-2 hover:text-slate-600 transition-colors"
                    >
                        Dashboard
                    </a>
                </p>
            </div>
        </div>
    );
}

/* ── Plan Card ─────────────────────────────────────────── */

function PlanCard({
    plan,
    theme,
    tenant,
    isAuthenticated,
}: {
    plan: PublicPlan;
    theme: { accent: string; accentGradient: string; accentLight: string };
    tenant: string;
    isAuthenticated: boolean;
}) {
    const router = useRouter();
    const periodLabel = BILLING_LABELS[plan.billing_period] || '';

    function handleSubscribe() {
        // ── Funil inteligente ──────────────────────────────────────
        // Se não autenticado → redireciona para login com returnTo
        if (!isAuthenticated) {
            router.push(`/${tenant}/login?redirectedFrom=/${tenant}/planos`);
            return;
        }

        // Autenticado → redireciona para a nossa página de checkout (One-Page, PCI compliant)
        router.push(`/checkout/${plan.id}`);
    }

    return (
        <div
            className={`relative bg-white rounded-2xl border-2 p-6 flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ${
                plan.is_highlighted ? 'border-transparent shadow-md' : 'border-slate-200 hover:border-slate-300'
            }`}
            style={plan.is_highlighted ? {
                borderColor: theme.accent,
                boxShadow: `0 4px 30px ${theme.accent}18`,
            } : undefined}
        >
            {plan.is_highlighted && (
                <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-bold uppercase tracking-wider text-white px-4 py-1 rounded-full shadow-sm"
                    style={{ background: theme.accentGradient }}
                >
                    Mais Popular
                </div>
            )}

            <p className="text-sm font-bold text-slate-900 mt-1">{plan.name}</p>

            <div className="mt-3 mb-4">
                {plan.original_price && (
                    <p className="text-xs text-slate-400 line-through mb-0.5">
                        R$ {plan.original_price.toFixed(2)}
                    </p>
                )}
                <div className="flex items-baseline gap-1">
                    <span className="text-[11px] text-slate-500 font-medium">R$</span>
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">
                        {Math.floor(plan.price)}
                    </span>
                    <span className="text-lg font-bold text-slate-400">
                        ,{String(Math.round((plan.price % 1) * 100)).padStart(2, '0')}
                    </span>
                    <span className="text-xs text-slate-400 font-medium ml-0.5">{periodLabel}</span>
                </div>
            </div>

            <div className="h-px bg-slate-100 my-1" />

            <ul className="flex-1 space-y-2.5 py-4">
                {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                        <svg
                            className="w-4 h-4 mt-0.5 shrink-0"
                            style={{ color: theme.accent }}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2.5}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="text-[13px] text-slate-600 leading-snug">{feature}</span>
                    </li>
                ))}
            </ul>

            <button
                onClick={handleSubscribe}
                className={`w-full mt-2 h-11 rounded-xl text-[13px] font-bold tracking-wide transition-all duration-200 ${
                    plan.is_highlighted
                        ? 'text-white shadow-md hover:shadow-lg hover:opacity-95 active:scale-[0.98]'
                        : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98]'
                }`}
                style={plan.is_highlighted ? { background: theme.accentGradient } : undefined}
            >
                Assinar Agora
            </button>
        </div>
    );
}
