'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShieldCheck, Zap, RotateCcw, Headphones } from 'lucide-react';
import { CheckoutFormSchema, type CheckoutFormInput } from '@/lib/billing/checkoutSchema';
import { processCheckout } from '../_actions/processCheckout';
import PersonalInfoBlock from './PersonalInfoBlock';
import EmailBlock from './EmailBlock';
import PaymentTabs from './PaymentTabs';
import type { GatewayCardRef } from './gateway/GatewayCardFields';
import { toast } from 'sonner';

interface Plan {
  id:             string;
  name:           string;
  price:          number;
  billing_period: string;
  vertical_id:    string;
}

interface CheckoutOrchestratorProps {
  plan:          Plan;
  userEmail:     string;
  userName:      string;
  userPhone:     string;
  userDocument:  string;
  gateway:       'stripe' | 'asaas' | 'mercadopago' | null;
  gatewayPubKey: string | null;
}

const BILLING_LABELS: Record<string, string> = {
  monthly: 'Mensal', quarterly: 'Trimestral',
  semiannual: 'Semestral', annual: 'Anual',
};

export default function CheckoutOrchestrator({
  plan, userEmail, userName, userPhone, userDocument, gateway, gatewayPubKey,
}: CheckoutOrchestratorProps) {
  const router      = useRouter();
  const cardRef     = useRef<GatewayCardRef | null>(null);
  const [busy, setBusy] = useState(false);

  const { register, handleSubmit, control, setValue, formState: { errors } } = useForm<CheckoutFormInput>({
    resolver: zodResolver(CheckoutFormSchema),
    defaultValues: {
      fullName:      userName,
      email:         userEmail,
      phone:         userPhone,
      document:      userDocument,
      paymentMethod: 'card',
      planId:        plan.id,
      installments:  1,
      gatewayToken:  '',
    },
  });

  const [watchedName, , watchedInstallments] = [
    useWatch({ control, name: 'fullName' }),
    useWatch({ control, name: 'paymentMethod' }),
    useWatch({ control, name: 'installments' }),
  ];

  async function onSubmit(data: CheckoutFormInput) {
    setBusy(true);
    try {
      if (data.paymentMethod === 'card') {
        if (!cardRef.current) {
          toast.error('Campos do cartão não carregados. Recarregue a página.');
          return;
        }
        const tokenResult = await cardRef.current.tokenize();
        if (!tokenResult) {
          toast.error('Não foi possível tokenizar o cartão. Verifique os dados.');
          return;
        }
        data.gatewayToken = tokenResult.token;
      }

      const result = await processCheckout(data);

      if (result.blocked) {
        toast.error(result.error ?? 'Limite de tentativas atingido.');
        return;
      }
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.redirectTo) {
        router.push(result.redirectTo);
      }
    } catch {
      toast.error('Erro inesperado. Tente novamente em alguns segundos.');
    } finally {
      setBusy(false);
    }
  }

  const gatewayLabel =
    gateway === 'stripe' ? 'Stripe' :
    gateway === 'asaas' ? 'Asaas' :
    gateway === 'mercadopago' ? 'Mercado Pago' : 'Gateway';

  void gatewayLabel; // available for other uses if needed
  const trustItems = [
    { Icon: ShieldCheck, text: 'Pagamento 100% seguro',               color: 'text-green-600' },
    { Icon: Zap,         text: 'Acesso imediato após a confirmação',          color: 'text-blue-600'  },
    { Icon: RotateCcw,   text: 'Cancele quando quiser',                       color: 'text-amber-600' },
    { Icon: Headphones,  text: 'Suporte 24 horas',                            color: 'text-purple-600'},
  ];

  return (
    <div className="max-w-5xl mx-auto px-3 py-5 sm:px-4 sm:py-6 lg:py-10">
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

        {/* ── LEFT: sticky plan summary sidebar (4 cols) ─── */}
        <aside className="hidden lg:block lg:col-span-4 sticky top-6">
          {/* Plan card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              Você está assinando
            </p>
            <div>
              <h2 className="text-[18px] font-extrabold text-slate-900 leading-tight">
                Treina Prova PRO
              </h2>
              <p className="text-[13px] text-slate-500 mt-0.5">
                {BILLING_LABELS[plan.billing_period] ?? plan.billing_period}
              </p>
            </div>
            <div className="border-t border-slate-100 pt-4 flex items-end justify-between">
              <span className="text-[13px] text-slate-500">Total</span>
              <span className="text-[28px] font-extrabold text-slate-900 leading-none">
                R$ {plan.price.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Trust badges */}
          <div className="mt-4 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
            {trustItems.map(({ Icon, text, color }) => (
              <div key={text} className="flex items-center gap-3">
                <Icon className={`w-4 h-4 flex-shrink-0 ${color}`} />
                <p className="text-[12px] text-slate-600 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </aside>

        {/* ── RIGHT: form (8 cols) ───────────────────────── */}
        <div className="lg:col-span-8 space-y-4">
          {/* Mobile-only plan summary (card style) */}
          <div className="lg:hidden bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest mb-2">
              Você está assinando
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[15px] font-extrabold text-slate-900">Treina Prova PRO</p>
                <p className="text-[12px] text-slate-500">{BILLING_LABELS[plan.billing_period] ?? plan.billing_period}</p>
              </div>
              <p className="text-[22px] font-extrabold text-slate-900">
                R$ {plan.price.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <PersonalInfoBlock register={register} errors={errors} control={control} />
            <EmailBlock register={register} errors={errors} />
            <PaymentTabs
              gateway={gateway}
              gatewayPubKey={gatewayPubKey}
              planAmount={plan.price}
              holderName={watchedName ?? ''}
              installments={watchedInstallments ?? 1}
              setValue={setValue}
              cardFieldRef={cardRef}
            />

            {/* ── Submit button ─────────────────────────── */}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-14 rounded-2xl bg-[#00a650] hover:bg-[#009644] disabled:opacity-60 disabled:cursor-not-allowed
                         text-white text-[16px] font-bold tracking-wide shadow-lg hover:shadow-xl
                         transition-all duration-200 flex items-center justify-center gap-2.5"
            >
              {busy ? (
                <>
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  Pagar agora
                </>
              )}
            </button>

            {/* ── Legal ────────────────────────────────── */}
            <p className="text-center text-[11px] text-slate-400 pb-4">
              Ao clicar em <span className="font-medium">"Pagar agora"</span>, você concorda com nossos{' '}
              <a href="/termos" className="underline underline-offset-2 hover:text-slate-600 transition-colors">
                termos de uso
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
