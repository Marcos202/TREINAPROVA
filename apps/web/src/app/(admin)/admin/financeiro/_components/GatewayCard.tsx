'use client';

import { useState, useTransition } from 'react';
import {
  updateGatewayKey,
  setActiveGateway,
  deactivateAllGateways,
} from '../_actions/gatewayActions';
import type { GatewayRow, GatewayName, KeyType } from '../_actions/gatewayActions';

// ── Gateway metadata ──────────────────────────────────────────

interface GatewayMeta {
  label:          string;
  description:    string;
  hasPublicKey:   boolean;
  secretLabel:    string;
  pubLabel:       string;
  webhookLabel:   string;
  docsUrl:        string;
  color:          string;
  bgLight:        string;
  border:         string;
  activeBorder:   string;
  icon:           React.ReactNode;
}

const GATEWAY_META: Record<GatewayName, GatewayMeta> = {
  stripe: {
    label:        'Stripe',
    description:  'Cartão de Crédito (Internacional)',
    hasPublicKey: true,
    secretLabel:  'Secret Key',
    pubLabel:     'Publishable Key',
    webhookLabel: 'Webhook Signing Secret',
    docsUrl:      'dashboard.stripe.com/apikeys',
    color:        'text-indigo-600',
    bgLight:      'bg-indigo-50',
    border:       'border-gray-100',
    activeBorder: 'border-indigo-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  asaas: {
    label:        'Asaas',
    description:  'PIX & Boleto (Brasil)',
    hasPublicKey: false,
    secretLabel:  'API Token',
    pubLabel:     '',
    webhookLabel: 'Token de Webhook',
    docsUrl:      'docs.asaas.com',
    color:        'text-orange-600',
    bgLight:      'bg-orange-50',
    border:       'border-gray-100',
    activeBorder: 'border-orange-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
        <path d="M9 9h6M9 12h6M9 15h4" />
      </svg>
    ),
  },
  mercadopago: {
    label:        'Mercado Pago',
    description:  'PIX & Cartão (Brasil / LATAM)',
    hasPublicKey: true,
    secretLabel:  'Access Token',
    pubLabel:     'Public Key',
    webhookLabel: 'Webhook Secret',
    docsUrl:      'mercadopago.com.br/developers',
    color:        'text-sky-600',
    bgLight:      'bg-sky-50',
    border:       'border-gray-100',
    activeBorder: 'border-sky-300',
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8M12 8v8" />
      </svg>
    ),
  },
};

// ── KeyField sub-component ────────────────────────────────────

interface KeyFieldProps {
  label:      string;
  masked:     string | null;
  hasKey:     boolean;
  isPending:  boolean;
  onSave:     (value: string) => void;
}

function KeyField({ label, masked, hasKey, isPending, onSave }: KeyFieldProps) {
  const [showInput, setShowInput] = useState(false);
  const [value, setValue]         = useState('');

  function handleSave() {
    if (!value.trim()) return;
    onSave(value.trim());
    setValue('');
    setShowInput(false);
  }

  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 font-mono text-sm text-gray-700 truncate">
          {showInput ? (
            <input
              type="password"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setShowInput(false); setValue(''); } }}
              placeholder="Cole a chave aqui..."
              className="w-full bg-transparent outline-none placeholder-gray-300 text-gray-800"
              autoFocus
            />
          ) : hasKey && masked ? (
            <span>{masked}</span>
          ) : (
            <span className="text-gray-300 italic text-sm">Não configurada</span>
          )}
        </div>
        {showInput ? (
          <>
            <button
              onClick={handleSave}
              disabled={isPending || !value.trim()}
              className="shrink-0 px-3 py-2 text-xs font-semibold bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-40"
            >
              Salvar
            </button>
            <button
              onClick={() => { setShowInput(false); setValue(''); }}
              className="shrink-0 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
            >
              Cancelar
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            disabled={isPending}
            className="shrink-0 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40"
          >
            {hasKey ? 'Atualizar' : 'Adicionar'}
          </button>
        )}
      </div>
    </div>
  );
}

// ── GatewayCard ───────────────────────────────────────────────

interface Props {
  row: GatewayRow;
}

