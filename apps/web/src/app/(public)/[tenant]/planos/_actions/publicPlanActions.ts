'use server';

import { createServiceClient } from '@/lib/supabase/service';

export interface PublicPlan {
    id: string;
    name: string;
    price: number;
    original_price: number | null;
    billing_period: string;
    features: string[];
    is_highlighted: boolean;
    checkout_url: string | null;
}

/**
 * Fetches active plans for a vertical and resolves the checkout URL
 * from the currently active payment gateway.
 *
 * Uses service_role to read gateway config (RLS denies anon/auth),
 * but plans are publicly readable via RLS policy.
 */
export async function getPublicPlans(
    verticalId: string,
): Promise<{ plans: PublicPlan[]; error?: string }> {
    try {
        const supabase = createServiceClient();

        // 1) Get active plans for this vertical (public read via RLS)
        const { data: plansData, error: plansErr } = await supabase
            .from('subscription_plans')
            .select('id, name, price, original_price, billing_period, features, is_highlighted, stripe_price_id, asaas_payment_link, mercadopago_link, sort_order')
            .eq('vertical_id', verticalId)
            .eq('is_active', true)
            .order('sort_order', { ascending: true })
            .order('price', { ascending: true });

        if (plansErr) {
            const isMissing = plansErr.message.includes('does not exist') ||
                plansErr.message.includes('schema cache') ||
                plansErr.code === '42P01';
            if (isMissing) return { plans: [] };
            return { plans: [], error: plansErr.message };
        }

        if (!plansData || plansData.length === 0) return { plans: [] };

        // 2) Get the active gateway (service_role bypasses RLS)
        const { data: gwData } = await supabase
            .from('payment_gateway_configs')
            .select('gateway_name')
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();

        const activeGateway = gwData?.gateway_name as string | null;

        // 3) Map plans with resolved checkout URL per active gateway
        const plans: PublicPlan[] = plansData.map((row: any) => {
            let checkoutUrl: string | null = null;

            if (activeGateway === 'stripe' && row.stripe_price_id) {
                checkoutUrl = row.stripe_price_id;
            } else if (activeGateway === 'asaas' && row.asaas_payment_link) {
                checkoutUrl = row.asaas_payment_link;
            } else if (activeGateway === 'mercadopago' && row.mercadopago_link) {
                checkoutUrl = row.mercadopago_link;
            }

            // Fallback: try any available link
            if (!checkoutUrl) {
                checkoutUrl = row.asaas_payment_link || row.mercadopago_link || row.stripe_price_id || null;
            }

            return {
                id: row.id,
                name: row.name,
                price: parseFloat(row.price),
                original_price: row.original_price ? parseFloat(row.original_price) : null,
                billing_period: row.billing_period,
                features: Array.isArray(row.features) ? row.features : [],
                is_highlighted: row.is_highlighted,
                checkout_url: checkoutUrl,
            };
        });

        return { plans };
    } catch (e) {
        return { plans: [], error: e instanceof Error ? e.message : 'Erro ao carregar planos.' };
    }
}
