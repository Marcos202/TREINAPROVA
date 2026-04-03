import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface SuccessPageProps {
  searchParams: Promise<{ plan?: string; tenant?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { plan, tenant } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const dashboardHref = tenant ? `/${tenant}` : '/';
  const planLabel     = plan ?? 'Treina Prova PRO';

  return (
    <div className="min-h-screen bg-[#F4F7FE] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 py-12">

        {/* Animated checkmark */}
        <div className="relative mx-auto w-24 h-24">
          <div className="absolute inset-0 rounded-full bg-green-100 animate-ping opacity-30" />
          <div className="relative w-24 h-24 rounded-full bg-green-500 flex items-center justify-center shadow-lg">
            <svg className="w-12 h-12 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-900">Pagamento confirmado!</h1>
          <p className="text-slate-500 text-[15px] leading-relaxed">
            Bem-vindo ao <strong className="text-slate-800">{planLabel}</strong>.
            Seu acesso PRO está ativo agora.
          </p>
        </div>

        {/* What's unlocked */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm text-left space-y-3">
          <p className="text-[12px] font-bold text-slate-500 uppercase tracking-widest">O que foi desbloqueado</p>
          {[
            'Questões ilimitadas por dia',
            'Acesso ao Foco Inteligente com IA',
            'Simulados completos sem restrições',
            'Flashcards ilimitados',
            'Estatísticas avançadas de desempenho',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2.5">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-3 h-3 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <span className="text-[13px] text-slate-700">{item}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <a
          href={dashboardHref}
          className="block w-full h-13 py-3.5 rounded-2xl bg-slate-900 text-white text-[15px] font-bold
                     hover:bg-slate-800 transition-colors shadow-lg hover:shadow-xl"
        >
          Ir ao Dashboard →
        </a>

        <p className="text-[11px] text-slate-400">
          Um e-mail de confirmação foi enviado para {user.email}
        </p>
      </div>
    </div>
  );
}
