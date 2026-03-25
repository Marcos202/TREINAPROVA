import { createClient } from "@/lib/supabase/server";
import { TENANT_LABELS, TENANT_THEME } from "@/config/tenants";
import RightPanel from "./_components/RightPanel";

/* ──────────────────────────────────────────────────────────────────────────────
   Stat Card
   ────────────────────────────────────────────────────────────────────────────── */

function StatCard({
  title, count, emptyText, href, icon, accent,
}: {
  title: string; count: number; emptyText: string;
  href: string; icon: React.ReactNode; accent: string;
}) {
  return (
    <a
      href={href}
      className="group relative bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300/60 transition-all duration-200 overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-[50px] opacity-[0.06]" style={{ background: accent }} />
      <div className="flex items-center justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: accent + '15' }}>
          {icon}
        </div>
        <svg className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 17l9.2-9.2M17 17V7H7" />
        </svg>
      </div>
      <p className="text-3xl font-bold text-slate-900 tabular-nums leading-none mb-1">
        {count.toLocaleString('pt-BR')}
      </p>
      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{title}</p>
      <p className="mt-0.5 text-[11px] text-slate-400">
        {count > 0 ? `${count} item(ns) cadastrado(s)` : emptyText}
      </p>
    </a>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Activity bar chart
   ────────────────────────────────────────────────────────────────────────────── */

function ActivityChart({ accent }: { accent: string }) {
  const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const heights = [45, 70, 55, 85, 60, 30, 40];
  return (
    <div className="flex items-end gap-2 h-28">
      {days.map((day, i) => (
        <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
          <div
            className="w-full rounded-lg"
            style={{ height: `${heights[i]}%`, background: i === 3 ? accent : accent + '30', borderRadius: '6px' }}
          />
          <span className="text-[9px] font-medium text-slate-400">{day}</span>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────────
   Progress Ring
   ────────────────────────────────────────────────────────────────────────────── */

function ProgressRing({ percentage, label, accent }: { percentage: number; label: string; accent: string }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" stroke="#f1f5f9" />
          <circle cx="50" cy="50" r={radius} fill="none" strokeWidth="8" stroke={accent} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
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

  // User for RightPanel
  const { data: { user } } = await supabase.auth.getUser();
  const userEmail = user?.email ?? '';
  const userName = user?.user_metadata?.full_name ?? user?.user_metadata?.name ?? 'Estudante';

  // Real counts
  const [questionsRes, examsRes, subjectsRes] = await Promise.all([
    supabase.from("questions").select("*", { count: "exact", head: true }).eq("tenant_id", tenant),
    supabase.from("exams").select("*", { count: "exact", head: true }).eq("tenant_id", tenant),
    supabase.from("subjects").select("*", { count: "exact", head: true }).eq("tenant_id", tenant),
  ]);

  const questionsCount = questionsRes.count ?? 0;
  const examsCount = examsRes.count ?? 0;
  const subjectsCount = subjectsRes.count ?? 0;

  return (
    /* ── Flex layout: central ocupa o restante, right = 260px (= sidebar) ── */
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

      {/* ════════════════════════════════════════════════════════════
          CENTRAL COLUMN — flex-1, full width on mobile
          ════════════════════════════════════════════════════════════ */}
      <div className="xl:col-span-9 flex flex-col gap-5">

        {/* ─── Welcome Banner ─────────────────────────────────── */}
        <div
          className="relative rounded-3xl p-6 sm:p-8 overflow-hidden min-h-[150px]"
          style={{ background: theme.accentGradient }}
        >
          <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/10 rounded-full" />
          <div className="absolute bottom-0 right-16 w-32 h-32 bg-white/5 rounded-full" />
          <div className="relative z-10 max-w-[460px]">
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
              Olá, bem-vindo(a)! 👋
            </h1>
            <p className="text-white/80 text-sm mt-2 leading-relaxed">
              Continue de onde parou. Explore questões, faça simulados e acompanhe seu progresso em{' '}
              <span className="font-semibold text-white">{label}</span>.
            </p>
            <a
              href={`/${tenant}/questoes`}
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-white text-slate-900 rounded-xl text-[13px] font-semibold hover:bg-white/90 transition-colors shadow-sm"
            >
              Explorar Questões
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>

        {/* ─── Stats Cards ─────────────────────────────────────── */}
        {/* Mobile: 2-col grid; Desktop: 3-col */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <StatCard title="Questões" count={questionsCount} emptyText="Nenhuma ainda"
            href={`/${tenant}/questoes`} accent={theme.accent}
            icon={<svg className="w-5 h-5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M9 15h6" /><path d="M9 11h6" />
            </svg>}
          />
          <StatCard title="Simulados" count={examsCount} emptyText="Nenhum ainda"
            href={`/${tenant}/simulados`} accent={theme.accent}
            icon={<svg className="w-5 h-5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
            </svg>}
          />
          <StatCard title="Disciplinas" count={subjectsCount} emptyText="Nenhuma ainda"
            href={`/${tenant}`} accent={theme.accent}
            icon={<svg className="w-5 h-5" style={{ color: theme.accent }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>}
          />
        </div>

        {/* ─── Activity + Progress ──────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 bg-white rounded-2xl border border-slate-200/60 p-5">
            <div className="flex items-center justify-between mb-4">
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

          <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Meu Progresso</h3>
            <div className="flex items-center justify-center">
              <ProgressRing
                percentage={questionsCount > 0 ? Math.min(Math.round((questionsCount / 500) * 100), 100) : 0}
                label="Progresso Geral"
                accent={theme.accent}
              />
            </div>
            <div className="mt-4 space-y-2">
              {[
                { label: 'Resolvidas', value: questionsCount, color: theme.accent },
                { label: 'Pendentes', value: Math.max(500 - questionsCount, 0), color: '#f59e0b' },
                { label: 'Simulados', value: examsCount, color: '#10b981' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-500">{item.label}</span>
                  </div>
                  <span className="font-semibold text-slate-700 tabular-nums">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Simulados em Andamento ───────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900">Simulados em Andamento</h3>
            <a href={`/${tenant}/simulados`} className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors" style={{ color: theme.accent }}>
              Ver todos
            </a>
          </div>

          {examsCount > 0 ? (
            <div className="divide-y divide-slate-100">
              {[
                { title: 'Simulado Nacional ENEM 2024', subject: label, date: '15 Nov', progress: 30, status: 'Em andamento', statusColor: '#f59e0b' },
                { title: 'Questões de Revisão — Bloco A', subject: label, date: '20 Nov', progress: 65, status: 'Em andamento', statusColor: theme.accent },
                { title: 'Estudo Dirigido: Urgências', subject: label, date: '25 Nov', progress: 0, status: 'Não iniciado', statusColor: '#94a3b8' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-3 hover:bg-slate-50/50 rounded-xl px-2 -mx-2 transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.statusColor + '15' }}>
                    <svg className="w-4 h-4" style={{ color: item.statusColor }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-slate-800 truncate">{item.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{item.subject} · Até {item.date}</p>
                  </div>
                  <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: item.statusColor + '18', color: item.statusColor }}>
                      {item.status}
                    </span>
                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${item.progress}%`, backgroundColor: item.statusColor }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <p className="text-[12px] text-slate-400 max-w-[200px]">Seus simulados aparecerão aqui quando você começar.</p>
              <a href={`/${tenant}/simulados`} className="mt-4 inline-flex items-center text-[12px] font-semibold px-4 py-2 rounded-xl text-white hover:opacity-90 transition-opacity" style={{ background: theme.accentGradient }}>
                Iniciar Simulado
              </a>
            </div>
          )}
        </div>

      </div>
      {/* end central column */}

      {/* ════════════════════════════════════════════════════════════
          RIGHT COLUMN — col-span-3 (~25% of 12-col grid = ≈320px @ xl)
          ════════════════════════════════════════════════════════════ */}
      <div className="xl:col-span-3 w-full">
        <RightPanel
          tenant={tenant}
          theme={theme}
          userName={userName}
          userEmail={userEmail}
        />
      </div>

    </div>
  );
}
