'use client';

/**
 * Mercado Pago Card Fields — uses individual secure field components.
 *
 * CardNumber, ExpirationDate, SecurityCode are MP-hosted iframes (SAQ A-EP).
 * createCardToken() resolves the token from those mounted secure fields.
 * Raw card data never enters our JS context.
 */

import {
  useImperativeHandle,
  forwardRef,
  useState,
  useCallback,
  useRef,
} from 'react';
import {
  initMercadoPago,
  CardNumber,
  SecurityCode,
  ExpirationDate,
  createCardToken,
} from '@mercadopago/sdk-react';
import type { GatewayCardRef } from './StripeCardFields';

interface MPCardFieldsProps {
  pubKey:       string;
  onCardChange: (info: { brand?: string; complete: boolean }) => void;
  innerRef:     React.Ref<GatewayCardRef>;
  holderName?:  string;
}

// MP SDK uses a different style shape — passing undefined uses the default SDK styles
const fieldStyle = undefined;

const MPCardFieldsInner = forwardRef<GatewayCardRef, {
  pubKey:       string;
  holderName?:  string;
  onCardChange: (info: { brand?: string; complete: boolean }) => void;
}>(({ pubKey, holderName, onCardChange }, ref) => {
  const [mounted, setMounted] = useState({ number: false, expiry: false, cvv: false });
  const allMounted = mounted.number && mounted.expiry && mounted.cvv;

  initMercadoPago(pubKey, { locale: 'pt-BR' });

  const handleReady = useCallback((field: 'number' | 'expiry' | 'cvv') => {
    setMounted((prev) => {
      const next = { ...prev, [field]: true };
      onCardChange({ complete: next.number && next.expiry && next.cvv });
      return next;
    });
  }, [onCardChange]);

  useImperativeHandle(ref, () => ({
    async tokenize() {
      if (!allMounted) return null;
      try {
        const token = await createCardToken({
          cardholderName: holderName ?? '',
        });
        return token?.id ? { token: token.id } : null;
      } catch {
        return null;
      }
    },
  }));

  const wrapClass = 'h-11 px-3.5 flex items-center bg-white border border-slate-200 rounded-xl focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all';
  const labelClass = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Número do Cartão</label>
        <div className={wrapClass}>
          <CardNumber
            placeholder="1234 5678 9012 3456"
            style={fieldStyle}
            onReady={() => handleReady('number')}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Validade</label>
          <div className={wrapClass}>
            <ExpirationDate
              placeholder="MM/AA"
              mode="short"
              style={fieldStyle}
              onReady={() => handleReady('expiry')}
            />
          </div>
        </div>
        <div>
          <label className={labelClass}>CVV</label>
          <div className={wrapClass}>
            <SecurityCode
              placeholder="123"
              style={fieldStyle}
              onReady={() => handleReady('cvv')}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
MPCardFieldsInner.displayName = 'MPCardFieldsInner';

export default function MPCardFields({ pubKey, onCardChange, innerRef, holderName }: MPCardFieldsProps) {
  return (
    <MPCardFieldsInner
      ref={innerRef}
      pubKey={pubKey}
      holderName={holderName}
      onCardChange={onCardChange}
    />
  );
}
