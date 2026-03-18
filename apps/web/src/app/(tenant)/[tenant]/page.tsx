import { createClient } from "@/lib/supabase/server";
import { TENANT_LABELS } from "@/config/tenants";

export default async function TenantDashboardPage({ params }: { params: Promise<{ tenant: string }> }) {
  const resolvedParams = await params;
  const tenant = resolvedParams.tenant;
  const label = TENANT_LABELS[tenant] || tenant.toUpperCase();

  const supabase = await createClient();

  // Buscar contagens reais do tenant atual
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

  const stats = [
    {
      title: "Questões Disponíveis",
      count: questionsCount,
      emptyText: "Nenhuma questão cadastrada ainda",
      href: `/${tenant}/questoes`,
    },
    {
      title: "Simulados Criados",
      count: examsCount,
      emptyText: "Nenhum simulado criado ainda",
      href: `/${tenant}/simulados`,
    },
    {
      title: "Disciplinas",
      count: subjectsCount,
      emptyText: "Nenhuma disciplina cadastrada ainda",
      href: `/${tenant}`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900">
          Dashboard
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Visão geral da sua área de estudo: {label}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <a
            key={stat.title}
            href={stat.href}
            className="border border-slate-200 rounded-lg p-6 bg-white hover:border-slate-300 hover:shadow-sm transition-all group"
          >
            <p className="text-sm font-medium text-slate-500">
              {stat.title}
            </p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {stat.count}
            </p>
            <p className="mt-1 text-xs text-slate-400 group-hover:text-slate-500 transition-colors">
              {stat.count > 0
                ? `${stat.count} item(ns) cadastrado(s)`
                : stat.emptyText}
            </p>
          </a>
        ))}
      </div>

      {/* Activity placeholder */}
      <div className="border border-dashed border-slate-200 rounded-lg flex items-center justify-center min-h-[180px] bg-white">
        <div className="text-center">
          <p className="text-sm text-slate-400">
            Atividade recente aparecerá aqui quando você começar a estudar.
          </p>
          <a
            href={`/${tenant}/questoes`}
            className="inline-block mt-3 text-xs font-medium text-slate-500 hover:text-slate-900 border border-slate-200 rounded-md px-4 py-2 transition-colors"
          >
            Explorar Banco de Questões →
          </a>
        </div>
      </div>
    </div>
  );
}
