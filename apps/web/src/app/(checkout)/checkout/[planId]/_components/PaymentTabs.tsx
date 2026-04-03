'use client';

import { useRef, useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { CheckoutFormInput } from '@/lib/billing/checkoutSchema';
import CardPreview from './CardPreview';
import GatewayCardFields, { type GatewayCardRef } from './gateway/GatewayCardFields';

type PaymentMethod = 'card' | 'pix' | 'boleto';

interface PaymentTabsProps {
  gateway:          'stripe' | 'asaas' | 'mercadopago' | null;
  gatewayPubKey:    string | null;
  planAmount:       number;   // BRL float
  holderName:       string;   // synced from fullName field
  installments:     number;
  setValue:         UseFormSetValue<CheckoutFormInput>;
  cardFieldRef:     React.MutableRefObject<GatewayCardRef | null>;
}

const TABS: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  {
    id: 'card',
    label: 'Cartão',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" />
      </svg>
    ),
  },
  {
    id: 'pix',
    label: 'PIX',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
      </svg>
    ),
  },
  {
    id: 'boleto',
    label: 'Boleto',
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 5v14" /><path d="M7 5v14" /><path d="M11 5v14" /><path d="M15 5v14" /><path d="M19 5v14" /><path d="M5 5v14" /><path d="M9 5v14" /><path d="M13 5v14" /><path d="M17 5v14" /><path d="M21 5v14" />
      </svg>
    ),
  },
];

export default function PaymentTabs({
  gateway,
  gatewayPubKey,
  planAmount,
  holderName,
  installments,
  setValue,
  cardFieldRef,
}: PaymentTabsProps) {
  const [activeTab, setActiveTab]   = useState<PaymentMethod>('card');
  const [cardBrand, setCardBrand]   = useState<string | undefined>();
  const [cardLast4, setCardLast4]   = useState<string | undefined>();
  const [cvcFocused, setCvcFocused] = useState(false);

  const isStripeUnsupported = (m: PaymentMethod) =>
    gateway === 'stripe' && (m === 'pix' || m === 'boleto');

  function handleTabClick(method: PaymentMethod) {
    if (isStripeUnsupported(method)) return;
    setActiveTab(method);
    setValue('paymentMethod', method);
  }

  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n     = i + 1;
    const label = n === 1
      ? `1x de R$ ${planAmount.toFixed(2)} (à vista)`
      : `${n}x de R$ ${(planAmount / n).toFixed(2)}`;
    return { value: n, label };
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" />
          </svg>
        </div>
        <h3 className="text-[14px] font-bold text-slate-800">Método de Pagamento</h3>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {TABS.map((tab) => {
          const disabled = isStripeUnsupported(tab.id);
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              disabled={disabled}
              onClick={() => handleTabClick(tab.id)}
              title={disabled ? 'Indisponível com o gateway atual' : undefined}
              className={`
                flex items-center justify-center gap-2 h-11 rounded-xl text-[13px] font-semibold
                border transition-all duration-150
                ${isActive
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : disabled
                    ? 'bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Card tab ── */}
      {activeTab === 'card' && (
        <div className="space-y-4">
          {/* Card preview */}
          <CardPreview
            holderName={holderName}
            brand={cardBrand}
            last4={cardLast4}
            isFlipped={cvcFocused}
          />

          {/* Gateway fields */}
          <div onFocus={(e) => {
            const el = e.target as HTMLElement;
            setCvcFocused(el.getAttribute('data-elements-stable-field-name') === 'cardCvc');
          }}>
            <GatewayCardFields
              gateway={gateway}
              pubKey={gatewayPubKey}
              amount={planAmount}
              onCardChange={({ brand, last4 }) => {
                if (brand) setCardBrand(brand);
                if (last4) setCardLast4(last4);
              }}
              innerRef={cardFieldRef}
            />
          </div>

          {/* Installments */}
          {gateway !== null && (
            <div>
              <label className="block text-[12px] font-semibold text-slate-600 mb-1.5">
                Parcelas
              </label>
              <select
                value={installments}
                onChange={(e) => setValue('installments', Number(e.target.value))}
                className="h-11 px-3.5 w-full bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer"
              >
                {installmentOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* ── PIX tab ── */}
      {activeTab === 'pix' && (
        <div className="rounded-xl border border-slate-200 p-4 flex gap-4">
          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #00b4a0, #00897b)' }}>
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="m21 16-4 4-4-4" /><path d="M17 20V4" /><path d="m3 8 4-4 4 4" /><path d="M7 4v16" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-800">Pagamento via PIX</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Aprovação instantânea</p>
            <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
              Ao clicar em <strong>"Pagar agora"</strong>, você será direcionado para uma página
              com o QR Code e o código PIX Copia e Cola para finalizar seu pagamento de
              forma <span className="text-teal-600 font-medium">rápida e segura</span>.
            </p>
          </div>
        </div>
      )}

      {/* ── Boleto tab ── */}
      {activeTab === 'boleto' && (
        <div className="rounded-xl border border-slate-200 p-4 flex gap-4">
          <div className="w-11 h-11 rounded-xl flex-shrink-0 bg-slate-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5v14" /><path d="M7 5v14" /><path d="M11 5v14" /><path d="M15 5v14" /><path d="M19 5v14" />
            </svg>
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-800">Boleto Bancário</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Pagamento tradicional e confiável</p>
            <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
              Você será direcionado para a página com o boleto para pagamento
              em qualquer banco, lotérica ou pelo app do seu banco.{' '}
              <strong>Pode levar até 3 dias úteis para compensar.</strong>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
