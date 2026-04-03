import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const revalidate = 60;

const CATEGORIES = [
  { key: 'med',          label: 'Medicina',       color: 'bg-blue-500',   light: 'bg-blue-50',   text: 'text-blue-700'   },
  { key: 'oab',          label: 'OAB',             color: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700' },
  { key: 'enem',         label: 'ENEM',            color: 'bg-orange-400', light: 'bg-orange-50', text: 'text-orange-700' },
  { key: 'vestibulares', label: 'Vestibulares',    color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-700'  },
] as const;

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [
    { count: countAlunos },
    { count: countPagantes },
    { count: countQuestoes },
    ...distResults
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }).neq('is_admin', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'premium'),
    supabase.from('questions').select('*', { count: 'exact', head: true }),
    ...CATEGORIES.map((c) =>
      supabase.from('questions').select('*', { count: 'exact', head: true }).eq('tenant_id', c.key)
    ),
  ]);

  const dist = CATEGORIES.map((cat, i) => ({
    ...cat,
    count: distResults[i]?.count ?? 0,
  }));

  const totalDist = dist.reduce((a, c) => a + c.count, 0) || 1;
  const convRate =
    countAlunos && countAlunos > 0
      ? Math.round(((countPagantes ?? 0) / countAlunos) * 100)
      : 0;

  return (
    <div className="space-y-8">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Visão Geral</h1>
          <p className="text-sm text-gray-500 mt-1">
            Dados consolidados da plataforma TreinaPro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ao vivo
          </span>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* Total Alunos */}
        <StatCard
          icon={<UsersIcon className="w-4 h-4 text-blue-600" />}
          iconBg="bg-blue-50"
          label="Total de Alunos"
          value={countAlunos ?? 0}
          description="usuários cadastrados"
          href="/admin/usuarios"
        />

        {/* Alunos Pagantes */}
        <StatCard
          icon={<CreditCardIcon className="w-4 h-4 text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="Alunos Pagantes"
          value={countPagantes ?? 0}
          description="assinaturas premium ativas"
          href="/admin/usuarios"
        />

        {/* Total Questões */}
        <StatCard
          icon={<FileTextIcon className="w-4 h-4 text-orange-600" />}
          iconBg="bg-orange-50"
          label="Total de Questões"
          value={countQuestoes ?? 0}
          description="no banco de dados"
          href="/admin/med/questoes"
        />

        {/* Taxa de Conversão */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
          <div className="flex items-start justify-between mb-4">
            <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
              <TrendingUpIcon className="w-4 h-4 text-violet-600" />
            </div>
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Conversão</span>
          </div>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
              {convRate}
              <span className="text-lg font-semibold text-gray-400">%</span>
            </p>
            <p className="text-xs text-gray-400">alunos que converteram</p>
          </div>
          {/* Mini progress bar */}
          <div className="mt-4 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all"
              style={{ width: `${Math.min(convRate, 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Distribuição por Vertical — 2/3 */}
        <div className="md:col-span-2 lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">Distribuição por Vertical</h3>
              <p className="text-xs text-gray-400 mt-0.5">{countQuestoes ?? 0} questões no total</p>
            </div>
            <Link
              href="/admin/med/questoes"
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Ver banco →
            </Link>
          </div>
          <div className="p-6 space-y-5">
            {dist.map((item) => {
              const pct = Math.round((item.count / totalDist) * 100);
              return (
                <div key={item.key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${item.color} shrink-0`} />
                      <span className="text-sm font-medium text-gray-700">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 tabular-nums">{item.count} questões</span>
                      <span className={`text-xs font-semibold tabular-nums px-2 py-0.5 rounded-full ${item.light} ${item.text}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Acesso Rápido — 1/3 */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-800">Acesso Rápido</h3>
            <p className="text-xs text-gray-400 mt-0.5">Ações frequentes do admin</p>
          </div>
          <div className="p-4 space-y-2">
            {[
              { href: '/admin/med/questoes',  label: 'Questões de Medicina',    icon: <PlusIcon className="w-3.5 h-3.5" />, color: 'blue'    },
              { href: '/admin/oab/questoes',  label: 'Questões de OAB',         icon: <PlusIcon className="w-3.5 h-3.5" />, color: 'emerald' },
              { href: '/admin/enem/questoes', label: 'Questões de ENEM',        icon: <PlusIcon className="w-3.5 h-3.5" />, color: 'orange'  },
              { href: '/admin/usuarios',      label: 'Gerenciar Usuários',      icon: <UsersIcon className="w-3.5 h-3.5" />, color: 'violet' },
              { href: '/admin/med/simulados', label: 'Criar Simulado',          icon: <FileTextIcon className="w-3.5 h-3.5" />, color: 'gray' },
            ].map(({ href, label, icon, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${color === 'blue'    ? 'hover:bg-blue-50    hover:text-blue-700'    : ''}
                  ${color === 'emerald' ? 'hover:bg-emerald-50 hover:text-emerald-700' : ''}
                  ${color === 'orange'  ? 'hover:bg-orange-50  hover:text-orange-700'  : ''}
                  ${color === 'violet'  ? 'hover:bg-violet-50  hover:text-violet-700'  : ''}
                  ${color === 'gray'    ? 'hover:bg-gray-100   hover:text-gray-800'    : ''}
                  text-gray-500 hover:shadow-sm`}
              >
                <span className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                  {icon}
                </span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Atividade Recente ── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-semibold text-gray-800">Atividade Recente</h3>
            <p className="text-xs text-gray-400 mt-0.5">Logs e eventos do sistema</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-3">
            <ClockIcon className="w-4.5 h-4.5 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-400">Nenhum log disponível</p>
          <p className="text-xs text-gray-300 mt-1">Os logs de atividade aparecerão aqui em breve.</p>
        </div>
      </div>

    </div>
  );
}

/* ── StatCard ── */
function StatCard({
  icon,
  iconBg,
  label,
  value,
  description,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group block"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </div>
        <ArrowIcon className="w-4 h-4 text-gray-200 group-hover:text-gray-400 transition-colors" />
      </div>
      <div className="space-y-1">
        <p className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
          {value.toLocaleString('pt-BR')}
        </p>
        <p className="text-sm font-medium text-gray-600">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
    </Link>
  );
}

/* ── Icons ── */
function UsersIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CreditCardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="5" rx="2" />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function FileTextIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
    </svg>
  );
}

function TrendingUpIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function ArrowIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17 17 7" />
      <path d="M7 7h10v10" />
    </svg>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
