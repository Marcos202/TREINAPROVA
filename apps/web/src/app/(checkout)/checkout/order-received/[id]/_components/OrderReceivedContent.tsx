'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { checkOrderStatus } from '../_actions/checkOrderStatus';

interface OrderReceivedContentProps {
  id:             string;
  orderKey:       string;
  paymentMethod:  'pix' | 'boleto' | 'card';
  planAmount:     number;
  tenantId:       string;
  // PIX
  pixQrCode?:     string;
  pixCopyPaste?:  string;
  // Boleto
  boletoUrl?:     string;
  boletoBarcode?: string;
}

const PIX_EXPIRY_SECONDS = 15 * 60; // 15 minutes

function formatTimer(s: number): string {
  const m = Math.floor(s / 60).toString().padStart(2, '0');
  const sec = (s % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

function formatOrderId(id: string): string {
  return id.replace(/-/g, '').toUpperCase().slice(0, 8);
}

// ── PIX Logo SVG ──────────────────────────────────────────────
function PixLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <path d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.384 14.765-5.378 20.14 0l76.989 76.989c14.192 14.192 33.064 22 53.12 22h15.139l-97.138 97.139c-29.22 29.22-76.6 29.22-105.82 0l-97.43-97.436h5.187z" fill="#32bcad" />
      <path d="M112.57 120.81h-5.187l97.43-97.43c29.22-29.22 76.6-29.22 105.82 0l97.138 97.13h-15.139c-20.056 0-38.928 7.808-53.12 22l-76.989 76.989c-5.55 5.55-14.59 5.55-20.14 0l-76.693-76.693c-14.192-14.191-33.064-21.996-53.12-21.996z" fill="#32bcad" />
      <path d="M488.06 210.18l-54.454-54.454h-40.97c-13.664 0-26.888 5.535-36.412 15.059l-76.989 76.989c-14.273 14.274-37.386 14.275-51.66 0l-76.693-76.693c-9.524-9.524-22.748-15.059-36.412-15.059h-46.5L23.94 210.18c-29.22 29.22-29.22 76.6 0 105.82l43.027 43.027h46.5c13.664 0 26.888-5.535 36.412-15.059l76.693-76.693c14.273-14.274 37.386-14.274 51.66 0l76.989 76.989c9.524 9.524 22.748 15.059 36.412 15.059h40.97l54.454-54.323c29.22-29.22 29.22-76.6 0-105.82z" fill="#32bcad" />
    </svg>
  );
}

