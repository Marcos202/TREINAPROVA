'use client';

/**
 * Asaas Card Tokenization Fields
 *
 * Asaas provides a JavaScript SDK (asaas.js) loaded via CDN.
 * The SDK exposes AsaasCardTokenizer which handles card tokenization
 * in-browser — raw card numbers never leave the client to our servers.
 *
 * CDN: https://www.asaas.com/assets/js/asaas.js (production)
 *      https://sandbox.asaas.com/assets/js/asaas.js (sandbox)
 *
 * This component uses masked visual inputs and calls the SDK on submit.
 * For PCI compliance, the SDK handles tokenization internally.
 */

import { useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import Script from 'next/script';
import { IMaskInput } from 'react-imask';
import type { GatewayCardRef } from './StripeCardFields';
import type { Focused } from 'react-credit-cards-2';

interface AsaasCardFieldsProps {
  pubKey:       string;
  onCardChange: (info: {
    number?:   string;
    expiry?:   string;
    last4?:    string;
    focused?:  Focused;
    complete:  boolean;
  }) => void;
  innerRef:     React.Ref<GatewayCardRef>;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AsaasCardTokenizer?: any;
  }
}

const AsaasCardFieldsInner = forwardRef<GatewayCardRef, {
  pubKey: string;
  onCardChange: AsaasCardFieldsProps['onCardChange'];
}>(({ pubKey, onCardChange }, ref) => {
  const [number,   setNumber]   = useState('');
  const [expiry,   setExpiry]   = useState('');
  const [cvc,      setCvc]      = useState('');
  const [holder,   setHolder]   = useState('');
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    if (window.AsaasCardTokenizer) setSdkReady(true);
  }, []);

  // Emit value updates whenever any field changes
  useEffect(() => {
    const cleaned = number.replace(/\s/g, '');
    const allFilled = cleaned.length >= 13
      && expiry.length === 5
      && cvc.length >= 3
      && holder.trim().length >= 3;
    const last4 = cleaned.length >= 4 ? cleaned.slice(-4) : undefined;
    onCardChange({
      number,
      expiry: expiry || undefined,
      last4,
      complete: allFilled,
    });
  }, [number, expiry, cvc, holder, onCardChange]);

  useImperativeHandle(ref, () => ({
    async tokenize() {
      if (!sdkReady || !window.AsaasCardTokenizer) return null;

      const [expMonth, expYear] = expiry.split('/');
      return new Promise((resolve) => {
        const tokenizer = new window.AsaasCardTokenizer({ publicKey: pubKey });
        tokenizer.tokenize({
          holderName:  holder,
          number:      number.replace(/\s/g, ''),
          expiryMonth: expMonth,
          expiryYear:  `20${expYear}`,
          ccv:         cvc,
        }, (tokenData: { creditCardToken: string } | null, err: unknown) => {
          if (err || !tokenData) { resolve(null); return; }
          resolve({ token: tokenData.creditCardToken });
        });
      });
    },
  }));

  const inputClass = 'h-11 px-3.5 w-full bg-white border border-slate-200 rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all';
  const labelClass = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  const emitFocus = (focused: Focused) => onCardChange({ complete: false, focused });
  const emitBlur  = () => onCardChange({ complete: false, focused: '' });

  return (
    <div className="space-y-3">
      <div>
        <label className={labelClass}>Número do Cartão</label>
        <IMaskInput
          mask="0000 0000 0000 0000 000"
          value={number}
          onAccept={(v: string) => setNumber(v)}
          onFocus={() => emitFocus('number')}
          onBlur={emitBlur}
          placeholder="1234 5678 9012 3456"
          className={inputClass}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Validade</label>
          <IMaskInput
            mask="00/00"
            value={expiry}
            onAccept={(v: string) => setExpiry(v)}
            onFocus={() => emitFocus('expiry')}
            onBlur={emitBlur}
            placeholder="MM/AA"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>CVV</label>
          <IMaskInput
            mask="0000"
            value={cvc}
            onAccept={(v: string) => setCvc(v)}
            onFocus={() => emitFocus('cvc')}
            onBlur={emitBlur}
            placeholder="123"
            className={inputClass}
          />
        </div>
      </div>
      <div>
        <label className={labelClass}>Nome do Titular</label>
        <input
          type="text"
          value={holder}
          onChange={(e) => setHolder(e.target.value.toUpperCase())}
          onFocus={() => emitFocus('name')}
          onBlur={emitBlur}
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          className={inputClass}
          autoComplete="cc-name"
        />
      </div>
    </div>
  );
});
AsaasCardFieldsInner.displayName = 'AsaasCardFieldsInner';

export default function AsaasCardFields({ pubKey, onCardChange, innerRef }: AsaasCardFieldsProps) {
  const isDev = process.env.NEXT_PUBLIC_ASAAS_ENV === 'sandbox';

  return (
    <>
      <Script
        src={isDev
          ? 'https://sandbox.asaas.com/assets/js/asaas.js'
          : 'https://www.asaas.com/assets/js/asaas.js'}
        strategy="lazyOnload"
      />
      <AsaasCardFieldsInner
        ref={innerRef}
        pubKey={pubKey}
        onCardChange={onCardChange}
      />
    </>
  );
}
