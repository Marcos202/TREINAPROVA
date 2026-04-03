'use client';

import { useState, useTransition } from 'react';
import type { SubscriptionPlan } from '../_actions/planActions';
import { createPlan, updatePlan, togglePlanActive, deletePlan } from '../_actions/planActions';

const BILLING_LABELS: Record<string, string> = {
    monthly: 'Mensal',
    quarterly: 'Trimestral',
    semiannual: 'Semestral',
    annual: 'Anual',
};

/* ── Plan Card ─────────────────────────────────────────── */

function PlanCard({ plan, verticalId }: { plan: SubscriptionPlan; verticalId: string }) {
    const [isPending, startTransition] = useTransition();
    const [editing, setEditing] = useState(false);

    function handleToggle() {
        startTransition(async () => {
            await togglePlanActive(plan.id, verticalId, !plan.is_active);
        });
    }

    function handleDelete() {
        if (!confirm(`Excluir o plano "${plan.name}"?`)) return;
        startTransition(async () => {
            await deletePlan(plan.id, verticalId);
        });
    }

    if (editing) {
        return (
            <PlanForm
                verticalId={verticalId}
                plan={plan}
                onClose={() => setEditing(false)}
            />
        );
    }

    return (
        <div className={`bg-white rounded-2xl border p-5 space-y-3 transition-all ${plan.is_active ? 'border-slate-200' : 'border-dashed border-slate-300 opacity-60'
            } ${plan.is_highlighted ? 'ring-2 ring-indigo-200' : ''}`}>
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-[15px] font-bold text-slate-900">{plan.name}</h3>
                        {plan.is_highlighted && (
                            <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                Destaque
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        {BILLING_LABELS[plan.billing_period] || plan.billing_period}
                        {' · '}Ordem: {plan.sort_order}
                    </p>
                </div>
                <div className="text-right">
                    {plan.original_price && (
                        <p className="text-xs text-slate-400 line-through">
                            R$ {plan.original_price.toFixed(2)}
                        </p>
                    )}
                    <p className="text-lg font-bold text-slate-900">
                        R$ {plan.price.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Features */}
            {plan.features.length > 0 && (
                <ul className="space-y-1">
                    {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-[12px] text-slate-600">
                            <svg className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {f}
                        </li>
                    ))}
                </ul>
            )}

            {/* Gateway IDs */}
            <div className="space-y-0.5">
                {plan.stripe_price_id && (
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                        <span className="font-semibold text-slate-500">Stripe:</span> {plan.stripe_price_id}
                    </p>
                )}
                {plan.asaas_payment_link && (
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                        <span className="font-semibold text-slate-500">Asaas:</span> {plan.asaas_payment_link}
                    </p>
                )}
                {plan.mercadopago_link && (
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                        <span className="font-semibold text-slate-500">MP:</span> {plan.mercadopago_link}
                    </p>
                )}
                {!plan.stripe_price_id && !plan.asaas_payment_link && !plan.mercadopago_link && (
                    <p className="text-[10px] text-amber-500 font-medium">⚠ Nenhum link de pagamento configurado</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                <button
                    onClick={() => setEditing(true)}
                    disabled={isPending}
                    className="text-[11px] font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                    Editar
                </button>
                <button
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`text-[11px] font-medium transition-colors ${plan.is_active
                            ? 'text-amber-600 hover:text-amber-800'
                            : 'text-emerald-600 hover:text-emerald-800'
                        }`}
                >
                    {plan.is_active ? 'Desativar' : 'Ativar'}
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="text-[11px] font-medium text-red-500 hover:text-red-700 transition-colors ml-auto"
                >
                    Excluir
                </button>
            </div>
        </div>
    );
}

/* ── Plan Form (Create / Edit) ────────────────────────── */

function PlanForm({
    verticalId,
    plan,
    onClose,
}: {
    verticalId: string;
    plan?: SubscriptionPlan;
    onClose?: () => void;
}) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        const formData = new FormData(e.currentTarget);

        startTransition(async () => {
            const result = plan
                ? await updatePlan(plan.id, verticalId, formData)
                : await createPlan(verticalId, formData);

            if (!result.ok) {
                setError(result.error || 'Erro desconhecido.');
            } else {
                setSuccess(true);
                if (onClose) onClose();
            }
        });
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4"
        >
            <p className="text-sm font-bold text-slate-800">
                {plan ? `Editando: ${plan.name}` : 'Novo Plano'}
            </p>

            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    {error}
                </p>
            )}
            {success && !plan && (
                <p className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    Plano criado com sucesso!
                </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Name */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Nome do Plano *</label>
                    <input
                        name="name"
                        defaultValue={plan?.name || ''}
                        required
                        placeholder="Ex: Mensal, Anual"
                        className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                {/* Price */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Preço (R$) *</label>
                    <input
                        name="price"
                        type="number"
                        step="0.01"
                        min="0.01"
                        defaultValue={plan?.price || ''}
                        required
                        placeholder="49.90"
                        className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                {/* Original price */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Preço Original (riscado)</label>
                    <input
                        name="original_price"
                        type="number"
                        step="0.01"
                        min="0"
                        defaultValue={plan?.original_price || ''}
                        placeholder="79.90"
                        className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                {/* Billing period */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Período</label>
                    <select
                        name="billing_period"
                        defaultValue={plan?.billing_period || 'monthly'}
                        className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all bg-white"
                    >
                        <option value="monthly">Mensal</option>
                        <option value="quarterly">Trimestral</option>
                        <option value="semiannual">Semestral</option>
                        <option value="annual">Anual</option>
                    </select>
                </div>

                {/* Sort order */}
                <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ordem de Exibição</label>
                    <input
                        name="sort_order"
                        type="number"
                        defaultValue={plan?.sort_order ?? 0}
                        className="w-full h-9 px-3 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                {/* Highlighted */}
                <div className="flex items-center gap-2 self-end pb-1">
                    <input
                        name="is_highlighted"
                        type="checkbox"
                        defaultChecked={plan?.is_highlighted || false}
                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-200"
                    />
                    <label className="text-[12px] text-slate-600 font-medium">Destaque (badge &quot;Mais Popular&quot;)</label>
                </div>
            </div>

            {/* Features */}
            <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Benefícios (um por linha)
                </label>
                <textarea
                    name="features"
                    rows={4}
                    defaultValue={plan?.features.join('\n') || ''}
                    placeholder={"Questões ilimitadas\nSimulados completos\nEstatísticas avançadas\nSuporte prioritário"}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all resize-none"
                />
            </div>

            {/* Gateway links */}
            <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Links de Pagamento</p>

                <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Stripe Price ID</label>
                    <input
                        name="stripe_price_id"
                        defaultValue={plan?.stripe_price_id || ''}
                        placeholder="price_1MoBy..."
                        className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Asaas Payment Link</label>
                    <input
                        name="asaas_payment_link"
                        defaultValue={plan?.asaas_payment_link || ''}
                        placeholder="https://www.asaas.com/c/..."
                        className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Mercado Pago Link</label>
                    <input
                        name="mercadopago_link"
                        defaultValue={plan?.mercadopago_link || ''}
                        placeholder="https://mpago.la/..."
                        className="w-full h-8 px-3 text-xs font-mono rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Submit */}
            <div className="flex items-center gap-2 pt-1">
                <button
                    type="submit"
                    disabled={isPending}
                    className="h-9 px-5 rounded-lg bg-slate-900 text-white text-[12px] font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                    {isPending ? 'Salvando...' : plan ? 'Salvar Alterações' : 'Criar Plano'}
                </button>
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 px-4 rounded-lg text-[12px] font-medium text-slate-500 hover:bg-slate-100 transition-colors"
                    >
                        Cancelar
                    </button>
                )}
            </div>
        </form>
    );
}

/* ── Main Component ──────────────────────────────────── */

interface PlanManagerProps {
    verticalId: string;
    initialPlans: SubscriptionPlan[];
    tableExists: boolean;
}

export default function PlanManager({ verticalId, initialPlans, tableExists }: PlanManagerProps) {
    const [showCreate, setShowCreate] = useState(false);

    if (!tableExists) {
        return (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
                <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4M12 17h.01" />
                </svg>
                <div>
                    <p className="text-sm font-semibold text-red-800">Migration pendente</p>
                    <p className="text-sm text-red-700 mt-1">
                        A tabela <code className="font-mono bg-red-100 px-1 rounded">subscription_plans</code> ainda
                        não existe. Execute a migration <strong>00015_subscription_plans.sql</strong> no Supabase.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Toggle create form */}
            <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                    {initialPlans.length === 0
                        ? 'Nenhum plano cadastrado para esta vertical.'
                        : `${initialPlans.length} plano(s) cadastrado(s)`}
                </p>
                <button
                    onClick={() => setShowCreate((v) => !v)}
                    className="h-8 px-4 rounded-lg bg-slate-900 text-white text-[11px] font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Novo Plano
                </button>
            </div>

            {showCreate && (
                <PlanForm
                    verticalId={verticalId}
                    onClose={() => setShowCreate(false)}
                />
            )}

            {/* Plan cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {initialPlans.map((plan) => (
                    <PlanCard key={plan.id} plan={plan} verticalId={verticalId} />
                ))}
            </div>
        </div>
    );
}