export default function OrderReceivedContent({
  id,
  orderKey,
  paymentMethod,
  planAmount,
  tenantId,
  pixQrCode,
  pixCopyPaste,
  boletoUrl,
  boletoBarcode,
}: OrderReceivedContentProps) {
  const router = useRouter();
  const [isPaid,   setIsPaid]   = useState(false);
  const [seconds,  setSeconds]  = useState(PIX_EXPIRY_SECONDS);
  const [expired,  setExpired]  = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollRef     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Countdown timer (PIX only) ────────────────────────────
  useEffect(() => {
    if (paymentMethod !== 'pix' || isPaid) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          clearInterval(intervalRef.current!);
          setExpired(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [paymentMethod, isPaid]);

  // ── Auto-polling every 5 s ────────────────────────────────
  const poll = useCallback(async () => {
    const result = await checkOrderStatus(id, orderKey);
    if (result.status === 'active') {
      setIsPaid(true);
      clearInterval(pollRef.current!);
    }
  }, [id, orderKey]);

  useEffect(() => {
    if (isPaid || expired) return;
    // Initial check
    poll();
    pollRef.current = setInterval(poll, 5000);
    return () => clearInterval(pollRef.current!);
  }, [poll, isPaid, expired]);

  const copyText = (text: string, label = 'Código copiado!') => {
    navigator.clipboard.writeText(text).then(() => toast.success(label));
  };

  const shortId = formatOrderId(id);
  const formattedAmount = `R$ ${planAmount.toFixed(2).replace('.', ',')}`;

  // ── Paid state ────────────────────────────────────────────
  if (isPaid) {
    return (
      <div className="flex flex-col items-center gap-5 text-center py-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <h2 className="text-[20px] font-extrabold text-slate-900">Pagamento Confirmado!</h2>
          <p className="text-[13px] text-slate-500 mt-1">Seu acesso PRO foi liberado. Bom estudo!</p>
        </div>
        <button
          onClick={() => router.push(`/${tenantId}?success=true`)}
          className="w-full max-w-xs h-12 rounded-2xl bg-[#00a650] hover:bg-[#009644] text-white text-[15px] font-bold transition-colors"
        >
          Ir ao Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Order summary ───────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pedido</p>
          <p className="text-[15px] font-bold text-slate-800 font-mono">#{shortId}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
          <p className="text-[22px] font-extrabold text-slate-900">{formattedAmount}</p>
        </div>
      </div>

      {/* ── PIX section ─────────────────────────────────────── */}
      {paymentMethod === 'pix' && (
        <div className="space-y-4">
          {/* Status badge + timer */}
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span className="text-[13px] font-semibold text-amber-700">
                {expired ? 'PIX expirado' : 'Aguardando pagamento'}
              </span>
            </div>
            {!expired && (
              <span className="font-mono text-[13px] font-bold text-amber-700">
                {formatTimer(seconds)}
              </span>
            )}
          </div>

          {/* QR Code */}
          {pixQrCode && !expired && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 mb-1">
                <PixLogo size={18} />
                <p className="text-[13px] font-semibold text-slate-600">Escaneie com o app do seu banco</p>
              </div>
              <div className="p-3 bg-white border-2 border-slate-200 rounded-2xl inline-block shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${pixQrCode}`}
                  alt="QR Code PIX"
                  className="w-52 h-52 sm:w-60 sm:h-60"
                />
              </div>
            </div>
          )}

          {/* PIX copy-paste */}
          {pixCopyPaste && !expired && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                PIX Copia e Cola
              </p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-600 break-all leading-relaxed">
                {pixCopyPaste}
              </div>
              <button
                type="button"
                onClick={() => copyText(pixCopyPaste, 'Código PIX copiado!')}
                className="w-full h-11 rounded-xl flex items-center justify-center gap-2 font-bold text-[13px] text-white transition-colors"
                style={{ background: '#32bcad' }}
              >
                <PixLogo size={16} />
                Copiar código PIX
              </button>
            </div>
          )}

          {expired && (
            <div className="text-center py-4">
              <p className="text-[14px] text-slate-500">O QR Code expirou.</p>
              <button
                onClick={() => router.push(`/${tenantId}/planos`)}
                className="mt-3 text-[13px] text-blue-600 underline underline-offset-2"
              >
                Gerar novo pedido
              </button>
            </div>
          )}

          {/* Auto-check notice */}
          {!expired && (
            <div className="flex items-center justify-center gap-2 text-slate-400">
              <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span className="text-[11px]">Verificando pagamento automaticamente…</span>
            </div>
          )}
        </div>
      )}

      {/* ── Boleto section ──────────────────────────────────── */}
      {paymentMethod === 'boleto' && (
        <div className="space-y-4">
          {/* Status badge */}
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[13px] font-semibold text-blue-700">Boleto gerado — válido por 3 dias úteis</span>
          </div>

          {/* Barcode */}
          {boletoBarcode && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Linha Digitável</p>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-[11px] text-slate-600 break-all leading-relaxed">
                {boletoBarcode}
              </div>
              <button
                type="button"
                onClick={() => copyText(boletoBarcode, 'Linha digitável copiada!')}
                className="w-full h-11 rounded-xl border border-slate-300 text-slate-700 text-[13px] font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
                Copiar código
              </button>
            </div>
          )}

          {/* Download PDF */}
          {boletoUrl && (
            <a
              href={boletoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-12 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-[14px] font-bold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              Baixar Boleto PDF
            </a>
          )}

          {/* Auto-check */}
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <svg className="w-3.5 h-3.5 animate-spin flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span className="text-[11px]">Verificando pagamento automaticamente…</span>
          </div>
        </div>
      )}

      {/* ── Footer ──────────────────────────────────────────── */}
      <div className="border-t border-slate-100 pt-4 text-center">
        <p className="text-[11px] text-slate-400">
          Após confirmação, seu acesso PRO será liberado automaticamente.
        </p>
        <button
          type="button"
          onClick={() => router.push(`/${tenantId}`)}
          className="mt-2 text-[12px] text-slate-400 hover:text-slate-600 underline underline-offset-2 transition-colors"
        >
          Ir ao dashboard (acesso liberado após pagamento)
        </button>
      </div>
    </div>
  );
}
