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
    number?:  string;
    expiry?:  string;
    name?:    string;
    cvc?:     string;   // displayed as dots — never the real value
    last4?:   string;
    focused?: Focused;
    complete: boolean;
  }) => void;
  innerRef:     React.Ref<GatewayCardRef>;
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    AsaasCardTokenizer?: any;
  }
}

/** Validate MM/AA expiry. Returns an error message or '' if valid. */
function validateExpiry(val: string): string {
  if (val.length < 5) return '';
  const [mm, yy] = val.split('/');
  const month = parseInt(mm, 10);
  if (isNaN(month) || month < 1 || month > 12) return 'Mês inválido (01–12)';
  const year  = 2000 + parseInt(yy, 10);
  const now   = new Date();
  const exp   = new Date(year, month - 1, 1);           // first day of exp. month
  const first = new Date(now.getFullYear(), now.getMonth(), 1); // first day of current month
  if (exp < first) return 'Cartão vencido';
  return '';
}

const AsaasCardFieldsInner = forwardRef<GatewayCardRef, {
  pubKey: string;
  onCardChange: AsaasCardFieldsProps['onCardChange'];
}>(({ pubKey, onCardChange }, ref) => {
  const [number,      setNumber]      = useState('');
  const [expiry,      setExpiry]      = useState('');
  const [expiryError, setExpiryError] = useState('');
  const [cvc,         setCvc]         = useState('');
  const [holder,      setHolder]      = useState('');
  const [sdkReady,    setSdkReady]    = useState(false);

  useEffect(() => {
    if (window.AsaasCardTokenizer) setSdkReady(true);
  }, []);

  // Emit full visual state whenever any field changes
  useEffect(() => {
    const cleaned  = number.replace(/\s/g, '');
    const errExp   = expiry.length === 5 ? validateExpiry(expiry) : '';
    const allFilled = cleaned.length >= 13
      && expiry.length === 5
      && errExp === ''
      && cvc.length >= 3
      && holder.trim().length >= 3;
    const last4 = cleaned.length >= 4 ? cleaned.slice(-4) : undefined;
    onCardChange({
      number,
      expiry:  expiry || undefined,
      name:    holder || undefined,
      cvc:     cvc ? '•'.repeat(cvc.length) : undefined,
      last4,
      complete: allFilled,
    });
  }, [number, expiry, cvc, holder, onCardChange]);

  useImperativeHandle(ref, () => ({
    async tokenize() {
      if (!sdkReady || !window.AsaasCardTokenizer) return null;
      const err = validateExpiry(expiry);
      if (err) return null;

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

  const inputBase = 'h-11 px-3.5 w-full bg-white border rounded-xl text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 transition-all';
  const inputOk   = `${inputBase} border-slate-200 focus:border-blue-500 focus:ring-blue-500`;
  const inputErr  = `${inputBase} border-red-400 focus:border-red-500 focus:ring-red-500`;
  const labelClass = 'block text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5';

  const emitFocus = (focused: Focused) => onCardChange({ complete: false, focused });
  const emitBlur  = () => onCardChange({ complete: false, focused: '' });

  return (
    <div className="space-y-3">
      {/* Número do Cartão */}
      <div>
        <label className={labelClass}>Número do Cartão</label>
        <IMaskInput
          mask="0000 0000 0000 0000 000"
          value={number}
          onAccept={(v: string) => setNumber(v)}
          onFocus={() => emitFocus('number')}
          onBlur={emitBlur}
          placeholder="1234 5678 9012 3456"
          className={inputOk}
        />
      </div>

      {/* Validade + CVV */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelClass}>Validade</label>
          <IMaskInput
            mask="00/00"
            value={expiry}
            onAccept={(v: string) => {
              setExpiry(v);
              setExpiryError(validateExpiry(v));
            }}
            onFocus={() => emitFocus('expiry')}
            onBlur={emitBlur}
            placeholder="MM/AA"
            className={expiryError ? inputErr : inputOk}
          />
          {expiryError && (
            <p className="mt-1 text-[11px] text-red-500">{expiryError}</p>
          )}
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
            className={inputOk}
          />
        </div>
      </div>

      {/* Nome do Titular */}
      <div>
        <label className={labelClass}>Nome do Titular</label>
        <input
          type="text"
          value={holder}
          onChange={(e) => setHolder(e.target.value.toUpperCase())}
          onFocus={() => emitFocus('name')}
          onBlur={emitBlur}
          placeholder="NOME COMO ESTÁ NO CARTÃO"
          className={inputOk}
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
