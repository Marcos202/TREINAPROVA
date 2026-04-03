import { notFound } from 'next/navigation';
import { createServiceClient } from '@/lib/supabase/service';
import OrderReceivedContent from './_components/OrderReceivedContent';

export const revalidate = 0;

interface PageProps {
  params:      Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}

export default async function OrderReceivedPage({ params, searchParams }: PageProps) {
  const { id }  = await params;
  const { key } = await searchParams;

  // ── Security: validate id + order_key ─────────────────────
  if (!id || !key) notFound();

  const service = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub } = await (service as any)
    .from('billing_subscriptions')
    .select(
      'id, order_key, status, payment_method, plan_amount, tenant_id, ' +
      'pix_qr_code, pix_copy_paste, boleto_url, boleto_barcode'
    )
    .eq('id', id)
    .maybeSingle() as { data: Record<string, string | null> | null };

  // Validate row exists and key matches
  if (!sub || sub['order_key'] !== key) notFound();

  // Card payments should not land here (they redirect straight to dashboard)
  const paymentMethod = ((sub['payment_method'] ?? 'pix') as 'pix' | 'boleto' | 'card');
  const planAmount    = Number(sub['plan_amount'] ?? 0);
  const tenantId      = (sub['tenant_id'] ?? 'med') as string;

  // Short display ID (first 8 hex chars of UUID, no dashes)
  const displayId = id.replace(/-/g, '').toUpperCase().slice(0, 8);

  return (
    <div className="min-h-screen bg-[#F4F7FE]">
      {/* ── Minimal header ──────────────────────────────────── */}
      <header className="w-full h-14 bg-white/90 backdrop-blur-sm border-b border-slate-200/60
                         flex items-center justify-between px-5 sm:px-8">
        <a
          href={`/${tenantId}/planos`}
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

      {/* ── Content ─────────────────────────────────────────── */}
      <main className="flex justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md">
          {/* Page title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h1 className="text-[20px] font-extrabold text-slate-900">Pedido Recebido!</h1>
            <p className="text-[13px] text-slate-500 mt-1">
              {paymentMethod === 'pix'
                ? 'Escaneie o QR Code ou copie o código PIX para pagar.'
                : 'Baixe ou copie o boleto para realizar o pagamento.'}
            </p>
          </div>

          {/* Main card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <OrderReceivedContent
              id={id}
              orderKey={key}
              paymentMethod={paymentMethod}
              planAmount={planAmount}
              tenantId={tenantId}
              pixQrCode={sub['pix_qr_code'] ?? undefined}
              pixCopyPaste={sub['pix_copy_paste'] ?? undefined}
              boletoUrl={sub['boleto_url'] ?? undefined}
              boletoBarcode={sub['boleto_barcode'] ?? undefined}
            />
          </div>

          {/* Order number badge */}
          <p className="text-center text-[11px] text-slate-400 mt-4">
            Pedido <span className="font-mono font-semibold">#{displayId}</span>
          </p>
        </div>
      </main>
    </div>
  );
}
