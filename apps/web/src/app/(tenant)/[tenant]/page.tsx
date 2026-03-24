import { createClient } from "@/lib/supabase/server";
import { TENANT_LABELS, TENANT_THEME } from "@/config/tenants";

/* ──────────────────────────────────────────────────────────────────────────────
   Stat Card
   ────────────────────────────────────────────────────────────────────────────── */

function StatCard({
  title,
  count,
  emptyText,
  href,
  icon,
  accent,
}: {
  title: string;
  count: number;
  emptyText: string;
  href: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <a
      href={href}
      className="group relative bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300/60 transition-all duration-200 overflow-hidden"
    >
      {/* Decorative gradient */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-bl-[60px] opacity-[0.06]"
        style={{ background: accent }}
      />

      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
          style={{ background: accent + '18' }}
        >
          {icon}
        </div>
        <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      </div>

      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-slate-900 tabular-nums">
        {count.toLocaleString('pt-BR')}
      </p>
      <p className="mt-1 text-[11px] text-slate-400 group-hover:text-slate-500 transition-colors">
        {count > 0 ? `${count} item(ns) cadastrado(s)` : emptyText}
      </p>
    </a>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Progress Ring (SVG donut)
   ────────────────────────────────────────────────────────────────────────────── */

function ProgressRing({
  percentage,
  label,
  accent,
}: {
  percentage: number;
  label: string;
  accent: string;
}) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" stroke="#f1f5f9" />
          <circle
            cx="50" cy="50" r={radius} fill="none" strokeWidth="8"
            stroke={accent}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-slate-900">{percentage}%</span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Activity bar chart (purely visual placeholder)
   ────────────────────────────────────────────────────────────────────────────── */

function ActivityChart({ accent }: { accent: string }) {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const heights = [45, 70, 55, 85, 60, 30, 40]; // visual only

  return (
    <div className="flex items-end gap-2 h-28">
      {days.map((day, i) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full rounded-lg min-w-[4px] transition-all duration-500 ease-out"
            style={{
              height: `${heights[i]}%`,
              background: i === 3 ? accent : accent + '30',
              borderRadius: '6px',
            }}
          />
          <span className="text-[9px] font-medium text-slate-400">{day}</span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Schedule item
   ────────────────────────────────────────────────────────────────────────────── */

function ScheduleItem({
  title,
  subject,
  time,
  badgeColor,
}: {
  title: string;
  subject: string;
  time: string;
  badgeColor: string;
}) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-b-0 group">
      <div className="w-1 h-full min-h-[40px] rounded-full" style={{ backgroundColor: badgeColor }} />
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-slate-800 truncate">{title}</p>
        <p className="text-[11px] text-slate-400 mt-0.5">
          {subject} • {time}
        </p>
      </div>
      <svg className="w-4 h-4 text-slate-300 group-hover:text-slate-400 mt-0.5 flex-shrink-0 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Recent Activity
   ────────────────────────────────────────────────────────────────────────────── */

function RecentActivityItem({
  action,
  detail,
  time,
  color,
}: {
  action: string;
  detail: string;
  time: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ backgroundColor: color + '18' }}>
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-slate-600">
          <span className="font-medium text-slate-800">{action}</span> {detail}
        </p>
        <p className="text-[10px] text-slate-400 mt-0.5">{time}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Dashboard Page
   ────────────────────────────────────────────────────────────────────────────── */

export default async function TenantDashboardPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const resolvedParams = await params;
  const tenant = resolvedParams.tenant;
  const label = TENANT_LABELS[tenant] || tenant.toUpperCase();
  const theme = TENANT_THEME[tenant] ?? TENANT_THEME['med'];

  const supabase = await createClient();

  // Fetch real counts
  const [questionsRes, examsRes, subjectsRes] = await Promise.all([
    supabase
      .from("questions")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant),
    supabase
      .from("exams")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant),
    supabase
      .from("subjects")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant),
  ]);

  const questionsCount = questionsRes.count ?? 0;
  const examsCount = examsRes.count ?? 0;
  const subjectsCount = subjectsRes.count ?? 0;

  // Today's date formatted in Portuguese
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      {/* ─── Welcome Banner ─────────────────────────────────────────── */}
      <div
        className="relative rounded-2xl p-6 sm:p-8 overflow-hidden"
        style={{ background: theme.accentGradient }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 bg-white/10 rounded-full" />
        <div className="absolute bottom-0 right-12 w-24 h-24 bg-white/5 rounded-full" />

        <div className="relative z-10">
          <p className="text-white/70 text-[12px] font-medium capitalize">{today}</p>
          <h1 className="text-xl sm:text-2xl font-bold text-white mt-1">
            Olá, bem-vindo(a)! 👋
          </h1>
          <p className="text-white/80 text-sm mt-1 max-w-md">
            Continue de onde parou. Explore questões, faça simulados e acompanhe seu progresso em{' '}
            <span className="font-semibold text-white">{label}</span>.
          </p>
          <a
            href={`/${tenant}/questoes`}
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[13px] font-semibold hover:bg-white/90 transition-colors shadow-sm"
          >
            Explorar Questões
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>

      {/* ─── Stats Cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Questões"
          count={questionsCount}
          emptyText="Nenhuma ainda"
          href={`/${tenant}/questoes`}
          accent={theme.accent}
          icon={
            <svg className="w-5 h-5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" />
            </svg>
          }
        />
        <StatCard
          title="Simulados"
          count={examsCount}
          emptyText="Nenhum ainda"
          href={`/${tenant}/simulados`}
          accent={theme.accent}
          icon={
            <svg className="w-5 h-5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
            </svg>
          }
        />
        <StatCard
          title="Disciplinas"
          count={subjectsCount}
          emptyText="Nenhuma ainda"
          href={`/${tenant}`}
          accent={theme.accent}
          icon={
            <svg className="w-5 h-5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
          }
        />
        <StatCard
          title="Desempenho"
          count={0}
          emptyText="Comece a estudar"
          href={`/${tenant}/estatisticas`}
          accent={theme.accent}
          icon={
            <svg className="w-5 h-5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
            </svg>
          }
        />
      </div>

      {/* ─── Charts + Progress Row ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Learning Activity Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Atividade de Estudo</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">Última semana</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                <span className="text-[10px] text-slate-400">Questões</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent + '40' }} />
                <span className="text-[10px] text-slate-400">Revisões</span>
              </div>
            </div>
          </div>
          <ActivityChart accent={theme.accent} />
        </div>

        {/* My Progress */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-5">Meu Progresso</h3>
          <div className="flex items-center justify-center">
            <ProgressRing percentage={questionsCount > 0 ? Math.min(Math.round((questionsCount / 500) * 100), 100) : 0} label="Progresso Geral" accent={theme.accent} />
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.accent }} />
                <span className="text-slate-500">Resolvidas</span>
              </div>
              <span className="font-semibold text-slate-700 tabular-nums">{questionsCount}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-slate-500">Pendentes</span>
              </div>
              <span className="font-semibold text-slate-700 tabular-nums">{Math.max(500 - questionsCount, 0)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-slate-500">Simulados</span>
              </div>
              <span className="font-semibold text-slate-700 tabular-nums">{examsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Schedule + Recent Activity ─────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* My Schedule */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Próximos Estudos</h3>
            <button className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors" style={{ color: theme.accent }}>
              Ver Agenda
            </button>
          </div>
          {questionsCount > 0 ? (
            <div>
              <ScheduleItem
                title="Revisão de Questões"
                subject={label}
                time="Hoje • 14:00 - 15:30"
                badgeColor={theme.accent}
              />
              <ScheduleItem
                title="Simulado Prática"
                subject={label}
                time="Amanhã • 09:00 - 11:00"
                badgeColor="#f59e0b"
              />
              <ScheduleItem
                title="Estudo Dirigido"
                subject={label}
                time="Quarta-feira • 19:00 - 20:30"
                badgeColor="#10b981"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                  <line x1="16" x2="16" y1="2" y2="6" />
                  <line x1="8" x2="8" y1="2" y2="6" />
                  <line x1="3" x2="21" y1="10" y2="10" />
                </svg>
              </div>
              <p className="text-[12px] text-slate-400 max-w-[200px]">
                Sua agenda aparecerá aqui quando você começar a estudar.
              </p>
            </div>
          )}
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Atividade Recente</h3>
            <button className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="5" r="1.5" />
                <circle cx="12" cy="12" r="1.5" />
                <circle cx="12" cy="19" r="1.5" />
              </svg>
            </button>
          </div>
          {questionsCount > 0 ? (
            <div className="space-y-0.5">
              <RecentActivityItem
                action="Resolveu"
                detail="questões de prática"
                time="Hoje, 10:30"
                color={theme.accent}
              />
              <RecentActivityItem
                action="Completou"
                detail="simulado parcial"
                time="Ontem, 15:45"
                color="#10b981"
              />
              <RecentActivityItem
                action="Revisou"
                detail="questões marcadas"
                time="Ontem, 09:15"
                color="#f59e0b"
              />
              <RecentActivityItem
                action="Acessou"
                detail="o dashboard"
                time="2 dias atrás"
                color="#8b5cf6"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 8v4l3 3" />
                  <circle cx="12" cy="12" r="10" />
                </svg>
              </div>
              <p className="text-[12px] text-slate-400 max-w-[200px]">
                Atividades recentes aparecerão aqui.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Quick Action CTA ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{ background: theme.accentGradient }}
        >
          <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-sm font-semibold text-slate-900">
            Pronto para começar?
          </h3>
          <p className="text-[12px] text-slate-400 mt-0.5">
            Mergulhe no banco de questões e pratique para a sua prova.
          </p>
        </div>
        <a
          href={`/${tenant}/questoes`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white shadow-sm hover:opacity-90 transition-opacity flex-shrink-0"
          style={{ background: theme.accentGradient }}
        >
          Explorar Banco de Questões
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
