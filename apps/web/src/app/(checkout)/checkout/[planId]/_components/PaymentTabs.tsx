'use client';

import { useState } from 'react';
import type { UseFormSetValue } from 'react-hook-form';
import type { CheckoutFormInput } from '@/lib/billing/checkoutSchema';
import type { Focused } from 'react-credit-cards-2';
import ReactCreditCards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import GatewayCardFields, { type GatewayCardRef } from './gateway/GatewayCardFields';

type PaymentMethod = 'card' | 'pix' | 'boleto';

interface PaymentTabsProps {
  gateway:       'stripe' | 'asaas' | 'mercadopago' | null;
  gatewayPubKey: string | null;
  planAmount:    number;
  holderName:    string;
  installments:  number;
  setValue:      UseFormSetValue<CheckoutFormInput>;
  cardFieldRef:  React.MutableRefObject<GatewayCardRef | null>;
}

// PIX official logo SVG (simplified, color #32bcad)
function PixLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none">
      <path
        d="M112.57 391.19c20.056 0 38.928-7.808 53.12-22l76.693-76.692c5.385-5.384 14.765-5.378 20.14 0l76.989 76.989c14.192 14.192 33.064 22 53.12 22h15.139l-97.138 97.139c-29.22 29.22-76.6 29.22-105.82 0l-97.43-97.436h5.187z"
        fill="#32bcad"
      />
      <path
        d="M112.57 120.81h-5.187l97.43-97.43c29.22-29.22 76.6-29.22 105.82 0l97.138 97.13h-15.139c-20.056 0-38.928 7.808-53.12 22l-76.989 76.989c-5.55 5.55-14.59 5.55-20.14 0l-76.693-76.693c-14.192-14.191-33.064-21.996-53.12-21.996z"
        fill="#32bcad"
      />
      <path
        d="M488.06 210.18l-54.454-54.454h-40.97c-13.664 0-26.888 5.535-36.412 15.059l-76.989 76.989c-14.273 14.274-37.386 14.275-51.66 0l-76.693-76.693c-9.524-9.524-22.748-15.059-36.412-15.059h-46.5L23.94 210.18c-29.22 29.22-29.22 76.6 0 105.82l43.027 43.027h46.5c13.664 0 26.888-5.535 36.412-15.059l76.693-76.693c14.273-14.274 37.386-14.274 51.66 0l76.989 76.989c9.524 9.524 22.748 15.059 36.412 15.059h40.97l54.454-54.323c29.22-29.22 29.22-76.6 0-105.82z"
        fill="#32bcad"
      />
    </svg>
  );
}

const TABS: { id: PaymentMethod; label: string }[] = [
  { id: 'card',   label: 'Cartão'  },
  { id: 'pix',    label: 'PIX'     },
  { id: 'boleto', label: 'Boleto'  },
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
  const [activeTab,   setActiveTab]  = useState<PaymentMethod>('card');
  const [cardNumber,  setCardNumber]  = useState('');
  const [cardExpiry,  setCardExpiry]  = useState('');
  const [cardName,    setCardName]    = useState('');
  const [cardCvc,     setCardCvc]     = useState('');
  const [cardFocused, setCardFocused] = useState<Focused>('');

  const isStripeUnsupported = (m: PaymentMethod) =>
    gateway === 'stripe' && (m === 'pix' || m === 'boleto');

  function handleTabClick(method: PaymentMethod) {
    if (isStripeUnsupported(method)) return;
    setActiveTab(method);
    setValue('paymentMethod', method);
  }

  const installmentOptions = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    return {
      value: n,
      label: n === 1
        ? `1x de R$ ${planAmount.toFixed(2).replace('.', ',')} (à vista)`
        : `${n}x de R$ ${(planAmount / n).toFixed(2).replace('.', ',')}`,
    };
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
              {tab.id === 'card' && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" />
                </svg>
              )}
              {tab.id === 'pix' && <PixLogo size={16} />}
              {tab.id === 'boleto' && (
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14" />
                </svg>
              )}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Card tab ── */}
      {activeTab === 'card' && (
        <div className="space-y-4">
          {/* react-credit-cards-2 preview */}
          <div className="flex justify-center">
            <ReactCreditCards
              number={cardNumber}
              name={cardName || holderName.toUpperCase() || 'NOME DO TITULAR'}
              expiry={cardExpiry}
              cvc={cardCvc || '•••'}
              focused={cardFocused}
              placeholders={{ name: 'NOME DO TITULAR' }}
              locale={{ valid: 'Válido até' }}
            />
          </div>

          {/* Gateway fields */}
          <div
            onFocus={(e) => {
              // Stripe Elements: detect CVC focus via data attribute on iframe container
              const el = e.target as HTMLElement;
              if (el.getAttribute('data-elements-stable-field-name') === 'cardCvc') {
                setCardFocused('cvc');
              }
            }}
            onBlur={(e) => {
              const el = e.target as HTMLElement;
              if (el.getAttribute('data-elements-stable-field-name') === 'cardCvc') {
                setCardFocused('');
              }
            }}
          >
            <GatewayCardFields
              gateway={gateway}
              pubKey={gatewayPubKey}
              amount={planAmount}
              onCardChange={({ number, expiry, name, cvc, focused }) => {
                if (number  !== undefined) setCardNumber(number);
                if (expiry  !== undefined) setCardExpiry(expiry);
                if (name    !== undefined) setCardName(name.toUpperCase());
                if (cvc     !== undefined) setCardCvc(cvc);
                if (focused !== undefined) setCardFocused(focused);
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
          <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center bg-[#e8f9f7]">
            <PixLogo size={28} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-slate-800">Pagamento via PIX</p>
            <p className="text-[12px] text-slate-500 mt-0.5">Aprovação instantânea</p>
            <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
              Ao clicar em <strong>"Pagar agora"</strong>, você será direcionado para uma página
              com o QR Code e o código PIX Copia e Cola para finalizar seu pagamento de
              forma <span className="font-medium" style={{ color: '#32bcad' }}>rápida e segura</span>.
            </p>
          </div>
        </div>
      )}

      {/* ── Boleto tab ── */}
      {activeTab === 'boleto' && (
        <div className="rounded-xl border border-slate-200 p-4 flex gap-4">
          <div className="w-11 h-11 rounded-xl flex-shrink-0 bg-slate-700 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5v14M7 5v14M11 5v14M15 5v14M19 5v14" />
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