export function GatewayCard({ row }: Props) {
  const meta                            = GATEWAY_META[row.gatewayName];
  const [isPending, startTransition]    = useTransition();
  const [feedback, setFeedback]         = useState<{ type: 'ok' | 'err'; msg: string } | null>(null);

  function flash(type: 'ok' | 'err', msg: string) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  }

  function handleSaveKey(keyType: KeyType) {
    return (value: string) => {
      startTransition(async () => {
        const res = await updateGatewayKey(row.gatewayName, keyType, value);
        if (res.ok) flash('ok', `Chave salva: ${res.masked}`);
        else        flash('err', res.error ?? 'Erro ao salvar chave.');
      });
    };
  }

  function handleSetActive() {
    startTransition(async () => {
      const res = await setActiveGateway(row.gatewayName);
      if (res.ok) flash('ok', `${meta.label} definido como gateway ativo.`);
      else        flash('err', res.error ?? 'Erro ao ativar gateway.');
    });
  }

  function handleDeactivate() {
    startTransition(async () => {
      const res = await deactivateAllGateways();
      if (res.ok) flash('ok', 'Gateway desativado. Nenhum checkout processará pagamentos.');
      else        flash('err', res.error ?? 'Erro ao desativar.');
    });
  }

  const isConfigured = row.hasSecretKey;

  return (
    <div className={`bg-white border rounded-2xl shadow-sm overflow-hidden transition-all duration-200 ${
      row.isActive ? meta.activeBorder : meta.border
    }`}>

      {/* ── Header ── */}
      <div className={`flex items-center justify-between px-6 py-4 border-b ${
        row.isActive ? 'bg-gradient-to-r from-white to-gray-50/50' : ''
      } border-gray-100`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${meta.bgLight} flex items-center justify-center shrink-0 ${meta.color}`}>
            {meta.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-gray-800">{meta.label}</h3>
              {row.isActive && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ativo
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">{meta.description}</p>
          </div>
        </div>

        {/* Active toggle */}
        {row.isActive ? (
          <button
            onClick={handleDeactivate}
            disabled={isPending}
            className="shrink-0 px-3 py-1.5 text-[11px] font-semibold text-gray-500
              bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-40"
            title="Desativar este gateway"
          >
            Desativar
          </button>
        ) : (
          <button
            onClick={handleSetActive}
            disabled={isPending || !isConfigured}
            className={`shrink-0 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-colors disabled:opacity-40
              ${isConfigured
                ? `${meta.color} bg-opacity-10 hover:bg-opacity-20 border border-current border-opacity-20 hover:bg-current`
                : 'text-gray-400 bg-gray-50 border border-gray-200 cursor-not-allowed'}`}
            title={isConfigured ? 'Definir como gateway ativo' : 'Configure a Secret Key primeiro'}
          >
            Definir Ativo
          </button>
        )}
      </div>

      {/* ── Key Fields ── */}
      <div className="px-6 py-5 space-y-4">
        <KeyField
          label={meta.secretLabel}
          masked={row.maskedSecretKey}
          hasKey={row.hasSecretKey}
          isPending={isPending}
          onSave={handleSaveKey('secret')}
        />

        {meta.hasPublicKey && (
          <KeyField
            label={meta.pubLabel}
            masked={row.maskedPubKey}
            hasKey={row.hasPubKey}
            isPending={isPending}
            onSave={handleSaveKey('pub')}
          />
        )}

        <KeyField
          label={meta.webhookLabel}
          masked={row.maskedWebhookSecret}
          hasKey={row.hasWebhookSecret}
          isPending={isPending}
          onSave={handleSaveKey('webhook')}
        />

        <p className="text-[11px] text-gray-400 pt-1">
          Documentação:{' '}
          <span className={`font-medium ${meta.color}`}>{meta.docsUrl}</span>
        </p>
      </div>

      {/* ── Feedback ── */}
      {feedback && (
        <div className={`mx-6 mb-4 px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 ${
          feedback.type === 'ok'
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {feedback.type === 'ok'
            ? <CheckIcon className="w-4 h-4 shrink-0" />
            : <XIcon     className="w-4 h-4 shrink-0" />}
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

/* ── Icons ── */
function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
    </svg>
  );
}
