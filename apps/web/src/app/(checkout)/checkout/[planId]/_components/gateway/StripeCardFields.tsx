'use client';

import { useEffect, useState, useImperativeHandle, forwardRef } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';

export interface GatewayCardRef {
  tokenize: () => Promise<{ token: string; brand?: string; last4?: string } | null>;
}

interface CardFieldsInnerProps {
  onCardChange: (info: { brand?: string; last4?: string; complete: boolean }) => void;
}

const ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '14px',
      color: '#1e293b',
      fontFamily: 'inherit',
      '::placeholder': { color: '#94a3b8' },
    },
    invalid: { color: '#ef4444' },
  },
};

const CardFieldsInner = forwardRef<GatewayCardRef, CardFieldsInnerProps>(
  ({ onCardChange }, ref) => {
    const stripe   = useStripe();
    const elements = useElements();

    useImperativeHandle(ref, () => ({
      async tokenize() {
        if (!stripe || !elements) return null;
        const cardNumber = elements.getElement(CardNumberElement);
        if (!cardNumber) return null;

        const { paymentMethod, error } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardNumber,
        });

        if (error || !paymentMethod) return null;
        return {
          token: paymentMethod.id,
          brand: paymentMethod.card?.brand,
          last4: paymentMethod.card?.last4,
        };
      },
    }));

    return (
      <div className="space-y-3">
        {/* Card number */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
            Número do Cartão
          </label>
          <div className="h-11 px-3.5 flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
            <CardNumberElement
              options={ELEMENT_OPTIONS}
              className="w-full"
              onChange={(e) =>
                onCardChange({ brand: e.brand, complete: e.complete })
              }
            />
          </div>
        </div>

        {/* Expiry + CVC */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              Validade
            </label>
            <div className="h-11 px-3.5 flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <CardExpiryElement options={ELEMENT_OPTIONS} className="w-full" />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
              CVV
            </label>
            <div className="h-11 px-3.5 flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <CardCvcElement options={ELEMENT_OPTIONS} className="w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }
);
CardFieldsInner.displayName = 'CardFieldsInner';

// ── Public wrapper with Stripe provider ───────────────────────

interface StripeCardFieldsProps {
  pubKey:       string;
  onCardChange: (info: { brand?: string; last4?: string; complete: boolean }) => void;
  innerRef:     React.Ref<GatewayCardRef>;
}

export default function StripeCardFields({ pubKey, onCardChange, innerRef }: StripeCardFieldsProps) {
  const [stripePromise] = useState(() => loadStripe(pubKey));

  return (
    <Elements stripe={stripePromise}>
      <CardFieldsInner ref={innerRef} onCardChange={onCardChange} />
    </Elements>
  );
}
