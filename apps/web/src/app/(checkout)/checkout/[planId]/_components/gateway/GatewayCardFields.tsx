'use client';

/**
 * GatewayCardFields — selects the correct tokenization component
 * based on the active gateway. Renders nothing if gateway is null.
 *
 * All three adapters implement the same GatewayCardRef interface,
 * allowing CheckoutOrchestrator to call ref.current.tokenize()
 * without knowing which gateway is active.
 */

import dynamic from 'next/dynamic';
import type { GatewayCardRef } from './StripeCardFields';

// Lazy-load each gateway SDK — only one will be loaded at runtime
const StripeCardFields     = dynamic(() => import('./StripeCardFields'),  { ssr: false });
const AsaasCardFields      = dynamic(() => import('./AsaasCardFields'),   { ssr: false });
const MPCardFields         = dynamic(() => import('./MPCardFields'),      { ssr: false });

export type { GatewayCardRef };

interface GatewayCardFieldsProps {
  gateway:      'stripe' | 'asaas' | 'mercadopago' | null;
  pubKey:       string | null;
  amount:       number;   // BRL float — used by MP
  onCardChange: (info: { brand?: string; last4?: string; expiry?: string; cvcFocused?: boolean; complete: boolean }) => void;
  innerRef:     React.Ref<GatewayCardRef>;
}

export default function GatewayCardFields({
  gateway,
  pubKey,
  amount,
  onCardChange,
  innerRef,
}: GatewayCardFieldsProps) {
  if (!gateway || !pubKey) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">
          Nenhum gateway de pagamento ativo. Configure no painel Admin → Financeiro.
        </p>
      </div>
    );
  }

  if (gateway === 'stripe') {
    return (
      <StripeCardFields
        pubKey={pubKey}
        onCardChange={onCardChange}
        innerRef={innerRef}
      />
    );
  }

  if (gateway === 'asaas') {
    return (
      <AsaasCardFields
        pubKey={pubKey}
        onCardChange={onCardChange}
        innerRef={innerRef}
      />
    );
  }

  if (gateway === 'mercadopago') {
    return (
      <MPCardFields
        pubKey={pubKey}
        onCardChange={onCardChange}
        innerRef={innerRef}
      />
    );
  }

  return null;
}
