import { notFound } from 'next/navigation';
import { TENANT_LABELS, TENANT_THEME, VALID_TENANTS } from '@/config/tenants';
import { createClient } from '@/lib/supabase/server';
import { getPublicPlans } from './_actions/publicPlanActions';
import PaywallClient from './_components/PaywallClient';

export const revalidate = 0;

interface PlanosPageProps {
    params: Promise<{ tenant: string }>;
}

export default async function PlanosPage({ params }: PlanosPageProps) {
    const { tenant } = await params;

    if (!VALID_TENANTS.includes(tenant)) notFound();

    const label = TENANT_LABELS[tenant] || tenant.toUpperCase();
    const theme = TENANT_THEME[tenant] ?? TENANT_THEME['med'];

    // Verifica sessão server-side — página é pública, botão requer auth
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const isAuthenticated = !!user;

    const { plans } = await getPublicPlans(tenant);

    return (
        <PaywallClient
            tenant={tenant}
            tenantLabel={label}
            theme={theme}
            plans={plans}
            isAuthenticated={isAuthenticated}
        />
    );
}
