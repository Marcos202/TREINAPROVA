'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

// ── Types ──────────────────────────────────────────────────────

export interface SubscriptionPlan {
    id: string;
    vertical_id: string;
    name: string;
    price: number;
    original_price: number | null;
    billing_period: string;
    features: string[];
    stripe_price_id: string | null;
    asaas_payment_link: string | null;
    mercadopago_link: string | null;
    is_active: boolean;
    is_highlighted: boolean;
    sort_order: number;
}

// ── Auth guard ─────────────────────────────────────────────────

async function requireAdmin(): Promise<string> {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Não autenticado.');

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();

    if (!profile?.is_admin) throw new Error('Acesso negado.');
    return session.user.id;
}

// ── List plans for a vertical ──────────────────────────────────

export async function getPlansForVertical(
    verticalId: string,
): Promise<{ plans: SubscriptionPlan[]; tableExists: boolean }> {
    await requireAdmin();
    const supabase = createServiceClient();

    const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('vertical_id', verticalId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        const isMissing = error.message.includes('does not exist') ||
            error.message.includes('schema cache') ||
            error.code === '42P01';
        if (isMissing) return { plans: [], tableExists: false };
        throw new Error(error.message);
    }

    const plans: SubscriptionPlan[] = (data ?? []).map((row: any) => ({
        id: row.id,
        vertical_id: row.vertical_id,
        name: row.name,
        price: parseFloat(row.price),
        original_price: row.original_price ? parseFloat(row.original_price) : null,
        billing_period: row.billing_period,
        features: Array.isArray(row.features) ? row.features : [],
        stripe_price_id: row.stripe_price_id,
        asaas_payment_link: row.asaas_payment_link,
        mercadopago_link: row.mercadopago_link,
        is_active: row.is_active,
        is_highlighted: row.is_highlighted,
        sort_order: row.sort_order,
    }));

    return { plans, tableExists: true };
}

// ── Create plan ────────────────────────────────────────────────

export async function createPlan(
    verticalId: string,
    formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
    try {
        await requireAdmin();
        const supabase = createServiceClient();

        const name = (formData.get('name') as string)?.trim();
        const price = parseFloat(formData.get('price') as string);
        const originalPrice = formData.get('original_price') as string;
        const billingPeriod = (formData.get('billing_period') as string) || 'monthly';
        const featuresRaw = (formData.get('features') as string) || '';
        const stripeId = (formData.get('stripe_price_id') as string)?.trim() || null;
        const asaasLink = (formData.get('asaas_payment_link') as string)?.trim() || null;
        const mpLink = (formData.get('mercadopago_link') as string)?.trim() || null;
        const isHighlighted = formData.get('is_highlighted') === 'on';
        const sortOrder = parseInt(formData.get('sort_order') as string) || 0;

        if (!name) return { ok: false, error: 'O nome é obrigatório.' };
        if (isNaN(price) || price <= 0) return { ok: false, error: 'Preço inválido.' };

        const features = featuresRaw
            .split('\n')
            .map((f) => f.trim())
            .filter(Boolean);

        const { error } = await supabase.from('subscription_plans').insert({
            vertical_id: verticalId,
            name,
            price,
            original_price: originalPrice ? parseFloat(originalPrice) || null : null,
            billing_period: billingPeriod,
            features,
            stripe_price_id: stripeId,
            asaas_payment_link: asaasLink,
            mercadopago_link: mpLink,
            is_highlighted: isHighlighted,
            sort_order: sortOrder,
            is_active: true,
        });

        if (error) return { ok: false, error: error.message };

        revalidatePath(`/admin/${verticalId}/planos`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
    }
}

// ── Update plan ────────────────────────────────────────────────

export async function updatePlan(
    planId: string,
    verticalId: string,
    formData: FormData,
): Promise<{ ok: boolean; error?: string }> {
    try {
        await requireAdmin();
        const supabase = createServiceClient();

        const name = (formData.get('name') as string)?.trim();
        const price = parseFloat(formData.get('price') as string);
        const originalPrice = formData.get('original_price') as string;
        const billingPeriod = (formData.get('billing_period') as string) || 'monthly';
        const featuresRaw = (formData.get('features') as string) || '';
        const stripeId = (formData.get('stripe_price_id') as string)?.trim() || null;
        const asaasLink = (formData.get('asaas_payment_link') as string)?.trim() || null;
        const mpLink = (formData.get('mercadopago_link') as string)?.trim() || null;
        const isHighlighted = formData.get('is_highlighted') === 'on';
        const sortOrder = parseInt(formData.get('sort_order') as string) || 0;

        if (!name) return { ok: false, error: 'O nome é obrigatório.' };
        if (isNaN(price) || price <= 0) return { ok: false, error: 'Preço inválido.' };

        const features = featuresRaw
            .split('\n')
            .map((f) => f.trim())
            .filter(Boolean);

        const { error } = await supabase
            .from('subscription_plans')
            .update({
                name,
                price,
                original_price: originalPrice ? parseFloat(originalPrice) || null : null,
                billing_period: billingPeriod,
                features,
                stripe_price_id: stripeId,
                asaas_payment_link: asaasLink,
                mercadopago_link: mpLink,
                is_highlighted: isHighlighted,
                sort_order: sortOrder,
            })
            .eq('id', planId);

        if (error) return { ok: false, error: error.message };

        revalidatePath(`/admin/${verticalId}/planos`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
    }
}

// ── Toggle active ──────────────────────────────────────────────

export async function togglePlanActive(
    planId: string,
    verticalId: string,
    isActive: boolean,
): Promise<{ ok: boolean; error?: string }> {
    try {
        await requireAdmin();
        const supabase = createServiceClient();

        const { error } = await supabase
            .from('subscription_plans')
            .update({ is_active: isActive })
            .eq('id', planId);

        if (error) return { ok: false, error: error.message };

        revalidatePath(`/admin/${verticalId}/planos`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
    }
}

// ── Delete plan ────────────────────────────────────────────────

export async function deletePlan(
    planId: string,
    verticalId: string,
): Promise<{ ok: boolean; error?: string }> {
    try {
        await requireAdmin();
        const supabase = createServiceClient();

        const { error } = await supabase
            .from('subscription_plans')
            .delete()
            .eq('id', planId);

        if (error) return { ok: false, error: error.message };

        revalidatePath(`/admin/${verticalId}/planos`);
        return { ok: true };
    } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Erro desconhecido.' };
    }
}
