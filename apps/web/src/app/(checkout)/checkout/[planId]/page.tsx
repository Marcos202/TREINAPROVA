import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { decryptApiKey } from '@/lib/ai/crypto';
import CheckoutOrchestrator from './_components/CheckoutOrchestrator';

export const revalidate = 0;

interface PageProps {
  params: Promise<{ planId: string }>;
}

export default async function CheckoutPage({ params }: PageProps) {
  const { planId } = await params;

  // ── Auth (double-check — middleware already guards) ────────
  const supabase  = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const service = createServiceClient();

  // ── Fetch plan ─────────────────────────────────────────────
  const { data: plan } = await service
    .from('subscription_plans')
    .select('id, name, price, billing_period, vertical_id, is_active')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle();

  if (!plan) notFound();

  // ── User profile (pre-fill form) ───────────────────────────
  const { data: profile } = await service
    .from('profiles')
    .select('full_name, subscription_status')
    .eq('id', user.id)
    .maybeSingle();

  // Redirect PRO users already subscribed to this vertical
  // (allow downgrades / plan changes by skipping this check if needed)

  // ── Active gateway + publishable key (safe to send to client) ──
  const { data: gw } = await service
    .from('payment_gateway_configs')
    .select('gateway_name, pub_key_enc, secret_key_enc')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  let gatewayPubKey: string | null = null;
  if (gw) {
    // Asaas uses the API token (secret_key_enc) as its tokenization key
    // when no separate pub_key_enc is configured.
    const encKey = gw.pub_key_enc ?? (gw.gateway_name === 'asaas' ? gw.secret_key_enc : null);
    if (encKey) {
      try { gatewayPubKey = decryptApiKey(encKey); }
      catch { gatewayPubKey = null; }
    }
  }

  const gateway = (gw?.gateway_name ?? null) as 'stripe' | 'asaas' | 'mercadopago' | null;

  return (
    <div className="min-h-screen bg-[#F4F7FE]">
      {/* ── Minimal checkout header ───────────────────────── */}
      <header className="w-full h-14 bg-white/90 backdrop-blur-sm border-b border-slate-200/60 flex items-center justify-between px-5 sm:px-8">
        <a
          href={`/${plan.vertical_id}/planos`}
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Voltar
        </a>

        <span className="text-[13px] font-bold text-slate-800 tracking-tight">TREINA PROVA</span>

        <div className="flex items-center gap-1.5 text-[11px] font-medium text-green-600">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          Pagamento Seguro
        </div>
      </header>

      {/* ── Form ─────────────────────────────────────────── */}
      <CheckoutOrchestrator
        plan={{
          id:             plan.id,
          name:           plan.name,
          price:          Number(plan.price),
          billing_period: plan.billing_period,
          vertical_id:    plan.vertical_id,
        }}
        userEmail={user.email ?? ''}
        userName={profile?.full_name ?? user.user_metadata?.full_name ?? ''}
        gateway={gateway}
        gatewayPubKey={gatewayPubKey}
      />
    </div>
  );
}
